import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useStore } from '../lib/store'
import { L, LOCALE } from '../lib/i18n'
import { checkJob, detectIntent, llmAnswer, rupee, saathiAnswer, speak } from '../lib/logic'
import { Icon, ListenButton } from '../components/ui'

export default function Saathi() {
  const { t, lang, state, reportJob, showToast } = useStore()
  const [params] = useSearchParams()
  const w = state.worker
  const [msgs, setMsgs] = useState([])
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [listening, setListening] = useState(false)
  const endRef = useRef()
  const recRef = useRef()

  const ctxJob = () => {
    const id = params.get('job')
    return state.jobs.find((j) => j.id === id) || state.jobs.find((j) => j.status === 'open' && checkJob(j).level === 'danger')
  }

  const ask = (intent, userText, job) => {
    const ans = saathiAnswer(intent, { job, trade: w.trade }, lang)
    setMsgs((m) => [...m, { from: 'me', text: userText, job }, { from: 'bot', ...ans }])
  }

  useEffect(() => {
    setMsgs([{ from: 'bot', tone: 'info', text: t('saathiHello', { name: w.name.split(' ')[0] }) }])
    if (params.get('job')) {
      const job = ctxJob()
      if (job) setTimeout(() => ask('safe', t('c_safe'), job), 250)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang])

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }) }, [msgs])

  const chips = [
    ['safe', 'c_safe', 'ShieldCheck', 'text-coral'],
    ['schemes', 'c_schemes', 'Landmark', 'text-greendark'],
    ['unpaid', 'c_unpaid', 'IndianRupee', 'text-[#B4741A]'],
    ['parchi', 'c_parchi', 'FileText', ''],
    ['rate', 'c_rate', 'TrendingUp', 'text-violet'],
  ]

  const submit = async (e) => {
    e?.preventDefault()
    const q = text.trim()
    if (!q) return
    setText('')
    const intent = detectIntent(q)
    if (intent !== 'unknown') return ask(intent, q, intent === 'safe' ? ctxJob() : undefined)
    setMsgs((m) => [...m, { from: 'me', text: q }])
    setBusy(true)
    const llm = await llmAnswer(q, lang, { trade: w.trade })
    setBusy(false)
    setMsgs((m) => [...m, llm ? { from: 'bot', tone: 'info', text: llm } : { from: 'bot', ...saathiAnswer('unknown', {}, lang) }])
  }

  const mic = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) return showToast(t('noMic'), 'info')
    if (listening) { recRef.current?.stop(); return }
    const r = new SR()
    r.lang = LOCALE[lang]
    r.interimResults = false
    r.onresult = (ev) => { const said = ev.results[0][0].transcript; setText(said) }
    r.onend = () => setListening(false)
    r.onerror = () => setListening(false)
    recRef.current = r
    setListening(true)
    r.start()
  }

  const msgSpeech = (m) => [m.text, ...(m.bullets || []).map((b) => b.text)].join('. ')

  return (
    <div className="max-w-[1120px] flex flex-wrap gap-6 items-start">
      <section className="flex-[999_1_480px] min-w-0 card card-hero flex flex-col overflow-hidden md:min-h-[640px]">
        <div className="flex items-center gap-3.5 px-5 py-4 border-b-[1.5px] border-ink">
          <span className="w-12 h-12 shrink-0 rounded-full bg-violetsoft border-[1.5px] border-violet flex items-center justify-center"><Icon name="Sparkles" size={24} className="text-violet" /></span>
          <div className="flex-1"><div className="text-[22px] font-extrabold leading-tight">{t('nav_saathi')}</div><div className="text-[14px] text-muted">{t('saathiSub')}</div></div>
          <span className="flex items-center gap-1.5 text-[13px] font-bold text-greendark"><span className="w-2 h-2 rounded-full bg-green" />{t('online')}</span>
        </div>

        <div className="flex-1 p-4 md:p-5 flex flex-col gap-4 bg-[#FCFAF5] overflow-y-auto max-h-[62vh] md:max-h-none" aria-live="polite">
          {msgs.map((m, i) => m.from === 'me' ? (
            <div key={i} className="self-end max-w-[85%] bg-ink text-white rounded-[16px_16px_4px_16px] px-4 py-3 flex flex-col gap-2 rise">
              <div className="text-[18px] font-bold">{m.text}</div>
              {m.job && <div className="bg-white/15 rounded-[10px] px-2.5 py-1.5 text-[14px] font-semibold">{L(m.job.title, lang)} · {rupee(m.job.pay)}/{t('perDay')}{m.job.advanceFee ? ` · ₹${m.job.advanceFee} fee` : ''}</div>}
            </div>
          ) : (
            <div key={i} className={`self-start max-w-[92%] bg-white border-[1.5px] ${m.tone === 'danger' || m.tone === 'ok' ? 'border-ink' : 'border-[#E2DACA]'} rounded-[16px_16px_16px_4px] overflow-hidden rise`}>
              {m.tone === 'danger' && <div className="caution !h-1.5" aria-hidden="true" />}
              <div className="px-4 py-3 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <span className={`text-[18px] md:text-[20px] font-extrabold leading-snug ${m.tone === 'danger' ? 'text-coraldark' : m.tone === 'ok' ? 'text-greendark' : ''}`}>{m.text}</span>
                  {i > 0 && <ListenButton text={msgSpeech(m)} />}
                </div>
                {m.bullets?.length > 0 && (
                  <div className="flex flex-col gap-2.5">
                    {m.bullets.map((b, k) => (
                      <div key={k} className="flex gap-3 items-center text-[16px] md:text-[17px] font-semibold">
                        <span className={`w-9 h-9 shrink-0 rounded-[10px] flex items-center justify-center ${m.tone === 'danger' ? 'bg-coralsoft' : m.tone === 'ok' ? 'bg-mint' : 'bg-sand'}`}>
                          <Icon name={b.icon} size={21} className={m.tone === 'danger' ? 'text-coral' : m.tone === 'ok' ? 'text-greendark' : ''} />
                        </span>{b.text}
                      </div>
                    ))}
                  </div>
                )}
                {m.actions?.length > 0 && (
                  <div className="flex flex-wrap gap-2.5">
                    {m.actions.map((a, k) => a.to
                      ? <Link key={k} to={a.to} className={`btn ${a.kind === 'primary' ? 'btn-primary' : a.kind === 'dark' ? 'btn-dark' : ''}`}>{a.label}</Link>
                      : <button key={k} type="button" className={`btn ${a.kind === 'dark' ? 'btn-dark' : ''}`} disabled={m.job?.reported}
                        onClick={() => { if (a.action === 'report' && m.job) { reportJob(m.job.id); showToast(t('reported')) } }}>{m.job?.reported && a.action === 'report' ? t('reported') : a.label}</button>)}
                  </div>
                )}
              </div>
            </div>
          ))}
          {busy && <div className="self-start flex items-center gap-2 text-muted font-semibold"><Icon name="LoaderCircle" className="animate-spin" />…</div>}
          <div ref={endRef} />
        </div>

        <div className="px-4 md:px-5 pt-3 pb-4 border-t-[1.5px] border-ink flex flex-col gap-3">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {chips.slice(1, 4).map(([k, key]) => (
              <button key={k} type="button" className="shrink-0 min-h-[42px] px-3.5 rounded-full bg-sand border-0 cursor-pointer text-[15px] font-bold" onClick={() => ask(k, t(key), k === 'safe' ? ctxJob() : undefined)}>{t(key)}</button>
            ))}
          </div>
          <form onSubmit={submit} className="flex gap-2.5 items-center">
            <label htmlFor="saathi-input" className="sr-only">{t('typeOrSpeak')}</label>
            <input id="saathi-input" className="input !min-h-[56px] flex-1 min-w-0" placeholder={listening ? t('listening') : t('typeOrSpeak')} value={text} onChange={(e) => setText(e.target.value)} />
            {text.trim()
              ? <button type="submit" className="btn btn-primary !min-h-[56px]" aria-label={t('send')}><Icon name="Send" /></button>
              : <button type="button" onClick={mic} aria-label={t('listening')} className={`w-[60px] h-[60px] shrink-0 rounded-full border-[1.5px] border-ink flex items-center justify-center cursor-pointer shadow-[3px_3px_0_#1B1B1B] ${listening ? 'bg-coral' : 'bg-violet'}`}>
                <Icon name="Mic" size={26} className="text-white" />
              </button>}
          </form>
        </div>
      </section>

      <aside className="flex-[1_1_300px] min-w-0 flex flex-col gap-3">
        <div className="text-[20px] font-extrabold">{t('quickAsk')}</div>
        {chips.map(([k, key, icon, cls]) => (
          <button key={k} type="button" onClick={() => { ask(k, t(key), k === 'safe' ? ctxJob() : undefined); speak(t(key), lang) }}
            className="min-h-[64px] flex items-center gap-3.5 px-3.5 rounded-2xl bg-white border-[1.5px] border-ink cursor-pointer text-[17px] font-extrabold text-left hover:shadow-[3px_3px_0_#1B1B1B]">
            <span className="w-11 h-11 shrink-0 rounded-xl bg-sand flex items-center justify-center"><Icon name={icon} size={23} className={cls} /></span>{t(key)}
          </button>
        ))}
        <section className="card p-4 flex gap-3 items-center mt-1">
          <Icon name="Phone" size={26} />
          <div className="flex-1"><div className="text-[16px] font-extrabold">{t('helpline')}</div><div className="text-[14px] text-muted">{t('helplineSub')}</div></div>
          <a className="btn" href="tel:14434">{t('call')}</a>
        </section>
      </aside>
    </div>
  )
}
