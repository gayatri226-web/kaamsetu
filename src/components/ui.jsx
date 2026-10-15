import { ICONS as Icons } from './icons'
import { NavLink, Link, useNavigate } from 'react-router-dom'
import { useStore, isOff } from '../lib/store'
import { L } from '../lib/i18n'
import { checkJob, distanceKm, fmtDay, fmtDate, fmtRange, jobSpeech, rupee, speak } from '../lib/logic'
import { NAKAS, tradeById } from '../lib/data'

export function Icon({ name, size = 20, className = '', strokeWidth = 2, ...rest }) {
  const C = Icons[name] || Icons.Circle
  return <C size={size} strokeWidth={strokeWidth} className={className} aria-hidden="true" {...rest} />
}

export function LogoMark({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <rect x="1" y="1" width="38" height="38" rx="12" fill="#F2A93B" stroke="#1B1B1B" strokeWidth="1.5" />
      <path d="M7 25.5 C 11 13, 29 13, 33 25.5" fill="none" stroke="#1B1B1B" strokeWidth="3" strokeLinecap="round" />
      <path d="M5 25.5 H35" stroke="#1B1B1B" strokeWidth="3" strokeLinecap="round" />
      <path d="M13.5 19.2 V25.5 M20 17 V25.5 M26.5 19.2 V25.5" stroke="#1B1B1B" strokeWidth="2" strokeLinecap="round" />
      <path d="M10 25.5 V31 M30 25.5 V31" stroke="#1B1B1B" strokeWidth="3" strokeLinecap="round" />
      <circle cx="20" cy="10.5" r="2.6" fill="#1F8A5B" stroke="#1B1B1B" strokeWidth="1.2" />
    </svg>
  )
}

export function Logo({ to = '/', size = 'md', light = false }) {
  return (
    <Link to={to} className="flex items-center gap-2.5 no-underline">
      <LogoMark size={size === 'lg' ? 42 : 36} />
      <span className={`font-display text-[22px] tracking-tight leading-none ${light ? 'text-white' : 'text-ink'}`}>
        <span className="font-bold">Kaam</span><span className={`font-semibold ${light ? 'text-[#9FE3C4]' : 'text-greendark'}`}>Setu</span>
      </span>
    </Link>
  )
}

export function ListenButton({ text, label, className = '', big = false }) {
  const { lang, t } = useStore()
  return (
    <button type="button" className={`btn ${label ? '' : 'btn-icon'} ${className}`} onClick={() => speak(text, lang)} aria-label={label ? undefined : t('listen')}>
      <Icon name="Volume2" size={big ? 22 : 20} className="text-violet" />
      {label}
    </button>
  )
}

export function LangSwitch({ compact = false }) {
  const { lang, setLang } = useStore()
  const opts = [['hi', 'हिंदी'], ['mr', 'मराठी'], ['en', 'English']]
  return (
    <div className="seg" role="group" aria-label="Language">
      {opts.map(([k, l]) => (
        <button key={k} type="button" aria-pressed={lang === k} onClick={() => setLang(k)} className={compact ? '!px-2.5 text-[15px]' : ''}>{l}</button>
      ))}
    </div>
  )
}

export function Toast() {
  const { toast } = useStore()
  if (!toast) return null
  const tone = toast.tone === 'danger' ? 'bg-coralsoft text-coraldark' : toast.tone === 'info' ? 'bg-white' : 'bg-mint text-greendark'
  return (
    <div role="status" className="fixed left-1/2 -translate-x-1/2 bottom-24 md:bottom-8 z-50 rise">
      <div key={toast.id} className={`card card-hero px-5 py-3 font-bold text-[17px] flex items-center gap-2 ${tone}`}>
        <Icon name={toast.tone === 'danger' ? 'TriangleAlert' : 'CircleCheck'} size={20} />
        {toast.msg}
      </div>
    </div>
  )
}

