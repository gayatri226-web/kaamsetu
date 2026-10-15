import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useStore } from '../lib/store'
import { FAIR, NAKAS, TRADES, dayISO, daysFrom, tradeById } from '../lib/data'
import { checkJob, distanceKm, fmtDate, fmtDay, fmtRange, getLocation, parseQuickPost, rupee } from '../lib/logic'
import { EmployerHeader, FairBar, Icon, MapView, Stars, Toast } from '../components/ui'
import { money } from './Parchi'

const AREA_COORDS = {
  Vidyavihar: { lat: 19.0793, lng: 72.8962 }, Ghatkopar: { lat: 19.0815, lng: 72.9142 }, Kurla: { lat: 19.0728, lng: 72.8826 },
  Vikhroli: { lat: 19.1062, lng: 72.9248 }, 'Pant Nagar': { lat: 19.0803, lng: 72.9178 }, Asalpha: { lat: 19.0955, lng: 72.8985 },
  Kirol: { lat: 19.0882, lng: 72.9012 }, Chembur: { lat: 19.0622, lng: 72.9005 }, Powai: { lat: 19.1176, lng: 72.906 },
  Bhandup: { lat: 19.1435, lng: 72.937 }, Sion: { lat: 19.0434, lng: 72.8619 },
}
const CAL = Array.from({ length: 14 }, (_, i) => dayISO(i))
const consecutive = (from, n) => { const i = Math.max(0, CAL.indexOf(from)); return daysFrom(i, n) }

function DayPicker({ days, onChange }) {
  const set = new Set(days)
  const toggle = (d) => { const nx = new Set(set); nx.has(d) ? nx.delete(d) : nx.add(d); onChange([...nx].sort()) }
  const first = days[0] || dayISO(1)
  const stepN = (dn) => onChange(consecutive(first, Math.max(1, Math.min(14 - CAL.indexOf(first), days.length + dn))))
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-[15px] font-bold">Which days? <span className="text-muted font-semibold">tap to pick, tap again to remove</span></span>
        <div className="flex items-center gap-1.5">
          <span className="text-[14px] font-semibold text-muted mr-1">In a row from first day:</span>
          <button type="button" aria-label="One day less" className="btn !min-h-[38px] !px-3" onClick={() => stepN(-1)}><Icon name="Minus" size={16} /></button>
          <span className="num text-[22px] w-9 text-center">{days.length}</span>
          <button type="button" aria-label="One day more" className="btn !min-h-[38px] !px-3" onClick={() => stepN(1)}><Icon name="Plus" size={16} /></button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {CAL.map((d, i) => {
          const on = set.has(d), sun = new Date(d + 'T12:00:00').getDay() === 0
          return (
            <button key={d} type="button" aria-pressed={on} onClick={() => toggle(d)}
              className={`min-h-[64px] rounded-xl border-[1.5px] cursor-pointer flex flex-col items-center justify-center leading-tight ${on ? 'bg-ink text-white border-ink' : 'bg-white border-line hover:border-ink'}`}>
              <span className={`text-[12px] font-bold uppercase ${on ? 'text-white/70' : sun ? 'text-coraldark' : 'text-muted'}`}>{i === 0 ? 'Today' : i === 1 ? 'Tmrw' : fmtDay(d, 'en')}</span>
              <span className="num text-[22px]">{new Date(d + 'T12:00:00').getDate()}</span>
              <span className={`text-[11px] font-semibold ${on ? 'text-white/70' : 'text-muted'}`}>{fmtDate(d, 'en').split(' ')[1]}</span>
            </button>
          )
        })}
      </div>
      <div className={`text-[15px] font-semibold rounded-xl px-3.5 py-2.5 ${days.length ? 'bg-mint text-[#133F2C]' : 'bg-coralsoft text-coraldark'}`}>
        {days.length ? <><b>{days.length} {days.length === 1 ? 'day' : 'days'}:</b> {days.map((d) => `${fmtDay(d, 'en')} ${fmtDate(d, 'en')}`).join(' · ')}</> : 'Pick at least one day'}
      </div>
    </div>
  )
}

