import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import WorkflowArchitectCanvas from '../components/WorkflowArchitectCanvas'
import { useTasks } from '../context/TasksContext'
import './ManageWorkflows.css'

const MU_WORKFLOW_EXAMPLES = [
  {
    id: 'mu-materials-brief',
    name: '前沿材料科学早报',
    icon: '📰',
    schedule: '每日 08:00',
    desc: '每天早上八点，自动获取前沿材料科学相关的新闻，并发送到自己的微信/飞书账号上。',
    tag: 'MU 提供',
  },
]

const CUSTOM_WORKFLOWS_SEED = [
  {
    id: 1,
    name: 'Daily Data Analysis',
    desc: 'Automated daily data processing and reports',
    icon: '📊',
    href: '/workbench/daily-data-analysis',
    status: 'running',
  },
  {
    id: 2,
    name: 'LIMS → Predict → Report',
    desc: 'Daily fetch, aggregate, life prediction, report (09:00)',
    icon: '⛓',
    href: '/workbench/lims-predict-report',
    status: 'stopped',
  },
]

export default function ManageWorkflows() {
  const navigate = useNavigate()
  const { addTask } = useTasks()
  const [customWorkflows, setCustomWorkflows] = useState(() =>
    CUSTOM_WORKFLOWS_SEED.map((w) => ({ ...w })),
  )
  const [workflowCanvasOpen, setWorkflowCanvasOpen] = useState(false)

  const handleDelete = (id) => {
    if (!window.confirm('确定删除该工作流？删除后可在 Ask / Workbench 中重新创建。')) return
    setCustomWorkflows((prev) => prev.filter((w) => w.id !== id))
  }

  const handleEdit = () => {
    setWorkflowCanvasOpen(true)
  }

  const handleWorkflowArchitectActivated = () => {
    const wfId = `WF-${String(Date.now()).slice(-6)}`
    addTask({
      id: wfId,
      type: 'workflow',
      category: 'workflows',
      tool: 'Workflow Architect',
      title: 'LIMS → Predict → Report (daily 09:00)',
      meta: 'Workbench · Scheduled',
      status: 'scheduled',
      createdAt: Date.now(),
      userId: 'U-10001',
    })
  }

  return (
    <div className="manage-workflows-page">
      <header className="page-header page-header-with-back">
        <div>
          <h1>Manage Workflows</h1>
          <p className="page-subtitle">浏览 MU 官方工作流模板，并管理你已启用的自定义工作流。</p>
        </div>
        <button type="button" className="page-back-btn" onClick={() => navigate('/features-workflows')}>
          ← Back to Workbench
        </button>
      </header>

      <section className="mw-section">
        <div className="mw-section-head">
          <h2 className="mw-section-title">MU workflow</h2>
          <p className="mw-section-desc">由平台提供的可订阅自动化模板，开箱即用。</p>
        </div>
        <div className="mw-grid">
          {MU_WORKFLOW_EXAMPLES.map((w) => (
            <article key={w.id} className="mw-card mw-card--custom mw-custom-card">
              <div className="mw-custom-head">
                <span className="mw-card-icon mw-custom-icon" aria-hidden>
                  {w.icon}
                </span>
                <span className="mw-status-tag mw-status-tag--mu">{w.tag}</span>
              </div>
              <h3 className="mw-card-name">{w.name}</h3>
              <p className="mw-card-schedule mw-card-schedule--compact">{w.schedule}</p>
              <p className="mw-card-text">{w.desc}</p>
              <div className="mw-custom-actions">
                <button type="button" className="mw-action-btn mw-action-btn--edit" disabled title="Demo">
                  查看详情
                </button>
                <button type="button" className="mw-action-btn mw-action-btn--mu-second" disabled title="Demo">
                  订阅到账号
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mw-section">
        <div className="mw-section-head">
          <h2 className="mw-section-title">自定义 workflow</h2>
          <p className="mw-section-desc">你在 Workbench 中创建或保存的流程，可从这里进入与调整。</p>
        </div>
        <div className="mw-grid">
          {customWorkflows.length === 0 ? (
            <p className="mw-custom-empty">
              暂无自定义工作流。
              <button
                type="button"
                className="mw-restore-link"
                onClick={() => setCustomWorkflows(CUSTOM_WORKFLOWS_SEED.map((w) => ({ ...w })))}
              >
                恢复示例
              </button>
            </p>
          ) : (
            customWorkflows.map((w) => (
              <article key={w.id} className="mw-card mw-card--custom mw-custom-card">
                <div className="mw-custom-head">
                  <span className="mw-card-icon mw-custom-icon" aria-hidden>
                    {w.icon}
                  </span>
                  <span
                    className={`mw-status-tag ${w.status === 'running' ? 'mw-status-tag--running' : 'mw-status-tag--stopped'}`}
                  >
                    {w.status === 'running' ? '运行中' : '停止'}
                  </span>
                </div>
                <h3 className="mw-card-name">{w.name}</h3>
                <p className="mw-card-text">{w.desc}</p>
                <div className="mw-custom-actions">
                  <button type="button" className="mw-action-btn mw-action-btn--edit" onClick={handleEdit}>
                    编辑
                  </button>
                  <button type="button" className="mw-action-btn mw-action-btn--delete" onClick={() => handleDelete(w.id)}>
                    删除
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      <WorkflowArchitectCanvas
        open={workflowCanvasOpen}
        onClose={() => setWorkflowCanvasOpen(false)}
        onActivated={handleWorkflowArchitectActivated}
      />
    </div>
  )
}