const NAV = [
  { to: '/w/home', key: 'nav_home', icon: 'LayoutDashboard' },
  { to: '/w', key: 'nav_work', icon: 'Briefcase', end: true },
  { to: '/w/parchi', key: 'nav_parchi', icon: 'FileText' },
  { to: '/w/card', key: 'nav_card', icon: 'IdCard' },
  { to: '/w/rights', key: 'nav_rights', icon: 'ShieldCheck' },
  { to: '/w/saathi', key: 'nav_saathi', icon: 'MessageCircle', ai: true },
]

export function WorkerLayout({ children }) {
  const { t, resetDemo, showToast } = useStore()
  const navigate = useNavigate()
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <aside className="hidden md:flex w-[230px] shrink-0 flex-col gap-1 bg-white border-r-[1.5px] border-ink px-3.5 py-5 sticky top-0 h-screen">
        <div className="px-2 pb-5"><Logo /></div>
        {NAV.map((n) => (
          <NavLink key={n.to} to={n.to} end={n.end}
            className={({ isActive }) => `min-h-[50px] flex items-center gap-3 px-4 rounded-full border-[1.5px] no-underline text-[17px] ${isActive ? (n.ai ? 'bg-violetsoft' : 'bg-goldsoft') + ' border-ink shadow-[3px_3px_0_#1B1B1B] font-extrabold text-ink' : 'border-transparent font-semibold text-[#3A3732] hover:bg-sand'}`}>
            <Icon name={n.icon} size={22} className={n.ai ? 'text-violet' : ''} strokeWidth={1.9} />{t(n.key)}
          </NavLink>
        ))}
        <div className="mt-auto flex flex-col gap-2">
          <LangSwitch compact />
          <Link to="/sms" className="flex items-center gap-2 px-4 min-h-[44px] rounded-full border-[1.5px] border-dashed border-ink text-[15px] font-bold no-underline text-ink"><Icon name="Smartphone" size={18} />{t('basicPhone')}</Link>
          <Link to="/e" className="px-3 py-2 text-[15px] font-bold text-muted">{t('employerLink')} →</Link>
          <button type="button" className="text-left px-3 text-[13px] font-semibold text-muted underline" onClick={() => { resetDemo(); showToast(t('resetDemo'), 'info'); navigate('/w') }}>{t('resetDemo')}</button>
        </div>
      </aside>

      <header className="md:hidden flex items-center justify-between gap-2 bg-white border-b-[1.5px] border-ink px-4 py-3 sticky top-0 z-30">
        <Logo />
        <LangSwitch compact />
      </header>

      <main className="flex-1 min-w-0 px-4 py-5 md:px-9 md:py-7 pb-28 md:pb-10">{children}</main>

      <nav aria-label="main" className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t-[1.5px] border-ink grid grid-cols-6 px-1 py-1.5 gap-0.5">
        {NAV.map((n) => (
          <NavLink key={n.to} to={n.to} end={n.end}
            className={({ isActive }) => `min-h-[56px] flex flex-col items-center justify-center gap-0.5 no-underline text-[11px] rounded-full ${isActive ? 'font-extrabold text-ink bg-goldsoft' : 'font-semibold text-muted'}`}>
            <Icon name={n.icon} size={22} className={n.ai ? 'text-violet' : ''} />{t(n.key)}
          </NavLink>
        ))}
      </nav>
      <Toast />
    </div>
  )
}

export function PageTitle({ title, sub, back }) {
  const { t } = useStore()
  return (
    <div className="flex items-center gap-3.5 mb-5">
      {back && (
        <Link to={back} aria-label={t('back')} className="btn btn-icon shrink-0 !rounded-full"><Icon name="ArrowLeft" size={22} /></Link>
      )}
      <div>
        <h1 className="m-0 text-[30px] md:text-[34px] font-extrabold leading-tight">{title}</h1>
        {sub && <div className="text-[16px] text-muted">{sub}</div>}
      </div>
    </div>
  )
}

