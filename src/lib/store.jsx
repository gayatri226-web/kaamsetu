import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { seedState, seedWorker, dayISO, OTHER_WORKERS, NAKAS } from './data'
import { translate } from './i18n'
import { checkJob } from './logic'

const KEY = 'kaamsetu-demo-v3'
const Ctx = createContext(null)

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const s = JSON.parse(raw)
      if (s && s.v === 3) return s
    }
  } catch { /* storage may be blocked; fall back to seed */ }
  return seedState()
}

export function isOff(w, iso) {
  if ((w.offDates || []).includes(iso)) return true
  if ((w.onDates || []).includes(iso)) return false
  return (w.offDays || []).includes(new Date(iso + 'T12:00:00').getDay())
}

const uid = (p) => p + Math.random().toString(36).slice(2, 8)

export function StoreProvider({ children }) {
  const [state, setState] = useState(load)
  const [toast, setToast] = useState(null)
  const toastTimer = useRef()

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(state)) } catch { /* ignore */ }
  }, [state])

  // Keep tabs in sync (e.g. employer in one tab, worker in another during the demo)
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === KEY && e.newValue) {
        try { setState(JSON.parse(e.newValue)) } catch { /* ignore */ }
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const showToast = useCallback((msg, tone = 'ok') => {
    setToast({ msg, tone, id: Date.now() })
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 3200)
  }, [])

  const up = useCallback((fn) => setState((s) => fn(structuredClone(s))), [])

  const actions = useMemo(() => ({
    setLang: (lang) => up((s) => { s.lang = lang; return s }),
    resetDemo: () => setState(seedState()),
    updateWorker: (patch) => up((s) => { Object.assign(s.worker, patch); return s }),
    startFresh: (profile) => up((s) => {
      const base = seedWorker()
      s.worker = { ...base, ...profile, jobsDone: 0, rating: 0, onTime: 100, vouched: false, skills: [], onboarded: true }
      s.bookings = []
      return s
    }),
    toggleCheckIn: (on) => up((s) => {
      s.worker.checkedIn = on
      s.worker.checkedInAt = on ? new Date().toTimeString().slice(0, 5) : null
      return s
    }),
    toggleOffDay: (iso) => up((s) => {
      const w = s.worker
      w.offDates = w.offDates || []
      w.onDates = w.onDates || []
      if (isOff(w, iso)) {
        w.offDates = w.offDates.filter((d) => d !== iso)
        if (!w.onDates.includes(iso)) w.onDates.push(iso)
      } else {
        w.onDates = w.onDates.filter((d) => d !== iso)
        w.offDates.push(iso)
      }
      return s
    }),
    addPhoto: (dataUrl) => up((s) => { s.worker.photos = [...(s.worker.photos || []), dataUrl].slice(-8); return s }),
    verifyId: () => up((s) => { s.worker.idVerified = true; return s }),

    // Worker taps "Take job" -> a slip is created with the employer's terms (employer already said yes)
    createBooking: (jobId) => {
      const id = uid('b')
      up((s) => {
        const job = s.jobs.find((j) => j.id === jobId)
        if (!job) return s
        const existing = s.bookings.find((b) => b.jobId === jobId && b.status !== 'completed')
        if (existing) { s._lastBooking = existing.id; return s }
        s.bookings.unshift({
          id, jobId, status: 'pending', empYes: true, workerYes: false, createdAt: dayISO(0),
          snap: { title: job.title, employer: job.employer, address: job.address, pay: job.pay, hours: job.hours, trade: job.trade, payWhen: job.payWhen, advanceFee: job.advanceFee, area: job.area },
          log: job.days.map((d) => ({ date: d, worked: false, empConfirmed: false, paid: false })),
        })
        s._lastBooking = id
        return s
      })
      return id
    },
    confirmBooking: (id) => up((s) => {
      const b = s.bookings.find((x) => x.id === id)
      if (!b) return s
      b.workerYes = true
      b.status = 'confirmed'
      const job = s.jobs.find((j) => j.id === b.jobId)
      if (job) { job.status = 'booked'; job.bookedBy = s.worker.setu }
      return s
    }),
    logWork: (id, date) => up((s) => {
      const d = s.bookings.find((x) => x.id === id)?.log.find((l) => l.date === date)
      if (d) d.worked = true
      return s
    }),
    empConfirmDay: (id, date) => up((s) => {
      const d = s.bookings.find((x) => x.id === id)?.log.find((l) => l.date === date)
      if (d) { d.worked = true; d.empConfirmed = true }
      return s
    }),
    markPaid: (id, date) => up((s) => {
      const d = s.bookings.find((x) => x.id === id)?.log.find((l) => l.date === date)
      if (d) { d.worked = true; d.empConfirmed = true; d.paid = true }
      return s
    }),
    completeBooking: (id, stars) => up((s) => {
      const b = s.bookings.find((x) => x.id === id)
      if (!b || b.status === 'completed') return s
      b.status = 'completed'
      b.rating = stars
      b.log.forEach((l) => { l.worked = true; l.empConfirmed = true })
      const w = s.worker
      const n = w.jobsDone
      w.rating = Math.round(((w.rating * n + stars) / (n + 1)) * 10) / 10
      w.jobsDone = n + 1
      const sk = w.skills.find((x) => x.label.en.toLowerCase().includes(b.snap.trade === 'painter' ? 'texture' : b.snap.trade))
      if (sk) sk.n += 1
      const job = s.jobs.find((j) => j.id === b.jobId)
      if (job) job.status = 'done'
      return s
    }),
    raiseComplaint: (id) => up((s) => {
      const b = s.bookings.find((x) => x.id === id)
      if (!b) return s
      const due = b.log.filter((l) => l.worked && !l.paid).length * b.snap.pay
      b.complaint = 'open'
      s.complaints.unshift({ id: uid('c'), bookingId: id, worker: `${s.worker.nameLatin} · ${b.snap.trade}`, amount: due, note: `${b.log.filter((l) => l.worked && !l.paid).length} day(s) unpaid · Kaam Parchi #KS-${id.slice(-4).toUpperCase()} attached`, status: 'open' })
      return s
    }),
    reportJob: (jobId) => up((s) => { const j = s.jobs.find((x) => x.id === jobId); if (j) j.reported = true; return s }),

    // Employer
    postJob: (draft) => {
      const id = uid('j')
      up((s) => {
        s.jobs.unshift({ id, status: 'open', createdBy: 'sharma', employerId: 'sharma', verified: true, rating: 4.7, reported: false, approved: false, advanceFee: 0, ...draft })
        return s
      })
      return id
    },
    bookDirect: (setu, draft) => {
      const jobId = uid('j')
      up((s) => {
        s.jobs.unshift({ id: jobId, status: 'open', createdBy: 'sharma', employerId: 'sharma', verified: true, rating: 4.7, reported: false, approved: false, advanceFee: 0, directFor: setu, ...draft })
        return s
      })
      return jobId
    },

    // Admin
    removeJob: (jobId) => up((s) => { const j = s.jobs.find((x) => x.id === jobId); if (j) j.status = 'removed'; return s }),
    approveJob: (jobId) => up((s) => { const j = s.jobs.find((x) => x.id === jobId); if (j) j.approved = true; return s }),
    resolveComplaint: (cid) => up((s) => {
      const c = s.complaints.find((x) => x.id === cid)
      if (c) {
        c.status = 'resolved'
        const b = s.bookings.find((x) => x.id === c.bookingId)
        if (b) { b.log.forEach((l) => { if (l.worked) l.paid = true }); b.complaint = 'resolved' }
      }
      return s
    }),
    verifyEmployers: () => up((s) => { s.pendingEmployers = 0; return s }),
  }), [up])

  const lang = state.lang
  const t = useCallback((k, v) => translate(lang, k, v), [lang])

  // Derived helpers
  const derived = useMemo(() => {
    const today = dayISO(0)
    const myBookings = state.bookings
    const bookedDays = {}
    for (const b of myBookings) if (b.status === 'confirmed') for (const l of b.log) bookedDays[l.date] = b
    const flaggedJobs = state.jobs.filter((j) => j.status === 'open' && !j.approved && (checkJob(j).level !== 'ok' || j.reported))
    const nakaWorkers = [
      ...(state.worker.checkedIn ? [{ setu: state.worker.setu, name: state.worker.nameLatin, trade: state.worker.trade, years: state.worker.years, jobsDone: state.worker.jobsDone, rating: state.worker.rating, atNaka: true, me: true }] : []),
      ...OTHER_WORKERS,
    ]
    return { today, bookedDays, flaggedJobs, nakaWorkers, naka: NAKAS[state.worker.naka] || NAKAS.ghatkopar }
  }, [state])

  const value = { state, lang, t, ...actions, ...derived, toast, showToast }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export const useStore = () => useContext(Ctx)
