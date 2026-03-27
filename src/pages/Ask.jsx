import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTasks } from '../context/TasksContext'
import { useFavorites } from '../context/FavoritesContext'
import { useAskConversations } from '../context/AskContext'
import './Ask.css'

const TOOL_OPTIONS = ['Formulate', 'Life Prediction', 'Electrolyte Design', 'Electrode Design']
const WELCOME_TOOL_CARDS = [
  { title: 'Life Prediction', desc: 'Run battery life prediction workflow.' },
  { title: 'Formulation', desc: 'Build electrolyte formulation and analyze results.' },
  { title: 'Design', desc: 'Design electrolyte/electrode and compare candidates.' },
  { title: 'Recent Tasks', desc: 'Open your recent tasks and assets.' },
]
const WELCOME_PROMPTS = [
  'What are the key considerations for electrolyte solvent selection in lithium-ion batteries?',
  'What are the advantages and application prospects of solid electrolytes in next-generation battery technology?',
  'What is the formation mechanism of SEI layer and its impact on battery performance?',
  'What are the stability issues and solutions for high-nickel cathode materials?',
  'What are the causes of lithium dendrite formation and methods to suppress them?',
  'How do sodium-ion batteries compare with lithium-ion batteries in terms of performance?',
]

// Inline chart for prediction result (Capacity Retention % vs Cycle ID)
const CHART_W = 480
const CHART_H = 220
const CHART_PAD = { left: 44, right: 20, top: 12, bottom: 32 }
const X_MIN = 0
const X_MAX = 3500
const Y_MIN = 75
const Y_MAX = 105

function buildChartPath(points) {
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
}

function PredictionChartInline({ cycleLife }) {
  const life = Number(cycleLife) || 3114
  const innerW = CHART_W - CHART_PAD.left - CHART_PAD.right
  const innerH = CHART_H - CHART_PAD.top - CHART_PAD.bottom
  const xScale = (v) => CHART_PAD.left + (v / X_MAX) * innerW
  const yScale = (v) => CHART_PAD.top + innerH - ((v - Y_MIN) / (Y_MAX - Y_MIN)) * innerH
  const usedPoints = []
  for (let i = 0; i <= 200; i += 10) {
    const x = i
    const y = 100 - (i / 200) * 4
    usedPoints.push({ x: xScale(x), y: yScale(y) })
  }
  const predictedPoints = []
  for (let i = 200; i <= 3200; i += 100) {
    const x = i
    const y = 96 - ((i - 200) / 3000) * 16
    predictedPoints.push({ x: xScale(x), y: yScale(y) })
  }
  const lifeX = xScale(life)
  const lifeY = yScale(80)
  const line80y = yScale(80)

  return (
    <div className="ask-msg-chart-wrap">
      <svg className="ask-msg-chart" viewBox={`0 0 ${CHART_W} ${CHART_H}`}>
        <text x={CHART_W / 2} y={CHART_H - 4} className="ask-msg-chart-axis" textAnchor="middle">Cycle ID</text>
        <text x={12} y={CHART_H / 2} className="ask-msg-chart-axis" textAnchor="middle" transform={`rotate(-90, 12, ${CHART_H / 2})`}>Capacity Retention(%)</text>
        {[0, 500, 1000, 1500, 2000, 2500, 3000, 3500].map((v) => (
          <line key={v} x1={xScale(v)} y1={CHART_PAD.top} x2={xScale(v)} y2={CHART_PAD.top + innerH} stroke="var(--border-light)" strokeDasharray="2,2" />
        ))}
        {[75, 80, 85, 90, 95, 100, 105].map((v) => (
          <line key={v} x1={CHART_PAD.left} y1={yScale(v)} x2={CHART_PAD.left + innerW} y2={yScale(v)} stroke={v === 80 ? '#d93025' : 'var(--border-light)'} strokeDasharray={v === 80 ? '4,4' : '2,2'} />
        ))}
        <path d={buildChartPath(usedPoints)} fill="none" stroke="#1a73e8" strokeWidth="2" />
        {usedPoints.map((p, i) => (i % 2 === 0 ? <circle key={i} cx={p.x} cy={p.y} r="2.5" fill="#1a73e8" /> : null))}
        <path d={buildChartPath(predictedPoints)} fill="none" stroke="#d93025" strokeWidth="2" strokeDasharray="6,4" />
        <line x1={lifeX} y1={line80y} x2={lifeX} y2={lifeY} stroke="#d93025" strokeDasharray="4,4" />
        <circle cx={lifeX} cy={lifeY} r="5" fill="#d93025" />
        <text x={lifeX + 10} y={lifeY + 3} fill="#d93025" fontSize="11" fontWeight="700">{life}</text>
      </svg>
      <div className="ask-msg-chart-legend">
        <span className="ask-msg-legend-item" style={{ color: '#1a73e8' }}>Uploaded (Used)</span>
        <span className="ask-msg-legend-item" style={{ color: '#d93025' }}>Predicted</span>
      </div>
    </div>
  )
}

