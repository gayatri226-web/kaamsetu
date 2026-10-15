import { useRef, useState } from 'react'
import { useStore } from '../lib/store'
import { L } from '../lib/i18n'
import { NAKAS, tradeById } from '../lib/data'
import { fmtDate, rupee } from '../lib/logic'
import { Icon, ListenButton, PageTitle } from '../components/ui'

export default function WorkerCard() {
  const { t, lang, state, addPhoto, verifyId, showToast } = useStore()
  const w = state.worker
  const tr = tradeById(w.trade)
  const fileRef = useRef()
  const [digi, setDigi] = useState(false)
  const done = state.bookings.filter((b) => b.status === 'completed')

  const onFiles = (e) => {
    ;[...(e.target.files || [])].slice(0, 4).forEach((f) => {
      const r = new FileReader()
      r.onload = () => {
        const img = new Image()
        img.onload = () => {
          const c = document.createElement('canvas'), s = 360 / Math.max(img.width, img.height)
          c.width = img.width * s; c.height = img.height * s
          c.getContext('2d').drawImage(img, 0, 0, c.width, c.height)
          addPhoto(c.toDataURL('image/jpeg', 0.7))
        }
        img.src = r.result
      }
      r.readAsDataURL(f)
    })
  }

  const share = encodeURIComponent(`KaamSetu ${t('myCard')}\n${w.name} · ${L(tr.name, lang)} · ${w.years} ${lang === 'en' ? 'yrs' : 'साल'}\n${t('jobsDone')}: ${w.jobsDone} · ${t('rating')}: ${w.rating || '–'}\n${t('setuNo')}: ${w.setu}`)
  const ladder = [
    { ok: w.phoneVerified, label: t('t_phone') },
    { ok: w.vouched, label: t('t_vouch') },
    { ok: w.jobsDone > 0, label: t('t_jobs', { n: w.jobsDone }) },
  ]

  return (
    <div className="max-w-[1120px]">
      <PageTitle title={t('myCard')} />
      <div className="flex flex-wrap gap-7 items-start">
        <section className="flex-[1_1_340px] min-w-0 max-w-[440px] card card-hero overflow-hidden">
          <div className="bg-ink text-white px-4.5 pt-3 pb-3.5 flex flex-col items-center gap-2.5">
            <span aria-hidden="true" className="w-[60px] h-2.5 rounded-full bg-paper" />
            <div className="flex justify-between w-full text-[14px] font-bold"><span className="num tracking-wide">KaamSetu</span><span>{t('myCard')}</span></div>
          </div>
          <div className="p-5 md:p-6 flex flex-col gap-4.5">
            <div className="flex gap-4 items-center">
              {w.photos?.[0]
                ? <img src={w.photos[0]} alt="" className="w-[92px] h-[108px] rounded-xl object-cover border border-line" />
                : <div className="w-[92px] h-[108px] shrink-0 rounded-xl bg-sand border border-line flex items-center justify-center"><Icon name="UserRound" size={46} strokeWidth={1.5} className="text-[#8A8478]" /></div>}
              <div className="flex flex-col gap-1.5">
                <div className="text-[27px] font-extrabold leading-tight">{w.name}</div>
                <div className="flex items-center gap-1.5 text-[16px] font-bold"><Icon name={tr.icon} size={18} />{L(tr.name, lang)} · {w.years} {lang === 'en' ? 'yrs' : lang === 'mr' ? 'वर्षे' : 'साल'}</div>
                <div className="text-[15px] text-muted">{L(NAKAS[w.naka]?.name, lang)}</div>
              </div>
            </div>
            <div className="flex items-center justify-between gap-2.5 px-4 py-3.5 bg-goldsoft rounded-2xl">
              <div><div className="text-[14px] font-bold text-golddark">{t('setuNo')}</div><div className="num text-[46px] tracking-[10px] leading-[1.05]">{w.setu}</div></div>
              <ListenButton text={`${t('setuNo')}: ${w.setu.split('').join(' ')}`} big />
            </div>
            <div className="text-[14px] text-muted -mt-2">{t('tellNumber')}</div>
            <div className="grid grid-cols-3 border-[1.5px] border-ink rounded-xl overflow-hidden text-center">
              <div className="py-2.5 border-r border-line"><div className="num text-[26px] leading-none">{w.jobsDone}</div><div className="text-[13px] font-semibold text-muted">{t('jobsDone')}</div></div>
              <div className="py-2.5 border-r border-line"><div className="num text-[26px] leading-none">{w.rating || '–'}</div><div className="text-[13px] font-semibold text-muted">{t('rating')}</div></div>
              <div className="py-2.5"><div className="num text-[26px] leading-none">{w.onTime}%</div><div className="text-[13px] font-semibold text-muted">{t('onTime')}</div></div>
            </div>
            <a className="btn btn-primary min-h-[54px] text-[17px]" href={`https://wa.me/?text=${share}`} target="_blank" rel="noreferrer"><Icon name="Share2" />{t('shareCard')}</a>
          </div>
        </section>

        <div className="flex-[999_1_380px] min-w-0 flex flex-col gap-5">
          <section aria-label={t('trustLadder')} className="card p-5 flex flex-col">
            <div className="text-[19px] font-extrabold mb-2.5">{t('trustLadder')}</div>
            {ladder.map((s, i) => (
              <div key={i} className="flex gap-3.5 items-start">
                <div className="flex flex-col items-center">
                  <span className={`w-[30px] h-[30px] rounded-full flex items-center justify-center ${s.ok ? 'bg-green' : 'border-[1.5px] border-dashed border-ink'}`}>
                    {s.ok && <Icon name="Check" size={15} strokeWidth={3.2} className="text-white" />}
                  </span>
                  <span className={`w-0.5 h-[22px] ${s.ok ? 'bg-green' : 'bg-line'}`} />
                </div>
                <div className={`pt-0.5 text-[17px] font-bold ${s.ok ? '' : 'text-muted'}`}>{s.label}</div>
              </div>
            ))}
            <div className="flex gap-3.5 items-center">
              <span className={`w-[30px] h-[30px] shrink-0 rounded-full flex items-center justify-center ${w.idVerified ? 'bg-green' : 'border-[1.5px] border-dashed border-ink'}`}>
                {w.idVerified && <Icon name="Check" size={15} strokeWidth={3.2} className="text-white" />}
              </span>
              <div className={`flex-1 text-[17px] font-bold ${w.idVerified ? '' : 'text-muted'}`}>{w.idVerified ? t('t_idDone') : t('t_id')}</div>
              {!w.idVerified && <button type="button" className="btn !min-h-[44px]" onClick={() => setDigi(true)}>{t('add')}</button>}
            </div>
          </section>

          {digi && (
            <section className="card card-hero p-5 flex flex-col gap-3 rise" role="dialog" aria-label={t('digiTitle')}>
              <div className="text-[19px] font-extrabold flex items-center gap-2"><Icon name="ShieldCheck" className="text-greendark" />{t('digiTitle')}</div>
              <div className="flex items-center gap-2.5 text-[16px] font-bold text-greendark"><Icon name="CircleCheck" />{t('digiSee')}</div>
              <div className="flex items-center gap-2.5 text-[16px] font-bold text-coraldark"><Icon name="X" />{t('digiNot')}</div>
              <div className="flex gap-2.5">
                <button type="button" className="btn btn-green" onClick={() => { verifyId(); setDigi(false); showToast(t('t_idDone')) }}>{t('allow')}</button>
                <button type="button" className="btn" onClick={() => setDigi(false)}>{t('cancel')}</button>
              </div>
            </section>
          )}

          <section className="card p-5 flex flex-col gap-3.5">
            <div className="flex flex-wrap justify-between items-center gap-2"><span className="text-[19px] font-extrabold">{t('mySkills')}</span><span className="text-[14px] font-semibold text-muted">{t('skillsBy')}</span></div>
            {w.skills.length > 0 && (
              <div className="flex flex-wrap gap-2">{w.skills.map((s, i) => <span key={i} className="chip !text-[15px] !py-1">{L(s.label, lang)} · {s.n}</span>)}</div>
            )}
            <div className="text-[15px] font-bold">{t('workPhotos')}</div>
            <div className="grid grid-cols-4 gap-2.5">
              {(w.photos || []).map((src, i) => <img key={i} src={src} alt="" className="aspect-square w-full object-cover rounded-[10px]" />)}
              {Array.from({ length: Math.max(0, 3 - (w.photos?.length || 0)) }, (_, i) => (
                <div key={'p' + i} className="aspect-square rounded-[10px] bg-sand flex items-center justify-center"><Icon name="Image" size={26} className="text-[#A39B8C]" strokeWidth={1.7} /></div>
              ))}
              <button type="button" onClick={() => fileRef.current?.click()} className="aspect-square rounded-[10px] bg-white border-[1.5px] border-dashed border-ink cursor-pointer flex flex-col items-center justify-center gap-0.5 text-[13px] font-bold">
                <Icon name="Camera" size={24} />{t('add')}
              </button>
            </div>
            <input ref={fileRef} type="file" accept="image/*" capture="environment" multiple className="hidden" onChange={onFiles} />
            {done.length > 0 && (
              <div className="flex flex-col">
                <div className="text-[15px] font-bold pb-1">{t('pastWork')}</div>
                {done.map((b) => (
                  <div key={b.id} className="flex justify-between gap-2.5 py-2.5 border-t border-line text-[15px]">
                    <span className="font-bold">{L(b.snap.title, lang)} · {L(b.snap.employer, lang)}</span>
                    <span className="font-bold text-greendark whitespace-nowrap">{b.rating?.toFixed?.(1) ?? b.rating} · {fmtDate(b.log.at(-1).date, lang)}</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
