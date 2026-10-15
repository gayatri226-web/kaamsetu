import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { useStore } from '../lib/store'
import { L } from '../lib/i18n'
import { tradeById } from '../lib/data'
import { fmtDate, fmtDay, fmtRange, parchiSpeech, rupee } from '../lib/logic'
import { Hafta, Icon, ListenButton, PageTitle } from '../components/ui'

const slipNo = (id) => '#KS-' + id.replace(/^b/, '').slice(-4).toUpperCase()
export const money = (b) => {
  const worked = b.log.filter((l) => l.worked).length
  const paid = b.log.filter((l) => l.paid).length
  return { earned: worked * b.snap.pay, received: paid * b.snap.pay, due: (worked - paid) * b.snap.pay, total: b.log.length * b.snap.pay }
}

export function ParchiList() {
  const { t, lang, state } = useStore()
  const all = state.bookings
  const sum = all.reduce((a, b) => { const m = money(b); a.earned += m.earned; a.received += m.received; a.due += m.due; return a }, { earned: 0, received: 0, due: 0 })
  const stLabel = { pending: 'st_pending', confirmed: 'st_confirmed', completed: 'st_completed' }
  const stCls = { pending: 'bg-goldsoft text-golddark', confirmed: 'bg-mint text-greendark', completed: 'bg-sand text-ink' }
  return (
    <div className="max-w-[960px] flex flex-col gap-5">
      <PageTitle title={t('mySlips')} sub={t('proof')} />
      <section className="card grid grid-cols-3 overflow-hidden text-center">
        <div className="py-4 border-r border-line"><div className="text-[14px] font-bold text-muted">{t('earned')}</div><div className="num text-[30px]">{rupee(sum.earned)}</div></div>
        <div className="py-4 border-r border-line"><div className="text-[14px] font-bold text-muted">{t('received')}</div><div className="num text-[30px] text-greendark">{rupee(sum.received)}</div></div>
        <div className={`py-4 ${sum.due > 0 ? 'bg-coralsoft' : ''}`}><div className={`text-[14px] font-bold ${sum.due > 0 ? 'text-coraldark' : 'text-muted'}`}>{t('due')}</div><div className={`num text-[30px] ${sum.due > 0 ? 'text-coraldark' : ''}`}>{rupee(sum.due)}</div></div>
      </section>
      {all.length === 0 && <div className="card p-6 text-[17px] text-muted font-semibold">{t('noSlips')}</div>}
      {all.map((b) => {
        const m = money(b), tr = tradeById(b.snap.trade)
        return (
          <Link key={b.id} to={`/w/parchi/${b.id}`} className="card p-4 flex flex-wrap items-center gap-4 no-underline text-ink hover:shadow-[3px_3px_0_#1B1B1B]">
            <span className="w-14 h-14 rounded-xl bg-sand flex items-center justify-center shrink-0"><Icon name={tr.icon} size={28} strokeWidth={1.7} /></span>
            <div className="flex-[1_1_200px] min-w-0">
              <div className="text-[20px] font-extrabold leading-tight">{L(b.snap.title, lang)}</div>
              <div className="text-[15px] text-muted">{L(b.snap.employer, lang)} · {fmtRange(b.log.map((l) => l.date), lang)}</div>
            </div>
            <span className={`chip ${stCls[b.status]}`}>{t(stLabel[b.status])}</span>
            {m.due > 0 && <span className="chip !bg-coralsoft !text-coraldark">{t('due')} {rupee(m.due)}</span>}
            <span className="num text-[24px]">{rupee(m.total)}</span>
            <Icon name="ArrowRight" />
          </Link>
        )
      })}
    </div>
  )
}

