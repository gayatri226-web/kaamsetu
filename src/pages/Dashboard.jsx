import { Link } from 'react-router-dom'
import { useStore } from '../lib/store'
import { L } from '../lib/i18n'
import { NAKAS, tradeById } from '../lib/data'
import { checkJob, fmtDate, fmtDay, fmtRange, rupee } from '../lib/logic'
import { Hafta, Icon } from '../components/ui'
import { money } from './Parchi'

export default function Dashboard() {
  const { t, lang, state, today, toggleCheckIn, showToast } = useStore()
  const tr = (hi, mr, en) => ({ hi, mr, en })[lang]
  const w = state.worker
  const tradeName = L(tradeById(w.trade).name, lang)

  const active = state.bookings.filter((b) => b.status !== 'completed')
  const next = active
    .map((b) => ({ b, day: b.log.find((l) => l.date >= today && !l.worked) }))
    .filter((x) => x.day)
    .sort((a, b) => a.day.date.localeCompare(b.day.date))[0]
  const pending = state.bookings.find((b) => b.status === 'pending')
  const totals = state.bookings.reduce((a, b) => { const m = money(b); a.earned += m.earned; a.received += m.received; a.due += m.due; return a }, { earned: 0, received: 0, due: 0 })
  const dueSlip = state.bookings.find((b) => money(b).due > 0)
  const openFair = state.jobs.filter((j) => j.status === 'open' && j.trade === w.trade && checkJob(j).level === 'ok').length
  const scams = state.jobs.filter((j) => j.status === 'open' && checkJob(j).level === 'danger').length

  const alerts = [
    pending && { tone: 'gold', icon: 'FileText', text: tr('एक पर्ची आपकी हाँ का इंतज़ार कर रही है', 'एक पावती तुमच्या होकाराची वाट पाहत आहे', 'A work slip is waiting for your yes'), to: `/w/parchi/${pending.id}`, cta: t('open') },
    dueSlip && { tone: 'coral', icon: 'IndianRupee', text: tr(`${L(dueSlip.snap.employer, lang)} से ${rupee(money(dueSlip).due)} बाकी`, `${L(dueSlip.snap.employer, lang)} कडून ${rupee(money(dueSlip).due)} बाकी`, `${rupee(money(dueSlip).due)} due from ${L(dueSlip.snap.employer, lang)}`), to: `/w/parchi/${dueSlip.id}`, cta: t('notPaid') },
    scams > 0 && { tone: 'coral', icon: 'ShieldCheck', text: tr(`आज ${scams} धोखे वाले काम पकड़े गए`, `आज ${scams} फसवी कामे पकडली`, `${scams} scam listing(s) caught today`), to: '/w', cta: tr('देखें', 'पाहा', 'View') },
    !w.idVerified && { tone: 'sand', icon: 'IdCard', text: tr('पहचान पत्र जोड़ें तो लंबे काम भी मिलेंगे', 'ओळखपत्र जोडा, दीर्घ कामेही मिळतील', 'Add ID to unlock long-term jobs'), to: '/w/card', cta: t('add') },
    { tone: 'mint', icon: 'Landmark', text: tr('आप e-Shram बीमा के योग्य हो सकते हैं', 'तुम्ही ई-श्रम विम्यासाठी पात्र असू शकता', 'You may qualify for e-Shram insurance'), to: '/w/rights', cta: tr('जाँचें', 'तपासा', 'Check') },
  ].filter(Boolean)
  const toneCls = { gold: 'bg-goldsoft', coral: 'bg-coralsoft', sand: 'bg-sand', mint: 'bg-mint' }

  return (
    <div className="max-w-[1120px] flex flex-col gap-5 md:gap-6">
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex items-center gap-4">
          {w.photos?.[0]
            ? <img src={w.photos[0]} alt="" className="w-16 h-16 rounded-full object-cover border-[1.5px] border-ink" />
            : <span className="w-16 h-16 rounded-full bg-goldsoft border-[1.5px] border-ink flex items-center justify-center"><Icon name="UserRound" size={30} /></span>}
          <div>
            <h1 className="m-0 text-[30px] md:text-[34px] font-extrabold leading-tight">{t('hello')}, {w.name.split(' ')[0]}</h1>
            <div className="text-[16px] text-muted">{tradeName} · {L(NAKAS[w.naka]?.name, lang)} · {t('setuNo')} <b className="num text-ink">{w.setu}</b></div>
          </div>
        </div>
        <button type="button" aria-pressed={w.checkedIn} onClick={() => { toggleCheckIn(!w.checkedIn); if (!w.checkedIn) showToast(t('atNakaOn')) }}
          className={`min-h-[56px] flex items-center gap-3 px-5 rounded-full border-[1.5px] cursor-pointer ${w.checkedIn ? 'bg-mint border-greendark text-[#133F2C]' : 'bg-white border-ink shadow-[3px_3px_0_#1B1B1B]'}`}>
          {w.checkedIn ? <span className="w-3 h-3 rounded-full bg-green live-dot" /> : <Icon name="LocateFixed" size={22} />}
          <span className="text-[17px] font-extrabold">{t('atNaka')}{w.checkedIn ? ` · ${w.checkedInAt}` : ''}</span>
        </button>
      </div>

      <div className="flex flex-wrap gap-5 items-stretch">
        <section className="flex-[999_1_460px] min-w-0 card card-hero p-5 flex flex-col gap-3">
          <div className="text-[15px] font-bold text-muted flex items-center gap-2"><Icon name="CalendarDays" size={18} />{tr('अगला काम', 'पुढचे काम', 'Next job')}</div>
          {next ? (
            <>
              <div className="flex flex-wrap items-center gap-4">
                <span className="w-16 h-16 shrink-0 rounded-xl bg-sand flex items-center justify-center"><Icon name={tradeById(next.b.snap.trade).icon} size={32} strokeWidth={1.7} /></span>
                <div className="flex-1 min-w-[200px]">
                  <div className="text-[24px] font-extrabold leading-tight">{L(next.b.snap.title, lang)}</div>
                  <div className="text-[16px] text-muted">{L(next.b.snap.employer, lang)} · {next.b.snap.address}</div>
                </div>
                <div className="text-right"><div className="num text-[34px] leading-none">{rupee(next.b.snap.pay)}</div><div className="text-[14px] text-muted">/ {t('perDay')}</div></div>
              </div>
              <div className="flex flex-wrap gap-2.5">
                <span className="chip !text-[15px] !py-1"><Icon name="CalendarDays" size={16} />{next.day.date === today ? t('f_today') : `${fmtDay(next.day.date, lang)} ${fmtDate(next.day.date, lang)}`}</span>
                <span className="chip !text-[15px] !py-1"><Icon name="Clock" size={16} />{next.b.snap.hours}</span>
                <span className={`chip !text-[15px] !py-1 ${next.b.status === 'confirmed' ? '!bg-mint !text-greendark' : '!bg-goldsoft !text-golddark'}`}>{next.b.status === 'confirmed' ? t('st_confirmed') : t('st_pending')}</span>
              </div>
              <Link to={`/w/parchi/${next.b.id}`} className="btn btn-primary self-start">{t('parchi')}<Icon name="ArrowRight" size={18} /></Link>
            </>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-[19px] font-bold">{tr(`अभी कोई काम बुक नहीं। आपके लिए ${openFair} सही काम खुले हैं।`, `आत्ता काम बुक नाही. तुमच्यासाठी ${openFair} योग्य कामे उघडी आहेत.`, `Nothing booked yet. ${openFair} fair jobs are open for you.`)}</div>
              <Link to="/w" className="btn btn-primary">{t('findWork')}<Icon name="ArrowRight" size={18} /></Link>
            </div>
          )}
        </section>

        <section className="flex-[1_1_300px] min-w-0 card p-5 flex flex-col gap-3">
          <div className="text-[15px] font-bold text-muted flex items-center gap-2"><Icon name="Wallet" size={18} />{tr('मेरी कमाई', 'माझी कमाई', 'My earnings')}</div>
          <div className="num text-[44px] leading-none">{rupee(totals.earned)}</div>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-mint p-3"><div className="text-[13px] font-bold text-greendark">{t('received')}</div><div className="num text-[22px]">{rupee(totals.received)}</div></div>
            <div className={`rounded-xl p-3 ${totals.due ? 'bg-coralsoft' : 'bg-sand'}`}><div className={`text-[13px] font-bold ${totals.due ? 'text-coraldark' : 'text-muted'}`}>{t('due')}</div><div className="num text-[22px]">{rupee(totals.due)}</div></div>
          </div>
          <Link to="/w/parchi" className="text-[15px] font-bold underline">{t('mySlips')} →</Link>
        </section>
      </div>

      <section className="card grid grid-cols-2 md:grid-cols-4 overflow-hidden text-center">
        {[[w.jobsDone, t('jobsDone')], [w.rating || '–', t('rating')], [`${w.onTime}%`, t('onTime')], [openFair, tr('खुले काम', 'उघडी कामे', 'Open jobs')]].map(([v, l], i) => (
          <div key={l} className={`py-4 border-line ${i % 2 === 0 ? 'border-r' : ''} md:border-r ${i === 3 ? 'md:border-r-0' : ''} ${i < 2 ? 'border-b md:border-b-0' : ''}`}>
            <div className="num text-[30px] leading-tight">{v}</div><div className="text-[14px] font-semibold text-muted">{l}</div>
          </div>
        ))}
      </section>

      <section className="card p-4 flex flex-col gap-2.5">
        <div className="flex items-center gap-2 text-[18px] font-extrabold"><Icon name="CalendarDays" />{t('myWeek')}</div>
        <Hafta />
      </section>

      <section className="flex flex-col gap-2.5">
        <div className="text-[18px] font-extrabold flex items-center gap-2"><Icon name="Bell" size={20} />{tr('आपके लिए', 'तुमच्यासाठी', 'For you')}</div>
        {alerts.map((a, i) => (
          <Link key={i} to={a.to} className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl no-underline text-ink ${toneCls[a.tone]}`}>
            <span className="w-10 h-10 shrink-0 rounded-full bg-white flex items-center justify-center"><Icon name={a.icon} size={20} /></span>
            <span className="flex-1 text-[16px] font-bold">{a.text}</span>
            <span className="flex items-center gap-1 text-[15px] font-extrabold whitespace-nowrap">{a.cta}<Icon name="ArrowRight" size={16} /></span>
          </Link>
        ))}
      </section>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[['/w', 'Briefcase', t('findWork')], ['/w/card', 'IdCard', t('nav_card')], ['/w/saathi', 'MessageCircle', t('nav_saathi')], ['/sms', 'Smartphone', t('basicPhone')]].map(([to, icon, label]) => (
          <Link key={to} to={to} className="card p-4 flex flex-col items-center gap-2 no-underline text-ink text-[16px] font-extrabold text-center hover:shadow-[3px_3px_0_#1B1B1B]">
            <Icon name={icon} size={28} strokeWidth={1.8} className={icon === 'MessageCircle' ? 'text-violet' : ''} />{label}
          </Link>
        ))}
      </section>
    </div>
  )
}
