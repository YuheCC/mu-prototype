import { Routes, Route, NavLink, useLocation } from 'react-router-dom'
import Tasks from './TasksData/Tasks'
import Favorites from './TasksData/Favorites'
import PredictionDetail from './PredictionDetail'
import './TasksData.css'

export default function TasksData() {
  const location = useLocation()
  const isTaskDetail = location.pathname.match(/\/task\/[^/]+$/)

  if (isTaskDetail) {
    return (
      <Routes>
        <Route path="task/:id" element={<PredictionDetail />} />
      </Routes>
    )
  }

  return (
    <div className="tasks-data-page">
      <header className="page-header">
        <h1>Assets</h1>
        <p className="page-subtitle">Manage your tasks and saved favorites</p>
      </header>

      <div className="tabs">
        <NavLink to="/tasks-data" end className={({ isActive }) => `tab ${isActive ? 'active' : ''}`}>
          Tasks
        </NavLink>
        <NavLink to="/tasks-data/favorites" className={({ isActive }) => `tab ${isActive ? 'active' : ''}`}>
          ★ Molecular
        </NavLink>
      </div>

      <div className="tab-content">
        <Routes>
          <Route index element={<Tasks />} />
          <Route path="favorites" element={<Favorites />} />
        </Routes>
      </div>
    </div>
  )
}
