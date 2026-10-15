import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../lib/store'
import { L } from '../lib/i18n'
import { NAKAS, TRADES } from '../lib/data'
import { getLocation, nearestNaka, speak } from '../lib/logic'
import { Icon, LangSwitch, ListenButton, Logo, Toast } from '../components/ui'

const YEARS = ['0–2', '3–5', '6–10', '10+']

export default function Onboarding() {
  const { t, lang, startFresh, showToast } = useStore()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [p, setP] = useState({ trade: null, years: null, naka: null, photos: [], name: '', phone: '' })
  const [setu] = useState(() => String(1000 + Math.floor(Math.random() * 8999)))
  const [locBusy, setLocBusy] = useState(false)
  const fileRef = useRef()
  const total = 5

  const steps = [
    { q: 'ob_trade', ok: !!p.trade },
    { q: 'ob_years', ok: !!p.years },
    { q: 'ob_naka', ok: !!p.naka },
    { q: 'ob_photo', ok: true },
    { q: 'ob_name', ok: p.name.trim().length > 1 && p.phone.replace(/\D/g, '').length >= 10 },
  ]

  const finish = () => {
    startFresh({ name: p.name.trim(), nameLatin: p.name.trim(), phone: p.phone, trade: p.trade, years: p.years, naka: p.naka, photos: p.photos, setu })
    setStep(5)
    setTimeout(() => speak(`${t('ob_done')} ${t('setuNo')}: ${setu.split('').join(' ')}`, lang), 300)
  }

  const onFiles = (e) => {
    const files = [...(e.target.files || [])].slice(0, 4)
    files.forEach((f) => {
      const r = new FileReader()
      r.onload = () => {
        const img = new Image()
        img.onload = () => {
          const c = document.createElement('canvas'), s = 360 / Math.max(img.width, img.height)
          c.width = img.width * s; c.height = img.height * s
          c.getContext('2d').drawImage(img, 0, 0, c.width, c.height)
          setP((x) => ({ ...x, photos: [...x.photos, c.toDataURL('image/jpeg', 0.7)].slice(-4) }))
        }
        img.src = r.result
      }
      r.readAsDataURL(f)
    })
  }

  const useLoc = async () => {
    setLocBusy(true)
    try {
      const pos = await getLocation()
      const n = nearestNaka(pos)
      if (n.d < 25) setP((x) => ({ ...x, naka: n.naka.id }))
      else showToast(t('locFar'), 'info')
    } catch { showToast(t('locFail'), 'info') }
    setLocBusy(false)
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b-[1.5px] border-ink">
        <div className="max-w-[860px] mx-auto px-5 py-3 flex flex-wrap gap-3 items-center justify-between"><Logo /><LangSwitch compact /></div>
      </header>
      <main className="flex-1 w-full max-w-[860px] mx-auto px-5 py-8 flex flex-col gap-6">
        {step < 5 && (
          <>
            <div className="flex items-center justify-between gap-3">
              <span className="text-[15px] font-bold text-muted">{t('ob_title')} · {t('stepOf', { a: step + 1, b: total })}</span>
              <div className="flex gap-1.5" aria-hidden="true">{Array.from({ length: total }, (_, i) => <span key={i} className={`h-2 w-8 rounded-full ${i <= step ? 'bg-ink' : 'bg-line'}`} />)}</div>
            </div>
            <div className="flex items-center gap-3">
              <h1 className="m-0 text-[30px] md:text-[38px] font-extrabold leading-tight flex-1">{t(steps[step].q)}</h1>
              <ListenButton text={t(steps[step].q)} big />
            </div>
          </>
        )}

        {step === 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {TRADES.map((tr) => (
              <button key={tr.id} type="button" aria-pressed={p.trade === tr.id} onClick={() => { setP({ ...p, trade: tr.id }); speak(L(tr.name, lang), lang) }}
                className={`min-h-[128px] flex flex-col items-center justify-center gap-2 rounded-2xl border-[1.5px] cursor-pointer text-[19px] font-extrabold ${p.trade === tr.id ? 'bg-goldsoft border-ink shadow-[4px_4px_0_#1B1B1B]' : 'bg-white border-line'}`}>
                <Icon name={tr.icon} size={46} strokeWidth={1.6} />{L(tr.name, lang)}
              </button>
            ))}
          </div>
        )}

        {step === 1 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {YEARS.map((y) => (
              <button key={y} type="button" aria-pressed={p.years === y} onClick={() => { setP({ ...p, years: y }); speak(`${y.replace('–', ' से ')} ${t('days') === 'days' ? 'years' : 'साल'}`, lang) }}
                className={`min-h-[120px] rounded-2xl border-[1.5px] cursor-pointer flex flex-col items-center justify-center ${p.years === y ? 'bg-goldsoft border-ink shadow-[4px_4px_0_#1B1B1B]' : 'bg-white border-line'}`}>
                <span className="num text-[44px] leading-none">{y}</span>
                <span className="text-[16px] font-bold text-muted">{lang === 'en' ? 'years' : lang === 'mr' ? 'वर्षे' : 'साल'}</span>
              </button>
            ))}
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-3">
            <button type="button" className="btn btn-dark self-start min-h-[56px] text-[17px]" onClick={useLoc} disabled={locBusy}>
              <Icon name={locBusy ? 'LoaderCircle' : 'LocateFixed'} className={locBusy ? 'animate-spin' : ''} />{locBusy ? t('locating') : t('useMyLoc')}
            </button>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {Object.values(NAKAS).map((n) => (
                <button key={n.id} type="button" aria-pressed={p.naka === n.id} onClick={() => setP({ ...p, naka: n.id })}
                  className={`min-h-[96px] rounded-2xl border-[1.5px] cursor-pointer flex items-center gap-3 px-4 text-[20px] font-extrabold ${p.naka === n.id ? 'bg-goldsoft border-ink shadow-[4px_4px_0_#1B1B1B]' : 'bg-white border-line'}`}>
                  <Icon name="MapPin" size={30} />{L(n.name, lang)}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col gap-3">
            <p className="m-0 text-[17px] text-muted">{t('ob_photoSub')}</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {p.photos.map((src, i) => <img key={i} src={src} alt="" className="aspect-square w-full object-cover rounded-xl border-[1.5px] border-ink" />)}
              <button type="button" onClick={() => fileRef.current?.click()} className="aspect-square rounded-xl border-[1.5px] border-dashed border-ink bg-white cursor-pointer flex flex-col items-center justify-center gap-1.5 text-[17px] font-bold">
                <Icon name="Camera" size={36} strokeWidth={1.7} />{t('takePhoto')}
              </button>
            </div>
            <input ref={fileRef} type="file" accept="image/*" capture="environment" multiple className="hidden" onChange={onFiles} />
          </div>
        )}

        {step === 4 && (
          <div className="flex flex-col gap-4 max-w-[480px]">
            <label className="flex flex-col gap-1.5 text-[16px] font-bold">{t('ob_namePh')}
              <input className="input !text-[20px]" value={p.name} onChange={(e) => setP({ ...p, name: e.target.value })} autoComplete="name" />
            </label>
            <label className="flex flex-col gap-1.5 text-[16px] font-bold">{t('ob_phonePh')}
              <input className="input num !text-[22px] tracking-wider" inputMode="numeric" value={p.phone} onChange={(e) => setP({ ...p, phone: e.target.value.replace(/[^\d ]/g, '').slice(0, 12) })} autoComplete="tel" />
            </label>
          </div>
        )}

        {step === 5 && (
          <div className="card card-hero p-7 md:p-9 flex flex-col items-center text-center gap-4 rise">
            <span className="w-16 h-16 rounded-full bg-green flex items-center justify-center"><Icon name="Check" size={34} strokeWidth={3} className="text-white" /></span>
            <h1 className="m-0 text-[34px] font-extrabold">{t('ob_done')}</h1>
            <p className="m-0 text-[18px] text-muted">{t('ob_doneSub')}</p>
            <div className="bg-goldsoft rounded-2xl px-8 py-4"><div className="text-[14px] font-bold text-golddark">{t('setuNo')}</div><div className="num text-[64px] tracking-[14px] leading-none">{setu}</div></div>
            <div className="flex flex-wrap gap-3 justify-center">
              <ListenButton text={`${t('setuNo')}: ${setu.split('').join(' ')}`} label={t('hearNumber')} />
              <button type="button" className="btn btn-primary text-[18px] min-h-[54px]" onClick={() => navigate('/w/home')}>{t('ob_go')}<Icon name="ArrowRight" /></button>
            </div>
          </div>
        )}

        {step < 5 && (
          <div className="flex items-center justify-between gap-3 mt-auto pt-4">
            <button type="button" className="btn min-h-[56px]" onClick={() => (step === 0 ? navigate('/') : setStep(step - 1))}><Icon name="ArrowLeft" />{t('back')}</button>
            <div className="flex gap-3">
              {step === 3 && <button type="button" className="btn min-h-[56px]" onClick={() => setStep(4)}>{t('skip')}</button>}
              <button type="button" className="btn btn-primary min-h-[56px] text-[18px]" disabled={!steps[step].ok} onClick={() => (step === 4 ? finish() : setStep(step + 1))}>
                {t('next')}<Icon name="ArrowRight" />
              </button>
            </div>
          </div>
        )}
      </main>
      <Toast />
    </div>
  )
}
