import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import './WorkflowArchitectCanvas.css'

const DT_SKILL = 'application/wa-skill'

const NODE_W = 178
const NODE_H = 118

const SKILL_CATALOG = [
  { key: 'source', label: 'LIMS Data Fetcher', role: 'SOURCE', icon: 'db' },
  { key: 'processor', label: 'Custom Table Aggregator', role: 'PROCESSOR', icon: 'table' },
  { key: 'model', label: 'Life Prediction (Predict Skill)', role: 'MODEL', icon: 'chart' },
  { key: 'output', label: 'Daily Report Generator', role: 'OUTPUT', icon: 'mail' },
]

function catalogByKey() {
  return Object.fromEntries(SKILL_CATALOG.map((s) => [s.key, s]))
}

function createSeedGraph() {
  const ids = ['ng-1', 'ng-2', 'ng-3', 'ng-4']
  const keys = ['source', 'processor', 'model', 'output']
  const nodes = ids.map((id, i) => ({
    id,
    templateKey: keys[i],
    x: 48 + i * 248,
    y: 140,
  }))
  const edges = [
    { id: 'eg-1', from: ids[0], to: ids[1] },
    { id: 'eg-2', from: ids[1], to: ids[2] },
    { id: 'eg-3', from: ids[2], to: ids[3] },
  ]
  return { nodes, edges }
}

function newNodeId() {
  return `ng-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function IconDb() {
  return (
    <svg className="wa-node-glyph" viewBox="0 0 24 24" fill="none" aria-hidden>
      <ellipse cx="12" cy="6" rx="7" ry="3" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5 6v4c0 1.66 3.13 3 7 3s7-1.34 7-3V6" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5 10v4c0 1.66 3.13 3 7 3s7-1.34 7-3v-4" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5 14v4c0 1.66 3.13 3 7 3s7-1.34 7-3v-4" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

function IconTable() {
  return (
    <svg className="wa-node-glyph" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="4" y="5" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M4 10h16M10 5v14" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

function IconChart() {
  return (
    <svg className="wa-node-glyph" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 19h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M7 16l3-6 4 3 3-8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="15" y="4" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.25" />
    </svg>
  )
}

function IconMail() {
  return (
    <svg className="wa-node-glyph" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="6" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3 8l9 6 9-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function NodeGlyph({ name }) {
  switch (name) {
    case 'db':
      return <IconDb />
    case 'table':
      return <IconTable />
    case 'chart':
      return <IconChart />
    case 'mail':
      return <IconMail />
    default:
      return null
  }
}

const SIDEBAR_BY_TEMPLATE = {
  source: {
    title: 'LIMS Data Fetcher',
    subtitle: '数据源 · 拉取电芯测试原始数据',
    fields: [
      { id: 'batch', label: 'Batch ID', placeholder: '例如 CELL-BATCH-2026-Q1' },
      { id: 'lims', label: 'LIMS 连接', placeholder: 'https://lims.example.com/api' },
    ],
  },
  processor: {
    title: 'Custom Table Aggregator',
    subtitle: '处理器 · 清洗与汇总',
    fields: [
      { id: 'window', label: '汇总时间窗', placeholder: '每日 00:00–23:59 (站点时区)' },
      { id: 'cols', label: '关键列映射', placeholder: 'barcode, cycle_id, capacity_ah' },
    ],
  },
  model: {
    title: 'Life Prediction (Predict Skill)',
    subtitle: '模型 · 寿命预测',
    fields: [
      { id: 'model', label: '模型版本', placeholder: 'MU Agent-LifePredict v2.4' },
      { id: 'infer', label: '推理参数', placeholder: 'cycles_used=200, confidence=0.95' },
    ],
  },
  output: {
    title: 'Daily Report Generator',
    subtitle: '输出 · 报告投递',
    fields: [
      { id: 'channel', label: '投递渠道', placeholder: '飞书 / Email' },
      { id: 'to', label: '接收人', placeholder: 'team@company.com' },
    ],
  },
}

function edgeEndpoints(fromNode, toNode) {
  if (!fromNode || !toNode) return null
  const x1 = fromNode.x + NODE_W
  const y1 = fromNode.y + NODE_H / 2
  const x2 = toNode.x
  const y2 = toNode.y + NODE_H / 2
  return { x1, y1, x2, y2 }
}

function GraphEdgeLine({ flowing, gradId, x1, y1, x2, y2 }) {
  return (
    <g className={flowing ? 'wa-ge-line-wrap wa-ge-line-wrap--flow' : 'wa-ge-line-wrap'}>
      <line x1={x1} y1={y1} x2={x2} y2={y2} className="wa-ge-dash" strokeDasharray="5 6" />
      {flowing ? (
        <line
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          className="wa-ge-glow"
          stroke={`url(#${gradId})`}
          strokeWidth="2.5"
          strokeDasharray="10 8"
          strokeLinecap="round"
        />
      ) : null}
    </g>
  )
}