/* Week strip: next 7 days, booked days filled, tap a free day to mark it off */
export function Hafta({ highlight = [], compact = false, interactive = true }) {
  const { lang, t, bookedDays, state, toggleOffDay } = useStore()
  const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setHours(12); d.setDate(d.getDate() + i); return d.toISOString().slice(0, 10) })
  return (
    <div className="grid grid-cols-7 gap-1.5 md:gap-2">
      {days.map((d) => {
        const b = bookedDays[d]
        const hl = highlight.includes(d)
        const off = !b && !hl && isOff(state.worker, d)
        const cls = hl || b ? 'bg-gold' : off ? 'bg-sand text-[#8A8478]' : 'bg-mint'
        const label = hl ? t('booked') : b ? L(b.snap.employer, lang) : off ? t('off') : t('free')
        const inner = (
          <>
            <div className={`text-[12px] md:text-[13px] font-bold ${!b && !hl && !off ? 'text-greendark' : ''}`}>{fmtDay(d, lang)}</div>
            <div className="num text-[18px] md:text-[20px] leading-tight">{new Date(d + 'T12:00:00').getDate()}</div>
            {!compact && <div className="text-[11px] md:text-[12px] font-bold truncate px-1">{label}</div>}
          </>
        )
        return interactive && !b && !hl ? (
          <button key={d} type="button" onClick={() => toggleOffDay(d)} aria-label={`${fmtDay(d, lang, { weekday: 'long', day: 'numeric', month: 'long' })}: ${label}`}
            className={`${cls} rounded-[10px] py-2 text-center border-0 cursor-pointer ${hl ? 'outline-[1.5px] outline outline-ink' : ''}`}>{inner}</button>
        ) : (
          <div key={d} className={`${cls} rounded-[10px] py-2 text-center ${hl ? 'outline-[1.5px] outline outline-ink' : ''}`}>{inner}</div>
        )
      })}
    </div>
  )
}

export function FairBar({ range, pay, labels = true }) {
  const [lo, hi] = range
  const min = Math.min(lo * 0.6, pay || lo), max = Math.max(hi * 1.3, pay || hi)
  const pct = (v) => ((v - min) / (max - min)) * 100
  return (
    <div>
      <div aria-hidden="true" className="relative h-2.5 rounded-full bg-sand">
        <div className="absolute top-0 bottom-0 rounded-full bg-green" style={{ left: pct(lo) + '%', width: pct(hi) - pct(lo) + '%' }} />
        {pay ? <div className="absolute -top-[5px] w-1 h-5 rounded-sm bg-ink" style={{ left: `calc(${Math.min(99, Math.max(0, pct(pay)))}% - 2px)` }} /> : null}
      </div>
      {labels && <div className="flex justify-between text-[13px] text-muted font-semibold mt-1"><span>{rupee(Math.round(min))}</span><span>{rupee(lo)} – {rupee(hi)}</span><span>{rupee(Math.round(max))}</span></div>}
    </div>
  )
}

