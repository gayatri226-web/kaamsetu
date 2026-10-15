import { FAIR, MIN_WAGE, NAKAS, TRADES } from './data'
import { LOCALE, L, translate } from './i18n'

/* ---------- Scam / fairness check ---------- */
export function checkJob(job) {
  const [lo, hi] = FAIR[job.trade] || [500, 1000]
  const reasons = []
  if (job.advanceFee > 0) reasons.push({ key: 'r_fee', icon: 'HandCoins', vars: { fee: job.advanceFee }, w: 3 })
  if (job.pay > hi * 1.8) reasons.push({ key: 'r_tooHigh', icon: 'TrendingUp', vars: { x: Math.round(job.pay / ((lo + hi) / 2)) }, w: 2 })
  if (job.pay < MIN_WAGE) reasons.push({ key: 'r_tooLow', icon: 'IndianRupee', w: 2 })
  if (!job.address) reasons.push({ key: 'r_noAddress', icon: 'MapPinOff', w: 2 })
  if (!job.verified && reasons.length) reasons.push({ key: 'r_unverified', icon: 'ShieldCheck', w: 1 })
  const score = reasons.reduce((a, r) => a + r.w, 0)
  const level = score >= 4 ? 'danger' : score >= 2 ? 'warn' : 'ok'
  const fair = job.pay >= lo && job.pay <= hi * 1.15 ? 'fair' : job.pay < lo ? 'low' : 'high'
  return { level, reasons, fair, range: [lo, hi] }
}

export const jobType = (job, today) => {
  if (job.days.length >= 15) return 'long'
  if (job.days[0] === today && job.days.length === 1) return 'today'
  return 'few'
}

/* ---------- Geo ---------- */
export function distanceKm(a, b) {
  const R = 6371, toR = (d) => (d * Math.PI) / 180
  const dLat = toR(b.lat - a.lat), dLng = toR(b.lng - a.lng)
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(toR(a.lat)) * Math.cos(toR(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(s))
}

export function getLocation(timeout = 8000) {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) return reject(new Error('no-geo'))
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
      (e) => reject(e),
      { enableHighAccuracy: true, timeout, maximumAge: 60000 },
    )
  })
}

export function nearestNaka(pos) {
  let best = null
  for (const n of Object.values(NAKAS)) {
    const d = distanceKm(pos, n)
    if (!best || d < best.d) best = { naka: n, d }
  }
  return best
}

/* ---------- Dates ---------- */
export const fmtDay = (iso, lang, opts = { weekday: 'short' }) =>
  new Date(iso + 'T12:00:00').toLocaleDateString(LOCALE[lang], opts)
export const fmtDate = (iso, lang) => new Date(iso + 'T12:00:00').toLocaleDateString(LOCALE[lang], { day: 'numeric', month: 'short' })
export const rupee = (n) => '₹' + Number(n).toLocaleString('en-IN')
export function fmtRange(days, lang) {
  if (!days.length) return ''
  if (days.length === 1) return `${fmtDay(days[0], lang)} ${fmtDate(days[0], lang)}`
  return `${fmtDay(days[0], lang)} ${fmtDate(days[0], lang)} – ${fmtDay(days.at(-1), lang)} ${fmtDate(days.at(-1), lang)}`
}

/* ---------- Speech ---------- */
export function speak(text, lang) {
  try {
    const synth = window.speechSynthesis
    if (!synth) return false
    synth.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.lang = LOCALE[lang]
    const voices = synth.getVoices()
    const v = voices.find((x) => x.lang === u.lang) || voices.find((x) => x.lang?.startsWith(lang)) || voices.find((x) => x.lang === 'hi-IN')
    if (v) u.voice = v
    u.rate = 0.92
    synth.speak(u)
    return true
  } catch {
    return false
  }
}