function extractToolPrefix(text) {
  const m = (text ?? '').match(/^\[([^\]]+)\]\s*/u)
  if (!m) return null
  const tool = m[1]
  return TOOL_OPTIONS.includes(tool) ? tool : null
}

function stripAnyToolPrefix(text) {
  return (text ?? '').replace(/^\[[^\]]+\]\s*/u, '')
}

function applyToolPrefix(text, tool) {
  if (!tool) return stripAnyToolPrefix(text)
  return `[${tool}] ${stripAnyToolPrefix(text)}`
}

function renderOverlayParts(text) {
  const raw = text ?? ''
  const m = raw.match(/^\[([^\]]+)\]\s*/u)
  if (!m) return { prefix: null, rest: raw }
  const prefix = m[0]
  const rest = raw.slice(prefix.length)
  return { prefix, rest }
}

const EC_MOLECULE = {
  name: 'EC',
  smiles: 'O=C1OCCO1',
  status: 'Published',
  propertySuitability: '8.28/10',
  molWeight: '88.0620 g/mol',
  meltingPoint: '36.6361',
  boilingPoint: '247.4271',
  flashPoint: '153.9163',
  combEnthalpy: '-14.8637 eV',
  homo: '-8.2230 eV',
  lumo: '0.6285 eV',
  espMin: '-1.5407 eV',
  espMax: '1.5638 eV',
  commercial: 'Commercially available',
  desc: 'EC (ethylene carbonate) is a cyclic organic carbonate commonly used as a high-permittivity solvent in Li‑ion battery electrolytes. It helps to form a stable SEI on graphite anodes and improves low‑temperature performance when blended with linear carbonates.',
  favPayload: {
    smiles: 'O=C1OCCO1',
    molWeight: 88.062,
    homo: -8.223,
    lumo: 0.6285,
    combEnthalpy: -14.8637,
    commercial: 'Commercially available',
    espMin: -1.5407,
    espMax: 1.5638,
    funcGroups: ['Carbonate', 'Cyclic'],
    umapX: 0,
    umapY: 0,
    addedDate: ''
  }
}

const SIMILAR_MOLECULES = [
  {
    name: 'PC',
    smiles: 'O=C1CCC(O1)O',
    status: 'Published',
    propertySuitability: '7.85/10',
    molWeight: '102.09 g/mol',
    meltingPoint: '-48.8',
    boilingPoint: '242.0',
    flashPoint: '132.0',
    combEnthalpy: '-13.2 eV',
    homo: '-7.9 eV',
    lumo: '0.52 eV',
    espMin: '-1.2 eV',
    espMax: '1.4 eV',
    commercial: 'Commercially available',
    desc: 'Propylene carbonate (PC), a cyclic carbonate similar to EC, used in electrolytes; often avoided in graphite anodes due to co-intercalation.',
    favPayload: { smiles: 'O=C1CCC(O1)O', molWeight: 102.09, homo: -7.9, lumo: 0.52, combEnthalpy: -13.2, commercial: 'Commercially available', espMin: -1.2, espMax: 1.4, funcGroups: ['Carbonate', 'Cyclic'], umapX: 0.3, umapY: 0.1, addedDate: '' }
  },
  {
    name: 'DMC',
    smiles: 'COC(=O)OC',
    status: 'Published',
    propertySuitability: '8.10/10',
    molWeight: '90.08 g/mol',
    meltingPoint: '4.6',
    boilingPoint: '90.0',
    flashPoint: '18.0',
    combEnthalpy: '-12.8 eV',
    homo: '-8.0 eV',
    lumo: '0.61 eV',
    espMin: '-1.35 eV',
    espMax: '1.48 eV',
    commercial: 'Commercially available',
    desc: 'Dimethyl carbonate (DMC), a linear carbonate, commonly blended with EC to lower viscosity and improve rate capability.',
    favPayload: { smiles: 'COC(=O)OC', molWeight: 90.08, homo: -8.0, lumo: 0.61, combEnthalpy: -12.8, commercial: 'Commercially available', espMin: -1.35, espMax: 1.48, funcGroups: ['Carbonate', 'Linear'], umapX: -0.2, umapY: 0.4, addedDate: '' }
  },
  {
    name: 'EMC',
    smiles: 'CCOC(=O)OC',
    status: 'Published',
    propertySuitability: '7.95/10',
    molWeight: '104.10 g/mol',
    meltingPoint: '-53',
    boilingPoint: '110.0',
    flashPoint: '25.0',
    combEnthalpy: '-13.0 eV',
    homo: '-7.85 eV',
    lumo: '0.58 eV',
    espMin: '-1.28 eV',
    espMax: '1.45 eV',
    commercial: 'Commercially available',
    desc: 'Ethyl methyl carbonate (EMC), a linear carbonate, widely used with EC in commercial Li-ion electrolytes for balanced viscosity and stability.',
    favPayload: { smiles: 'CCOC(=O)OC', molWeight: 104.10, homo: -7.85, lumo: 0.58, combEnthalpy: -13.0, commercial: 'Commercially available', espMin: -1.28, espMax: 1.45, funcGroups: ['Carbonate', 'Linear'], umapX: 0.1, umapY: 0.2, addedDate: '' }
  }
]