export function JobCard({ job, origin, onSelect, selected }) {
  const { lang, t, state, reportJob, showToast } = useStore()
  const navigate = useNavigate()
  const check = checkJob(job)
  const km = origin ? distanceKm(origin, job) : null
  const trade = tradeById(job.trade)
  const existing = state.bookings.find((b) => b.jobId === job.id && b.status !== 'completed')
  const take = () => navigate(existing ? `/w/parchi/${existing.id}` : `/w/parchi/new/${job.id}`)

  if (check.level === 'danger') {
    return (
      <article id={`job-${job.id}`} className={`card overflow-hidden bg-coralsoft ${selected ? 'ring-4 ring-coral/40' : ''}`}>
        <div className="caution" aria-hidden="true" />
        <div className="p-4 md:p-5 flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <Icon name="TriangleAlert" size={26} className="text-coral" />
            <span className="text-[19px] font-extrabold text-coraldark">{t('scamTitle')}</span>
            <span className="md:ml-auto text-[16px] font-bold">{L(job.title, lang)} · <span className="num">{rupee(job.pay)}</span>/{t('perDay')}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {check.reasons.filter((r) => r.key !== 'r_unverified').map((r) => (
              <div key={r.key} className="flex items-center gap-2.5 bg-white rounded-[10px] px-3 py-2 text-[15px] font-bold">
                <Icon name={r.icon} size={24} className="text-coral shrink-0" />{t(r.key, r.vars)}
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-2.5">
            <Link to={`/w/saathi?job=${job.id}`} className="btn"><Icon name="MessageCircle" size={18} className="text-violet" />{t('askSaathi')}</Link>
            <button type="button" className="btn btn-dark" disabled={job.reported} onClick={() => { reportJob(job.id); showToast(t('reported')) }}>
              <Icon name="Flag" size={18} />{job.reported ? t('reported') : t('report')}
            </button>
          </div>
        </div>
      </article>
    )
  }

  return (
    <article id={`job-${job.id}`} className={`card p-4 md:p-5 flex flex-wrap gap-4 md:gap-5 items-center ${selected ? 'card-hero' : ''} ${check.level === 'warn' ? 'border-dashed' : ''}`}>
      <button type="button" onClick={() => onSelect?.(job.id)} className="shrink-0 w-[76px] h-[76px] md:w-[88px] md:h-[88px] rounded-xl bg-sand border border-line flex flex-col items-center justify-center gap-0.5 cursor-pointer" aria-label={L(trade.name, lang)}>
        <Icon name={trade.icon} size={32} strokeWidth={1.7} />
        <span className="text-[12px] font-bold text-muted">{L(trade.name, lang)}</span>
      </button>
      <div className="flex-[1_1_220px] min-w-0 flex flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[21px] md:text-[23px] font-extrabold leading-tight">{L(job.title, lang)}</span>
          {job.verified && <span className="chip !bg-mint !text-greendark !text-[13px]"><Icon name="BadgeCheck" size={14} />{t('verifiedEmp')}</span>}
          {job.directFor && <span className="chip !bg-violetsoft !text-violet !text-[13px]">Pakka Booking</span>}
        </div>
        <div className="text-[16px] text-muted">{L(job.employer, lang)} · {L(job.area, lang)}</div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[15px] font-semibold text-[#3A3732]">
          <span className="flex items-center gap-1.5"><Icon name="CalendarDays" size={17} />{job.days.length} {t('days')} · {fmtRange(job.days, lang)}</span>
          <span className="flex items-center gap-1.5"><Icon name="Clock" size={17} />{job.hours}</span>
          {km != null && <span className="flex items-center gap-1.5"><Icon name="MapPin" size={17} />{km.toFixed(1)} km</span>}
        </div>
        {check.level === 'warn' && (
          <div className="flex flex-wrap gap-2 mt-1">
            {check.reasons.map((r) => <span key={r.key} className="chip !bg-coralsoft !text-coraldark"><Icon name={r.icon} size={15} />{t(r.key, r.vars)}</span>)}
          </div>
        )}
      </div>
      <div className="flex-none flex flex-col items-end gap-2.5 ml-auto">
        <div className="text-right">
          <span className="num text-[34px] md:text-[38px] leading-none">{rupee(job.pay)}</span>
          <span className="text-[15px] text-muted"> / {t('perDay')}</span>
          <div className={`text-[13px] font-bold ${check.fair === 'low' ? 'text-coraldark' : 'text-greendark'}`}>{check.fair === 'low' ? t('lowRate') : t('fairRate')}</div>
        </div>
        <div className="flex gap-2">
          <ListenButton text={jobSpeech(job, lang, km)} />
          <button type="button" className="btn btn-primary text-[18px]" onClick={take}>{t('take')}</button>
        </div>
      </div>
    </article>
  )
}

/* Simple offline map: projects real lat/lng around the origin. Swap for Leaflet + OSM tiles in production. */
export function MapView({ origin, jobs, onSelect, selectedId, radiusKm = 2 }) {
  const { t } = useStore()
  const W = 340, H = 250, cx = W / 2, cy = H / 2, pxPerKm = 92 / radiusKm
  const proj = (p) => ({
    x: cx + (p.lng - origin.lng) * Math.cos((origin.lat * Math.PI) / 180) * 111.32 * pxPerKm,
    y: cy - (p.lat - origin.lat) * 110.57 * pxPerKm,
  })
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${t('nearby')}: ${jobs.length}`} className="block w-full h-auto rounded-[10px] bg-[#EEF1EA]">
      <path d="M0 210 C 80 195, 150 240, 230 225 L 230 250 L 0 250 Z" fill="#D5E6F2" />
      <rect x="18" y="16" width="70" height="44" rx="4" fill="#E2E6DC" />
      <rect x="196" y="14" width="56" height="36" rx="4" fill="#DCEBD2" />
      <rect x="252" y="150" width="72" height="44" rx="4" fill="#E2E6DC" />
      <path d="M0 88 L340 68" stroke="#fff" strokeWidth="12" />
      <path d="M120 0 L150 250" stroke="#fff" strokeWidth="10" />
      <path d="M262 0 L236 250" stroke="#fff" strokeWidth="8" />
      <path d="M0 140 L340 150" stroke="#fff" strokeWidth="5" />
      <circle cx={cx} cy={cy} r={92} fill="rgba(31,138,91,0.06)" stroke="#1F8A5B" strokeWidth="1.5" strokeDasharray="5 5" />
      <circle cx={cx} cy={cy} r="16" fill="rgba(31,138,91,0.2)" />
      <circle cx={cx} cy={cy} r="7" fill="#1F8A5B" stroke="#fff" strokeWidth="2.5" />
      <text x={cx + 12} y={cy + 26} fontFamily="Mukta" fontSize="13" fontWeight="700" fill="#1F6B4A">{t('you')}</text>
      {jobs.map((j, i) => {
        const p = proj(j)
        if (p.x < 8 || p.x > W - 8 || p.y < 8 || p.y > H - 8) return null
        const danger = checkJob(j).level === 'danger'
        const sel = selectedId === j.id
        return (
          <g key={j.id} onClick={() => onSelect?.(j.id)} style={{ cursor: 'pointer' }}>
            <circle cx={p.x} cy={p.y} r={sel ? 16 : 13} fill={danger ? '#E5533D' : '#F2A93B'} stroke="#1B1B1B" strokeWidth={sel ? 2.5 : 1.5} />
            <text x={p.x} y={p.y + 5} textAnchor="middle" fontFamily="Space Grotesk" fontSize="13" fontWeight="700" fill={danger ? '#fff' : '#1B1B1B'}>{danger ? '!' : i + 1}</text>
          </g>
        )
      })}
    </svg>
  )
}

export function EmployerHeader({ title = 'for Employers' }) {
  return (
    <header className="bg-white border-b-[1.5px] border-ink">
      <div className="max-w-[1220px] mx-auto px-5 md:px-7 py-3 flex flex-wrap gap-3 items-center justify-between">
        <div className="flex items-center gap-2.5"><Logo /><span className="chip">{title}</span></div>
        <div className="flex flex-wrap gap-3 items-center">
          <nav className="flex gap-1 p-1 rounded-full border-[1.5px] border-ink bg-white">
            <NavLink to="/e" end className={({ isActive }) => `px-4 min-h-[38px] flex items-center rounded-full font-bold text-[15px] no-underline ${isActive ? 'bg-ink text-white' : 'text-ink'}`}>Post a job</NavLink>
            <NavLink to="/e/jobs" className={({ isActive }) => `px-4 min-h-[38px] flex items-center rounded-full font-bold text-[15px] no-underline ${isActive ? 'bg-ink text-white' : 'text-ink'}`}>My jobs</NavLink>
          </nav>
          <Link to="/w" className="px-4 min-h-[42px] flex items-center rounded-full font-bold text-[15px] text-muted no-underline hover:bg-sand">Switch to worker</Link>
          <span className="min-h-[42px] flex items-center gap-2 pl-4 pr-2 border-[1.5px] border-ink rounded-full font-bold">Sharma ji
            <span className="chip !bg-mint !text-greendark !text-[13px]"><Icon name="Check" size={12} strokeWidth={3} />Verified</span></span>
        </div>
      </div>
    </header>
  )
}

export function Stars({ value, onChange, size = 30 }) {
  return (
    <div className="flex gap-1" role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" role="radio" aria-checked={value === n} aria-label={`${n}`} onClick={() => onChange(n)} className="p-1 bg-transparent border-0 cursor-pointer">
          <Icon name="Star" size={size} className={n <= value ? 'text-gold fill-gold' : 'text-line'} />
        </button>
      ))}
    </div>
  )
}

export { NAKAS }
