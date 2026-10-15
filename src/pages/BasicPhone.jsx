import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../lib/store'
import { L } from '../lib/i18n'
import { NAKAS, tradeById } from '../lib/data'
import { checkJob, fmtRange, jobType, rupee, speak } from '../lib/logic'
import { Icon, LangSwitch, Logo, Toast } from '../components/ui'

const NUMBER = '1800-120-5252'

/* A simulated keypad phone. Workers with a basic phone use KaamSetu through
   missed calls and SMS replies; in production this runs on an SMS/IVR gateway
   (e.g. Exotel or Twilio) talking to the same backend as the website. */
export default function BasicPhone() {
  const { lang, state, today, bookedDays, toggleCheckIn, createBooking, confirmBooking, raiseComplaint, showToast } = useStore()
  const tr = (hi, mr, en) => ({ hi, mr, en })[lang]
  const w = state.worker
  const [msgs, setMsgs] = useState([])
  const [offerIdx, setOfferIdx] = useState(0)
  const [mode, setMode] = useState('idle') // idle | offer | booked
  const [lastBooking, setLastBooking] = useState(null)
  const screenRef = useRef()

  // Only safe, fair jobs are ever sent by SMS: scam-flagged listings never reach a keypad phone.
  const offers = useMemo(() => {
    const booked = new Set(Object.keys(bookedDays))
    return state.jobs
      .filter((j) => j.status === 'open' && (!j.directFor || j.directFor === w.setu))
      .filter((j) => checkJob(j).level === 'ok' && !j.days.some((d) => booked.has(d)))
      .sort((a, b) => (a.trade === w.trade ? 0 : 1) - (b.trade === w.trade ? 0 : 1) || a.days[0].localeCompare(b.days[0]))
  }, [state.jobs, bookedDays, w.trade, w.setu])

  useEffect(() => { screenRef.current?.scrollTo({ top: 99999, behavior: 'smooth' }) }, [msgs])

  const push = (...m) => setMsgs((x) => [...x, ...m.map((text) => ({ from: 'ks', text, at: new Date().toTimeString().slice(0, 5) }))])
  const me = (text) => setMsgs((x) => [...x, { from: 'me', text, at: new Date().toTimeString().slice(0, 5) }])

  const offerText = (j) => {
    const n = j.days.length
    return tr(
      `काम: ${L(j.title, 'hi')}, ${L(j.employer, 'hi')}, ${L(j.area, 'hi')}. ₹${j.pay}/दिन × ${n} दिन, ${j.hours}. फीस ₹0. 1=हाँ 2=अगला 0=सुनें`,
      `काम: ${L(j.title, 'mr')}, ${L(j.employer, 'mr')}, ${L(j.area, 'mr')}. ₹${j.pay}/दिवस × ${n} दिवस, ${j.hours}. फी ₹0. 1=होय 2=पुढचे 0=ऐका`,
      `Job: ${L(j.title, 'en')}, ${L(j.employer, 'en')}, ${L(j.area, 'en')}. Rs${j.pay}/day x ${n} days, ${j.hours}. Fee Rs0. 1=Yes 2=Next 0=Listen`,
    )
  }

  const sendOffer = (i) => {
    const j = offers[i]
    if (!j) { push(tr('अभी और काम नहीं है। नया काम आते ही SMS आएगा।', 'आत्ता आणखी काम नाही. नवीन काम आल्यावर SMS येईल.', 'No more jobs right now. We will SMS you when one comes.')); setMode('idle'); return }
    setOfferIdx(i); setMode('offer'); push(offerText(j))
  }

  const missedCall = () => {
    me(tr(`मिस्ड कॉल → ${NUMBER}`, `मिस्ड कॉल → ${NUMBER}`, `Missed call → ${NUMBER}`))
    if (!w.checkedIn) toggleCheckIn(true)
    const naka = L(NAKAS[w.naka]?.name, lang)
    const time = new Date().toTimeString().slice(0, 5)
    setTimeout(() => {
      push(tr(
        `KaamSetu: हाजिरी लग गई, ${naka} ${time}. सेतु नंबर ${w.setu}. 3=मेरे हक 9=पैसा नहीं मिला`,
        `KaamSetu: हजेरी लागली, ${naka} ${time}. सेतू नंबर ${w.setu}. 3=माझे हक्क 9=पैसे मिळाले नाहीत`,
        `KaamSetu: Checked in at ${naka} ${time}. Setu no ${w.setu}. 3=My rights 9=Not paid`,
      ))
      setTimeout(() => sendOffer(0), 700)
    }, 500)
  }

  const press = (k) => {
    if (k === 'call') return missedCall()
    if (k === 'end') { setMsgs([]); setMode('idle'); return }
    me(k)
    setTimeout(() => {
      if (k === '1' && mode === 'offer') {
        const j = offers[offerIdx]
        const id = createBooking(j.id)
        confirmBooking(id)
        setLastBooking(id)
        setMode('booked')
        const total = j.pay * j.days.length
        push(tr(
          `पक्का! पर्ची KS-${id.slice(-4).toUpperCase()}: ${L(j.title, 'hi')}, ${fmtRange(j.days, 'hi')}, ${j.hours}. कुल ₹${total}. पैसा: ${L(j.payWhen, 'hi')}. पता: ${j.address}`,
          `पक्के! पावती KS-${id.slice(-4).toUpperCase()}: ${L(j.title, 'mr')}, ${fmtRange(j.days, 'mr')}, ${j.hours}. एकूण ₹${total}. पैसे: ${L(j.payWhen, 'mr')}. पत्ता: ${j.address}`,
          `Confirmed! Slip KS-${id.slice(-4).toUpperCase()}: ${L(j.title, 'en')}, ${fmtRange(j.days, 'en')}, ${j.hours}. Total Rs${total}. Pay: ${L(j.payWhen, 'en')}. Address: ${j.address}`,
        ))
        showToast(tr('मालिक को भी पर्ची मिल गई', 'मालकालाही पावती मिळाली', 'Employer received the slip too'))
      } else if (k === '2' && mode === 'offer') {
        sendOffer(offerIdx + 1)
      } else if (k === '0' && mode === 'offer') {
        const j = offers[offerIdx]
        speak(offerText(j).replace(/1=.*/, ''), lang)
        push(tr('(आवाज़ में सुनाया जा रहा है)', '(आवाजात ऐकवत आहोत)', '(Playing as a voice call)'))
      } else if (k === '3') {
        push(tr(
          'आप e-Shram (₹2 लाख बीमा) और BOCW बोर्ड के योग्य हो सकते हैं। कागज़: आधार, बैंक पासबुक। CSC: घाटकोपर पूर्व, स्टेशन के पास। हेल्पलाइन 14434',
          'तुम्ही ई-श्रम (₹2 लाख विमा) आणि बांधकाम मंडळासाठी पात्र असू शकता. कागद: आधार, बँक पासबुक. CSC: घाटकोपर पूर्व. हेल्पलाइन 14434',
          'You may be eligible for e-Shram (Rs2 lakh cover) and the Construction Board. Docs: Aadhaar, bank passbook. CSC: Ghatkopar East. Helpline 14434',
        ))
      } else if (k === '9') {
        const b = state.bookings.find((x) => !x.complaint && x.log.some((l) => l.worked && !l.paid))
        if (!b) push(tr('आपका कोई पैसा बाकी नहीं है।', 'तुमचे कोणतेही पैसे बाकी नाहीत.', 'You have no unpaid days.'))
        else {
          const due = b.log.filter((l) => l.worked && !l.paid).length * b.snap.pay
          raiseComplaint(b.id)
          push(tr(
            `शिकायत दर्ज: ${L(b.snap.employer, 'hi')}, ₹${due} बाकी। नाका टीम 24 घंटे में बात करेगी।`,
            `तक्रार नोंदवली: ${L(b.snap.employer, 'mr')}, ₹${due} बाकी. नाका टीम 24 तासांत बोलेल.`,
            `Complaint filed: ${L(b.snap.employer, 'en')}, Rs${due} due. The naka team will call within 24 hours.`,
          ))
        }
      } else {
        push(tr('समझ नहीं आया। मिस्ड कॉल दें या 1, 2, 3, 9 भेजें।', 'समजले नाही. मिस्ड कॉल द्या किंवा 1, 2, 3, 9 पाठवा.', 'Not understood. Give a missed call or send 1, 2, 3 or 9.'))
      }
    }, 450)
  }

  const keys = [['1', ''], ['2', 'abc'], ['3', 'def'], ['4', 'ghi'], ['5', 'jkl'], ['6', 'mno'], ['7', 'pqrs'], ['8', 'tuv'], ['9', 'wxyz'], ['*', ''], ['0', '+'], ['#', '']]
  const legend = [
    ['call', tr('हरा बटन = मिस्ड कॉल: हाजिरी + काम का SMS', 'हिरवे बटण = मिस्ड कॉल: हजेरी + कामाचा SMS', 'Green key = missed call: check in + job SMS')],
    ['1', tr('काम पक्का करें', 'काम पक्के करा', 'Accept the job')],
    ['2', tr('अगला काम', 'पुढचे काम', 'Next job')],
    ['0', tr('काम आवाज़ में सुनें', 'काम आवाजात ऐका', 'Hear the job as a voice call')],
    ['3', tr('मेरी योजनाएं और हेल्पलाइन', 'माझ्या योजना आणि हेल्पलाइन', 'My schemes and helpline')],
    ['9', tr('पैसा नहीं मिला: शिकायत', 'पैसे मिळाले नाहीत: तक्रार', 'Not paid: file complaint')],
  ]

  return (
    <div className="min-h-screen">
      <header className="bg-white border-b-[1.5px] border-ink">
        <div className="max-w-[1180px] mx-auto px-5 md:px-7 py-3 flex flex-wrap gap-3 items-center justify-between">
          <Logo />
          <div className="flex flex-wrap gap-2 items-center">
            <Link to="/w" className="px-4 min-h-[42px] flex items-center rounded-full font-bold text-[15px] no-underline text-ink hover:bg-sand">{tr('स्मार्टफ़ोन वाला ऐप', 'स्मार्टफोन अ‍ॅप', 'Smartphone app')}</Link>
            <Link to="/e/jobs" className="px-4 min-h-[42px] flex items-center rounded-full font-bold text-[15px] no-underline text-ink hover:bg-sand">Employer view</Link>
            <LangSwitch compact />
          </div>
        </div>
      </header>

      <main className="max-w-[1180px] mx-auto px-5 md:px-7 py-8 flex flex-wrap gap-10 items-start">
        <section className="flex-[1_1_440px] min-w-0 flex flex-col gap-5">
          <span className="self-start flex items-center gap-2 bg-goldsoft text-golddark rounded-full px-3.5 py-1 text-[15px] font-bold"><Icon name="Smartphone" size={16} />{tr('बिना स्मार्टफ़ोन, बिना इंटरनेट', 'स्मार्टफोनशिवाय, इंटरनेटशिवाय', 'No smartphone, no internet')}</span>
          <h1 className="m-0 text-[38px] md:text-[48px] leading-[1.08] font-extrabold tracking-tight">{tr('कीपैड फ़ोन से भी काम', 'कीपॅड फोनवरूनही काम', 'Work on a keypad phone too')}</h1>
          <p className="m-0 text-[19px] leading-relaxed text-[#4A463F] max-w-[520px]">
            {tr(
              'नाके के बहुत से मज़दूरों के पास ₹1,500 वाला साधारण फ़ोन है। उन्हें ऐप की ज़रूरत नहीं: एक मिस्ड कॉल से हाजिरी, SMS से काम, और एक बटन से पक्का।',
              'नाक्यावरील अनेक कामगारांकडे ₹1,500 चा साधा फोन आहे. त्यांना अ‍ॅपची गरज नाही: एका मिस्ड कॉलने हजेरी, SMS ने काम, आणि एका बटणाने पक्के.',
              'Many naka workers carry a ₹1,500 keypad phone. They need no app: one missed call checks them in, jobs arrive by SMS, and one key confirms.',
            )}
          </p>
          <div className="card p-5 flex flex-col gap-3">
            <div className="text-[18px] font-extrabold">{tr('कौन सा बटन, क्या काम', 'कोणते बटण, काय काम', 'Which key does what')}</div>
            {legend.map(([k, label]) => (
              <div key={k} className="flex items-center gap-3.5">
                <span className={`w-11 h-11 shrink-0 rounded-full flex items-center justify-center num text-[18px] ${k === 'call' ? 'bg-green text-white' : 'bg-ink text-white'}`}>
                  {k === 'call' ? <Icon name="PhoneCall" size={20} /> : k}
                </span>
                <span className="text-[17px] font-semibold">{label}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-3 items-start p-4 rounded-2xl bg-mint text-[#133F2C]">
            <Icon name="ShieldCheck" size={24} className="shrink-0" />
            <span className="text-[16px] font-semibold">{tr('धोखे वाले काम SMS पर कभी नहीं भेजे जाते। सिर्फ़ जाँचे हुए, सही रेट वाले काम।', 'फसवणुकीची कामे SMS वर कधीच पाठवली जात नाहीत. फक्त तपासलेली, योग्य दराची कामे.', 'Scam-flagged jobs are never sent by SMS. Only checked, fair-rate jobs.')}</span>
          </div>
          <div className="text-[14px] text-muted">{tr('असली सिस्टम में यह SMS/IVR गेटवे (जैसे Exotel) से चलेगा, उसी डेटा पर जो वेबसाइट चलाता है।', 'खऱ्या प्रणालीत हे SMS/IVR गेटवेवर (उदा. Exotel) चालेल, वेबसाइटच्याच डेटावर.', 'In production this runs on an SMS/IVR gateway (e.g. Exotel) using the same data as the website.')}</div>
        </section>

        <section aria-label="Keypad phone simulator" className="flex-[0_1_340px] mx-auto">
          <div className="w-[320px] max-w-full mx-auto rounded-[44px] bg-[#232323] border-[1.5px] border-ink p-5 pt-6 shadow-[8px_8px_0_#1B1B1B] flex flex-col gap-4">
            <div className="flex justify-center"><span className="w-16 h-1.5 rounded-full bg-[#444]" aria-hidden="true" /></div>
            <div className="rounded-[14px] bg-[#C9DDB8] border-4 border-[#111] h-[300px] flex flex-col overflow-hidden" style={{ fontFamily: "'VT323', 'Courier New', monospace" }}>
              <div className="flex justify-between px-2.5 py-1 text-[15px] text-[#203018] border-b border-[#9DB58B]">
                <span>▂▄▆ Jio</span><span>KaamSetu</span><span>{new Date().toTimeString().slice(0, 5)}</span>
              </div>
              <div ref={screenRef} className="flex-1 overflow-y-auto px-2.5 py-2 flex flex-col gap-2 text-[17px] leading-[1.15] text-[#18240F]" aria-live="polite">
                {msgs.length === 0 && (
                  <div className="m-auto text-center text-[19px]">
                    <div>{NUMBER}</div>
                    <div className="mt-2 text-[16px]">{tr('हरा बटन दबाएं = मिस्ड कॉल', 'हिरवे बटण दाबा = मिस्ड कॉल', 'Press green = missed call')}</div>
                  </div>
                )}
                {msgs.map((m, i) => (
                  <div key={i} className={m.from === 'me' ? 'self-end bg-[#18240F] text-[#C9DDB8] px-2 rounded' : 'self-start'}>
                    {m.from === 'ks' && <div className="text-[13px] opacity-70">SMS · {m.at}</div>}
                    <div>{m.text}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 px-1">
              <button type="button" onClick={() => press('call')} aria-label={tr('मिस्ड कॉल', 'मिस्ड कॉल', 'Missed call')} className="h-12 rounded-full bg-green border-0 cursor-pointer flex items-center justify-center active:scale-95"><Icon name="PhoneCall" className="text-white" /></button>
              <span />
              <button type="button" onClick={() => press('end')} aria-label={tr('साफ़ करें', 'साफ करा', 'Clear')} className="h-12 rounded-full bg-coral border-0 cursor-pointer flex items-center justify-center active:scale-95"><Icon name="PhoneOff" className="text-white" /></button>
              {keys.map(([k, sub]) => (
                <button key={k} type="button" onClick={() => press(k)} aria-label={k}
                  className={`h-14 rounded-[18px] border-0 cursor-pointer flex flex-col items-center justify-center active:scale-95 ${['1', '2', '0', '3', '9'].includes(k) ? 'bg-[#3A3A3A]' : 'bg-[#2E2E2E]'} text-white`}>
                  <span className="num text-[22px] leading-none">{k}</span>
                  <span className="text-[10px] tracking-wider opacity-60 uppercase">{sub}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="text-center text-[14px] text-muted mt-4">
            {mode === 'booked' && lastBooking
              ? <Link to="/e/jobs" className="font-bold underline">{tr('मालिक की तरफ़ देखें: My jobs →', 'मालकाच्या बाजूने पाहा: My jobs →', "See it on the employer side: My jobs →")}</Link>
              : tr('बटन दबाकर देखें', 'बटणे दाबून पाहा', 'Try the keys')}
          </div>
        </section>
      </main>
      <Toast />
    </div>
  )
}
