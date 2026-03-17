import { Routes, Route, NavLink } from 'react-router-dom'
import { TasksProvider } from './context/TasksContext'
import { AskProvider } from './context/AskContext'
import { FavoritesProvider } from './context/FavoritesContext'
import Ask from './pages/Ask'
import TasksData from './pages/TasksData'
import FeaturesWorkflows from './pages/FeaturesWorkflows'
import ManageFeatures from './pages/ManageFeatures'
import FormulateIntro from './pages/FormulateIntro'
import NewLifePrediction from './pages/NewLifePrediction'
import TrainLifePredictionModel from './pages/TrainLifePredictionModel'
import ToolsDocs from './pages/ToolsDocs'
import DailyDataAnalysis from './pages/DailyDataAnalysis'
import DailyDataHistory from './pages/DailyDataHistory'
import DailyDataHistoryDetail from './pages/DailyDataHistoryDetail'
import LifePredictionResult from './pages/LifePredictionResult'
import './App.css'

function App() {
  const handleTopNavClick = () => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }

  return (
    <TasksProvider>
      <AskProvider>
        <FavoritesProvider>
          <div className="app">
            <header className="topbar">
              <span className="logo">MU</span>
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
                >
                  Workbench
                </NavLink>
                <NavLink
                  to="/tasks-data"
                  className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                  onClick={handleTopNavClick}
                >
                  Assets
                </NavLink>
              </nav>
            </header>
            <main className="main-content">
              <Routes>
                <Route path="/" element={<Ask />} />
                <Route path="/tasks-data/*" element={<TasksData />} />
                <Route path="/features-workflows" element={<FeaturesWorkflows />} />
                <Route path="/workbench/manage-features" element={<ManageFeatures />} />
                <Route path="/workbench/features/formulate" element={<FormulateIntro />} />
                <Route path="/workbench/new-life-prediction" element={<NewLifePrediction />} />
                <Route path="/workbench/train-life-prediction-model" element={<TrainLifePredictionModel />} />
                <Route path="/workbench/daily-data-analysis" element={<DailyDataAnalysis />} />
                <Route path="/workbench/daily-data-history" element={<DailyDataHistory />} />
                <Route path="/workbench/daily-data-history/:id" element={<DailyDataHistoryDetail />} />
                <Route path="/workbench/activity/life-prediction" element={<LifePredictionResult />} />
                <Route path="/tools" element={<ToolsDocs />} />
              </Routes>
            </main>
          </div>
        </FavoritesProvider>
      </AskProvider>
    </TasksProvider>
  )
}

export default App
