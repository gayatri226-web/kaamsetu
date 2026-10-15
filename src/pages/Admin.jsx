import { useStore } from '../lib/store'
import { checkJob, rupee } from '../lib/logic'
import { Icon, Logo, Toast } from '../components/ui'
import { Link } from 'react-router-dom'

const REASON_EN = { r_fee: (v) => `₹${v.fee} fee upfront`, r_tooHigh: (v) => `${v.x}× area rate`, r_tooLow: () => 'Below minimum wage', r_noAddress: () => 'No address given', r_unverified: () => 'Employer not verified' }

export default function Admin() {
  const { state, flaggedJobs, nakaWorkers, removeJob, approveJob, resolveComplaint, verifyEmployers, showToast } = useStore()
  const open = state.jobs.filter((j) => j.status === 'open').length
  const complaints = state.complaints.filter((c) => c.status === 'open')
  const stats = [
    ['Open jobs', open, ''],
    ['Workers at naka now', nakaWorkers.length, ''],
    ['Flagged listings', flaggedJobs.length, flaggedJobs.length ? 'bg-coralsoft text-coraldark' : ''],
    ['Unpaid-wage reports', complaints.length, complaints.length ? 'bg-goldsoft text-golddark' : ''],
  ]
  return (
    <div className="min-h-screen">
      <header className="bg-ink text-white">
        <div className="max-w-[1220px] mx-auto px-5 md:px-7 py-3 flex flex-wrap gap-3 items-center justify-between">
          <div className="flex items-center gap-2.5"><Logo light /><span className="chip !bg-white/15 !text-white">Admin</span></div>
          <div className="flex gap-4 items-center text-[14px] font-semibold text-[#D8D2C6]"><span>Ghatkopar naka · mock data</span><Link to="/" className="!text-white underline">Home</Link></div>
        </div>
      </header>
      <main className="max-w-[1220px] mx-auto px-5 md:px-7 py-7 flex flex-col gap-6">
        <section className="card grid grid-cols-2 md:grid-cols-4 overflow-hidden">
          {stats.map(([l, v, cls], i) => (
            <div key={l} className={`px-5 py-4.5 ${i < 3 ? 'md:border-r' : ''} ${i % 2 === 0 ? 'border-r md:border-r' : ''} ${i < 2 ? 'border-b md:border-b-0' : ''} border-line ${cls}`}>
              <div className="text-[14px] font-bold opacity-80">{l}</div><div className="num text-[40px] leading-tight">{v}</div>
            </div>
          ))}
        </section>

        <div className="flex flex-wrap gap-6 items-start">
          <section className="flex-[999_1_600px] min-w-0 card overflow-hidden">
            <div className="caution" aria-hidden="true" />
            <div className="p-5 flex flex-col gap-2.5">
              <h2 className="m-0 font-display text-[22px] font-bold">Flagged listings</h2>
              <p className="m-0 text-[14px] text-muted">Auto-flagged by the scam check (upfront fee, unusual pay, missing address) or reported by workers.</p>
              {flaggedJobs.length === 0 ? <div className="py-6 text-center font-bold text-greendark">All clear. No flagged listings.</div> : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] border-collapse text-[15px]">
                    <thead><tr className="text-left text-muted border-b-[1.5px] border-ink"><th className="py-2.5 px-2">Listing</th><th className="py-2.5 px-2">Pay / day</th><th className="py-2.5 px-2">Why flagged</th><th className="py-2.5 px-2"><span className="sr-only">Action</span></th></tr></thead>
                    <tbody>
                      {flaggedJobs.map((j) => {
                        const c = checkJob(j)
                        return (
                          <tr key={j.id} className="border-b border-line">
                            <td className="py-3.5 px-2 font-extrabold">{j.title.en}<div className="text-[13px] font-semibold text-muted">{j.employer.en}</div></td>
                            <td className="py-3.5 px-2 num">{rupee(j.pay)}</td>
                            <td className="py-3.5 px-2">
                              {c.reasons.map((r) => <span key={r.key} className={`chip m-0.5 ${r.w >= 2 ? '!bg-coralsoft !text-coraldark' : '!bg-goldsoft !text-golddark'}`}>{REASON_EN[r.key](r.vars || {})}</span>)}
                              {j.reported && <span className="chip m-0.5 !bg-coralsoft !text-coraldark"><Icon name="Flag" size={13} />Reported by worker</span>}
                            </td>
                            <td className="py-3.5 px-2"><div className="flex gap-2 justify-end">
                              <button type="button" className="btn btn-dark !min-h-[42px]" onClick={() => { removeJob(j.id); showToast('Listing removed') }}>Remove</button>
                              <button type="button" className="btn !min-h-[42px]" onClick={() => { approveJob(j.id); showToast('Approved', 'info') }}>Approve</button>
                            </div></td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>

          <section className="flex-[1_1_320px] min-w-0 card p-5 flex flex-col">
            <h2 className="m-0 mb-2 font-display text-[22px] font-bold">Unpaid wages</h2>
            {complaints.length === 0 && <div className="py-3 font-bold text-greendark">No open reports.</div>}
            {complaints.map((c) => (
              <div key={c.id} className="py-3 border-t border-line flex flex-col gap-2">
                <div className="flex justify-between gap-2"><span className="font-extrabold">{c.worker}</span><span className="num">{rupee(c.amount)}</span></div>
                <div className="text-[14px] text-muted">{c.note}</div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" className="btn btn-primary !min-h-[42px]" onClick={() => { resolveComplaint(c.id); showToast('Marked resolved: employer paid') }}>Employer paid</button>
                  <a className="btn !min-h-[42px]" href="tel:14434">Labour helpline</a>
                </div>
              </div>
            ))}
            <div className="pt-3 border-t border-line flex justify-between items-center gap-2">
              <div><div className="font-extrabold">Employer verification</div><div className="text-[14px] text-muted">{state.pendingEmployers} waiting</div></div>
              <button type="button" className="btn !min-h-[42px]" disabled={!state.pendingEmployers} onClick={() => { verifyEmployers(); showToast('Employers verified') }}>Review</button>
            </div>
          </section>
        </div>
      </main>
      <Toast />
    </div>
  )
}
