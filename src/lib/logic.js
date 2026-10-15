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

/* ---------- Setu Saathi: built-in, context-aware answers (no API needed) ---------- */
const INTENTS = [
  ['unpaid', /(not paid|unpaid|didn'?t pay|पैसा नहीं मिला|पैसे नहीं मिले|पैसा नही मिला|पैसे मिळाले नाहीत|पगार मिळाला नाही|मज़दूरी नहीं मिली|shikayat|शिकायत|तक्रार|complaint)/],
  ['safe', /(fee|advance|safe|scam|fraud|fake|धोखा|फीस|फी |सुरक्षित|पैसे पहले|पहले पैसे|फसव|सुरक्षित आहे|खरा|असली)/],
  ['dues', /(बाकी|due|owe|हिसाब|हिशोब|कितना पैसा|किती पैसे|how much.*(money|earn)|कमाई|earning|कमावले)/],
  ['next', /(अगला काम|next job|कल का काम|tomorrow|पुढचे काम|मेरा काम कब|my booking|बुक)/],
  ['jobs', /(काम चाहिए|काम दो|काम दिखा|काम मिल|kaam|job|work for me|नौकरी|काम हवे|काम द्या|काम शोध|find work|nearby)/],
  ['schemes', /(scheme|yojana|योजना|pension|पेंशन|पेन्शन|e-?shram|ई-श्रम|बीमा|विमा|insurance|सरकारी|card|कार्ड)/],
  ['parchi', /(parchi|slip|पर्ची|पावती|receipt)/],
  ['rate', /(rate|रेट|दर|कितना मिलना|how much should|wage|मज़दूरी|मजुरी|minimum)/],
  ['checkin', /(naka|नाका|नाके|हाजिरी|हजेरी|check ?in|attendance)/],
  ['hello', /^(hi|hello|hey|namaste|नमस्ते|नमस्कार|राम राम|hii+)\b/],
]
export function detectIntent(text) {
  const s = text.toLowerCase().trim()
  for (const [k, re] of INTENTS) if (re.test(s)) return k
  return 'unknown'
}

// ctx: { job, worker, jobs, bookings, today }
export function saathiAnswer(intent, ctx, lang) {
  const t = (k, v) => translate(lang, k, v)
  const tr = (hi, mr, en) => ({ hi, mr, en })[lang]
  const w = ctx.worker || {}
  const trade = TRADES.find((x) => x.id === w.trade)
  const tradeName = trade ? L(trade.name, lang) : ''
  const money = (b) => {
    const worked = b.log.filter((l) => l.worked).length, paid = b.log.filter((l) => l.paid).length
    return { due: (worked - paid) * b.snap.pay, received: paid * b.snap.pay, earned: worked * b.snap.pay }
  }
  const fairJobs = (ctx.jobs || []).filter((j) => j.status === 'open' && j.trade === w.trade && checkJob(j).level === 'ok' && (!j.directFor || j.directFor === w.setu))

  switch (intent) {
    case 'hello':
      return { tone: 'info', text: tr(`नमस्ते ${w.name?.split(' ')[0] || ''}! बताइए, क्या मदद करूं?`, `नमस्कार ${w.name?.split(' ')[0] || ''}! सांगा, काय मदत करू?`, `Hello ${w.name?.split(' ')[0] || ''}! How can I help?`), follow: ['jobs', 'dues', 'schemes'] }

    case 'jobs': {
      const list = fairJobs.slice().sort((a, b) => a.days[0].localeCompare(b.days[0])).slice(0, 3)
      if (!list.length) return { tone: 'info', text: tr(`अभी ${tradeName} का कोई सही काम खुला नहीं है। नया काम आते ही बताऊंगा।`, `आत्ता ${tradeName} चे योग्य काम उघडे नाही. नवीन काम आल्यावर सांगेन.`, `No fair ${tradeName} jobs are open right now. I'll tell you when one comes.`), actions: [{ label: t('allTrades'), to: '/w', kind: 'primary' }], follow: ['rate', 'schemes'] }
      return {
        tone: 'ok', text: tr(`आपके लिए ${list.length} सही ${tradeName} काम`, `तुमच्यासाठी ${list.length} योग्य ${tradeName} कामे`, `${list.length} fair ${tradeName} jobs for you`),
        jobs: list,
        follow: ['safe', 'rate', 'next'],
      }
    }

    case 'next': {
      const items = (ctx.bookings || []).filter((b) => b.status !== 'completed')
        .map((b) => ({ b, day: b.log.find((l) => l.date >= ctx.today && !l.worked) })).filter((x) => x.day)
        .sort((a, b) => a.day.date.localeCompare(b.day.date))
      if (!items.length) return { tone: 'info', text: tr('अभी कोई काम बुक नहीं है।', 'आत्ता कोणतेही काम बुक नाही.', 'Nothing is booked yet.'), actions: [{ label: t('findWork'), intent: 'jobs', kind: 'primary' }], follow: ['jobs'] }
      const { b, day } = items[0]
      const when = day.date === ctx.today ? tr('आज', 'आज', 'Today') : fmtRange([day.date], lang)
      return {
        tone: 'ok', text: tr(`अगला काम: ${L(b.snap.title, lang)}`, `पुढचे काम: ${L(b.snap.title, lang)}`, `Next job: ${L(b.snap.title, lang)}`),
        bullets: [
          { icon: 'CalendarDays', text: `${when} · ${b.snap.hours}` },
          { icon: 'MapPin', text: b.snap.address || L(b.snap.area, lang) || '' },
          { icon: 'IndianRupee', text: `₹${b.snap.pay} / ${t('perDay')} · ${L(b.snap.employer, lang)}` },
          ...(b.status === 'pending' ? [{ icon: 'FileText', text: tr('आपकी हाँ बाकी है', 'तुमचा होकार बाकी आहे', 'Your yes is still pending') }] : []),
        ],
        actions: [{ label: t('parchi'), to: `/w/parchi/${b.id}`, kind: 'primary' }],
        follow: ['dues', 'parchi'],
      }
    }

    case 'dues': {
      const sum = (ctx.bookings || []).reduce((a, b) => { const m = money(b); a.due += m.due; a.received += m.received; a.earned += m.earned; return a }, { due: 0, received: 0, earned: 0 })
      const dueSlip = (ctx.bookings || []).find((b) => money(b).due > 0)
      return {
        tone: sum.due ? 'danger' : 'ok',
        text: sum.due ? tr(`आपके ₹${sum.due} बाकी हैं`, `तुमचे ₹${sum.due} बाकी आहेत`, `₹${sum.due} is still owed to you`) : tr('आपका कोई पैसा बाकी नहीं है', 'तुमचे कोणतेही पैसे बाकी नाहीत', 'Nothing is owed to you'),
        bullets: [
          { icon: 'Wallet', text: `${t('earned')}: ₹${sum.earned}` },
          { icon: 'CircleCheck', text: `${t('received')}: ₹${sum.received}` },
          ...(dueSlip ? [{ icon: 'FileText', text: tr(`${L(dueSlip.snap.employer, lang)} से ₹${money(dueSlip).due}`, `${L(dueSlip.snap.employer, lang)} कडून ₹${money(dueSlip).due}`, `₹${money(dueSlip).due} from ${L(dueSlip.snap.employer, lang)}`) }] : []),
        ],
        actions: dueSlip ? [{ label: t('notPaid'), to: `/w/parchi/${dueSlip.id}`, kind: 'dark' }] : [],
        follow: dueSlip ? ['unpaid', 'next'] : ['jobs', 'next'],
      }
    }

    case 'safe': {
      const job = ctx.job
      if (!job) return { tone: 'info', text: tr('किसी भी काम पर "सेतु साथी से पूछें" दबाएं, मैं उसे जाँच दूंगा। या काम का रेट और फीस लिखें।', 'कोणत्याही कामावर "सेतू साथीला विचारा" दाबा, मी तपासतो. किंवा कामाचा दर आणि फी लिहा.', 'Tap "Ask Setu Saathi" on any job and I will check it, or type the pay and any fee.'), follow: ['jobs', 'rate'] }
      const c = checkJob(job)
      if (c.level === 'ok')
        return {
          tone: 'ok', job,
          text: tr('हाँ, ये काम ठीक लगता है', 'होय, हे काम ठीक वाटते', 'Yes, this job looks fine'),
          bullets: [
            { icon: 'BadgeCheck', text: job.verified ? tr('मालिक पक्का है', 'मालक पडताळलेला आहे', 'Employer is verified') : tr('मालिक अभी पक्का नहीं, पर्ची ज़रूर लें', 'मालक अजून पडताळलेला नाही, पावती घ्या', 'Employer not verified yet: insist on the slip') },
            { icon: 'IndianRupee', text: tr(`₹${job.pay} इलाके के रेट (₹${c.range[0]}–${c.range[1]}) में है`, `₹${job.pay} भागातील दरात (₹${c.range[0]}–${c.range[1]}) आहे`, `₹${job.pay} is within the area rate (₹${c.range[0]}–${c.range[1]})`) },
            { icon: 'HandCoins', text: tr('कोई एडवांस फीस नहीं', 'आगाऊ फी नाही', 'No advance fee') },
          ],
          actions: [{ label: t('take'), to: `/w/parchi/new/${job.id}`, kind: 'primary' }],
          follow: ['parchi', 'next'],
        }
      return {
        tone: 'danger', job,
        text: tr('नहीं, ये धोखा लगता है', 'नाही, ही फसवणूक वाटते', 'No, this looks like a scam'),
        bullets: c.reasons.map((r) => ({ icon: r.icon, text: t(r.key, r.vars) })).concat([
          { icon: 'ShieldCheck', text: tr('असली काम में पहले पैसे कभी नहीं मांगे जाते', 'खऱ्या कामात आधी पैसे कधीच मागत नाहीत', 'Real jobs never ask you to pay first') },
        ]),
        actions: [{ label: t('report'), action: 'report', kind: 'dark' }, { label: tr('सही काम दिखाओ', 'योग्य कामे दाखवा', 'Show fair jobs'), intent: 'jobs', kind: 'primary' }],
        follow: ['jobs', 'unpaid'],
      }
    }

    case 'schemes':
      return {
        tone: 'ok',
        text: tr('आप इन योजनाओं के योग्य हो सकते हैं', 'तुम्ही या योजनांसाठी पात्र असू शकता', 'You may be eligible for these'),
        bullets: [
          { icon: 'IdCard', text: tr('e-Shram कार्ड: ₹2 लाख दुर्घटना बीमा', 'ई-श्रम कार्ड: ₹2 लाख अपघात विमा', 'e-Shram card: ₹2 lakh accident cover') },
          ...(['painter', 'mason', 'carpenter', 'helper', 'electrician', 'plumber'].includes(w.trade) ? [{ icon: 'Landmark', text: tr('BOCW बोर्ड: औज़ार और बच्चों की पढ़ाई में मदद', 'बांधकाम मंडळ: अवजारे आणि शिक्षणासाठी मदत', 'Construction board: tools and education help') }] : []),
          { icon: 'ShieldCheck', text: tr('PM सुरक्षा बीमा: ₹20 साल में', 'PM सुरक्षा विमा: ₹20 वर्षाला', 'PM Suraksha Bima: ₹20 a year') },
        ],
        actions: [{ label: tr('4 सवाल में पक्का करें', '4 प्रश्नांत खात्री करा', 'Confirm in 4 taps'), to: '/w/rights', kind: 'primary' }],
        follow: ['dues', 'checkin'],
      }

    case 'unpaid': {
      const dueSlip = (ctx.bookings || []).find((b) => money(b).due > 0)
      return {
        tone: 'info',
        text: tr('घबराइए मत, पर्ची आपका सबूत है', 'घाबरू नका, पावती तुमचा पुरावा आहे', "Don't worry, your slip is proof"),
        bullets: [
          { icon: 'FileText', text: t('g1') },
          { icon: 'Flag', text: t('g2') },
          { icon: 'Phone', text: tr('e-Shram हेल्पलाइन 14434 पर कॉल करें', 'ई-श्रम हेल्पलाइन 14434 वर कॉल करा', 'Call e-Shram helpline 14434') },
        ],
        actions: [{ label: dueSlip ? tr(`${L(dueSlip.snap.employer, lang)} की पर्ची खोलें`, `${L(dueSlip.snap.employer, lang)} ची पावती उघडा`, `Open ${L(dueSlip.snap.employer, lang)} slip`) : t('nav_parchi'), to: dueSlip ? `/w/parchi/${dueSlip.id}` : '/w/parchi', kind: 'primary' }],
        follow: ['dues', 'schemes'],
      }
    }

    case 'parchi':
      return {
        tone: 'info',
        text: tr('पर्ची में ये चार बातें देखें', 'पावतीत या चार गोष्टी पाहा', 'Check these four things on the slip'),
        bullets: [
          { icon: 'IndianRupee', text: tr('हर दिन कितने पैसे, और कुल कितने', 'दिवसाला किती पैसे, आणि एकूण किती', 'Pay per day, and the total') },
          { icon: 'Clock', text: tr('काम का समय', 'कामाची वेळ', 'Working hours') },
          { icon: 'Wallet', text: tr('पैसा कब और कैसे मिलेगा', 'पैसे कधी आणि कसे मिळतील', 'When and how you get paid') },
          { icon: 'HandCoins', text: tr('एडवांस फीस ₹0 होनी चाहिए', 'आगाऊ फी ₹0 असावी', 'Advance fee must be ₹0') },
        ],
        follow: ['next', 'unpaid'],
      }

    case 'rate': {
      const [lo, hi] = FAIR[w.trade] || FAIR.painter
      return {
        tone: 'ok',
        text: tr(`आज ${tradeName} का सही रेट ₹${lo} – ₹${hi} प्रति दिन है`, `आज ${tradeName} चा योग्य दर ₹${lo} – ₹${hi} प्रतिदिन आहे`, `Fair ${tradeName} rate today: ₹${lo} – ₹${hi} a day`),
        bullets: [
          { icon: 'TrendingUp', text: tr(`₹${MIN_WAGE} से कम कभी न लें, ये न्यूनतम मज़दूरी से कम है`, `₹${MIN_WAGE} पेक्षा कमी कधीही घेऊ नका`, `Never accept below ₹${MIN_WAGE}, the minimum wage`) },
          { icon: 'TriangleAlert', text: tr(`₹${Math.round(hi * 1.8)} से ज़्यादा का ऑफ़र अक्सर धोखा होता है`, `₹${Math.round(hi * 1.8)} पेक्षा जास्त ऑफर अनेकदा फसवणूक असते`, `Offers above ₹${Math.round(hi * 1.8)} are often scams`) },
        ],
        follow: ['jobs', 'safe'],
      }
    }

    case 'checkin':
      return {
        tone: 'info',
        text: w.checkedIn ? tr(`आप ${w.checkedInAt} से नाके पर हैं। मालिक आपको देख सकते हैं।`, `तुम्ही ${w.checkedInAt} पासून नाक्यावर आहात. मालक तुम्हाला पाहू शकतात.`, `You've been at the naka since ${w.checkedInAt}. Employers can see you.`)
          : tr('नाके पर पहुँचकर "मैं नाके पर हूँ" दबाएं, या मिस्ड कॉल दें। मालिक आपको तुरंत देख लेंगे।', 'नाक्यावर पोहोचून "मी नाक्यावर आहे" दाबा, किंवा मिस्ड कॉल द्या.', 'At the naka, tap "I\'m at the naka" or give a missed call. Employers will see you right away.'),
        actions: w.checkedIn ? [] : [{ label: t('atNaka'), action: 'checkin', kind: 'primary' }],
        follow: ['jobs', 'rate'],
      }

    default:
      return {
        tone: 'info',
        text: tr('माफ़ कीजिए, मैं समझ नहीं पाया। इनमें से कुछ पूछें:', 'माफ करा, मला समजले नाही. यापैकी काही विचारा:', "Sorry, I didn't get that. Try one of these:"),
        follow: ['jobs', 'dues', 'safe', 'schemes'],
      }
  }
}

export const FOLLOW_LABEL = {
  jobs: { hi: 'मेरे लिए काम', mr: 'माझ्यासाठी काम', en: 'Jobs for me', icon: 'Briefcase' },
  next: { hi: 'मेरा अगला काम', mr: 'माझे पुढचे काम', en: 'My next job', icon: 'CalendarDays' },
  dues: { hi: 'मेरा हिसाब', mr: 'माझा हिशोब', en: 'My earnings', icon: 'Wallet' },
  safe: { hi: 'क्या ये काम सुरक्षित है?', mr: 'हे काम सुरक्षित आहे का?', en: 'Is this job safe?', icon: 'ShieldCheck' },
  schemes: { hi: 'मेरी सरकारी योजनाएं', mr: 'माझ्या सरकारी योजना', en: 'My government schemes', icon: 'Landmark' },
  unpaid: { hi: 'पैसा नहीं मिला', mr: 'पैसे मिळाले नाहीत', en: "I wasn't paid", icon: 'IndianRupee' },
  parchi: { hi: 'पर्ची समझाओ', mr: 'पावती समजावा', en: 'Explain my slip', icon: 'FileText' },
  rate: { hi: 'आज का सही रेट', mr: 'आजचा योग्य दर', en: "Today's fair rate", icon: 'TrendingUp' },
  checkin: { hi: 'नाके पर हाजिरी', mr: 'नाक्यावर हजेरी', en: 'Check in at the naka', icon: 'LocateFixed' },
}

/* Optional: real LLM answer for free text, only if a key is configured. */
export async function llmAnswer(text, lang, ctx) {
  const key = import.meta.env.VITE_GEMINI_API_KEY
  if (!key) return null
  const model = import.meta.env.VITE_GEMINI_MODEL || 'gemini-2.0-flash'
  const langName = { hi: 'Hindi', mr: 'Marathi', en: 'simple English' }[lang]
  const sys = `You are Setu Saathi, a friendly helper inside KaamSetu for daily-wage workers at Mumbai labour nakas. Reply in ${langName}, in at most 3 short sentences, using very simple words a person with little schooling understands. Never ask workers to pay anyone; real jobs never charge a fee. Fair daily rate for this worker's trade (${ctx.trade}) is about ₹${(FAIR[ctx.trade] || FAIR.painter).join('–')}. Minimum wage is ₹${MIN_WAGE}. If unsure, suggest calling the e-Shram helpline 14434.`
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