export function EmployerPost() {
  const { postJob, bookDirect, state, nakaWorkers, showToast } = useStore()
  const navigate = useNavigate()
  const [quick, setQuick] = useState('Need a painter for 3 days in Vidyavihar, 2BHK flat, 900 per day')
  const [f, setF] = useState({ trade: 'painter', title: '', pay: '', hours: '9 – 6', days: daysFrom(1, 1), address: '', area: 'Vidyavihar', lat: 19.0793, lng: 72.8962, advanceFee: 0 })
  const [locBusy, setLocBusy] = useState(false)
  const [find, setFind] = useState('')
  const [filled, setFilled] = useState(false)

  const range = FAIR[f.trade]
  const pay = Number(f.pay) || 0
  const preview = { ...f, pay, days: f.days, address: f.address, verified: true }
  const check = pay ? checkJob(preview) : null
  const kmFromNaka = distanceKm(NAKAS.ghatkopar, f)
  const allWorkers = [...nakaWorkers, ...(state.worker.checkedIn ? [] : [{ setu: state.worker.setu, name: state.worker.nameLatin, trade: state.worker.trade, years: state.worker.years, jobsDone: state.worker.jobsDone, rating: state.worker.rating, me: true }])]
  const found = find.length >= 4 ? allWorkers.find((w) => w.setu === find.trim() || (w.me && state.worker.phone.replace(/\D/g, '').endsWith(find.replace(/\D/g, '').slice(-4)) && find.replace(/\D/g, '').length >= 10)) : null

  const fill = () => {
    const p = parseQuickPost(quick)
    setF((x) => ({
      ...x,
      trade: p.trade || x.trade,
      days: p.days ? consecutive(x.days[0] || dayISO(1), Math.min(p.days, 14)) : x.days,
      pay: p.pay ? String(p.pay) : x.pay,
      hours: p.hours || x.hours,
      area: p.area || x.area,
      ...(p.area && AREA_COORDS[p.area] ? AREA_COORDS[p.area] : {}),
      title: `${tradeById(p.trade || x.trade).name.en} needed${p.area ? ` · ${p.area}` : ''}`,
      address: x.address || (p.area ? `${p.area}, Mumbai` : ''),
    }))
    setFilled(true)
  }

  const useLoc = async () => {
    setLocBusy(true)
    try {
      const pos = await getLocation()
      if (distanceKm(pos, NAKAS.ghatkopar) > 25) showToast('You seem far from Mumbai; keeping the typed area', 'info')
      else { setF((x) => ({ ...x, lat: pos.lat, lng: pos.lng })); showToast('Location set') }
    } catch { showToast("Couldn't get location; type the address", 'info') }
    setLocBusy(false)
  }

  const draft = () => {
    const tr = tradeById(f.trade)
    const title = f.title || `${tr.name.en} needed`
    return {
      trade: f.trade, pay, hours: f.hours, days: f.days, advanceFee: Number(f.advanceFee) || 0,
      title: { hi: title, mr: title, en: title },
      employer: { hi: 'शर्मा जी', mr: 'शर्मा जी', en: 'Sharma ji' },
      area: { hi: f.area, mr: f.area, en: f.area }, address: f.address, lat: f.lat, lng: f.lng,
    }
  }

  const post = () => {
    if (!pay) return showToast('Enter pay per day', 'danger')
    if (!f.days.length) return showToast('Pick which days', 'danger')
    postJob(draft())
    const reach = allWorkers.filter((x) => x.trade === f.trade).length
    showToast(check?.level === 'danger' ? 'Posted, but flagged for admin review' : `Posted. ${reach} ${tradeById(f.trade).name.en.toLowerCase()}${reach === 1 ? '' : 's'} nearby notified (app + SMS)`)
    navigate('/e/jobs')
  }

  const book = (w) => {
    if (!pay || !f.days.length) { showToast('Fill pay and days first, then book', 'danger'); return }
    bookDirect(w.setu, draft())
    showToast(`Pakka Booking sent to ${w.name}`)
    navigate('/e/jobs')
  }

  return (
    <div className="min-h-screen">
      <EmployerHeader />
      <main className="max-w-[1220px] mx-auto px-5 md:px-7 py-7 flex flex-wrap gap-7 items-start">
        <section className="flex-[999_1_600px] min-w-0 flex flex-col gap-4.5">
          <div><h1 className="m-0 font-display text-[36px] md:text-[38px] font-bold tracking-tight">Post a job</h1><div className="text-[16px] text-muted">Workers nearby see it in their own language, with pay and hours up front.</div></div>

          <div className="bg-violetsoft border-[1.5px] border-violet rounded-2xl p-4 flex flex-col gap-2.5">
            <label htmlFor="aiq" className="flex items-center gap-2 text-[16px] font-extrabold text-[#3D2D96]"><Icon name="Sparkles" size={20} />Quick post with Setu Saathi</label>
            <div className="flex flex-wrap gap-2.5">
              <input id="aiq" className="input flex-[1_1_320px] !border-violet" value={quick} onChange={(e) => setQuick(e.target.value)} />
              <button type="button" className="btn btn-violet !min-h-[52px]" onClick={fill}>Fill the form</button>
            </div>
            {filled && <div className="text-[14px] font-semibold text-[#3D2D96]">Filled from your sentence. Check the details below.</div>}
          </div>

          <div className="card p-5 md:p-6 flex flex-col gap-5.5">
            <div className="flex flex-col gap-2.5">
              <div className="text-[16px] font-extrabold">Trade</div>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(104px,1fr))] gap-2.5">
                {TRADES.map((tr) => (
                  <button key={tr.id} type="button" aria-pressed={f.trade === tr.id} onClick={() => setF({ ...f, trade: tr.id })}
                    className={`min-h-[88px] flex flex-col items-center justify-center gap-1.5 rounded-xl border-[1.5px] cursor-pointer text-[15px] ${f.trade === tr.id ? 'bg-goldsoft border-ink shadow-[3px_3px_0_#1B1B1B] font-extrabold' : 'bg-white border-[#D9D1C0] font-semibold'}`}>
                    <Icon name={tr.icon} size={30} strokeWidth={1.7} />{tr.name.en}
                  </button>
                ))}
              </div>
            </div>

            <label className="flex flex-col gap-1.5 text-[15px] font-bold">Job title (optional)
              <input className="input" placeholder="e.g. 2BHK flat painting" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
            </label>

            <div className="grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-3.5">
              <label className="flex flex-col gap-1.5 text-[15px] font-bold">Pay per day (₹)
                <input className="input num !text-[22px]" inputMode="numeric" placeholder={`${range[0]}–${range[1]}`} value={f.pay} onChange={(e) => setF({ ...f, pay: e.target.value.replace(/\D/g, '').slice(0, 5) })} />
              </label>
              <label className="flex flex-col gap-1.5 text-[15px] font-bold">Hours
                <input className="input" value={f.hours} onChange={(e) => setF({ ...f, hours: e.target.value })} />
              </label>
            </div>
            <DayPicker days={f.days} onChange={(days) => setF({ ...f, days })} />

            {pay > 0 && (
              <div className={`flex flex-col gap-2 p-3.5 rounded-xl ${check.fair === 'fair' ? 'bg-mint' : 'bg-coralsoft'}`}>
                <div className={`flex flex-wrap justify-between gap-2 text-[15px] font-extrabold ${check.fair === 'fair' ? 'text-[#133F2C]' : 'text-coraldark'}`}>
                  <span>Fair-rate check · {tradeById(f.trade).name.en} near Ghatkopar</span>
                  <span>{check.fair === 'fair' ? `${rupee(pay)} is fair` : check.fair === 'low' ? `${rupee(pay)} is below the usual rate` : `${rupee(pay)} is unusually high`}</span>
                </div>
                <FairBar range={range} pay={pay} />
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label htmlFor="addr" className="text-[15px] font-bold">Address</label>
              <div className="flex flex-wrap gap-2.5">
                <input id="addr" className="input flex-[1_1_280px]" placeholder="Flat / building, area" value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} />
                <button type="button" className="btn !min-h-[52px]" onClick={useLoc} disabled={locBusy}><Icon name={locBusy ? 'LoaderCircle' : 'LocateFixed'} className={locBusy ? 'animate-spin' : ''} />Use my location</button>
              </div>
              <div className="text-[14px] text-muted">{kmFromNaka.toFixed(1)} km from Ghatkopar naka · <b>tap the map or drag the JOB pin</b> to set the exact spot</div>
              <MapView origin={{ lat: NAKAS.ghatkopar.lat, lng: NAKAS.ghatkopar.lng }} originLabel="Ghatkopar naka" radiusKm={3} jobs={[]} pin={{ lat: f.lat, lng: f.lng }} onPick={(ll) => setF((x) => ({ ...x, ...ll }))} height={240} />
            </div>

            <label className="flex items-center gap-3 text-[15px] font-semibold text-muted">
              <span>Advance fee from worker</span>
              <input className="input !w-28 num" inputMode="numeric" value={f.advanceFee} onChange={(e) => setF({ ...f, advanceFee: e.target.value.replace(/\D/g, '').slice(0, 4) || 0 })} />
              <span className="text-[13px]">(should be ₹0; anything else gets flagged)</span>
            </label>

            {check && check.reasons.length > 0 && (
              <div className="rounded-xl overflow-hidden border-[1.5px] border-ink">
                <div className="caution" aria-hidden="true" />
                <div className="p-3.5 bg-coralsoft flex flex-wrap gap-2 items-center">
                  <span className="font-extrabold text-coraldark mr-2">This listing will be flagged:</span>
                  {check.reasons.filter((r) => r.key !== 'r_unverified').map((r) => <span key={r.key} className="chip !bg-white"><Icon name={r.icon} size={15} />{{ r_fee: `Fee ₹${r.vars?.fee}`, r_tooHigh: 'Pay far above usual', r_tooLow: 'Below minimum wage', r_noAddress: 'No address' }[r.key]}</span>)}
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3.5 pt-1.5 border-t border-line">
              <div><div className="text-[14px] font-semibold text-muted">Total · reaches {allWorkers.filter((x) => x.trade === f.trade).length} {tradeById(f.trade).name.en.toLowerCase()}(s) nearby</div><div className="num text-[30px]">{pay ? rupee(pay * f.days.length) : '—'}</div>{pay > 0 && <div className="text-[13px] font-semibold text-muted">{rupee(pay)} × {f.days.length} {f.days.length === 1 ? 'day' : 'days'} · {fmtRange(f.days, 'en')}</div>}</div>
              <button type="button" className="btn btn-primary !min-h-[56px] text-[19px] px-7" onClick={post}>Post job</button>
            </div>
          </div>
        </section>

        <aside className="flex-[1_1_340px] min-w-0 flex flex-col gap-4.5">
          <section className="card p-4.5 flex flex-col gap-3">
            <div className="text-[18px] font-extrabold">Know a worker?</div>
            <label htmlFor="find" className="text-[14px] text-muted">Ask for their 4-digit Setu number (or phone). No app or QR needed on their side.</label>
            <div className="flex gap-2">
              <input id="find" className="input num !text-[26px] tracking-[8px]" inputMode="numeric" placeholder="2417" value={find} onChange={(e) => setFind(e.target.value.replace(/[^\d]/g, '').slice(0, 10))} />
            </div>
            {find.length >= 4 && !found && <div className="text-[14px] font-semibold text-coraldark">No worker with this number</div>}
            {found && <WorkerRow w={found} onBook={() => book(found)} highlight />}
            <div className="text-[13px] text-muted">Try 2417 (Ramesh) or 3851 (Suresh).</div>
          </section>

          <section className="card p-4.5 flex flex-col">
            <div className="flex justify-between items-center gap-2 mb-2">
              <span className="text-[18px] font-extrabold">At Ghatkopar naka now</span>
              <span className="flex items-center gap-1.5 text-[13px] font-bold text-greendark"><span className="w-2 h-2 rounded-full bg-green live-dot" />{nakaWorkers.length} workers</span>
            </div>
            {nakaWorkers.filter((w) => w.trade === f.trade || f.trade === 'helper').concat(nakaWorkers.filter((w) => w.trade !== f.trade && f.trade !== 'helper')).map((w) => <WorkerRow key={w.setu} w={w} onBook={() => book(w)} />)}
            <div className="text-[13px] text-muted pt-2">Workers appear here after tapping "I'm at the naka".</div>
          </section>
        </aside>
      </main>
      <Toast />
    </div>
  )
}

function WorkerRow({ w, onBook, highlight }) {
  const tr = tradeById(w.trade)
  return (
    <div className={`flex gap-3 items-center py-2.5 ${highlight ? 'px-3 rounded-xl bg-goldsoft' : 'border-t border-line'}`}>
      <span className="w-11 h-11 shrink-0 rounded-full bg-sky border border-[#C9D9E6] flex items-center justify-center font-extrabold">{w.name.split(' ').map((x) => x[0]).join('').slice(0, 2)}</span>
      <div className="flex-1 min-w-0">
        <div className="font-extrabold flex items-center gap-1.5">{w.name}{w.me && <span className="chip !bg-mint !text-greendark !text-[11px] !px-1.5">live</span>}</div>
        <div className="text-[14px] text-muted">{tr.name.en} · {w.years} yrs · {w.jobsDone} jobs · {w.rating || '–'}</div>
      </div>
      <button type="button" className={`btn !min-h-[44px] ${highlight ? 'btn-primary' : ''}`} onClick={onBook}>Book</button>
    </div>
  )
}

export function EmployerJobs() {
  const { state, empConfirmDay, markPaid, completeBooking, showToast, today } = useStore()
  const [stars, setStars] = useState({})
  const mine = useMemo(() => state.jobs.filter((j) => j.createdBy === 'sharma' || j.employerId === 'sharma'), [state.jobs])

  return (
    <div className="min-h-screen">
      <EmployerHeader />
      <main className="max-w-[1000px] mx-auto px-5 md:px-7 py-7 flex flex-col gap-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h1 className="m-0 font-display text-[36px] font-bold tracking-tight">My jobs</h1>
          <Link to="/e" className="btn btn-primary">+ Post a job</Link>
        </div>
        {mine.map((j) => {
          const b = state.bookings.find((x) => x.jobId === j.id)
          const c = checkJob(j)
          const tr = tradeById(j.trade)
          const status = j.status === 'removed' ? ['Removed by admin', 'bg-coralsoft text-coraldark']
            : !b ? [j.directFor ? `Pakka Booking sent · waiting for ${j.directFor}` : 'Open · visible to nearby workers', 'bg-goldsoft text-golddark']
              : b.status === 'pending' ? ['Worker reviewing the slip', 'bg-goldsoft text-golddark']
                : b.status === 'confirmed' ? ['Confirmed · Ramesh Kale', 'bg-mint text-greendark'] : ['Completed', 'bg-sand text-ink']
          return (
            <section key={j.id} className={`card p-5 flex flex-col gap-4 ${b?.status === 'confirmed' ? 'card-hero' : ''}`}>
              <div className="flex flex-wrap items-center gap-3.5">
                <span className="w-12 h-12 rounded-xl bg-sand flex items-center justify-center"><Icon name={tr.icon} size={26} strokeWidth={1.7} /></span>
                <div className="flex-1 min-w-[200px]"><div className="text-[20px] font-extrabold">{j.title.en}</div><div className="text-[15px] text-muted">{fmtRange(j.days, 'en')} · {j.hours} · {j.area.en}</div></div>
                <span className={`chip ${status[1]}`}>{status[0]}</span>
                <span className="num text-[24px]">{rupee(j.pay)}<span className="text-[14px] text-muted font-sans font-semibold">/day</span></span>
              </div>
              {c.level !== 'ok' && j.status !== 'removed' && <div className="chip !bg-coralsoft !text-coraldark self-start"><Icon name="TriangleAlert" size={15} />Flagged for admin review</div>}

              {b && b.status !== 'pending' && (
                <div className="flex flex-col gap-2">
                  <div className="text-[15px] font-extrabold">Attendance and payment · Kaam Parchi</div>
                  {b.log.map((l) => (
                    <div key={l.date} className="flex flex-wrap items-center gap-2.5 py-1.5 border-t border-line">
                      <span className="w-[110px] font-bold">{fmtDay(l.date, 'en')} {fmtDate(l.date, 'en')}</span>
                      <span className="flex-1 flex gap-1.5 flex-wrap">
                        {l.worked && !l.empConfirmed && <span className="chip">Worker marked present</span>}
                        {l.empConfirmed && <span className="chip !bg-mint !text-greendark">Confirmed</span>}
                        {l.paid && <span className="chip !bg-mint !text-greendark">Paid {rupee(b.snap.pay)}</span>}
                      </span>
                      {!l.empConfirmed && l.date <= today && <button type="button" className="btn !min-h-[40px]" onClick={() => empConfirmDay(b.id, l.date)}>Confirm day</button>}
                      {l.empConfirmed && !l.paid && <button type="button" className="btn btn-green !min-h-[40px]" onClick={() => { markPaid(b.id, l.date); showToast('Payment recorded') }}>Mark paid</button>}
                    </div>
                  ))}
                  <div className="flex flex-wrap gap-4 text-[15px] font-semibold pt-1">
                    <span>Paid {rupee(money(b).received)}</span><span>Due <b className="num">{rupee(money(b).total - money(b).received)}</b></span>
                  </div>
                  {b.status === 'confirmed' && (
                    <div className="flex flex-wrap items-center gap-3 pt-2 border-t-[1.5px] border-ink">
                      <span className="font-extrabold">Job done? Rate Ramesh:</span>
                      <Stars value={stars[b.id] || 0} onChange={(v) => setStars({ ...stars, [b.id]: v })} />
                      <button type="button" className="btn btn-primary" disabled={!stars[b.id]} onClick={() => { completeBooking(b.id, stars[b.id]); showToast("Completed. Added to the worker's card") }}>Complete job</button>
                    </div>
                  )}
                  {b.status === 'completed' && <div className="text-[15px] font-bold text-greendark">Rated {b.rating} · added to worker's card</div>}
                </div>
              )}
            </section>
          )
        })}
      </main>
      <Toast />
    </div>
  )
}