function MoleculeCardBlock({ mol, onAddFavorite, showFindSimilar, onFindSimilar }) {
  const payload = { ...mol.favPayload, addedDate: new Date().toLocaleString('en-US', { month: 'short', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) }
  return (
    <div className="ask-molecule-card">
      <div className="ask-mol-left">
        <div className="ask-mol-structure">{mol.name}</div>
      </div>
      <div className="ask-mol-main">
        <div className="ask-mol-row ask-mol-smiles">
          <span className="ask-mol-label">SMILES</span>
          <span className="ask-mol-value">{mol.smiles}</span>
        </div>
        <div className="ask-mol-row">
          <span className="ask-mol-label">Status</span>
          <span className="ask-mol-status">{mol.status}</span>
        </div>
        <div className="ask-mol-row">
          <span className="ask-mol-label">Property Suitability</span>
          <span className="ask-mol-score">{mol.propertySuitability}</span>
        </div>
        <div className="ask-mol-grid">
          <div className="ask-mol-grid-item">
            <div className="ask-mol-k">Molecular Weight</div>
            <div className="ask-mol-v">{mol.molWeight}</div>
          </div>
          <div className="ask-mol-grid-item">
            <div className="ask-mol-k">Predicted Melting Point</div>
            <div className="ask-mol-v">{mol.meltingPoint} ℃</div>
          </div>
          <div className="ask-mol-grid-item">
            <div className="ask-mol-k">Predicted Boiling Point</div>
            <div className="ask-mol-v">{mol.boilingPoint} ℃</div>
          </div>
          <div className="ask-mol-grid-item">
            <div className="ask-mol-k">Predicted Flash Point</div>
            <div className="ask-mol-v">{mol.flashPoint} ℃</div>
          </div>
          <div className="ask-mol-grid-item">
            <div className="ask-mol-k">Combustion Enthalpy</div>
            <div className="ask-mol-v">{mol.combEnthalpy}</div>
          </div>
          <div className="ask-mol-grid-item">
            <div className="ask-mol-k">HOMO</div>
            <div className="ask-mol-v">{mol.homo}</div>
          </div>
          <div className="ask-mol-grid-item">
            <div className="ask-mol-k">LUMO</div>
            <div className="ask-mol-v">{mol.lumo}</div>
          </div>
          <div className="ask-mol-grid-item">
            <div className="ask-mol-k">ESP Min</div>
            <div className="ask-mol-v">{mol.espMin}</div>
          </div>
          <div className="ask-mol-grid-item">
            <div className="ask-mol-k">ESP Max</div>
            <div className="ask-mol-v">{mol.espMax}</div>
          </div>
          <div className="ask-mol-grid-item">
            <div className="ask-mol-k">Commercial Viability</div>
            <div className="ask-mol-v">{mol.commercial}</div>
          </div>
        </div>
        <p className="ask-mol-desc">{mol.desc}</p>
      </div>
      <button type="button" className="ask-mol-fav-btn" onClick={() => onAddFavorite(payload)}>
        ADD TO FAVORITES
      </button>
      {showFindSimilar && (
        <button type="button" className="ask-mol-find-similar-btn" onClick={onFindSimilar}>
          Find similar
        </button>
      )}
    </div>
  )
}

export default function Ask() {
  const navigate = useNavigate()
  const { addTask } = useTasks()
  const { addFavorite } = useFavorites()
  const {
    conversations,
    setConversations,
    currentId,
    setCurrentId,
    updateConversation,
    createNewConversation,
    initialMessages
  } = useAskConversations()
  const [input, setInput] = useState('')
  const [isToolsOpen, setIsToolsOpen] = useState(false)
  const [selectedTool, setSelectedTool] = useState(null)
  const [isTyping, setIsTyping] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editTitle, setEditTitle] = useState('')
  const messagesEndRef = useRef(null)
  const uploadInputRef = useRef(null)
  const overlayRef = useRef(null)
  const textareaRef = useRef(null)
  const renameInputRef = useRef(null)

  const current = conversations.find(c => c.id === currentId) || conversations[0]
  const messages = current?.messages ?? initialMessages
  const hasUserMessage = messages.some((m) => m.role === 'user')
  const showWelcomeState = !hasUserMessage

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const hasMountedRef = useRef(false)
  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true
      return
    }
    scrollToBottom()
  }, [messages, currentId])

  const handleNewConversation = () => {
    const newConv = createNewConversation()
    setConversations(prev => [newConv, ...prev])
    setCurrentId(newConv.id)
  }

  const handleSelectConversation = (id) => {
    setEditingId(null)
    setCurrentId(id)
  }

  const handleDeleteConversation = (e, id) => {
    e.stopPropagation()
    const next = conversations.filter((c) => c.id !== id)
    if (next.length === 0) {
      const newConv = createNewConversation()
      setConversations([newConv])
      setCurrentId(newConv.id)
    } else {
      setConversations(next)
      if (currentId === id) {
        const idx = conversations.findIndex((c) => c.id === id)
        const nextIdx = idx >= next.length ? next.length - 1 : idx
        setCurrentId(next[nextIdx].id)
      }
    }
    setEditingId(null)
  }

  const handleStartRename = (e, conv) => {
    e.stopPropagation()
    setEditingId(conv.id)
    setEditTitle(conv.title)
    setTimeout(() => renameInputRef.current?.focus(), 0)
  }

  const handleRenameSubmit = (id) => {
    const trimmed = editTitle.trim()
    if (trimmed) {
      updateConversation(id, (c) => ({ ...c, title: trimmed }))
    }
    setEditingId(null)
    setEditTitle('')
  }

  const isLifePredictionQuestion = (text) => {
    const t = text.toLowerCase()
    return t.includes('life prediction') || t.includes('battery life') || text.includes('电池寿命')
  }

  const appendAssistantMessage = (msg) => {
    updateConversation(currentId, c => ({
      ...c,
      messages: [...c.messages, msg]
    }))
  }

  const updateLastAssistantMessage = (updater) => {
    updateConversation(currentId, c => {
      const msgs = [...c.messages]
      const lastIdx = msgs.length - 1
      if (lastIdx >= 0 && msgs[lastIdx].role === 'assistant') {
        msgs[lastIdx] = updater(msgs[lastIdx])
      }
      return { ...c, messages: msgs }
    })
  }

  const parseCsvPreview = (text, maxRows = 5) => {
    const lines = text.trim().split(/\r?\n/).filter(Boolean)
    if (lines.length === 0) return { columns: [], rows: [] }
    const columns = lines[0].split(',').map(c => c.trim())
    const rows = lines.slice(1, 1 + maxRows).map(line =>
      line.split(',').map(c => c.trim())
    )
    return { columns, rows }
  }

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''

    const userMsg = {
      id: Date.now(),
      role: 'user',
      content: `Uploaded: ${file.name}`
    }
    const parsingMsg = {
      id: Date.now() + 1,
      role: 'assistant',
      content: null,
      block: 'parsingFile'
    }
    updateConversation(currentId, c => ({
      ...c,
      messages: [...c.messages, userMsg, parsingMsg]
    }))

    const reader = new FileReader()
    reader.onload = () => {
      const text = reader.result
      const { columns, rows } = parseCsvPreview(text)
      setTimeout(() => {
        updateLastAssistantMessage(() => ({
          id: Date.now() + 1,
          role: 'assistant',
          content: null,
          block: 'uploadPreview',
          fileName: file.name,
          columns: columns.length ? columns : ['barcode', 'cycle_id', 'current (A)', 'voltage (V)', 'time (s)'],
          previewRows: rows.length ? rows : [
            ['BAT001', '1', '0.5', '3.7', '0'],
            ['BAT001', '1', '-0.5', '3.2', '3600'],
            ['BAT001', '2', '0.5', '3.7', '3600'],
            ['BAT001', '2', '-0.5', '3.15', '7200'],
            ['BAT001', '3', '0.5', '3.68', '7200']
          ]
        }))
      }, 1800)
    }
    reader.readAsText(file, 'UTF-8')
  }

  const createPredictionTask = (fileName) => {
    const id = `PR-${String(Date.now()).slice(-3)}`
    const now = new Date()
    const predictionTime = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`
    addTask({
      id,
      type: 'prediction',
      tool: 'Life Prediction',
      title: `Prediction ${id}`,
      fileName: fileName || 'data.csv',
      predictionTime,
      batteryCount: 1,
      barcode: 'demo',
      cycleLife: 3114,
      status: 'done'
    })
    return id
  }

  const appendPredictionResult = (convId, taskId) => {
    const resultMsg = {
      id: Date.now(),
      role: 'assistant',
      content: null,
      block: 'predictionResult',
      taskId,
      barcode: 'demo',
      cycleLife: 3114
    }
    updateConversation(convId, c => ({
      ...c,
      messages: [...c.messages, resultMsg]
    }))
  }

  const handleCycleSelect = (cycles) => {
    const conv = conversations.find(c => c.id === currentId) || conversations[0]
    const lastPreview = [...conv.messages].reverse().find(m => m.block === 'uploadPreview')
    const fileName = lastPreview?.fileName
    const taskId = createPredictionTask(fileName)
    const convId = currentId

    const userMsg = { id: Date.now(), role: 'user', content: String(cycles) }
    const assistantMsg = {
      id: Date.now() + 1,
      role: 'assistant',
      content: `Using ${cycles} cycles for inference. Starting prediction...`,
      block: null
    }
    updateConversation(currentId, c => ({
      ...c,
      messages: [...c.messages, userMsg, assistantMsg]
    }))

    setTimeout(() => appendPredictionResult(convId, taskId), 5000)
  }

  const isCycleCountReply = (text, messages) => {
    const n = parseInt(text.trim(), 10)
    if (Number.isNaN(n) || n < 1) return false
    const lastAssistant = [...messages].reverse().find(m => m.role === 'assistant')
    return lastAssistant?.block === 'uploadPreview'
  }

  const handleLifePredictionDemo = () => {
    const msg = {
      id: Date.now(),
      role: 'assistant',
      content: null,
      block: 'lifePrediction',
      action: 'newPrediction'
    }
    appendAssistantMessage(msg)
  }

  const handleNewPredictionInfo = () => {
    const userMsg = {
      id: Date.now(),
      role: 'user',
      content: 'New Life Prediction'
    }
    const assistantMsg = {
      id: Date.now() + 1,
      role: 'assistant',
      content: null,
      block: 'uploadFormat',
      uploadTip: 'You can upload the file directly in this chat using the Upload button next to Run.'
    }
    updateConversation(currentId, c => ({
      ...c,
      messages: [...c.messages, userMsg, assistantMsg]
    }))
  }

  const isEcQuestion = (text) => {
    const t = text.trim().toLowerCase()
    return t === 'ec是什么' || t === 'ec是什麼' || t === 'ec' || t.includes('what is ec')
  }

  const handleEcDemo = () => {
    const msg = {
      id: Date.now(),
      role: 'assistant',
      content: null,
      block: 'moleculeEc'
    }
    appendAssistantMessage(msg)
  }

  const handleViewMoleculeCard = () => {
    const userMsg = { id: Date.now(), role: 'user', content: '查看分子卡片' }
    const assistantMsg = {
      id: Date.now() + 1,
      role: 'assistant',
      content: null,
      block: 'moleculeEcCard'
    }
    updateConversation(currentId, c => ({
      ...c,
      messages: [...c.messages, userMsg, assistantMsg]
    }))
  }

  const handleFindSimilar = () => {
    const userMsg = { id: Date.now(), role: 'user', content: 'find similar' }
    const assistantMsg = {
      id: Date.now() + 1,
      role: 'assistant',
      content: null,
      block: 'similarMolecules'
    }
    updateConversation(currentId, c => ({
      ...c,
      messages: [...c.messages, userMsg, assistantMsg]
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!input.trim() || isTyping) return

    const userContent = input.trim()
    const conv = conversations.find(c => c.id === currentId) || conversations[0]
    const isFirstUserMessage = conv.messages.every(m => m.role !== 'user')

    if (isCycleCountReply(userContent, conv.messages)) {
      const cycles = parseInt(userContent, 10)
      const lastPreview = [...conv.messages].reverse().find(m => m.block === 'uploadPreview')
      const taskId = createPredictionTask(lastPreview?.fileName)
      const convId = currentId

      const userMessage = { id: Date.now(), role: 'user', content: userContent }
      const assistantMsg = {
        id: Date.now() + 1,
        role: 'assistant',
        content: `Using ${cycles} cycles for inference. Starting prediction...`,
        block: null
      }
      updateConversation(currentId, c => ({
        ...c,
        title: isFirstUserMessage ? `${userContent} cycles` : c.title,
        messages: [...c.messages, userMessage, assistantMsg]
      }))
      setInput('')

      setTimeout(() => appendPredictionResult(convId, taskId), 5000)
      return
    }

    const userMessage = { id: Date.now(), role: 'user', content: userContent }
    updateConversation(currentId, c => ({
      ...c,
      title: isFirstUserMessage && userContent ? (userContent.slice(0, 20) + (userContent.length > 20 ? '...' : '')) : c.title,
      messages: [...c.messages, userMessage]
    }))
    setInput('')

    if (isLifePredictionQuestion(userContent)) {
      handleLifePredictionDemo()
      return
    }

    if (isEcQuestion(userContent)) {
      handleEcDemo()
      return
    }

    setIsTyping(true)

    setTimeout(() => {
      const assistantMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content:
          'I received your message. This is a demo—in production I would process your request with the appropriate tools and return relevant analysis or predictions.'
      }
      appendAssistantMessage(assistantMessage)
      setIsTyping(false)
    }, 600)
  }

  const handleWelcomePrompt = (text) => {
    setInput(text)
    setTimeout(() => textareaRef.current?.focus(), 0)
  }

  const handleWelcomeToolClick = (title) => {
    if (title === 'Recent Tasks') {
      navigate('/tasks-data')
      return
    }
    const mapping = {
      'Life Prediction': 'Life Prediction',
      Formulation: 'Formulate',
      Design: 'Electrolyte Design',
    }
    const nextTool = mapping[title]
    if (nextTool) {
      setSelectedTool(nextTool)
      setInput((prev) => applyToolPrefix(prev, nextTool))
      setTimeout(() => textareaRef.current?.focus(), 0)
    }
  }

  return (
    <div className="ask-page">
      <aside className="ask-sidebar">
        <div className="ask-sidebar-top">ASK</div>
        <button type="button" className="btn-new-chat" onClick={handleNewConversation}>
          <span className="btn-new-chat-icon">+</span>
          New Chat
        </button>
        <button type="button" className="ask-search-btn">
          <span className="ask-search-icon">⌕</span>
          Search Chat
        </button>
        <div className="ask-history">
          <div className="ask-history-label">CHAT HISTORY</div>
          <ul className="conversation-list">
            {conversations.map((conv) => (
              <li key={conv.id} className="conversation-list-item">
                <div
                  className={`conversation-item ${conv.id === currentId ? 'active' : ''}`}
                  onClick={() => handleSelectConversation(conv.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && handleSelectConversation(conv.id)}
                >
                  {editingId === conv.id ? (
                    <input
                      ref={renameInputRef}
                      type="text"
                      className="conversation-item-input"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onBlur={() => handleRenameSubmit(conv.id)}
                      onKeyDown={(e) => {
                        e.stopPropagation()
                        if (e.key === 'Enter') handleRenameSubmit(conv.id)
                        if (e.key === 'Escape') setEditingId(null)
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <span className="conversation-item-title">{conv.title}</span>
                  )}
                </div>
                <div className="conversation-item-actions">
                  <button
                    type="button"
                    className="conversation-action-btn"
                    onClick={(e) => handleStartRename(e, conv)}
                    title="Rename"
                    aria-label="Rename"
                  >
                    ✎
                  </button>
                  <button
                    type="button"
                    className="conversation-action-btn"
                    onClick={(e) => handleDeleteConversation(e, conv.id)}
                    title="Delete"
                    aria-label="Delete"
                  >
                    🗑
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <div className="ask-main">
        {!showWelcomeState && (
          <header className="ask-header">
            <h1>Ask</h1>
            <p className="ask-subtitle">Chat with AI for analysis, predictions, and workflows</p>
          </header>
        )}

        <div className="chat-container">
          {showWelcomeState ? (
            <div className="ask-welcome">
              <h2 className="ask-welcome-title">Welcome to MU.</h2>
              <p className="ask-welcome-subtitle">Start building with tools</p>
              <div className="ask-welcome-tools-grid">
                {WELCOME_TOOL_CARDS.map((card) => (
                  <button
                    key={card.title}
                    type="button"
                    className="ask-welcome-tool-card"
                    onClick={() => handleWelcomeToolClick(card.title)}
                  >
                    <div className="ask-welcome-tool-title">{card.title}</div>
                    <div className="ask-welcome-tool-desc">{card.desc}</div>
                  </button>
                ))}
              </div>
              <p className="ask-welcome-subtitle ask-welcome-questions-title">Or simply describe your research goal here.</p>
              <div className="ask-welcome-prompts">
                {WELCOME_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    className="ask-welcome-prompt-chip"
                    onClick={() => handleWelcomePrompt(prompt)}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="messages">
              {messages.map((msg) => (
                <div key={msg.id} className={`message message-${msg.role}`}>
                  <div className="message-avatar">
                    {msg.role === 'user' ? 'U' : '◆'}
                  </div>
                  <div className="message-content">
                  {msg.block === 'lifePrediction' && (
                    <>
                      <h4 className="ask-msg-heading">Common approaches</h4>
                      <ul className="ask-msg-list">
                        <li>Fit empirical cycle fade curves (e.g., capacity vs. cycle count).</li>
                        <li>Use features from full charge/discharge curves (voltage, current, time) to train regression models.</li>
                        <li>Apply physics-informed or degradation‑mode models when you have richer testing data.</li>
                      </ul>
                      <p className="ask-msg-para">
                        Inside MU, you can also use the built‑in <strong>Life Prediction</strong> tool in Workbench. It takes your cycling CSV data, extracts features automatically, and returns remaining‑life estimates plus confidence intervals.
                      </p>
                      <button
                        type="button"
                        className="inline-action-btn"
                        onClick={handleNewPredictionInfo}
                      >
                        New Prediction
                      </button>
                    </>
                  )}
                  {msg.block === 'uploadFormat' && (
                    <>
                      <div className="ask-format-card">
                        <div className="ask-format-title">CSV Data Format Requirements</div>
                        <div className="ask-format-body">
                          <div className="ask-format-row">
                            <span className="ask-format-key">Required Fields:</span> barcode, cycle_id, current (A), voltage (V), time (s)
                          </div>
                          <div className="ask-format-row">
                            <span className="ask-format-key">Current Direction:</span> + for charging, − for discharging
                          </div>
                          <div className="ask-format-row">
                            <span className="ask-format-key">Unit Requirements:</span> Current in A, Voltage in V, Time in s
                          </div>
                          <div className="ask-format-row">
                            <span className="ask-format-key">Data Requirements:</span> Upload data ≥100 cycles, data must be sorted by time
                          </div>
                        </div>
                      </div>
                      <p className="ask-upload-tip">{msg.uploadTip}</p>
                      <button
                        type="button"
                        className="inline-action-btn"
                        onClick={() => uploadInputRef.current?.click()}
                        disabled={isTyping}
                      >
                        Upload data
                      </button>
                    </>
                  )}
                  {msg.block === 'parsingFile' && (
                    <div className="ask-parsing">
                      <span className="ask-parsing-spinner" />
                      <span className="ask-parsing-text">Parsing file...</span>
                    </div>
                  )}
                  {msg.block === 'uploadPreview' && (
                    <>
                      <p className="ask-preview-intro">Preview (first 5 rows). Please confirm if the data looks correct.</p>
                      <div className="ask-preview-table-wrap">
                        <table className="ask-preview-table">
                          <thead>
                            <tr>
                              {(msg.columns || []).map((col, i) => (
                                <th key={i}>{col}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {(msg.previewRows || []).map((row, i) => (
                              <tr key={i}>
                                {(msg.columns || []).map((_, j) => (
                                  <td key={j}>{row[j] ?? '—'}</td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <p className="ask-cycles-intro">How many cycles to use for inference?</p>
                      <div className="ask-cycles-actions">
                        {[100, 200, 300].map((n) => (
                          <button
                            key={n}
                            type="button"
                            className="inline-action-btn ask-cycle-btn"
                            onClick={() => handleCycleSelect(n)}
                          >
                            {n}
                          </button>
                        ))}
                      </div>
                      <p className="ask-cycles-hint">Or type a cycle number in the input and send.</p>
                    </>
                  )}
                  {msg.block === 'predictionResult' && (
                    <>
                      <p className="ask-msg-para">Prediction complete.</p>
                      <div className="ask-preview-table-wrap">
                        <table className="ask-preview-table">
                          <thead>
                            <tr>
                              <th>Barcode</th>
                              <th>Cycle Life</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td>{msg.barcode}</td>
                              <td>{msg.cycleLife}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      <PredictionChartInline cycleLife={msg.cycleLife} />
                      <div className="ask-result-actions">
                        <button
                          type="button"
                          className="inline-action-btn"
                          onClick={() => navigate(`/tasks-data/task/${msg.taskId}`)}
                        >
                          View in Assets
                        </button>
                        <button
                          type="button"
                          className="inline-action-btn"
                          onClick={() => navigate('/features-workflows?highlight=new-life-prediction')}
                        >
                          Add Life Prediction to Workbench
                        </button>
                        <button
                          type="button"
                          className="inline-action-btn"
                          onClick={() => uploadInputRef.current?.click()}
                          disabled={isTyping}
                        >
                          Continue prediction
                        </button>
                      </div>
                    </>
                  )}
                  {msg.block === 'moleculeEc' && (
                    <>
                      <p className="ask-msg-para">
                        EC (ethylene carbonate) is a cyclic organic carbonate widely used as a high‑dielectric constant solvent in Li‑ion
                        battery electrolytes. It helps form a robust SEI on graphite anodes, improves low‑temperature performance, and is
                        usually blended with linear carbonates such as EMC or DMC to tune viscosity and conductivity.
                      </p>
                      <button
                        type="button"
                        className="inline-action-btn"
                        onClick={handleViewMoleculeCard}
                      >
                        查看分子卡片
                      </button>
                    </>
                  )}
                  {msg.block === 'moleculeEcCard' && (
                    <MoleculeCardBlock
                      mol={EC_MOLECULE}
                      onAddFavorite={addFavorite}
                      showFindSimilar
                      onFindSimilar={handleFindSimilar}
                    />
                  )}
                  {msg.block === 'similarMolecules' && (
                    <>
                      <p className="ask-msg-para">Here are some molecules similar to EC (cyclic/linear carbonates commonly used in electrolytes):</p>
                      <div className="ask-similar-cards">
                        {SIMILAR_MOLECULES.map((mol) => (
                          <MoleculeCardBlock
                            key={mol.name}
                            mol={mol}
                            onAddFavorite={addFavorite}
                            showFindSimilar={false}
                          />
                        ))}
                      </div>
                    </>
                  )}
                  {!msg.block && msg.content != null && (
                    <>
                      {msg.content.split('\n').map((line, idx) => (
                        <p key={idx}>{line}</p>
                      ))}
                      {msg.action === 'newPrediction' && (
                        <button
                          type="button"
                          className="inline-action-btn"
                          onClick={handleNewPredictionInfo}
                        >
                          New Prediction
                        </button>
                      )}
                    </>
                  )}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="message message-assistant">
                  <div className="message-avatar">◆</div>
                  <div className="message-content typing">
                    <span className="dot"></span>
                    <span className="dot"></span>
                    <span className="dot"></span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}

          <form className="chat-input-area" onSubmit={handleSubmit}>
            <div className="composer">
              <div ref={overlayRef} className="composer-overlay" aria-hidden="true">
                {(() => {
                  const { prefix, rest } = renderOverlayParts(input)
                  return (
                    <>
                      {prefix ? <span className="tool-prefix-inline">{prefix}</span> : null}
                      <span>{rest || ' '}</span>
                    </>
                  )
                })()}
              </div>
              <textarea
                ref={textareaRef}
                className="composer-textarea"
                value={input}
                onChange={(e) => {
                  const next = e.target.value
                  setInput(next)
                  setSelectedTool(extractToolPrefix(next))
                }}
                onFocus={() => setIsToolsOpen(false)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSubmit(e)
                  }
                  if (e.key === 'Escape') setIsToolsOpen(false)
                }}
                onScroll={(e) => {
                  if (!overlayRef.current) return
                  overlayRef.current.scrollTop = e.currentTarget.scrollTop
                }}
                placeholder="Start typing a prompt, use option + enter to append"
                rows={2}
                disabled={isTyping}
              />

              <div className="composer-toolbar">
                <div className="composer-left">
                  <button type="button" className="icon-btn" aria-label="Voice" title="Voice" disabled={isTyping}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 1a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                      <path d="M19 10v1a7 7 0 0 1-14 0v-1" />
                      <path d="M12 19v4" />
                      <path d="M8 23h8" />
                    </svg>
                    <span className="sr-only">Voice</span>
                  </button>

                  <div className="tools-wrap">
                    <button
                      type="button"
                      className={`tools-btn ${isToolsOpen ? 'open' : ''}`}
                      onClick={() => setIsToolsOpen(v => !v)}
                      aria-haspopup="menu"
                      aria-expanded={isToolsOpen}
                    >
                      <span className="tools-icon">⬢</span>
                      Tools
                    </button>

                    {isToolsOpen ? (
                      <div className="tools-menu" role="menu">
                        <div className="tools-menu-top">
                          <button
                            type="button"
                            className="tools-tune-btn"
                            title="Tools documentation"
                            onClick={() => {
                              setIsToolsOpen(false)
                              navigate('/tools')
                            }}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M12 1v22" />
                              <path d="M5 6h14" />
                              <path d="M7 6v6" />
                              <path d="M17 18v-6" />
                              <path d="M5 18h14" />
                            </svg>
                            Adjust
                          </button>
                          <div className="tools-desc">Pick a tool to run specialized battery & electrochemistry workflows.</div>
                        </div>
                        {TOOL_OPTIONS.map((t) => (
                          <button
                            key={t}
                            type="button"
                            className={`tools-menu-item ${selectedTool === t ? 'active' : ''}`}
                            role="menuitem"
                            onClick={() => {
                              setSelectedTool(t)
                              setInput((prev) => applyToolPrefix(prev, t))
                              setIsToolsOpen(false)
                            }}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="composer-right">
                  <input
                    ref={uploadInputRef}
                    type="file"
                    accept=".csv"
                    className="composer-file-input"
                    onChange={handleFileUpload}
                  />
                  <button
                    type="button"
                    className="icon-btn"
                    aria-label="Upload data"
                    onClick={() => uploadInputRef.current?.click()}
                    disabled={isTyping}
                    title="Upload data"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 5v14" />
                      <path d="M5 12h14" />
                    </svg>
                  </button>

                  <button
                    type="submit"
                    className="send-btn"
                    disabled={!input.trim() || isTyping}
                    aria-label="Run"
                    title="Run"
                  >
                    Run
                    <span className="send-kbd">⌘⏎</span>
                  </button>
                </div>
              </div>
            </div>
            <p className="input-hint">MU can make mistakes. Check important info.</p>
          </form>
        </div>
      </div>
    </div>
  )
}
