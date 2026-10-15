import { useState } from 'react'
import { useStore } from '../lib/store'
import { L } from '../lib/i18n'
import { DOCS, SCHEMES } from '../lib/data'
import { speak } from '../lib/logic'
import { Icon, ListenButton, PageTitle } from '../components/ui'

export default function Rights() {
  const { t, lang, state } = useStore()
  const defaultWork = ['painter', 'mason', 'carpenter', 'helper', 'electrician', 'plumber'].includes(state.worker.trade) ? 'construction' : 'other'
  const [a, setA] = useState({})
  const qs = [
    { k: 'work', q: 'q_work', opts: [['construction', 'a_construction', 'BrickWall'], ['other', 'a_other', 'House']] },
    { k: 'age', q: 'q_age', opts: [['18-40', '18–40'], ['41-59', '41–59'], ['60+', '60+']] },
    { k: 'income', q: 'q_income', opts: [['yes', 'yes', 'Check'], ['no', 'no', 'X']] },
    { k: 'bank', q: 'q_bank', opts: [['yes', 'yes', 'Check'], ['no', 'no', 'X']] },
  ]
  const step = qs.findIndex((q) => !a[q.k])
  const done = step === -1
  const results = done ? SCHEMES.filter((s) => s.eligible(a)) : []
  const docs = [...new Set(results.flatMap((s) => s.docs))]

  return (
    <div className="max-w-[1120px]">
      <PageTitle title={t('rightsTitle')} />
      <div className="flex flex-wrap gap-6 items-start">
        <section className="flex-[999_1_520px] min-w-0 card card-hero p-5 md:p-6 flex flex-col gap-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="m-0 text-[24px] font-extrabold">{t('schemeFinder')}</h2>
            {Object.keys(a).length > 0 && <button type="button" className="btn !min-h-[42px]" onClick={() => setA({})}><Icon name="RotateCcw" size={18} />{t('restart')}</button>}
          </div>

          {!done && (
            <div className="flex flex-col gap-4 rise" key={step}>
              <div className="flex items-center gap-1.5" aria-hidden="true">{qs.map((_, i) => <span key={i} className={`h-2 w-10 rounded-full ${i <= step ? 'bg-ink' : 'bg-line'}`} />)}</div>
              <div className="flex items-center gap-3">
                <div className="text-[26px] md:text-[30px] font-extrabold flex-1 leading-tight">{t(qs[step].q)}</div>
                <ListenButton text={t(qs[step].q)} big />
              </div>
              <div className={`grid gap-3 ${qs[step].opts.length === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
                {qs[step].opts.map(([val, label, icon]) => {
                  const text = icon || qs[step].k !== 'age' ? t(label) : label
                  const pre = qs[step].k === 'work' && val === defaultWork
                  return (
                    <button key={val} type="button" onClick={() => { setA({ ...a, [qs[step].k]: val }); speak(text, lang) }}
                      className={`min-h-[112px] rounded-2xl border-[1.5px] cursor-pointer flex flex-col items-center justify-center gap-2 text-[20px] font-extrabold bg-white ${pre ? 'border-ink' : 'border-line'} hover:bg-goldsoft`}>
                      {icon ? <Icon name={icon} size={38} strokeWidth={1.7} /> : <span className="num text-[34px]">{label}</span>}
                      {icon && text}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {done && (
            <div className="flex flex-col gap-4 rise">
              <div className="text-[19px] font-extrabold text-greendark">{t('eligibleTitle')}</div>
              {results.map((s) => (
                <div key={s.id} className="flex items-center gap-3.5 p-3.5 rounded-xl bg-mint">
                  <span className="w-12 h-12 shrink-0 rounded-xl bg-white flex items-center justify-center"><Icon name={s.icon} size={26} /></span>
                  <div className="flex-1"><div className="text-[19px] font-extrabold">{L(s.name, lang)}</div><div className="text-[15px] text-[#3A3732]">{L(s.benefit, lang)}</div></div>
                  <ListenButton text={`${L(s.name, lang)}. ${L(s.benefit, lang)}`} />
                </div>
              ))}
              {results.length === 0 && <div className="text-[17px] text-muted">—</div>}
              <div className="text-[14px] text-muted">{t('estimate')}</div>

              <div className="text-[19px] font-extrabold pt-2">{t('docs')}</div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {docs.map((d) => (
                  <div key={d} className="rounded-xl border-[1.5px] border-ink bg-white p-3.5 flex flex-col items-center text-center gap-2">
                    <span className="w-14 h-14 rounded-xl bg-sand flex items-center justify-center"><Icon name={DOCS[d].icon} size={30} strokeWidth={1.7} /></span>
                    <span className="text-[15px] font-bold leading-snug">{L(DOCS[d].name, lang)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        <aside className="flex-[1_1_320px] min-w-0 flex flex-col gap-4">
          <section className="card p-4.5 flex flex-col gap-3">
            <div className="text-[18px] font-extrabold">{t('whereGo')}</div>
            <div className="flex gap-3 items-start">
              <Icon name="Landmark" size={26} className="shrink-0" />
              <div><div className="text-[16px] font-extrabold">{t('csc')}</div><div className="text-[14px] text-muted">{t('cscAddr')}</div></div>
            </div>
            <a className="btn" href="https://www.google.com/maps/search/CSC+centre+Ghatkopar" target="_blank" rel="noreferrer"><Icon name="MapPin" size={18} />Map</a>
          </section>

          <section className="card overflow-hidden">
            <div className="caution" aria-hidden="true" />
            <div className="p-4.5 flex flex-col gap-3">
              <div className="text-[18px] font-extrabold">{t('grievance')}</div>
              {['g1', 'g2', 'g3'].map((g, i) => (
                <div key={g} className="flex gap-3 items-start">
                  <span className="w-7 h-7 shrink-0 rounded-full border-[1.5px] border-ink flex items-center justify-center num text-[14px]">{i + 1}</span>
                  <span className="text-[16px] font-semibold">{t(g)}</span>
                </div>
              ))}
              <ListenButton text={`${t('grievance')}. 1. ${t('g1')}. 2. ${t('g2')}. 3. ${t('g3')}.`} label={t('listen')} />
            </div>
          </section>

          <section className="card p-4.5 flex gap-3 items-center">
            <Icon name="Phone" size={28} />
            <div className="flex-1"><div className="text-[16px] font-extrabold">{t('helplineEshram')}</div><div className="num text-[22px]">14434</div></div>
            <a className="btn btn-primary" href="tel:14434">{t('call')}</a>
          </section>
        </aside>
      </div>
    </div>
  )
}