export function ParchiNew() {
  const { jobId } = useParams()
  const { state, createBooking } = useStore()
  const navigate = useNavigate()
  useEffect(() => {
    const existing = state.bookings.find((b) => b.jobId === jobId && b.status !== 'completed')
    const id = existing ? existing.id : createBooking(jobId)
    navigate(`/w/parchi/${id}`, { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId])
  return null
}

export function ParchiDetail() {
  const { id } = useParams()
  const { t, lang, state, confirmBooking, logWork, raiseComplaint, showToast, today } = useStore()
  const [justStamped, setJustStamped] = useState(false)
  const b = state.bookings.find((x) => x.id === id)
  if (!b) return <Navigate to="/w/parchi" replace />
  const s = b.snap, m = money(b), days = b.log.map((l) => l.date)
  const confirmed = b.status !== 'pending'

  const waText = encodeURIComponent(
    `KaamSetu ${t('parchi')} ${slipNo(b.id)}\n${L(s.title, lang)} · ${L(s.employer, lang)}\n${rupee(s.pay)} × ${days.length} = ${rupee(m.total)}\n${t('date')}: ${fmtRange(days, lang)}\n${t('time')}: ${s.hours}\n${t('payWhen')}: ${L(s.payWhen, lang)}\n${t('advance')}: ₹0\n${t('worker')}: ${state.worker.name} (${state.worker.setu})`,
  )
  const remind = encodeURIComponent(`${L(s.employer, lang)}, ${t('parchi')} ${slipNo(b.id)}: ${t('due')} ${rupee(m.due)}. ${t('proof')}`)

  return (
    <div className="max-w-[1120px]">
      <PageTitle title={t('parchi')} sub={t('bothYes')} back="/w/parchi" />
      <div className="flex flex-wrap gap-7 items-start">
        <section className="flex-[999_1_520px] min-w-0" style={{ filter: 'drop-shadow(0 18px 30px rgba(27,27,27,0.10))' }}>
          <Zigzag top />
          <div className="relative bg-[#FFFDF7] border-x-[1.5px] border-ink px-5 md:px-7 pt-4 pb-6 flex flex-col gap-4.5"
            style={{ backgroundImage: 'repeating-linear-gradient(transparent 0 35px, rgba(27,27,27,0.05) 35px 36px)' }}>
            <div className="flex flex-wrap justify-between gap-2 num text-[14px] tracking-[2.5px]"><span>KAAM PARCHI</span><span className="text-muted tracking-normal">{slipNo(b.id)} · {fmtDate(b.createdAt, lang)}</span></div>
            <div className="flex flex-wrap items-center gap-3.5">
              <div className="flex-1 min-w-[200px]">
                <div className="text-[26px] font-extrabold leading-tight">{L(s.title, lang)}</div>
                <div className="text-[16px] text-muted">{L(s.employer, lang)} · {s.address}</div>
              </div>
              <ListenButton text={parchiSpeech(b, lang)} label={t('listen')} />
            </div>
            <div className="flex flex-wrap items-baseline gap-3.5 py-3.5 border-y-[1.5px] border-dashed border-ink">
              <span className="num text-[52px] md:text-[60px] leading-none">{rupee(m.total)}</span>
              <span className="text-[19px] font-semibold text-[#4A463F]">{rupee(s.pay)} × {days.length} {t('days')}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
              <Info icon="CalendarDays" label={t('date')} value={fmtRange(days, lang)} />
              <Info icon="Clock" label={t('time')} value={s.hours} />
              <Info icon="Wallet" label={t('payWhen')} value={L(s.payWhen, lang)} />
              <Info icon="ShieldCheck" label={t('advance')} value={`₹0 · ${t('none')}`} good />
            </div>
            <div className="flex flex-wrap items-end justify-between gap-4 pt-1.5">
              <div className="flex flex-wrap gap-7">
                <div><div className="text-[13px] font-semibold text-muted">{t('employer')}</div><div className="min-w-[150px] border-b-[1.5px] border-ink pb-0.5 text-[18px] font-bold text-greendark">{L(s.employer, lang)} · {t('saidYes')}</div></div>
                <div><div className="text-[13px] font-semibold text-muted">{t('worker')}</div>
                  <div className={`min-w-[150px] border-b-[1.5px] ${confirmed ? 'border-ink text-greendark font-bold' : 'border-dashed border-ink text-[#8A8478] font-semibold'} pb-0.5 text-[18px]`}>{confirmed ? `${state.worker.name} · ${t('saidYes')}` : t('pendingYes')}</div></div>
              </div>
              <div aria-label={t('stampYes')} className={`${justStamped ? 'stamp-in' : '-rotate-[11deg]'} w-[104px] h-[104px] shrink-0 rounded-full border-[3px] border-green outline outline-[1.5px] outline-green outline-offset-[3px] flex flex-col items-center justify-center text-green opacity-90 text-center`}>
                <span className="text-[22px] font-extrabold leading-none">{t('stampYes')}</span>
                <span className="text-[11px] font-bold">{confirmed ? t('bothStamp') : t('empStamp')}</span>
                <span className="num text-[10px]">{fmtDate(b.createdAt, 'en')}</span>
              </div>
            </div>
          </div>
          <Zigzag />
        </section>

        <aside className="flex-[1_1_320px] min-w-0 flex flex-col gap-3.5">
          <section className="card p-3.5 flex flex-col gap-2.5">
            <div className="text-[17px] font-extrabold">{confirmed ? t('myWeek') : t('weekBook')}</div>
            <Hafta highlight={confirmed ? [] : days} compact interactive={false} />
            {!confirmed && <div className="text-[14px] text-muted">{t('weekHide')}</div>}
          </section>

          {!confirmed ? (
            <button type="button" className="btn btn-green min-h-[62px] text-[21px]" onClick={() => { confirmBooking(b.id); setJustStamped(true); showToast(t('confirmed')) }}>
              <Icon name="Check" size={24} strokeWidth={3} />{t('confirmYes')}
            </button>
          ) : (
            <section className="card p-3.5 flex flex-col gap-2">
              <div className="text-[17px] font-extrabold">{t('workLog')}</div>
              {b.log.map((l) => (
                <div key={l.date} className="flex items-center gap-2.5 py-1.5 border-t border-line first:border-t-0">
                  <span className="w-[86px] text-[15px] font-bold">{fmtDay(l.date, lang)} {fmtDate(l.date, lang)}</span>
                  <span className="flex-1 flex flex-wrap gap-1.5">
                    {l.paid ? <span className="chip !bg-mint !text-greendark">{t('paid')}</span>
                      : l.empConfirmed ? <span className="chip !bg-coralsoft !text-coraldark">{t('unpaid')}</span>
                        : l.worked ? <span className="chip">{t('worked')}</span> : null}
                  </span>
                  {!l.worked && l.date <= today && b.status === 'confirmed' && (
                    <button type="button" className="btn !min-h-[42px] text-[15px]" onClick={() => logWork(b.id, l.date)}>{t('workedToday')}</button>
                  )}
                </div>
              ))}
              <div className="grid grid-cols-3 text-center pt-2 border-t-[1.5px] border-ink">
                <div><div className="text-[12px] font-bold text-muted">{t('earned')}</div><div className="num text-[18px]">{rupee(m.earned)}</div></div>
                <div><div className="text-[12px] font-bold text-muted">{t('received')}</div><div className="num text-[18px] text-greendark">{rupee(m.received)}</div></div>
                <div><div className="text-[12px] font-bold text-muted">{t('due')}</div><div className={`num text-[18px] ${m.due ? 'text-coraldark' : ''}`}>{rupee(m.due)}</div></div>
              </div>
            </section>
          )}

          <a className="btn min-h-[52px]" href={`https://wa.me/?text=${waText}`} target="_blank" rel="noreferrer"><Icon name="Share2" />{t('sendWA')}</a>

          {m.due > 0 && (
            <section className="card overflow-hidden bg-coralsoft">
              <div className="caution" aria-hidden="true" />
              <div className="p-3.5 flex flex-col gap-2.5">
                <div className="text-[17px] font-extrabold text-coraldark flex items-center gap-2"><Icon name="TriangleAlert" />{t('notPaid')} · {rupee(m.due)}</div>
                <a className="btn" href={`https://wa.me/?text=${remind}`} target="_blank" rel="noreferrer"><Icon name="Send" size={18} />{t('remindEmp')}</a>
                <button type="button" className="btn btn-dark" disabled={!!b.complaint} onClick={() => { raiseComplaint(b.id); showToast(t('complaintSent')) }}>
                  <Icon name="Flag" size={18} />{b.complaint ? t('complaintSent') : t('fileComplaint')}
                </button>
                <a className="btn" href="tel:14434"><Icon name="Phone" size={18} />{t('helplineEshram')} · 14434</a>
              </div>
            </section>
          )}
          <div className="flex gap-2.5 items-center px-3.5 py-3 bg-goldsoft rounded-xl text-[15px] font-semibold">
            <Icon name="Shield" className="text-[#B4741A] shrink-0" />{t('proof')}
          </div>
        </aside>
      </div>
    </div>
  )
}

function Info({ icon, label, value, good }) {
  return (
    <div className="flex gap-3 items-center">
      <Icon name={icon} size={26} strokeWidth={1.8} className={good ? 'text-greendark' : ''} />
      <div><div className={`text-[13px] font-semibold ${good ? 'text-greendark' : 'text-muted'}`}>{label}</div><div className="text-[18px] font-extrabold">{value}</div></div>
    </div>
  )
}

function Zigzag({ top }) {
  const pts = []
  for (let x = 0; x <= 600; x += 10) pts.push(`${x} ${(x / 10) % 2 === 0 ? (top ? 6 : 6) : top ? 0 : 12}`)
  const d = top ? `M0 12 L${pts.join(' L')} L600 12 Z` : `M0 0 L${pts.join(' L')} L600 0 Z`
  return (
    <svg aria-hidden="true" viewBox="0 0 600 12" preserveAspectRatio="none" className="block w-full h-3">
      <path d={d} fill="#FFFDF7" />
      <polyline points={pts.join(' ')} fill="none" stroke="#1B1B1B" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
      <line x1="0" y1={top ? 6 : 0} x2="0" y2={top ? 12 : 6} stroke="#1B1B1B" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
      <line x1="600" y1={top ? 6 : 0} x2="600" y2={top ? 12 : 6} stroke="#1B1B1B" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}
