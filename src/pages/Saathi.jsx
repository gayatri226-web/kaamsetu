import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useStore } from '../lib/store'
import { L, LOCALE } from '../lib/i18n'
import { tradeById } from '../lib/data'
import { FOLLOW_LABEL, checkJob, detectIntent, fmtRange, llmAnswer, rupee, saathiAnswer, speak } from '../lib/logic'
import { Icon, ListenButton } from '../components/ui'

const now = () => new Date().toTimeString().slice(0, 5)

export default function Saathi() {
  const { t, lang, state, today, reportJob, toggleCheckIn, showToast } = useStore()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const w = state.worker
  const [msgs, setMsgs] = useState([])
  const [text, setText] = useState('')
  const [typing, setTyping] = useState(false)
  const [listening, setListening] = useState(false)
  const [autoSpeak, setAutoSpeak] = useState(false)
  const endRef = useRef()
  const recRef = useRef()
  const stateRef = useRef(state)
  stateRef.current = state
  const tr = (hi, mr, en) => ({ hi, mr, en })[lang]

  // The job being asked about: from the link, else the scam job in my trade, else any flagged job
  const ctxJob = () => {
    const s = stateRef.current
    const id = params.get('job')
    return s.jobs.find((j) => j.id === id)
      || s.jobs.find((j) => j.status === 'open' && j.trade === w.trade && checkJob(j).level === 'danger')
      || s.jobs.find((j) => j.status === 'open' && checkJob(j).level === 'danger')
  }
  const ctx = (job) => ({ job, worker: stateRef.current.worker, jobs: stateRef.current.jobs, bookings: stateRef.current.bookings, today })

  const reply = (ans) => {
    setTyping(true)
    setTimeout(() => {
      setTyping(false)
      setMsgs((m) => [...m, { from: 'bot', at: now(), ...ans }])
      if (autoSpeak) speak([ans.text, ...(ans.bullets || []).map((b) => b.text)].join('. '), lang)
    }, 650)
  }

  const ask = (intent, userText) => {
    const job = intent === 'safe' ? ctxJob() : undefined
    setMsgs((m) => [...m, { from: 'me', text: userText, job, at: now() }])
    reply(saathiAnswer(intent, ctx(job), lang))
  }

  useEffect(() => {
    const first = w.name.split(' ')[0]
    setMsgs([{
      from: 'bot', at: now(), tone: 'info',
      text: tr(`नमस्ते ${first}! मैं सेतु साथी हूँ। काम, पैसा, या सरकारी योजना, कुछ भी पूछिए।`, `नमस्कार ${first}! मी सेतू साथी. काम, पैसे किंवा सरकारी योजना, काहीही विचारा.`, `Hi ${first}! I'm Setu Saathi. Ask me about jobs, money or government schemes.`),
      follow: ['jobs', 'next', 'dues', 'safe'],
    }])
    if (params.get('job')) setTimeout(() => ask('safe', t('c_safe')), 300)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang])

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }) }, [msgs, typing])

  const submit = async (e) => {
    e?.preventDefault()
    const q = text.trim()
    if (!q) return
    setText('')
    const intent = detectIntent(q)
    if (intent !== 'unknown') return ask(intent, q)
    setMsgs((m) => [...m, { from: 'me', text: q, at: now() }])
    setTyping(true)
    const llm = await llmAnswer(q, lang, { trade: w.trade })
    setTyping(false)
    if (llm) setMsgs((m) => [...m, { from: 'bot', at: now(), tone: 'info', text: llm, follow: ['jobs', 'dues', 'schemes'] }])
    else reply(saathiAnswer('unknown', ctx(), lang))
  }

  const mic = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) return showToast(t('noMic'), 'info')
    if (listening) { recRef.current?.stop(); return }
    const r = new SR()
    r.lang = LOCALE[lang]
    r.interimResults = false
    r.onresult = (ev) => {
      const said = ev.results[0][0].transcript
      const intent = detectIntent(said)
      if (intent !== 'unknown') ask(intent, said)
      else setText(said)
    }
    r.onend = () => setListening(false)
    r.onerror = () => { setListening(false); showToast(t('noMic'), 'info') }
    recRef.current = r
    setListening(true)
    try { r.start() } catch { setListening(false) }
  }

  const doAction = (a, m) => {
    if (a.to) return navigate(a.to)
    if (a.intent) return ask(a.intent, L(FOLLOW_LABEL[a.intent], lang))
    if (a.action === 'report' && m.job) { reportJob(m.job.id); showToast(t('reported')) }
    if (a.action === 'checkin') { toggleCheckIn(true); showToast(t('atNakaOn')) }
  }

  const msgSpeech = (m) => [m.text, ...(m.bullets || []).map((b) => b.text), ...(m.jobs || []).map((j) => `${L(j.title, lang)}, ${j.pay} ${t('perDay')}`)].join('. ')
  const toneText = { danger: 'text-coraldark', ok: 'text-greendark', info: '' }
  const toneBg = { danger: 'bg-coralsoft', ok: 'bg-mint', info: 'bg-sand' }
  const toneIcon = { danger: 'text-coral', ok: 'text-greendark', info: '' }

  return (
    <div className="max-w-[1120px] flex flex-wrap gap-6 items-start">
      <section className="flex-[999_1_480px] min-w-0 card card-hero flex flex-col overflow-hidden md:h-[calc(100vh-64px)] md:max-h-[820px]">
        <div className="flex items-center gap-3.5 px-5 py-3.5 border-b-[1.5px] border-ink">
          <span className="w-12 h-12 shrink-0 rounded-full bg-violetsoft border-[1.5px] border-violet flex items-center justify-center"><Icon name="Sparkles" size={24} className="text-violet" /></span>
          <div className="flex-1 min-w-0">
            <div className="text-[21px] font-extrabold leading-tight">{t('nav_saathi')}</div>
            <div className="text-[14px] text-muted flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green" />{t('online')} · {L(tradeById(w.trade).name, lang)}</div>
          </div>
          <button type="button" aria-pressed={autoSpeak} onClick={() => setAutoSpeak(!autoSpeak)}
            className={`min-h-[42px] px-3.5 rounded-full border-[1.5px] cursor-pointer flex items-center gap-1.5 text-[14px] font-bold ${autoSpeak ? 'bg-violet text-white border-violet' : 'bg-white border-ink'}`}>
            <Icon name="Volume2" size={17} />{tr('जवाब बोलकर', 'उत्तर बोलून', 'Speak replies')}
          </button>
        </div>

        <div className="flex-1 min-h-[360px] p-4 md:p-5 flex flex-col gap-4 bg-[#FCFAF5] overflow-y-auto" aria-live="polite">
          {msgs.map((m, i) => m.from === 'me' ? (
            <div key={i} className="self-end max-w-[85%] flex flex-col items-end gap-1 rise">
              <div className="bg-ink text-white rounded-[18px_18px_4px_18px] px-4 py-2.5 flex flex-col gap-2">
                <div className="text-[17px] font-bold">{m.text}</div>
                {m.job && <div className="bg-white/15 rounded-[10px] px-2.5 py-1.5 text-[14px] font-semibold">{L(m.job.title, lang)} · {rupee(m.job.pay)}/{t('perDay')}{m.job.advanceFee ? ` · ₹${m.job.advanceFee} fee` : ''}</div>}
              </div>
              <span className="text-[12px] text-muted">{m.at}</span>
            </div>
          ) : (
            <div key={i} className="self-start max-w-[94%] flex gap-2.5 rise">
              <span className="w-8 h-8 shrink-0 rounded-full bg-violetsoft flex items-center justify-center mt-1"><Icon name="Sparkles" size={16} className="text-violet" /></span>
              <div className="flex flex-col gap-2 min-w-0">
                <div className={`bg-white border-[1.5px] ${m.tone === 'danger' || m.tone === 'ok' ? 'border-ink' : 'border-[#E2DACA]'} rounded-[4px_18px_18px_18px] overflow-hidden`}>
                  {m.tone === 'danger' && <div className="caution !h-1.5" aria-hidden="true" />}
                  <div className="px-4 py-3 flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-3">
                      <span className={`text-[18px] font-extrabold leading-snug ${toneText[m.tone] || ''}`}>{m.text}</span>
                      <ListenButton text={msgSpeech(m)} className="!min-h-[40px] !w-[40px] shrink-0" />
                    </div>
                    {m.bullets?.length > 0 && (
                      <div className="flex flex-col gap-2">
                        {m.bullets.map((b, k) => (
                          <div key={k} className="flex gap-3 items-center text-[16px] font-semibold">
                            <span className={`w-9 h-9 shrink-0 rounded-[10px] flex items-center justify-center ${toneBg[m.tone] || 'bg-sand'}`}><Icon name={b.icon} size={19} className={toneIcon[m.tone] || ''} /></span>
                            <span className="min-w-0">{b.text}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {m.jobs?.length > 0 && (
                      <div className="flex flex-col gap-2">
                        {m.jobs.map((j) => (
                          <div key={j.id} className="flex flex-wrap items-center gap-3 p-2.5 rounded-xl border-[1.5px] border-line">
                            <span className="w-10 h-10 shrink-0 rounded-lg bg-sand flex items-center justify-center"><Icon name={tradeById(j.trade).icon} size={20} /></span>
                            <div className="flex-1 min-w-[140px]">
                              <div className="text-[16px] font-extrabold leading-tight">{L(j.title, lang)}</div>
                              <div className="text-[13px] text-muted">{L(j.area, lang)} · {fmtRange(j.days, lang)}</div>
                            </div>
                            <span className="num text-[19px]">{rupee(j.pay)}</span>
                            <Link to={`/w/parchi/new/${j.id}`} className="btn btn-primary !min-h-[40px] !px-3.5 text-[15px]">{t('take')}</Link>
                          </div>
                        ))}
                      </div>
                    )}
                    {m.actions?.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {m.actions.map((a, k) => (
                          <button key={k} type="button" disabled={a.action === 'report' && m.job?.reported}
                            className={`btn !min-h-[44px] ${a.kind === 'primary' ? 'btn-primary' : a.kind === 'dark' ? 'btn-dark' : ''}`} onClick={() => doAction(a, m)}>
                            {a.action === 'report' && m.job?.reported ? t('reported') : a.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                {i === msgs.length - 1 && m.follow?.length > 0 && !typing && (
                  <div className="flex flex-wrap gap-2">
                    {m.follow.map((k) => (
                      <button key={k} type="button" onClick={() => ask(k, L(FOLLOW_LABEL[k], lang))}
                        className="min-h-[40px] px-3.5 rounded-full bg-white border-[1.5px] border-ink cursor-pointer text-[14px] font-bold flex items-center gap-1.5 hover:bg-goldsoft">
                        <Icon name={FOLLOW_LABEL[k].icon} size={15} />{L(FOLLOW_LABEL[k], lang)}
                      </button>
                    ))}
                  </div>
                )}
                <span className="text-[12px] text-muted">{m.at}</span>
              </div>
            </div>
          ))}
          {typing && (
            <div className="self-start flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-full bg-violetsoft flex items-center justify-center"><Icon name="Sparkles" size={16} className="text-violet" /></span>
              <span className="bg-white border-[1.5px] border-[#E2DACA] rounded-full px-4 py-2.5 flex gap-1.5" aria-label="typing">
                {[0, 1, 2].map((d) => <span key={d} className="w-2 h-2 rounded-full bg-muted animate-bounce" style={{ animationDelay: `${d * 0.15}s` }} />)}
              </span>
            </div>
          )}
          <div ref={endRef} />
        </div>

        <form onSubmit={submit} className="px-4 md:px-5 py-3.5 border-t-[1.5px] border-ink flex gap-2.5 items-center">
          <label htmlFor="saathi-input" className="sr-only">{t('typeOrSpeak')}</label>
          <input id="saathi-input" className="input !min-h-[56px] !rounded-full flex-1 min-w-0" placeholder={listening ? t('listening') : t('typeOrSpeak')} value={text} onChange={(e) => setText(e.target.value)} />
          {text.trim()
            ? <button type="submit" className="w-[58px] h-[58px] shrink-0 rounded-full bg-gold border-[1.5px] border-ink shadow-[3px_3px_0_#1B1B1B] flex items-center justify-center cursor-pointer" aria-label={t('send')}><Icon name="Send" size={24} /></button>
            : <button type="button" onClick={mic} aria-label={t('listening')} className={`w-[58px] h-[58px] shrink-0 rounded-full border-[1.5px] border-ink flex items-center justify-center cursor-pointer shadow-[3px_3px_0_#1B1B1B] ${listening ? 'bg-coral live-dot' : 'bg-violet'}`}>
              <Icon name="Mic" size={26} className="text-white" />
            </button>}
        </form>
      </section>

      <aside className="flex-[1_1_300px] min-w-0 flex flex-col gap-3">
        <div className="text-[19px] font-extrabold">{t('quickAsk')}</div>
        {['jobs', 'next', 'dues', 'safe', 'schemes', 'unpaid', 'rate'].map((k) => (
          <button key={k} type="button" onClick={() => ask(k, L(FOLLOW_LABEL[k], lang))}
            className="min-h-[60px] flex items-center gap-3.5 px-3.5 rounded-full bg-white border-[1.5px] border-ink cursor-pointer text-[16px] font-extrabold text-left hover:shadow-[3px_3px_0_#1B1B1B]">
            <span className="w-10 h-10 shrink-0 rounded-full bg-sand flex items-center justify-center"><Icon name={FOLLOW_LABEL[k].icon} size={20} className={k === 'safe' ? 'text-coral' : k === 'jobs' ? 'text-greendark' : ''} /></span>
            {L(FOLLOW_LABEL[k], lang)}
          </button>
        ))}
        <div className="text-[13px] text-muted px-1">{tr('बोलकर भी पूछ सकते हैं: "मेरा अगला काम", "कितना पैसा बाकी है", "क्या ये काम सुरक्षित है"', 'बोलूनही विचारू शकता: "माझे पुढचे काम", "किती पैसे बाकी", "हे काम सुरक्षित आहे का"', 'You can also say: "my next job", "how much is due", "is this job safe"')}</div>
        <section className="card p-4 flex gap-3 items-center mt-1 !rounded-[22px]">
          <Icon name="Phone" size={24} />
          <div className="flex-1"><div className="text-[16px] font-extrabold">{t('helpline')}</div><div className="text-[14px] text-muted">e-Shram · <span className="num text-ink">14434</span></div></div>
          <a className="btn !rounded-full" href="tel:14434">{t('call')}</a>
        </section>
      </aside>
    </div>
  )
}
