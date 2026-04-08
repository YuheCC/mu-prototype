import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import './FeaturesWorkflows.css'

const features = [
  { id: 1, name: 'New Life Prediction', desc: 'Create a new battery life prediction', icon: '⏱', href: '/workbench/new-life-prediction' },
  { id: 2, name: 'Train Life Prediction Model', desc: 'Train a new life prediction model', icon: '📈', href: '/workbench/train-life-prediction-model' },
  { id: 3, name: 'Formulate', desc: 'Formulation optimization and recipe design', icon: '🧪' },
  { id: 4, name: 'Electrolyte Design', desc: 'Electrolyte composition and property analysis', icon: '⚡' },
]

const workflows = [
  { id: 1, name: 'Daily Data Analysis', desc: 'Automated daily data processing and reports', icon: '📊', href: '/workbench/daily-data-analysis' },
  { id: 2, name: 'LIMS → Predict → Report', desc: 'Daily fetch, aggregate, life prediction, report (09:00)', icon: '⛓', href: '/workbench/lims-predict-report' },
]

const TIME_RANGES = [
  { value: 'today', label: 'Today' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
]

function getDateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const todayKey = getDateKey(new Date())

const mockKanbanTasks = [
  { type: 'feature', name: 'New Life Prediction', time: '09:15', date: todayKey, status: 'Done', detail: '1 prediction', href: '/workbench/activity/life-prediction' },
  { type: 'workflow', name: 'Daily Data Analysis', time: '10:00', date: todayKey, status: 'Done', detail: '3 cells, report DDA-20260315', href: '/workbench/daily-data-analysis' },
  { type: 'workflow', name: 'Daily Data Analysis', time: '10:00', date: getDateKey(new Date(Date.now() - 86400000)), status: 'Done', detail: '5 cells, report DDA-20260314', href: '/workbench/daily-data-history' },
  { type: 'workflow', name: 'Daily Data Analysis', time: '10:01', date: getDateKey(new Date(Date.now() - 86400000 * 3)), status: 'Done', detail: '2 cells', href: '/workbench/daily-data-history' },
]

function filterTasksByRange(tasks, range) {
  const now = new Date()
  const today = getDateKey(now)
  if (range === 'today') {
    return tasks.filter((t) => t.date === today)
  }
  const n = range === '7d' ? 7 : 30
  const from = new Date(now)
  from.setDate(from.getDate() - n)
  const fromKey = getDateKey(from)
  return tasks.filter((t) => t.date >= fromKey && t.date <= today)
}

export default function FeaturesWorkflows() {
  const location = useLocation()
  const navigate = useNavigate()
  const [timeRange, setTimeRange] = useState('today')
  const [highlightFeature, setHighlightFeature] = useState(null)

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const v = params.get('highlight')
    if (!v) return

    setHighlightFeature(v)
    const t = setTimeout(() => {
      setHighlightFeature(null)
      params.delete('highlight')
      navigate({ pathname: location.pathname, search: params.toString() ? `?${params.toString()}` : '' }, { replace: true })
    }, 1600)
    return () => clearTimeout(t)
  }, [location.pathname, location.search, navigate])

  const filtered = filterTasksByRange(mockKanbanTasks, timeRange)
  const featureTasks = filtered.filter((t) => t.type === 'feature')
  const workflowTasks = filtered.filter((t) => t.type === 'workflow')

  const rangeLabel = TIME_RANGES.find((r) => r.value === timeRange)?.label ?? 'Today'

  return (
    <div className="features-workflows-page">
      <header className="page-header" data-onboarding-anchor="workbench-intro-header">
        <h1>Workbench</h1>
        <p className="page-subtitle">Built-in features and your custom workflows</p>
      </header>

      <section className="workbench-kanban">
        <div className="workbench-kanban-head">
          <div>
            <h2 className="workbench-kanban-title">Activity</h2>
            <p className="workbench-kanban-date">{rangeLabel}</p>
          </div>
          <div className="workbench-kanban-controls">
            <select
              className="workbench-kanban-select"
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              aria-label="Time range"
            >
              {TIME_RANGES.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="workbench-kanban-stats">
          <div className="workbench-kanban-stat">
            <span className="workbench-kanban-stat-value">{featureTasks.length}</span>
            <span className="workbench-kanban-stat-label">Feature tasks</span>
          </div>
          <div className="workbench-kanban-stat">
            <span className="workbench-kanban-stat-value">{workflowTasks.length}</span>
            <span className="workbench-kanban-stat-label">Workflow tasks</span>
          </div>
        </div>
        <div className="workbench-kanban-grid">
          <div className="workbench-kanban-col">
            <h3 className="workbench-kanban-col-title">Feature tasks</h3>
            <ul className="workbench-kanban-list">
              {featureTasks.length === 0 ? (
                <li className="workbench-kanban-empty">No feature tasks in this period</li>
              ) : (
                featureTasks.map((t, i) => (
                  <li key={`f-${t.date}-${i}`} className="workbench-kanban-item">
                    <button
                      type="button"
                      className="workbench-kanban-item-btn"
                      onClick={() => t.href && navigate(t.href)}
                    >
                      <span className="workbench-kanban-item-name">{t.name}</span>
                      <span className="workbench-kanban-item-meta">{t.date} {t.time} · {t.detail}</span>
                      <span className={`workbench-kanban-item-status workbench-kanban-status-${t.status.toLowerCase()}`}>{t.status}</span>
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>
          <div className="workbench-kanban-col">
            <h3 className="workbench-kanban-col-title">Workflow tasks</h3>
            <ul className="workbench-kanban-list">
              {workflowTasks.length === 0 ? (
                <li className="workbench-kanban-empty">No workflow tasks in this period</li>
              ) : (
                workflowTasks.map((t, i) => (
                  <li key={`w-${t.date}-${i}`} className="workbench-kanban-item">
                    <button
                      type="button"
                      className="workbench-kanban-item-btn"
                      onClick={() => t.href && navigate(t.href)}
                    >
                      <span className="workbench-kanban-item-name">{t.name}</span>
                      <span className="workbench-kanban-item-meta">{t.date} {t.time} · {t.detail}</span>
                      <span className={`workbench-kanban-item-status workbench-kanban-status-${t.status.toLowerCase()}`}>{t.status}</span>
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-header-row">
          <div>
            <h2 className="section-title">Features</h2>
            <p className="section-desc">Fixed capabilities for analysis and design</p>
          </div>
          <button
            type="button"
            className="section-manage-btn"
            onClick={() => navigate('/workbench/manage-features')}
          >
            Manage features
          </button>
        </div>
        <div className="grid">
          {features.map((f) => (
            <button
              key={f.id}
              type="button"
              className={`feature-card feature-card-button ${highlightFeature === 'new-life-prediction' && f.name === 'New Life Prediction' ? 'feature-card-highlight' : ''}`}
              onClick={() => {
                if (f.href) navigate(f.href)
              }}
            >
              <span className="feature-icon">{f.icon}</span>
              <h3 className="feature-name">{f.name}</h3>
              <p className="feature-desc">{f.desc}</p>
            </button>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-header-row">
          <div>
            <h2 className="section-title">Workflows</h2>
            <p className="section-desc">Your automated workflows</p>
          </div>
          <button
            type="button"
            className="section-manage-btn"
            onClick={() => navigate('/workbench/manage-workflows')}
          >
            Manage workflows
          </button>
        </div>
        <div className="grid">
          {workflows.map((w) => (
            <button
              key={w.id}
              type="button"
              className="workflow-card workflow-card-button"
              onClick={() => {
                if (w.href) navigate(w.href)
              }}
            >
              <span className="workflow-icon">{w.icon}</span>
              <h3 className="workflow-name">{w.name}</h3>
              <p className="workflow-desc">{w.desc}</p>
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}