export default function WorkflowArchitectCanvas({ open, onClose, onActivated }) {
  const viewportRef = useRef(null)
  const gradPrefix = useId().replace(/:/g, '')

  const [graphNodes, setGraphNodes] = useState(() => createSeedGraph().nodes)
  const [graphEdges, setGraphEdges] = useState(() => createSeedGraph().edges)
  const [connectFromId, setConnectFromId] = useState(null)
  const [sidebarTemplate, setSidebarTemplate] = useState(null)
  const [flowStage, setFlowStage] = useState(0)
  const [activating, setActivating] = useState(false)

  const catalog = useMemo(() => catalogByKey(), [])

  const resetGraph = useCallback(() => {
    const { nodes, edges } = createSeedGraph()
    setGraphNodes(nodes)
    setGraphEdges(edges)
    setConnectFromId(null)
    setSidebarTemplate(null)
  }, [])

  useEffect(() => {
    if (!open) {
      setSidebarTemplate(null)
      setFlowStage(0)
      setActivating(false)
      setConnectFromId(null)
      return
    }
    resetGraph()
  }, [open, resetGraph])

  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') {
        if (connectFromId) {
          setConnectFromId(null)
          return
        }
        if (!activating) onClose?.()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose, connectFromId, activating])

  const nodesById = useMemo(() => Object.fromEntries(graphNodes.map((n) => [n.id, n])), [graphNodes])

  const handlePaletteDragStart = (e, skillKey) => {
    e.dataTransfer.setData(DT_SKILL, skillKey)
    e.dataTransfer.setData('text/plain', skillKey)
    e.dataTransfer.effectAllowed = 'copy'
  }

  const handleCanvasDragOver = (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
  }

  const handleCanvasDrop = (e) => {
    e.preventDefault()
    const key = e.dataTransfer.getData(DT_SKILL) || e.dataTransfer.getData('text/plain')
    if (!key || !catalog[key]) return
    const vp = viewportRef.current
    if (!vp) return
    const inner = vp.querySelector('.wa-graph-inner')
    const vr = vp.getBoundingClientRect()
    const pad = 12
    let x = e.clientX - vr.left + vp.scrollLeft - NODE_W / 2
    let y = e.clientY - vr.top + vp.scrollTop - NODE_H / 2
    const maxX = (inner?.offsetWidth ?? vp.clientWidth) - NODE_W - pad
    const maxY = (inner?.offsetHeight ?? vp.clientHeight) - NODE_H - pad
    x = Math.max(pad, Math.min(x, maxX))
    y = Math.max(pad, Math.min(y, maxY))
    setGraphNodes((prev) => [...prev, { id: newNodeId(), templateKey: key, x, y }])
  }

  const handlePortOut = (nodeId) => {
    setConnectFromId((prev) => (prev === nodeId ? null : nodeId))
  }

  const handlePortIn = (nodeId) => {
    if (!connectFromId || connectFromId === nodeId) return
    const from = connectFromId
    setConnectFromId(null)
    setGraphEdges((prev) => {
      if (prev.some((ed) => ed.from === from && ed.to === nodeId)) return prev
      return [...prev, { id: `eg-${Date.now()}`, from, to: nodeId }]
    })
  }

  const handleEdgeMidClick = (edge) => {
    const fromNode = nodesById[edge.from]
    if (fromNode) setSidebarTemplate(fromNode.templateKey)
  }

  const handleNodeCardClick = (nodeId) => {
    const n = nodesById[nodeId]
    if (n) setSidebarTemplate(n.templateKey)
  }

  const handleActivate = () => {
    if (activating) return
    if (graphEdges.length === 0) return
    setActivating(true)
    setFlowStage(0)
    const stepMs = 720
    graphEdges.forEach((_, i) => {
      setTimeout(() => setFlowStage(i + 1), 40 + i * stepMs)
    })
    const doneAt = 40 + graphEdges.length * stepMs + 900
    setTimeout(() => {
      setFlowStage(graphEdges.length + 1)
      onActivated?.()
      setActivating(false)
      onClose?.()
    }, doneAt)
  }

  if (!open) return null

  const copy = sidebarTemplate ? SIDEBAR_BY_TEMPLATE[sidebarTemplate] : null

  return (
    <div className="wa-overlay" role="dialog" aria-modal="true" aria-labelledby="wa-canvas-title">
      <div className="wa-backdrop" onClick={() => !activating && onClose?.()} />
      <div className="wa-panel">
        <header className="wa-head">
          <div className="wa-head-left">
            <span className="wa-brand-mark" aria-hidden>
              MU
            </span>
            <div>
              <h1 id="wa-canvas-title" className="wa-title">
                Workflow Architect
              </h1>
              <p className="wa-sub">数据 → 清洗 → 预测 → 报告</p>
            </div>
          </div>
          <div className="wa-head-actions">
            <button
              type="button"
              className="wa-btn wa-btn-primary"
              disabled={activating || graphEdges.length === 0}
              onClick={handleActivate}
              title={graphEdges.length === 0 ? '请先连接至少两个节点' : undefined}
            >
              Activate Workflow
            </button>
            <button type="button" className="wa-btn wa-btn-ghost" disabled={activating} onClick={() => onClose?.()}>
              关闭
            </button>
          </div>
        </header>

        <div className="wa-body">
          <aside className="wa-palette" aria-label="Skill 面板">
            <div className="wa-palette-title">Skills</div>
            <p className="wa-palette-hint">拖拽到右侧画布放置；点击节点右侧圆点后再点目标左侧圆点连线。</p>
            <ul className="wa-palette-list">
              {SKILL_CATALOG.map((s) => (
                <li key={s.key}>
                  <div
                    className="wa-palette-item"
                    draggable
                    onDragStart={(e) => handlePaletteDragStart(e, s.key)}
                    role="button"
                    tabIndex={0}
                    aria-grabbed="false"
                  >
                    <span className="wa-palette-item-role">{s.role}</span>
                    <div className="wa-palette-item-mid">
                      <div className="wa-palette-item-icon">
                        <NodeGlyph name={s.icon} />
                      </div>
                      <span className="wa-palette-item-label">{s.label}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </aside>

          <div
            ref={viewportRef}
            className={`wa-graph-viewport ${connectFromId ? 'wa-graph-viewport--connecting' : ''}`}
            onDragOver={handleCanvasDragOver}
            onDrop={handleCanvasDrop}
          >
            <div className="wa-graph-inner">
            {connectFromId ? (
              <div className="wa-graph-hint">已选中输出端口，请点击另一节点的<strong>左侧</strong>连接点完成连线（Esc 取消）。</div>
            ) : null}

            <svg className="wa-graph-svg" aria-hidden>
              <defs>
                <linearGradient id={`${gradPrefix}-flow`} x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#38bdf8" />
                </linearGradient>
              </defs>
              {graphEdges.map((edge, i) => {
                const ep = edgeEndpoints(nodesById[edge.from], nodesById[edge.to])
                if (!ep) return null
                return (
                  <GraphEdgeLine
                    key={edge.id}
                    flowing={activating && flowStage > i}
                    gradId={`${gradPrefix}-flow`}
                    x1={ep.x1}
                    y1={ep.y1}
                    x2={ep.x2}
                    y2={ep.y2}
                  />
                )
              })}
            </svg>

            {graphEdges.map((edge) => {
              const ep = edgeEndpoints(nodesById[edge.from], nodesById[edge.to])
              if (!ep) return null
              const mx = (ep.x1 + ep.x2) / 2
              const my = (ep.y1 + ep.y2) / 2
              return (
                <button
                  key={`${edge.id}-hit`}
                  type="button"
                  className="wa-graph-edge-hit"
                  style={{ left: mx - 13, top: my - 13 }}
                  aria-label="编辑此连接段"
                  title="编辑上游节点配置"
                  onClick={() => handleEdgeMidClick(edge)}
                >
                  <svg className="wa-edge-plus" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" />
                  </svg>
                </button>
              )
            })}

            {graphNodes.map((n) => {
              const tpl = catalog[n.templateKey]
              if (!tpl) return null
              return (
                <div
                  key={n.id}
                  className="wa-graph-node-wrap"
                  style={{ left: n.x, top: n.y, width: NODE_W }}
                >
                  <button
                    type="button"
                    className="wa-port wa-port-in"
                    aria-label="连入：作为连线终点"
                    title="连入"
                    onClick={(e) => {
                      e.stopPropagation()
                      handlePortIn(n.id)
                    }}
                  />
                  <button
                    type="button"
                    className={`wa-port wa-port-out ${connectFromId === n.id ? 'wa-port-out--active' : ''}`}
                    aria-label="连出：点击后选择另一节点左侧连接点"
                    title="连出"
                    onClick={(e) => {
                      e.stopPropagation()
                      handlePortOut(n.id)
                    }}
                  />
                  <div
                    className="wa-node wa-node--on-canvas"
                    role="button"
                    tabIndex={0}
                    onClick={() => handleNodeCardClick(n.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        handleNodeCardClick(n.id)
                      }
                    }}
                  >
                    <div className="wa-node-brand">
                      <span className="wa-node-logo">MU Agent</span>
                      <span className="wa-node-role">{tpl.role}</span>
                    </div>
                    <div className="wa-node-mid">
                      <div className="wa-node-icon-wrap">
                        <NodeGlyph name={tpl.icon} />
                      </div>
                      <div className="wa-node-text">
                        <div className="wa-node-label">{tpl.label}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
            </div>
          </div>

          <aside className={`wa-sidebar ${copy ? 'wa-sidebar--open' : ''}`}>
            {copy ? (
              <>
                <div className="wa-sidebar-head">
                  <h2 className="wa-sidebar-title">{copy.title}</h2>
                  <p className="wa-sidebar-sub">{copy.subtitle}</p>
                  <button
                    type="button"
                    className="wa-sidebar-x"
                    onClick={() => setSidebarTemplate(null)}
                    aria-label="关闭侧栏"
                  >
                    ×
                  </button>
                </div>
                <div className="wa-sidebar-body">
                  {copy.fields.map((f) => (
                    <label key={f.id} className="wa-field">
                      <span className="wa-field-label">{f.label}</span>
                      <input className="wa-field-input" type="text" placeholder={f.placeholder} readOnly />
                    </label>
                  ))}
                  <p className="wa-field-hint">Demo：以上为只读示意，生产环境将写入工作流配置。</p>
                </div>
              </>
            ) : null}
          </aside>
        </div>
      </div>
    </div>
  )
}
