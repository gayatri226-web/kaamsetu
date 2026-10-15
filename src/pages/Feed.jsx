import { useMemo, useState } from 'react'
import { useStore } from '../lib/store'
import { L } from '../lib/i18n'
import { FAIR, NAKAS, tradeById } from '../lib/data'
import { checkJob, distanceKm, getLocation, jobType } from '../lib/logic'
import { FairBar, Hafta, Icon, JobCard, MapView } from '../components/ui'

export default function Feed() {
  const { t, lang, state, today, bookedDays, toggleCheckIn, showToast, naka } = useStore()
  const w = state.worker
  const [filter, setFilter] = useState('all')
  const [origin, setOrigin] = useState({ lat: naka.lat, lng: naka.lng, src: naka.id })
  const [locBusy, setLocBusy] = useState(false)
  const [selected, setSelected] = useState(null)

  const visible = useMemo(() => {
    const bookedSet = new Set(Object.keys(bookedDays))
    return state.jobs
      .filter((j) => j.status === 'open')
      .filter((j) => !j.directFor || j.directFor === w.setu)
      .filter((j) => !j.days.some((d) => bookedSet.has(d)))
      .filter((j) => filter === 'all' || jobType(j, today) === filter)
      .map((j) => ({ j, km: distanceKm(origin, j), c: checkJob(j) }))
      .sort((a, b) => {
        const lv = (x) => (x.c.level === 'danger' ? 2 : 0)
        const match = (x) => (x.j.trade === w.trade ? 0 : 1)
        return lv(a) - lv(b) || match(a) - match(b) || a.km - b.km
      })
  }, [state.jobs, bookedDays, filter, origin, today, w.trade, w.setu])

  const useMyLocation = async () => {
    setLocBusy(true)
    try {
      const pos = await getLocation()
      if (distanceKm(pos, naka) > 25) showToast(t('locFar'), 'info')
      else { setOrigin({ ...pos, src: 'me' }); showToast(t('locOk')) }
    } catch {
      showToast(t('locFail'), 'info')
    }
    setLocBusy(false)
  }

  const select = (id) => {
    setSelected(id)
    document.getElementById(`job-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  const range = FAIR[w.trade] || FAIR.painter
  const filters = [['all', 'f_all'], ['today', 'f_today'], ['few', 'f_few'], ['long', 'f_long']]

  return (
    <div className="flex flex-col gap-5 md:gap-6 max-w-[1180px]">
      <div className="flex flex-wrap gap-3.5 items-center justify-between">
        <div className="flex items-center gap-3.5">
          {w.photos?.[0]
            ? <img src={w.photos[0]} alt="" className="w-14 h-14 rounded-full object-cover border-[1.5px] border-ink" />
            : <span className="w-14 h-14 rounded-full bg-goldsoft border-[1.5px] border-ink flex items-center justify-center"><Icon name="UserRound" size={28} /></span>}
          <div>
            <h1 className="m-0 text-[30px] md:text-[34px] font-extrabold leading-tight">{t('hello')}, {w.name.split(' ')[0]}</h1>
            <div className="text-[16px] text-muted">{L(tradeById(w.trade).name, lang)} · {L(NAKAS[w.naka]?.name, lang)}</div>
          </div>
        </div>
        <button type="button" aria-pressed={w.checkedIn} onClick={() => { toggleCheckIn(!w.checkedIn); if (!w.checkedIn) showToast(t('atNakaOn')) }}
          className={`min-h-[58px] flex items-center gap-3 px-4.5 rounded-xl border-[1.5px] cursor-pointer text-left ${w.checkedIn ? 'bg-mint border-greendark text-[#133F2C]' : 'bg-white border-ink shadow-[3px_3px_0_#1B1B1B]'}`}>
          {w.checkedIn ? <span className="w-3 h-3 rounded-full bg-green live-dot shrink-0" /> : <Icon name="LocateFixed" size={22} />}
          <span className="leading-tight">
            <span className="block text-[17px] font-extrabold">{t('atNaka')}</span>
            <span className="block text-[13px] font-semibold">{w.checkedIn ? `${w.checkedInAt} ${t('since')} · ${t('atNakaOn')}` : t('atNakaOff')}</span>
          </span>
        </button>
      </div>

      <section aria-label={t('myWeek')} className="card p-3.5 md:p-4 flex flex-col gap-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="flex items-center gap-2 text-[18px] font-extrabold"><Icon name="CalendarDays" />{t('myWeek')}</span>
          <span className="flex flex-wrap gap-3.5 text-[13px] font-semibold text-muted">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-[3px] bg-mint border border-greendark" />{t('free')}</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-[3px] bg-gold" />{t('booked')}</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-[3px] bg-sand border border-line" />{t('off')}</span>
            <span className="hidden sm:inline">· {t('weekHint')}</span>
          </span>
        </div>
        <Hafta />
      </section>

      <div className="flex flex-wrap gap-6 items-start">
        <section className="flex-[999_1_480px] min-w-0 flex flex-col gap-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div className="seg overflow-x-auto max-w-full" role="group" aria-label="Filter">
              {filters.map(([k, key]) => <button key={k} type="button" aria-pressed={filter === k} onClick={() => setFilter(k)}>{t(key)}</button>)}
            </div>
            <span className="text-[15px] font-semibold text-muted">{t('jobsForYou', { n: visible.filter((v) => v.c.level !== 'danger').length })}</span>
          </div>
          {visible.length === 0 && <div className="card p-6 text-[17px] font-semibold text-muted">{t('noJobs')}</div>}
          {visible.map(({ j }) => <JobCard key={j.id} job={j} origin={origin} onSelect={setSelected} selected={selected === j.id} />)}
        </section>

        <aside className="flex-[1_1_330px] min-w-0 flex flex-col gap-4 md:sticky md:top-6">
          <section className="card p-3.5 flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <span className="text-[18px] font-extrabold">{t('nearby')}</span>
              <span className="text-[14px] font-semibold text-muted">{origin.src === 'me' ? t('you') : L(NAKAS[origin.src]?.name, lang)} · {t('within', { km: 2 })}</span>
            </div>
            <MapView origin={origin} jobs={visible.map((v) => v.j)} onSelect={select} selectedId={selected} />
            <button type="button" className="btn" onClick={useMyLocation} disabled={locBusy}>
              <Icon name={locBusy ? 'LoaderCircle' : 'LocateFixed'} className={locBusy ? 'animate-spin' : ''} />{locBusy ? t('locating') : t('useLocation')}
            </button>
            <div className="flex flex-wrap gap-1.5 items-center">
              <span className="text-[14px] font-semibold text-muted">{t('orNaka')}</span>
              {Object.values(NAKAS).map((n) => (
                <button key={n.id} type="button" aria-pressed={origin.src === n.id} onClick={() => setOrigin({ lat: n.lat, lng: n.lng, src: n.id })}
                  className={`min-h-[40px] px-3 rounded-full border-0 cursor-pointer text-[14px] ${origin.src === n.id ? 'bg-ink text-white font-bold' : 'bg-sand font-semibold'}`}>
                  {L(n.name, lang).replace(/ ?(नाका|naka)$/, '')}
                </button>
              ))}
            </div>
          </section>

          <section className="card p-4 flex flex-col gap-2.5">
            <div className="flex justify-between text-[16px] font-extrabold"><span>{t('fairToday')}</span><span className="num">₹{range[0]}–{range[1]}</span></div>
            <FairBar range={range} labels={false} />
            <div className="text-[14px] text-muted">{t('fairHint')}</div>
          </section>
        </aside>
      </div>
    </div>
  )
}