export function jobSpeech(job, lang, km) {
  const n = job.days.length
  const t = TRADES.find((x) => x.id === job.trade)
  if (lang === 'en')
    return `${L(job.title, lang)}. ${L(job.employer, lang)}, ${L(job.area, lang)}. ${job.pay} rupees per day, for ${n} day${n > 1 ? 's' : ''}. Hours ${job.hours}. ${km ? km.toFixed(1) + ' kilometres away.' : ''}`
  if (lang === 'mr')
    return `${L(job.title, lang)}. ${L(job.employer, lang)}, ${L(job.area, lang)}. दिवसाला ${job.pay} रुपये, ${n} दिवस. वेळ ${job.hours}. ${km ? km.toFixed(1) + ' किलोमीटर दूर.' : ''} ${t ? '' : ''}`
  return `${L(job.title, lang)}. ${L(job.employer, lang)}, ${L(job.area, lang)}. हर दिन ${job.pay} रुपये, ${n} दिन का काम. समय ${job.hours}. ${km ? km.toFixed(1) + ' किलोमीटर दूर.' : ''}`
}

export function parchiSpeech(b, lang) {
  const s = b.snap, n = b.log.length, total = s.pay * n
  if (lang === 'en') return `Work slip. ${L(s.title, lang)} for ${L(s.employer, lang)}. ${n} days at ${s.pay} rupees, total ${total} rupees. Hours ${s.hours}. Paid ${L(s.payWhen, lang)}. Advance fee: none.`
  if (lang === 'mr') return `कामाची पावती. ${L(s.title, lang)}, ${L(s.employer, lang)}. ${n} दिवस, दिवसाला ${s.pay} रुपये, एकूण ${total} रुपये. वेळ ${s.hours}. पैसे ${L(s.payWhen, lang)}. आगाऊ फी नाही.`
  return `काम पर्ची. ${L(s.title, lang)}, ${L(s.employer, lang)}. ${n} दिन, हर दिन ${s.pay} रुपये, कुल ${total} रुपये. समय ${s.hours}. पैसा ${L(s.payWhen, lang)}. कोई एडवांस फीस नहीं.`
}

/* ---------- Employer quick post parser (rule-based, works offline) ---------- */
const TRADE_WORDS = {
  painter: ['paint', 'painter', 'पेंट', 'रंग', 'पुट्टी', 'putty'],
  plumber: ['plumb', 'pipe', 'leak', 'नल', 'पाइप', 'प्लंबर'],
  electrician: ['electric', 'wiring', 'wire', 'बिजली', 'वायर'],
  carpenter: ['carpent', 'wood', 'furniture', 'बढ़ई', 'सुतार', 'लकड़ी'],
  mason: ['mason', 'brick', 'tile', 'cement', 'मिस्त्री', 'गवंडी', 'टाइल'],
  cleaning: ['clean', 'सफ़ाई', 'सफाई', 'साफ'],
  helper: ['helper', 'labour', 'labor', 'shift', 'मज़दूर', 'मजदूर', 'हेल्पर'],
}
const AREAS = ['Vidyavihar', 'Ghatkopar', 'Kurla', 'Vikhroli', 'Pant Nagar', 'Asalpha', 'Kirol', 'Chembur', 'Powai', 'Bhandup', 'Sion']
export function parseQuickPost(text) {
  const s = text.toLowerCase()
  let trade = null
  for (const [k, words] of Object.entries(TRADE_WORDS)) if (words.some((w) => s.includes(w.toLowerCase()))) { trade = k; break }
  const daysM = s.match(/(\d+)\s*(day|days|din|दिन|दिवस)/)
  const nums = [...s.matchAll(/(?:₹|rs\.?\s*|inr\s*)?(\d{3,5})/g)].map((m) => +m[1]).filter((n) => n >= 200 && n <= 5000)
  const area = AREAS.find((a) => s.includes(a.toLowerCase())) || null
  const hoursM = s.match(/(\d{1,2})\s*(?:am|a\.m\.)?\s*(?:-|to|–)\s*(\d{1,2})\s*(?:pm|p\.m\.)?/)
  return {
    trade, days: daysM ? Math.min(+daysM[1], 60) : null, pay: nums[0] || null, area,
    hours: hoursM ? `${hoursM[1]} – ${hoursM[2]}` : null,
  }
}

