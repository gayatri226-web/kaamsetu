import { Link } from 'react-router-dom'
import { useStore } from '../lib/store'
import { Icon, LangSwitch, Logo, Toast } from '../components/ui'

export default function Landing() {
  const { t, lang } = useStore()
  const tr = (hi, mr, en) => ({ hi, mr, en })[lang]
  return (
    <div className="min-h-screen">
      <header className="bg-white border-b-[1.5px] border-ink">
        <div className="max-w-[1220px] mx-auto px-5 md:px-7 py-3.5 flex flex-wrap gap-3 items-center justify-between">
          <Logo />
          <LangSwitch />
        </div>
      </header>

      <main className="max-w-[1220px] mx-auto px-5 md:px-7 pt-10 md:pt-14 pb-8 flex flex-col gap-12 md:gap-14">
        <section className="flex flex-wrap gap-10 md:gap-12 items-center">
          <div className="flex-[1_1_460px] min-w-0 flex flex-col gap-5">
            <span className="self-start flex items-center gap-2 bg-mint text-greendark rounded-full px-3.5 py-1 text-[15px] font-bold">
              <span className="w-2 h-2 rounded-full bg-green live-dot" />{t('startFrom')}
            </span>
            <h1 className="m-0 text-[48px] md:text-[72px] leading-[1.04] font-extrabold tracking-[-1.5px]">
              {t('tagline')}
            </h1>
            <p className="m-0 text-[19px] md:text-[21px] leading-relaxed text-[#4A463F] max-w-[520px]">{t('heroSub')}</p>

            <div className="flex flex-wrap gap-3.5">
              <Link to="/w/home" className="flex-[1_1_220px] flex items-center gap-3.5 px-4.5 py-4 bg-gold border-[1.5px] border-ink rounded-[14px] shadow-[4px_4px_0_#1B1B1B] no-underline text-ink active:translate-x-0.5 active:translate-y-0.5">
                <Icon name="HardHat" size={34} strokeWidth={1.8} />
                <span className="flex-1"><span className="block text-[24px] font-extrabold leading-tight">{t('findWork')}</span><span className="block text-[15px] font-semibold">{tr('मुझे काम चाहिए', 'मला काम हवे', 'I need work')}</span></span>
                <Icon name="ArrowRight" size={22} strokeWidth={2.4} />
              </Link>
              <Link to="/e" className="flex-[1_1_220px] flex items-center gap-3.5 px-4.5 py-4 bg-white border-[1.5px] border-ink rounded-[14px] no-underline text-ink">
                <Icon name="House" size={32} strokeWidth={1.8} />
                <span className="flex-1"><span className="block text-[24px] font-extrabold leading-tight">{t('hireWorker')}</span><span className="block text-[15px] font-semibold">{tr('घर, सोसाइटी, ठेकेदार', 'घर, सोसायटी, ठेकेदार', 'Homes, societies, contractors')}</span></span>
                <Icon name="ArrowRight" size={22} strokeWidth={2.4} />
              </Link>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              <Link to="/onboard" className="font-bold text-[17px] underline underline-offset-4">{t('newHere')} →</Link>
              <Link to="/sms" className="flex items-center gap-1.5 font-bold text-[17px] underline underline-offset-4"><Icon name="Smartphone" size={18} />{tr('कीपैड फ़ोन? SMS से भी चलता है', 'कीपॅड फोन? SMS नेही चालते', 'Keypad phone? Works over SMS too')} →</Link>
            </div>

            <div className="flex flex-wrap gap-5 text-[16px] font-semibold text-[#4A463F]">
              <span className="flex items-center gap-2"><Icon name="Volume2" className="text-violet" />{t('f_listen')}</span>
              <span className="flex items-center gap-2"><Icon name="ShieldCheck" className="text-greendark" />{t('f_safe')}</span>
              <span className="flex items-center gap-2"><Icon name="MapPin" className="text-[#B4741A]" />{t('f_near')}</span>
            </div>
          </div>

          <div aria-hidden="true" className="flex-[1_1_420px] min-w-0 relative h-[440px] hidden sm:block">
            <div className="absolute left-0 top-6 w-[78%] card card-hero p-4 flex gap-3.5 items-center">
              <span className="w-16 h-16 shrink-0 rounded-xl bg-sand flex items-center justify-center"><Icon name="PaintRoller" size={30} strokeWidth={1.7} /></span>
              <div className="flex-1"><div className="text-[20px] font-extrabold">{tr('2BHK पेंटिंग', '2BHK रंगकाम', '2BHK flat painting')}</div><div className="text-[14px] text-muted">{tr('शर्मा जी · 2.1 km · 3 दिन', 'शर्मा जी · 2.1 km · 3 दिवस', 'Sharma ji · 2.1 km · 3 days')}</div></div>
              <div className="text-right"><div className="num text-[28px] leading-none">₹900</div><div className="text-[13px] text-muted">/ {tr('दिन', 'दिवस', 'day')}</div></div>
            </div>
            <div className="absolute right-0 top-0 card px-4 py-3 text-center rotate-3">
              <div className="text-[12px] font-bold text-muted">{tr('सेतु नंबर', 'सेतू नंबर', 'Setu number')}</div>
              <div className="num text-[32px] tracking-[6px] leading-tight">2417</div>
            </div>
            <div className="absolute left-[14%] right-[4%] top-[150px] bg-[#FFFDF7] border-[1.5px] border-ink rounded-md px-5 py-4 -rotate-[1.5deg] shadow-[0_18px_40px_rgba(27,27,27,0.12)]"
              style={{ backgroundImage: 'repeating-linear-gradient(transparent 0 31px, rgba(27,27,27,0.06) 31px 32px)' }}>
              <div className="flex justify-between num text-[13px] tracking-[2px]"><span>KAAM PARCHI</span><span>#KS-1047</span></div>
              <div className="num text-[44px] mt-2">₹2,700</div>
              <div className="text-[15px] font-semibold text-[#4A463F]">{tr('₹900 × 3 दिन · सुबह 9 – शाम 6 · एडवांस ₹0', '₹900 × 3 दिवस · सकाळी 9 – संध्या 6 · आगाऊ ₹0', '₹900 × 3 days · 9 am – 6 pm · advance ₹0')}</div>
              <div className="flex gap-2 mt-3.5 flex-wrap"><span className="chip">{tr('मंगल – गुरु', 'मंगळ – गुरु', 'Tue – Thu')}</span><span className="chip">{tr('रोज़ शाम · UPI', 'रोज संध्याकाळी · UPI', 'Daily evening · UPI')}</span></div>
              <div className="absolute right-4 bottom-3.5 -rotate-12 w-24 h-24 border-[3px] border-green rounded-full outline outline-[1.5px] outline-green outline-offset-[3px] flex flex-col items-center justify-center text-green opacity-90">
                <span className="text-[22px] font-extrabold leading-none">{t('stampYes')}</span><span className="text-[11px] font-bold">{t('bothStamp')}</span>
              </div>
            </div>
            <div className="absolute left-[4%] bottom-0 flex items-center gap-2.5 card !rounded-full pl-2.5 pr-4 py-2 text-[15px] font-bold">
              <span className="w-7 h-7 rounded-full bg-mint flex items-center justify-center"><span className="w-2.5 h-2.5 rounded-full bg-green live-dot" /></span>
              {tr('रमेश नाके पर है · 7:40 से', 'रमेश नाक्यावर आहे · 7:40 पासून', 'Ramesh is at the naka · since 7:40')}
            </div>
          </div>
        </section>

        <section aria-label="How it works" className="card grid grid-cols-1 md:grid-cols-3 overflow-hidden">
          {[['step1', 'step1s'], ['step2', 'step2s'], ['step3', 'step3s']].map(([a, b], i) => (
            <div key={a} className={`p-5 md:p-6 flex gap-4 items-start ${i < 2 ? 'md:border-r-[1.5px] border-b-[1.5px] md:border-b-0 border-line' : ''}`}>
              <span className="shrink-0 w-10 h-10 rounded-full border-[1.5px] border-ink flex items-center justify-center num">{i + 1}</span>
              <div><div className="text-[21px] font-extrabold">{t(a)}</div><div className="text-[16px] text-muted">{t(b)}</div></div>
            </div>
          ))}
        </section>
      </main>

      <footer className="max-w-[1220px] mx-auto px-5 md:px-7 pb-7 flex flex-wrap gap-3 justify-between text-[15px] text-muted">
        <span>Team Dhanur Dhaari · Artemis 2026</span>
        <Link to="/admin" className="font-bold">Admin</Link>
      </footer>
      <Toast />
    </div>
  )
}
