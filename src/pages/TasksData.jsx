import { useEffect, useMemo, useRef, useState } from 'react'
import { Routes, Route, NavLink, useLocation, useNavigate } from 'react-router-dom'
import RecentTasks from './TasksData/RecentTasks'
import CategoryTasks from './TasksData/CategoryTasks'
import Favorites from './TasksData/Favorites'
import PredictionDetail from './PredictionDetail'
import { ASSET_CATEGORY } from './TasksData/assetTasks'
import './TasksData.css'

const STORAGE_KEY = 'mu.assets.visibleTabs'

const ASSET_TABS = [
  { id: 'recent', to: '/tasks-data', end: true, label: 'Recent Tasks' },
  { id: 'molecules', to: '/tasks-data/molecules', label: '★ Molecules', settingsLabel: 'Molecules' },
  { id: 'paperResearch', to: '/tasks-data/paper-research', label: 'Paper Research' },
  { id: 'predicts', to: '/tasks-data/predicts', label: 'Predicts' },
  { id: 'formulate', to: '/tasks-data/formulate', label: 'Formulate' },
  { id: 'electrolyteDesign', to: '/tasks-data/electrolyte-design', label: 'Electrolyte Design' },
  {
    id: 'electrodeForwardDesign',
    to: '/tasks-data/electrode-forward-design',
    label: 'Electrode Forward Design',
  },
  {
    id: 'electrodeInverseDesign',
    to: '/tasks-data/electrode-inverse-design',
    label: 'Electrode Inverse Design',
  },
]

const DEFAULT_VISIBILITY = () =>
  Object.fromEntries(ASSET_TABS.map((t) => [t.id, true]))

function loadVisibility() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_VISIBILITY()
    const parsed = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return DEFAULT_VISIBILITY()
    const next = { ...DEFAULT_VISIBILITY() }
    for (const tab of ASSET_TABS) {
      if (tab.id === 'recent') continue
      if (typeof parsed[tab.id] === 'boolean') next[tab.id] = parsed[tab.id]
    }
    next.recent = true
    return next
  } catch {
    return DEFAULT_VISIBILITY()
  }
}

function pathMatchesTab(pathname, tab) {
  const p = pathname.replace(/\/$/, '') || '/'
  const target = tab.to.replace(/\/$/, '') || '/'
  if (tab.end) return p === target
  return p === target || p.startsWith(`${target}/`)
}

export default function TasksData() {
  const location = useLocation()
  const navigate = useNavigate()
  const isTaskDetail = location.pathname.match(/\/task\/[^/]+$/)

  const [visibility, setVisibility] = useState(loadVisibility)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const settingsRef = useRef(null)

  const visibleTabs = useMemo(
    () => ASSET_TABS.filter((t) => t.id === 'recent' || visibility[t.id]),
    [visibility]
  )

  useEffect(() => {
    if (isTaskDetail) return
    if (visibleTabs.length === 0) return
    const ok = visibleTabs.some((t) => pathMatchesTab(location.pathname, t))
    if (!ok) navigate(visibleTabs[0].to, { replace: true })
  }, [isTaskDetail, location.pathname, visibleTabs, navigate])

  useEffect(() => {
    if (!settingsOpen) return
    const onDoc = (e) => {
      const el = settingsRef.current
      if (el && !el.contains(e.target)) setSettingsOpen(false)
    }
    const onKey = (e) => {
      if (e.key === 'Escape') setSettingsOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [settingsOpen])

  const toggleTabVisibility = (id) => {
    if (id === 'recent') return
    setVisibility((prev) => {
      const next = { ...prev, [id]: !prev[id], recent: true }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }

  const resetTabsVisibility = () => {
    const next = DEFAULT_VISIBILITY()
    next.recent = true
    setVisibility(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }

  if (isTaskDetail) {
    return (
      <Routes>
        <Route path="task/:id" element={<PredictionDetail />} />
      </Routes>
    )
  }

  return (
    <div className="tasks-data-page">
      <header className="page-header" data-onboarding-anchor="assets-intro-header">
        <h1>Assets</h1>
        <p className="page-subtitle">
          Tasks started in Ask, generated reports, and workbench runs are grouped by feature here.
        </p>
      </header>

      <div className="tabs-assets-row">
        <nav className="tabs tabs-assets tabs-assets-scroll" aria-label="Assets categories">
          {visibleTabs.map((tab) => (
            <NavLink
              key={tab.id}
              to={tab.to}
              end={tab.end}
              className={({ isActive }) => `tab ${isActive ? 'active' : ''}`}
            >
              {tab.label}
            </NavLink>
          ))}
        </nav>
        <div className="tabs-assets-settings-wrap" ref={settingsRef}>
          <button
            type="button"
            className={`tabs-settings-trigger ${settingsOpen ? 'active' : ''}`}
            onClick={() => setSettingsOpen((o) => !o)}
            aria-expanded={settingsOpen}
            aria-haspopup="dialog"
            aria-label="Tab visibility settings"
            title="Tab visibility"
          >
            <span className="tabs-settings-icon" aria-hidden>⚙</span>
            <span className="tabs-settings-label">Settings</span>
          </button>
          {settingsOpen && (
            <div className="tabs-settings-panel" role="dialog" aria-label="Choose visible tabs">
              <div className="tabs-settings-panel-head">
                <span>Visible tabs</span>
                <button type="button" className="tabs-settings-reset" onClick={resetTabsVisibility}>
                  Reset all
                </button>
              </div>
              <p className="tabs-settings-hint">Recent Tasks is always shown. You can show or hide the other tabs.</p>
              <ul className="tabs-settings-list">
                {ASSET_TABS.map((tab) => {
                  const isRecent = tab.id === 'recent'
                  const checked = isRecent ? true : visibility[tab.id]
                  const settingName = tab.settingsLabel ?? tab.label
                  return (
                    <li key={tab.id}>
                      <label className={`tabs-settings-option ${isRecent ? 'tabs-settings-option--locked' : ''}`}>
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={isRecent}
                          onChange={() => toggleTabVisibility(tab.id)}
                        />
                        <span>
                          {settingName}
                          {isRecent ? <span className="tabs-settings-required">(required)</span> : null}
                        </span>
                      </label>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
        </div>
      </div>

      <div className="tab-content">
        <Routes>
          <Route index element={<RecentTasks />} />
          <Route path="molecules" element={<Favorites />} />
          <Route
            path="paper-research"
            element={<CategoryTasks category={ASSET_CATEGORY.paperResearch} />}
          />
          <Route path="predicts" element={<CategoryTasks category={ASSET_CATEGORY.predicts} />} />
          <Route path="formulate" element={<CategoryTasks category={ASSET_CATEGORY.formulate} />} />
          <Route
            path="electrolyte-design"
            element={<CategoryTasks category={ASSET_CATEGORY.electrolyteDesign} />}
          />
          <Route
            path="electrode-forward-design"
            element={<CategoryTasks category={ASSET_CATEGORY.electrodeForwardDesign} />}
          />
          <Route
            path="electrode-inverse-design"
            element={<CategoryTasks category={ASSET_CATEGORY.electrodeInverseDesign} />}
          />
        </Routes>
      </div>
    </div>
  )
}