/* ---------- Setu Saathi: built-in answers (no API needed) ---------- */
export function detectIntent(text) {
  const s = text.toLowerCase()
  if (/(fee|advance|safe|scam|fraud|धोखा|फीस|सुरक्षित|पैसे पहले|फसव|सुरक्षित)/.test(s)) return 'safe'
  if (/(scheme|yojana|योजना|pension|पेंशन|पेन्शन|e-?shram|ई-श्रम|बीमा|विमा|insurance)/.test(s)) return 'schemes'
  if (/(not paid|unpaid|paisa|पैसा नहीं|पैसे मिळाले नाहीत|पैसा नही|salary|मज़दूरी नहीं|पगार)/.test(s)) return 'unpaid'
  if (/(parchi|slip|पर्ची|पावती)/.test(s)) return 'parchi'
  if (/(rate|रेट|दर|कितना|how much|wage|मज़दूरी)/.test(s)) return 'rate'
  return 'unknown'
}

export function saathiAnswer(intent, ctx, lang) {
  const t = (k, v) => translate(lang, k, v)
  const tr = (hi, mr, en) => ({ hi, mr, en })[lang]
  switch (intent) {
    case 'safe': {
      const job = ctx.job
      if (!job) return { tone: 'info', text: tr('किसी भी काम पर "सेतु साथी से पूछें" दबाएं, मैं जाँच कर दूंगा।', 'कोणत्याही कामावर "सेतू साथीला विचारा" दाबा, मी तपासतो.', 'Tap "Ask Setu Saathi" on any job and I will check it.') }
      const c = checkJob(job)
      if (c.level === 'ok')
        return {
          tone: 'ok', job,
          text: tr('हाँ, ये काम ठीक लगता है', 'होय, हे काम ठीक वाटते', 'Yes, this job looks fine'),
          bullets: [
            { icon: 'BadgeCheck', text: tr('मालिक पक्का है', 'मालक पडताळलेला आहे', 'Employer is verified') },
            { icon: 'IndianRupee', text: tr(`₹${job.pay} इलाके के रेट के अंदर है`, `₹${job.pay} भागातील दरात आहे`, `₹${job.pay} is within the area rate`) },
            { icon: 'FileText', text: tr('पक्का करने से पहले पर्ची ज़रूर देखें', 'पक्के करण्याआधी पावती नक्की पाहा', 'Check the slip before confirming') },
          ],
          actions: [{ label: t('take'), to: `/w/parchi/new/${job.id}`, kind: 'primary' }],
        }
      return {
        tone: 'danger', job,
        text: tr('नहीं, ये धोखा लगता है', 'नाही, ही फसवणूक वाटते', "No, this looks like a scam"),
        bullets: c.reasons.map((r) => ({ icon: r.icon, text: t(r.key, r.vars) })).concat([
          { icon: 'ShieldCheck', text: tr('असली काम में पहले पैसे कभी नहीं मांगे जाते', 'खऱ्या कामात आधी पैसे कधीच मागत नाहीत', 'Real jobs never ask you to pay first') },
        ]),
        actions: [{ label: t('report'), action: 'report', kind: 'dark' }, { label: tr('सही काम देखें', 'योग्य कामे पाहा', 'See fair jobs'), to: '/w', kind: 'primary' }],
      }
    }
    case 'schemes':
      return {
        tone: 'ok',
        text: tr('आप इन योजनाओं के योग्य हो सकते हैं', 'तुम्ही या योजनांसाठी पात्र असू शकता', 'You may be eligible for these'),
        bullets: [
          { icon: 'IdCard', text: tr('e-Shram कार्ड: ₹2 लाख दुर्घटना बीमा', 'ई-श्रम कार्ड: ₹2 लाख अपघात विमा', 'e-Shram card: ₹2 lakh accident cover') },
          { icon: 'Landmark', text: tr('BOCW बोर्ड: औज़ार और बच्चों की पढ़ाई में मदद', 'बांधकाम मंडळ: अवजारे आणि शिक्षणासाठी मदत', 'Construction board: tools and education help') },
          { icon: 'ShieldCheck', text: tr('PM सुरक्षा बीमा: ₹20 साल में', 'PM सुरक्षा विमा: ₹20 वर्षाला', 'PM Suraksha Bima: ₹20 a year') },
        ],
        actions: [{ label: tr('पूरी जाँच करें', 'पूर्ण तपासा', 'Check fully'), to: '/w/rights', kind: 'primary' }],
      }
    case 'unpaid':
      return {
        tone: 'info',
        text: tr('घबराइए मत, पर्ची आपका सबूत है', 'घाबरू नका, पावती तुमचा पुरावा आहे', "Don't worry, your slip is proof"),
        bullets: [
          { icon: 'FileText', text: t('g1') },
          { icon: 'Flag', text: t('g2') },
          { icon: 'Phone', text: tr('e-Shram हेल्पलाइन 14434 पर कॉल करें', 'ई-श्रम हेल्पलाइन 14434 वर कॉल करा', 'Call e-Shram helpline 14434') },
        ],
        actions: [{ label: t('nav_parchi'), to: '/w/parchi', kind: 'primary' }],
      }
    case 'parchi':
      return {
        tone: 'info',
        text: tr('पर्ची में चार बातें देखें', 'पावतीत चार गोष्टी पाहा', 'Check four things on the slip'),
        bullets: [
          { icon: 'IndianRupee', text: tr('हर दिन कितने पैसे, और कुल कितने', 'दिवसाला किती पैसे, आणि एकूण किती', 'Pay per day, and the total') },
          { icon: 'Clock', text: tr('काम का समय', 'कामाची वेळ', 'Working hours') },
          { icon: 'Wallet', text: tr('पैसा कब और कैसे मिलेगा', 'पैसे कधी आणि कसे मिळतील', 'When and how you get paid') },
          { icon: 'HandCoins', text: tr('एडवांस फीस ₹0 होनी चाहिए', 'आगाऊ फी ₹0 असावी', 'Advance fee must be ₹0') },
        ],
      }
    case 'rate': {
      const [lo, hi] = FAIR[ctx.trade] || FAIR.painter
      return {
        tone: 'ok',
        text: tr(`आज घाटकोपर में सही रेट ₹${lo} – ₹${hi} प्रति दिन है`, `आज घाटकोपरमध्ये योग्य दर ₹${lo} – ₹${hi} प्रतिदिन आहे`, `Fair rate in Ghatkopar today: ₹${lo} – ₹${hi} per day`),
        bullets: [{ icon: 'TrendingUp', text: tr('इससे कम मिले तो मोलभाव करें', 'यापेक्षा कमी मिळाले तर घासाघीस करा', 'If offered less, negotiate') }],
      }
    }
    default:
      return {
        tone: 'info',
        text: tr('मैं इन चीज़ों में मदद कर सकता हूँ, नीचे दबाएं', 'मी यात मदत करू शकतो, खाली दाबा', 'I can help with these, tap one below'),
      }
  }
}

/* Optional: real LLM answer for free text, only if a key is configured. */
export async function llmAnswer(text, lang, ctx) {
  const key = import.meta.env.VITE_GEMINI_API_KEY
  if (!key) return null
  const model = import.meta.env.VITE_GEMINI_MODEL || 'gemini-2.0-flash'
  const langName = { hi: 'Hindi', mr: 'Marathi', en: 'simple English' }[lang]
  const sys = `You are Setu Saathi, a helper for daily-wage workers at Mumbai labour nakas. Reply in ${langName}, in at most 3 short sentences, simple words, no jargon. Never ask workers to pay anyone. If unsure, suggest calling e-Shram helpline 14434. Worker trade: ${ctx.trade}.`
  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ systemInstruction: { parts: [{ text: sys }] }, contents: [{ role: 'user', parts: [{ text }] }] }),
    })
    const j = await r.json()
    return j?.candidates?.[0]?.content?.parts?.[0]?.text || null
  } catch {
    return null
  }
}
