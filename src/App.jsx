import { useState, useRef, useEffect } from 'react'
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom'
import { TasksProvider } from './context/TasksContext'
import { AskProvider } from './context/AskContext'
import { UserDemoProvider, useUserDemo } from './context/UserDemoContext'
import { OnboardingTourProvider, useOnboardingTour } from './context/OnboardingTourContext'
import OnboardingSpotlight from './components/OnboardingSpotlight'
import { FavoritesProvider } from './context/FavoritesContext'
import NewUserDemoModal from './components/NewUserDemoModal'
import Ask from './pages/Ask'
import TasksData from './pages/TasksData'
import FeaturesWorkflows from './pages/FeaturesWorkflows'
import ManageFeatures from './pages/ManageFeatures'
import ManageWorkflows from './pages/ManageWorkflows'
import FormulateIntro from './pages/FormulateIntro'
import NewLifePrediction from './pages/NewLifePrediction'
import TrainLifePredictionModel from './pages/TrainLifePredictionModel'
import ToolsDocs from './pages/ToolsDocs'
import HelpUserCenter from './pages/HelpUserCenter'
import HelpOnboarding from './pages/HelpOnboarding'
import AccountSettings from './pages/AccountSettings'
import AccountPlans from './pages/AccountPlans'
import DailyDataAnalysis from './pages/DailyDataAnalysis'
import LimsPredictReportWorkflow from './pages/LimsPredictReportWorkflow'
import LimsPredictReportHistory from './pages/LimsPredictReportHistory'
import DailyDataHistory from './pages/DailyDataHistory'
import DailyDataHistoryDetail from './pages/DailyDataHistoryDetail'
import LifePredictionResult from './pages/LifePredictionResult'
import './App.css'

function TopbarHelpMenu() {
  const navigate = useNavigate()
  const { openUserDemoModal } = useUserDemo()
  const { startSpotlightTour } = useOnboardingTour()
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <div className="topbar-help-wrap" ref={wrapRef}>
      <button
        type="button"
        className="topbar-help-trigger"
        aria-label="帮助中心"
        aria-expanded={open}
        aria-haspopup="menu"
        title="帮助中心"
        onClick={() => setOpen((v) => !v)}
      >
        <svg className="topbar-help-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <path d="M12 17h.01" />
        </svg>
      </button>
      {open && (
        <div className="topbar-help-menu" role="menu">
          <button
            type="button"
            role="menuitem"
            className="topbar-help-menu-item"
            onClick={() => {
              setOpen(false)
              navigate('/help/user')
            }}
          >
            用户帮助中心
          </button>
          <button
            type="button"
            role="menuitem"
            className="topbar-help-menu-item"
            onClick={() => {
              setOpen(false)
              navigate('/')
              startSpotlightTour()
            }}
          >
            新手引导
          </button>
          <button
            type="button"
            role="menuitem"
            className="topbar-help-menu-item"
            onClick={() => {
              setOpen(false)
              navigate('/')
              openUserDemoModal()
            }}
          >
            新用户 Demo
          </button>
        </div>
      )}
    </div>
  )
}

function TopbarUserMenu() {
  const navigate = useNavigate()
  const { setProfile } = useUserDemo()
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <div className="topbar-user-wrap" ref={wrapRef}>
      <button
        type="button"
        className="topbar-user-trigger"
        aria-label="Account"
        aria-expanded={open}
        aria-haspopup="menu"
        title="Account"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="topbar-user-avatar" aria-hidden>
          DR
        </span>
      </button>

      {open && (
        <div className="topbar-user-menu" role="menu" aria-label="User menu">
          <div className="topbar-user-menu-head">
            <div className="topbar-user-menu-plan">Plan: <strong>Pro</strong></div>
            <div className="topbar-user-menu-expiry">Expires: <strong>2026/12/31</strong></div>
          </div>
          <button
            type="button"
            role="menuitem"
            className="topbar-user-menu-item"
            onClick={() => {
              setOpen(false)
              navigate('/account')
            }}
          >
            Account setting
          </button>
          <button
            type="button"
            role="menuitem"
            className="topbar-user-menu-item danger"
            onClick={() => {
              setOpen(false)
              setProfile(null)
              navigate('/')
            }}
          >
            Logout
          </button>
        </div>
      )}
    </div>
  )
}

function App() {
  const handleTopNavClick = () => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }

  return (
    <TasksProvider>
      <AskProvider>
        <UserDemoProvider>
          <OnboardingTourProvider>
            <FavoritesProvider>
              <div className="app">
                <NewUserDemoModal />
                <OnboardingSpotlight />
                <header className="topbar">
                  <span className="logo">MU Agent</span>
                  <div className="topbar-nav-cluster">
                    <nav className="top-nav">
                      <NavLink
                        to="/"
                        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                        end
                        onClick={handleTopNavClick}
                      >
                        Ask
                      </NavLink>
                      <NavLink
                        to="/features-workflows"
                        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                        onClick={handleTopNavClick}
                        data-onboarding-anchor="nav-workbench"
                      >
                        Workbench
                      </NavLink>
                      <NavLink
                        to="/tasks-data"
                        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                        onClick={handleTopNavClick}
                        data-onboarding-anchor="nav-assets"
                      >
                        Assets
                      </NavLink>
                    </nav>
                    <TopbarUserMenu />
                    <TopbarHelpMenu />
                  </div>
                </header>
                <main className="main-content">
                  <Routes>
                    <Route path="/" element={<Ask />} />
                    <Route path="/tasks-data/*" element={<TasksData />} />
                    <Route path="/features-workflows" element={<FeaturesWorkflows />} />
                    <Route path="/workbench/manage-features" element={<ManageFeatures />} />
                    <Route path="/workbench/manage-workflows" element={<ManageWorkflows />} />
                    <Route path="/workbench/features/formulate" element={<FormulateIntro />} />
                    <Route path="/workbench/new-life-prediction" element={<NewLifePrediction />} />
                    <Route path="/workbench/train-life-prediction-model" element={<TrainLifePredictionModel />} />
                    <Route path="/workbench/daily-data-analysis" element={<DailyDataAnalysis />} />
                    <Route path="/workbench/lims-predict-report" element={<LimsPredictReportWorkflow />} />
                    <Route path="/workbench/lims-predict-report-history" element={<LimsPredictReportHistory />} />
                    <Route path="/workbench/daily-data-history" element={<DailyDataHistory />} />
                    <Route path="/workbench/daily-data-history/:id" element={<DailyDataHistoryDetail />} />
                    <Route path="/workbench/activity/life-prediction" element={<LifePredictionResult />} />
                    <Route path="/tools" element={<ToolsDocs />} />
                    <Route path="/account" element={<AccountSettings />} />
                    <Route path="/account/plans" element={<AccountPlans />} />
                    <Route path="/help/user" element={<HelpUserCenter />} />
                    <Route path="/help/onboarding" element={<HelpOnboarding />} />
                  </Routes>
                </main>
              </div>
            </FavoritesProvider>
          </OnboardingTourProvider>
        </UserDemoProvider>
      </AskProvider>
    </TasksProvider>
  )
}

export default App
