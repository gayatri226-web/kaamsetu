import { useEffect } from 'react'
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { StoreProvider, useStore } from './lib/store'
import Landing from './pages/Landing'
import Onboarding from './pages/Onboarding'
import Feed from './pages/Feed'
import { ParchiList, ParchiNew, ParchiDetail } from './pages/Parchi'
import WorkerCard from './pages/WorkerCard'
import Rights from './pages/Rights'
import Saathi from './pages/Saathi'
import { EmployerPost, EmployerJobs } from './pages/Employer'
import Admin from './pages/Admin'
import BasicPhone from './pages/BasicPhone'
import Dashboard from './pages/Dashboard'
import { WorkerLayout } from './components/ui'

function LangAttr() {
  const { lang } = useStore()
  useEffect(() => { document.documentElement.lang = lang }, [lang])
  return null
}
function ScrollTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}
const W = (el) => <WorkerLayout>{el}</WorkerLayout>

export default function App() {
  return (
    <StoreProvider>
      <HashRouter>
        <LangAttr />
        <ScrollTop />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/onboard" element={<Onboarding />} />
          <Route path="/w/home" element={W(<Dashboard />)} />
          <Route path="/w" element={W(<Feed />)} />
          <Route path="/w/parchi" element={W(<ParchiList />)} />
          <Route path="/w/parchi/new/:jobId" element={W(<ParchiNew />)} />
          <Route path="/w/parchi/:id" element={W(<ParchiDetail />)} />
          <Route path="/w/card" element={W(<WorkerCard />)} />
          <Route path="/w/rights" element={W(<Rights />)} />
          <Route path="/w/saathi" element={W(<Saathi />)} />
          <Route path="/e" element={<EmployerPost />} />
          <Route path="/e/jobs" element={<EmployerJobs />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/sms" element={<BasicPhone />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </StoreProvider>
  )
}
