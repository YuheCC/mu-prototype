import { useState, useRef, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { marked } from 'marked'
import { useTasks } from '../context/TasksContext'
import { useFavorites } from '../context/FavoritesContext'
import { useAskConversations } from '../context/AskContext'
import { useUserDemo } from '../context/UserDemoContext'
import { useOnboardingTour, TOUR_STEP } from '../context/OnboardingTourContext'
import { getPersonalizedWelcome } from '../lib/welcomePersonalization'
import LiteratureRunBlock from './AskLiteratureRun'
import './Ask.css'

const TOOL_OPTIONS = ['Formulate', 'Life Prediction', 'Electrolyte Design', 'Electrode Design']

// Inline chart for prediction result (Capacity Retention % vs Cycle ID)
const CHART_W = 480
const CHART_H = 220
const CHART_PAD = { left: 44, right: 20, top: 12, bottom: 32 }
const X_MIN = 0
const X_MAX = 3500
const Y_MIN = 75
const Y_MAX = 105
marked.setOptions({ gfm: true, breaks: true })

function buildLiteraturePipelineDefs(formData) {
  const span = formData?.timeSpan || '近5年'
  const focus = formData?.focus || '材料工艺'
  const focusAlgo = focus === '算法实现'
  return [
    {
      headline:
        '🔍 Corpus alignment · 15 peer-reviewed sources indexed (ArXiv, ScienceDirect, CrossRef, MU knowledge index)...',
      detail: `Query lattice: (sulfide SSE OR argyrodite OR LGPS-class) AND (interfacial degradation OR chemo-mechanical coupling) AND (cycle life OR capacity retention).
• Synonym expansion + MeSH-style bridges; non-English SI appendices machine-translated for abstract-only hits.
• De-duplication: 3 DOI merges; 2 arXiv → journal VO R upgrades applied.
• Inclusion: studies with ≥3 full cells or symmetric-cell EIS with raw curves; pure DFT-only works excluded unless validating a cited cell paper.
• Temporal prior: evidence reweighted toward publications overlapping your window (${span}).`,
    },
    {
      headline:
        '🧠 Mechanism graph · interfacial transport + stress fields encoded as a synthesis-ready feature tensor...',
      detail: `Features: effective σ interface, migration-barrier ratio ΔE, grain-boundary wetting proxies, stack-pressure sensitivity slopes.
• Conflict resolution: two labs disagreed on Li-metal anode pairing — flagged in the tension map with protocol metadata.
• Graph export: mu.interface_profile@v2 (JSON-LD) with per-field provenance hashes.
• ${focusAlgo ? 'Branch bias: graph topology normalized for R-GCN ingestion in the code-extraction step.' : 'Branch bias: coating / particle-size descriptors emphasized for process read-across.'}`,
    },
    ...(formData?.needCode
      ? [
          {
            headline:
              '💻 Architecture extraction · heterogeneous graph conv + temporal confidence head (Python pseudo, audit trail)...',
            detail: `Encoder stack: 4× relational graph conv over grain / coating / void nodes; relational edges: ionic contact, crack-opening kinematics, blocked pathways.
• Objective: 0.55 Huber(cycles) + 0.25 physics slack on Arrhenius-consistent Ea bands + 0.20 calibration on held-out chemistries.
• Validation: 5-fold chemistry holdout; isotonic calibration on val tail for upper confidence stability.
• Determinism: seed=42 and MU-Life template checksum logged for the Methods appendix.`,
          },
        ]
      : []),
    {
      headline:
        '✍️ Report synthesis · executive narrative + quant matrix + cross-study tension mapping (MU Assets citations)...',
      detail: `Document spine: Executive summary → Retrieval & scope → Quantitative evidence → Synthesis & disagreements → R&D implications → Limitations → References.
• Citation policy: numeric [1…n]; bracketed intervals whenever extrapolating beyond reported cycle counts.
• QA: every numeric claim grounded to normalized spans; contradictory pairs annotated before publishing to workspace.
• User parameters honored: span=${span}; focus=${focus}; code appendix=${formData?.needCode ? 'on' : 'off'}.`,
    },
  ]
}

function streamLiteratureStep(convId, msgId, stepDef, stepIndex, updateMessageById) {
  const full = stepDef.headline
  const detail = stepDef.detail
  return new Promise((resolve) => {
    updateMessageById(convId, msgId, (m) => ({
      ...m,
      literatureSteps: [
        ...(m.literatureSteps || []),
        { headline: '', detail, streaming: true, expanded: false },
      ],
      content: '',
    }))
    let c = 0
    const stepMs = 11
    const tick = () => {
      c += 1
      if (c > full.length) {
        updateMessageById(convId, msgId, (m) => {
          const literatureSteps = [...(m.literatureSteps || [])]
          literatureSteps[stepIndex] = {
            ...literatureSteps[stepIndex],
            headline: full,
            streaming: false,
          }
          return { ...m, literatureSteps, content: full }
        })
        resolve()
        return
      }
      updateMessageById(convId, msgId, (m) => {
        const literatureSteps = [...(m.literatureSteps || [])]
        literatureSteps[stepIndex] = {
          ...literatureSteps[stepIndex],
          headline: full.slice(0, c),
          streaming: c < full.length,
        }
        return {
          ...m,
          literatureSteps,
          content: full.slice(0, c),
        }
      })
      setTimeout(tick, stepMs)
    }
    setTimeout(tick, stepMs)
  })
}

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

function buildRetentionCurve(cycleLife, xScale, yScale) {
  const life = Number(cycleLife) || 3000
  const startY = 99.5
  const endY = 80
  const denom = Math.max(life - 200, 400)
  const points = []
  for (let i = 0; i <= life; i += 120) {
    const x = i
    const ratio = Math.min(Math.max((i - 200) / denom, 0), 1)
    const y = startY - (startY - endY) * Math.pow(ratio, 1.1)
    points.push({ x: xScale(x), y: yScale(y) })
  }
  return points
}

function PredictionCompareChartInline({ left, right }) {
  const leftLife = Number(left?.cycleLife) || 2860
  const rightLife = Number(right?.cycleLife) || 3240
  const innerW = CHART_W - CHART_PAD.left - CHART_PAD.right
  const innerH = CHART_H - CHART_PAD.top - CHART_PAD.bottom
  const xScale = (v) => CHART_PAD.left + (v / X_MAX) * innerW
  const yScale = (v) => CHART_PAD.top + innerH - ((v - Y_MIN) / (Y_MAX - Y_MIN)) * innerH
  const leftCurve = buildRetentionCurve(leftLife, xScale, yScale)
  const rightCurve = buildRetentionCurve(rightLife, xScale, yScale)

  return (
    <div className="ask-msg-chart-wrap ask-compare-chart-wrap">
      <svg className="ask-msg-chart" viewBox={`0 0 ${CHART_W} ${CHART_H}`}>
        <text x={CHART_W / 2} y={CHART_H - 4} className="ask-msg-chart-axis" textAnchor="middle">Cycle ID</text>
        <text x={12} y={CHART_H / 2} className="ask-msg-chart-axis" textAnchor="middle" transform={`rotate(-90, 12, ${CHART_H / 2})`}>Capacity Retention(%)</text>
        {[0, 500, 1000, 1500, 2000, 2500, 3000, 3500].map((v) => (
          <line key={v} x1={xScale(v)} y1={CHART_PAD.top} x2={xScale(v)} y2={CHART_PAD.top + innerH} stroke="var(--border-light)" strokeDasharray="2,2" />
        ))}
        {[75, 80, 85, 90, 95, 100, 105].map((v) => (
          <line key={v} x1={CHART_PAD.left} y1={yScale(v)} x2={CHART_PAD.left + innerW} y2={yScale(v)} stroke={v === 80 ? '#d93025' : 'var(--border-light)'} strokeDasharray={v === 80 ? '4,4' : '2,2'} />
        ))}

        <path d={buildChartPath(leftCurve)} fill="none" stroke="#f2994a" strokeWidth="2" />
        <path d={buildChartPath(rightCurve)} fill="none" stroke="#56b26a" strokeWidth="2" />
      </svg>
      <div className="ask-msg-chart-legend">
        <span className="ask-msg-legend-item" style={{ color: '#f2994a' }}>{left?.barcode || 'demo(1)'}</span>
        <span className="ask-msg-legend-item" style={{ color: '#56b26a' }}>{right?.barcode || 'demo(2)'}</span>
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

const MOLECULE_INDEX = (() => {
  const dec = {
    name: 'DEC',
    smiles: 'CCOC(=O)OCC',
    status: 'Published',
    propertySuitability: '7.70/10',
    molWeight: '118.13 g/mol',
    meltingPoint: '-43',
    boilingPoint: '126.0',
    flashPoint: '31.0',
    combEnthalpy: '-13.1 eV',
    homo: '-7.9 eV',
    lumo: '0.56 eV',
    espMin: '-1.25 eV',
    espMax: '1.41 eV',
    commercial: 'Commercially available',
    desc: 'Diethyl carbonate (DEC) is a linear carbonate solvent often blended with EC to reduce viscosity and tune low-temperature transport.',
    favPayload: { smiles: 'CCOC(=O)OCC', molWeight: 118.13, homo: -7.9, lumo: 0.56, combEnthalpy: -13.1, commercial: 'Commercially available', espMin: -1.25, espMax: 1.41, funcGroups: ['Carbonate', 'Linear'], umapX: 0.15, umapY: 0.28, addedDate: '' }
  }
  const fec = {
    name: 'FEC',
    smiles: 'O=C1OCC(F)O1',
    status: 'Published',
    propertySuitability: '8.25/10',
    molWeight: '106.05 g/mol',
    meltingPoint: '18.0',
    boilingPoint: '195.0',
    flashPoint: '85.0',
    combEnthalpy: '-14.1 eV',
    homo: '-8.6 eV',
    lumo: '0.35 eV',
    espMin: '-1.62 eV',
    espMax: '1.68 eV',
    commercial: 'Commercially available',
    desc: 'Fluoroethylene carbonate (FEC) is a common additive that improves SEI formation, especially for silicon-rich anodes, by forming more robust inorganic-rich interphases.',
    favPayload: { smiles: 'O=C1OCC(F)O1', molWeight: 106.05, homo: -8.6, lumo: 0.35, combEnthalpy: -14.1, commercial: 'Commercially available', espMin: -1.62, espMax: 1.68, funcGroups: ['Carbonate', 'Cyclic', 'Fluorinated'], umapX: 0.05, umapY: -0.12, addedDate: '' }
  }

  const base = [EC_MOLECULE, ...SIMILAR_MOLECULES, dec, fec]
  return Object.fromEntries(base.map((m) => [m.name, m]))
})()

const ELECTROLYTE_SOLVENT_DEMO_Q = '锂离子电池的电解质溶剂选择有哪些关键考虑因素？'

/** name：体系名称；remark：「-」后的卡片备注（展示时与名称分行） */
const ELECTROLYTE_DESIGN_SYSTEMS = [
  { id: 'ncm811-100si', name: 'NCM811-100% Si-C', remark: 'Carbonate electrolyte', disabled: false },
  { id: 'ncm811-12si', name: 'NCM811-12% Si-C', remark: 'Carbonate electrolyte', disabled: false },
  {
    id: 'lfp-graphite-mu3',
    name: 'LFP-Graphite',
    remark: 'Carbonate electrolyte',
    disabled: true,
  },
  {
    id: 'ncm811-li-ses-mu3',
    name: 'NCM811-Li-Metal',
    remark: 'SES proprietary electrolyte',
    disabled: true,
  },
]

function formatElectrolyteSystemLine(entry) {
  if (!entry) return ''
  return `${entry.name} - ${entry.remark}`
}

const ELECTROLYTE_DESIGN_SALTS = ['LiPF6', 'LiFSI']
const ELECTROLYTE_DESIGN_ADDITIVES = ['FEC', 'VC', 'PS', 'DTD']
const ELECTROLYTE_DESIGN_SOLVENTS = ['EC:DMC 1:1', 'EC:EMC 3:7', 'EC:EMC 1:1', 'EC:DMC:EMC 1:1:1']

function normalizeElectrolyteDesignFormula(f) {
  const common = Array.isArray(f?.commonAdditives) ? f.commonAdditives : null
  const custom = f?.customAdditive && typeof f.customAdditive === 'object' ? f.customAdditive : null
  if (common && common.length === 3 && custom) return f

  const fromLegacy = Array.isArray(f?.additives) ? f.additives : []
  const commonAdditives = [0, 1, 2].map((i) => {
    const row = fromLegacy[i]
    return { name: row?.name || '', wt: Number(row?.wt ?? 0) }
  })
  const customAdditive = { smiles: '', wt: 0 }
  return { ...(f || {}), commonAdditives, customAdditive }
}

const ELECTROLYTE_SYSTEM_SPECS = {
  'ncm811-100si': {
    cathode: 'Polycrystal NCM811, 4 mAh/cm2',
    anode: '~80% SiC with conductive agent and binder',
    benchmarkElectrolyte: 'EC/EMC/DEC/FEC (2:2:2:1) + 1M LiPF6/LiFSI',
    cellDesign: '4/5 layer pouch cell, 1.25 NP ratio, 1 Ah capacity',
  },
  'ncm811-12si': {
    cathode: 'Polycrystal NCM811, 4 mAh/cm2',
    anode: '~12% Si-C with conductive agent and binder',
    benchmarkElectrolyte: 'EC/EMC/DEC/FEC (2:2:2:1) + 1M LiPF6/LiFSI',
    cellDesign: '4/5 layer pouch cell, 1.25 NP ratio, 1 Ah capacity',
  },
  'lfp-graphite-mu3': {
    cathode: 'LFP (to be launched in MU3)',
    anode: 'Graphite',
    benchmarkElectrolyte: 'Carbonate electrolyte (to be launched in MU3)',
    cellDesign: '—',
  },
  'ncm811-li-ses-mu3': {
    cathode: 'NCM811',
    anode: 'Li Metal',
    benchmarkElectrolyte: 'SES proprietary electrolyte (to be launched in MU3)',
    cellDesign: '—',
  },
}

function createElectrolyteDesignFormula(variant) {
  if (variant === 'B') {
    return normalizeElectrolyteDesignFormula({
      salt: 'LiFSI',
      saltM: 1.2,
      solventPreset: 'EC:EMC 3:7',
      commonAdditives: [
        { name: 'VC', wt: 1.0 },
        { name: '', wt: 0 },
        { name: '', wt: 0 },
      ],
      customAdditive: { smiles: '', wt: 0 },
    })
  }
  return normalizeElectrolyteDesignFormula({
    salt: 'LiPF6',
    saltM: 1.0,
    solventPreset: 'EC:DMC 1:1',
    commonAdditives: [
      { name: 'FEC', wt: 2.0 },
      { name: '', wt: 0 },
      { name: '', wt: 0 },
    ],
    customAdditive: { smiles: '', wt: 0 },
  })
}

function buildElectrolyteDesignDemoResult(formulaA, formulaB, batterySystem) {
  const score = (f) => {
    const ff = normalizeElectrolyteDesignFormula(f)
    let ionic = ff.salt === 'LiFSI' ? 78 : 70
    ionic += Math.min(8, Math.abs(Number(ff.saltM) - 1) * 12)
    const addWt =
      (ff.commonAdditives || []).reduce((s, a) => s + (Number(a.wt) || 0), 0) +
      (Number(ff.customAdditive?.wt) || 0)
    ionic += Math.min(4, addWt * 0.25)
    if (String(ff.solventPreset || '').includes('3:7')) ionic += 3
    let viscMerit = ff.salt === 'LiFSI' ? 68 : 76
    if (String(ff.solventPreset || '').includes('DMC')) viscMerit += 2
    viscMerit = Math.min(95, Math.round(viscMerit))
    let window = ff.salt === 'LiFSI' ? 84 : 77
    let cost = ff.salt === 'LiFSI' ? 62 : 80
    if (batterySystem === 'ncm811-100si') {
      window = Math.min(99, window + 2)
      ionic = Math.min(99, ionic + 1)
    }
    return {
      ionicConductivity: Math.min(99, Math.round(ionic)),
      viscosityMerit: viscMerit,
      electrochemicalWindow: Math.min(99, Math.round(window)),
      costIndex: Math.min(99, Math.round(cost)),
    }
  }
  const A = score(formulaA)
  const B = score(formulaB)
  let recommendation =
    '两配方在电导率、粘度适宜性与成本之间各有取舍，建议结合目标倍率与预算做小批量验证后再锁定。'
  if (B.ionicConductivity > A.ionicConductivity + 3 && B.costIndex < A.costIndex - 5) {
    recommendation =
      '配方 B 在低温传导性上更优，但成本高出约 15%，建议用于高端快充系列；配方 A 更适合成本敏感场景。'
  } else if (B.ionicConductivity > A.ionicConductivity + 2) {
    recommendation =
      '配方 B 在离子电导率上领先；若界面与循环数据满足要求，可作为高性能选项，同时关注其成本指数相对 A 的落差。'
  } else if (A.costIndex > B.costIndex + 8) {
    recommendation = '配方 A 在成本指数上更占优；若需拓宽电化学窗口，可参考配方 B 的盐型或溶剂配比做微调。'
  }
  const dims = [
    { key: 'ionicConductivity', label: 'Ionic Conductivity', sub: '电导率' },
    { key: 'viscosityMerit', label: 'Viscosity', sub: '粘度适宜性（越低越好）' },
    { key: 'electrochemicalWindow', label: 'Electrochemical Window', sub: '电压窗口' },
    { key: 'costIndex', label: 'Cost Index', sub: '成本指数' },
  ]
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v))
  const diff = (k) => (Number(B[k]) || 0) - (Number(A[k]) || 0)
  const cycleLife25 = clamp(35 + diff('electrochemicalWindow') * 3 + diff('viscosityMerit') * 0.8, -30, 80)
  const cycleLife45 = clamp(28 + diff('electrochemicalWindow') * 2.6 + diff('viscosityMerit') * 0.7, -30, 80)
  const rate25 = clamp(8 + diff('ionicConductivity') * 1.1, -30, 60)
  const rate45 = clamp(6 + diff('ionicConductivity') * 0.9, -30, 60)
  const ceUp = diff('electrochemicalWindow') + diff('viscosityMerit') * 0.15 >= 0
  const cellPerformance = {
    title: 'Cell Performance Prediction',
    subtitle: 'Performances of Formulation B compared with Formulation A',
    note:
      'Note: This function evaluates the performance difference between formulations A and B by comparing the cell performance of two additive groups (A and B) using a user-defined benchmark electrolyte. Results may differ when applied to different cell designs or benchmark electrolytes.',
    temps: [
      {
        label: '25°C Performance',
        metrics: [
          { key: 'cycleLife', label: 'Cycle Life', kind: 'pct', value: cycleLife25 },
          { key: 'ce', label: 'Coulombic Efficiency', kind: 'arrow', value: ceUp ? 'up' : 'down' },
          { key: 'rate', label: 'Rate Performance', kind: 'pct', value: rate25 },
        ],
      },
      {
        label: '45°C Performance',
        metrics: [
          { key: 'cycleLife', label: 'Cycle Life', kind: 'pct', value: cycleLife45 },
          { key: 'ce', label: 'Coulombic Efficiency', kind: 'arrow', value: ceUp ? 'up' : 'down' },
        ],
      },
    ],
  }
  return { metricsA: A, metricsB: B, recommendation, dims, cellPerformance }
}

function buildElectrolyteDesignCommonAnswer(questionText) {
  const q = String(questionText || '').trim()
  const isCompare = q.includes('对比电解液配方性能')
  if (isCompare) {
    return `从工程实践看，**对比两款电解液配方**通常要同时看体相传输（电导率、黏度）、**电化学稳定窗口**、界面化学（SEI/CEI 倾向）以及成本与供应链，很难用单一指标定胜负，更多是**在目标体系与工作条件下的多目标权衡**。

常见思路包括：

1. **控制变量**：在盐浓度、溶剂骨架相近的前提下，比较添加剂组合对循环、存储或快充的影响。  
2. **物性先行**：用语义清晰的代理量（黏度、离子电导、窗口宽度等）先做排序，缩小实验矩阵。  
3. **体系对齐**：高镍、铁锂与金属锂/固态等体系对高压侧与界面要求不同，预测与经验先验往往需要**按体系统一标定**。

以上是通用层面的说明；若您希望进入结构化配置与预测对比，请点击下方 **电解液设计专家** 卡片继续。`
  }
  return `设计锂电池电解液配方时，核心是在**离子传输、界面稳定性、温度与安全**之间找平衡。典型路径是：先搭溶剂骨架（如环状碳酸酯 + 线状稀释剂）、再定锂盐与浓度，最后用少量功能添加剂调节 SEI/CEI 与高电压副反应。

在实验数据不足时，可用**组成—物性—界面倾向**类代理模型做初筛，减少试错轮次。不同正负极与封装体系对还原/氧化稳定性要求差异很大，因此**先明确电池体系**再谈配方更合理。

以上是通用建议；需要并排配置双配方并生成预测对比时，请点击下方 **电解液设计专家** 卡片进入下一步。`
}

function buildElectrolyteSolventDemoAnswer() {
  return `在为锂离子电池挑选电解质溶剂时，需要综合平衡导电性能、界面化学、安全性和成本等多方面要求。关键考虑因素可归纳如下：

• 电化学稳定窗口  
溶剂的氧化/还原稳定电位必须覆盖电池工作电压范围（石墨负极≈0 V vs. Li⁺/Li，镍富正极可达>4.4 V）。碳酸酯类（EC、EMC、DEC 等）在≈4.3 V左右开始被氧化，若要支持更高电压，则需使用更抗氧化的氟碳酸酯、磺酰胺或磺酮等高电位溶剂/添加剂 [1]。

• 离子溶解及传导能力  
溶剂应具有足够的介电常数以解离锂盐，同时保持较低黏度，确保高离子电导率（常温 >10⁻³ S cm⁻¹）。常见做法是用高极性且黏度大的 EC 提供溶剂化能力，再用低黏度的线性碳酸酯（DMC、EMC、DEC）稀释以降低黏度 [1]。

• 形成稳定固体电解质界面（SEI）的能力  
在石墨或硅等负极上，溶剂还原产物需快速形成致密、离子导电而电子绝缘的 SEI，以抑制持续分解。环状碳酸酯（尤其是 EC）因会在≈0.8 V发生还原并生成具有弹性的聚碳酸酯/无机盐 SEI，因此被视为“必需溶剂”；FEC 等添加剂可进一步改善界面稳定性 [1,3]。

• 与正极/集流体的化学兼容性  
溶剂及其分解产物不可强烈腐蚀 Al 集流体，也不可与高电位正极活性氧/过渡金属剧烈反应。采用含硼化合物或 FSI⁻ 基电解质时，线性碳酸酯对 Al 被动膜的保护不足，往往需要含硼添加剂抑制腐蚀 [2]。

• 温度适用范围  
−30 ℃以下应保持液态且具可接受电导率；>60–80 ℃不应出现大量挥发、分解或凝胶。低熔点溶剂（例如 EMC、MP、全氟醚）和共溶剂设计可改善低温性能，而高闪点溶剂（磺酮、酯类离子液体）有助于提升高温稳定性 [1]。

• 安全性与环保性  
低挥发性、低毒性、难燃性是减缓热失控和满足法规的重要指标。氟代碳酸酯、磺酮以及稀释型局部高浓度电解液（LHCE）策略，可在保持导电性的同时显著提高闪点并降低热释放速率 [1]。

• 经济性和大规模可获得性  
价格、合成路线、原料供应链和回收难度也是工业化必须考量的因素，往往与溶剂分子复杂度和氟化程度直接相关。

通过在以上维度上权衡取舍，最常见的商用配方由 15–25 wt% EC + 75–85 wt% 线性碳酸酯（EMC/DMC/DEC）构成，再配合数％功能添加剂；而针对高镍/高电压正极或低温动力电池，则需引入氟代碳酸酯、磺酰胺等新溶剂或采用局部高浓度电解液来满足更苛刻的要求。

References

[1] Xu, K. Electrolytes and Interphases in Li-Ion Batteries and Beyond. Chemical Reviews, 114/11503-11618, 2014. DOI:10.1021/cr500003w
[2] Park, K., Yu, S., Lee, C., Lee, H. Comparative study on lithium borates as corrosion inhibitors of aluminum current collector in lithium bis(fluorosulfonyl)imide electrolytes. Journal of Power Sources, 296/34-42, 2015. DOI:10.1016/j.jpowsour.2015.07.052
[3] Zhang, S.S. A review on electrolyte additives for lithium-ion batteries. Journal of Power Sources, 162/1379-1394, 2006. DOI:10.1016/j.jpowsour.2006.07.074`
}

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
  const { profile } = useUserDemo()
  const { toolCards, prompts, welcomeTitle, welcomeSubtitle } = useMemo(
    () => getPersonalizedWelcome(profile),
    [profile]
  )
  const [input, setInput] = useState('')
  const [selectedTool, setSelectedTool] = useState(null)
  const [isTyping, setIsTyping] = useState(false)
  const [modelTier, setModelTier] = useState('lightning') // lightning | pro | deepSpace
  const [moleculeDrawerOpen, setMoleculeDrawerOpen] = useState(false)
  const [activeMolecule, setActiveMolecule] = useState(null)
  const [similarOpen, setSimilarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [menuOpenId, setMenuOpenId] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [editTitle, setEditTitle] = useState('')
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const messagesEndRef = useRef(null)
  const uploadInputRef = useRef(null)
  const overlayRef = useRef(null)
  const textareaRef = useRef(null)
  const renameInputRef = useRef(null)
  const hasUserContent = (conv) => conv.messages.some((m) => m.role === 'user')

  const current = conversations.find(c => c.id === currentId) || conversations[0]
  const messages = current?.messages ?? initialMessages
  const hasUserMessage = messages.some((m) => m.role === 'user')
  const showWelcomeState = !hasUserMessage
  const searchableConversations = conversations.filter((conv) => {
    if (!hasUserContent(conv)) return false
    const q = searchQuery.trim().toLowerCase()
    if (!q) return true
    const titleMatch = conv.title.toLowerCase().includes(q)
    const contentMatch = conv.messages.some((m) => (m.content ?? '').toLowerCase().includes(q))
    return titleMatch || contentMatch
  })
  const displayedConversations = [...searchableConversations].sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned))

  const estimateTokensForConversation = (conv) => {
    if (!conv || !Array.isArray(conv.messages)) return 0
    const chars = conv.messages.reduce((sum, m) => {
      if (!m || typeof m.content !== 'string') return sum
      return sum + m.content.length
    }, 0)
    return Math.max(0, Math.round(chars / 4))
  }

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  useEffect(() => {
    if (!menuOpenId) return
    const close = () => setMenuOpenId(null)
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [menuOpenId])


  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const hasMountedRef = useRef(false)
  const skipNextAutoScrollRef = useRef(false)
  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true
      return
    }
    if (skipNextAutoScrollRef.current) {
      skipNextAutoScrollRef.current = false
      return
    }
    scrollToBottom()
  }, [messages, currentId])

  const handleNewConversation = () => {
    const newConv = createNewConversation()
    setConversations((prev) => {
      const cleaned = prev.filter((c) => c.id === currentId || hasUserContent(c))
      return [newConv, ...cleaned.filter((c) => c.id !== newConv.id)]
    })
    setCurrentId(newConv.id)
  }

  const { tourActive, step, registerTourNewChatHandler, goToTourStep } = useOnboardingTour()
  const newConvForTourRef = useRef(handleNewConversation)
  newConvForTourRef.current = handleNewConversation
  useEffect(() => {
    return registerTourNewChatHandler(() => newConvForTourRef.current())
  }, [registerTourNewChatHandler])

  useEffect(() => {
    if (!tourActive || step !== TOUR_STEP.LITERATURE_WAIT) return
    const done = messages.some((m) => m.block === 'literatureRun' && m.done)
    if (done) goToTourStep(TOUR_STEP.LITERATURE_ASSETS_BTN)
  }, [tourActive, step, messages, goToTourStep])

  const handleSelectConversation = (id) => {
    setEditingId(null)
    setCurrentId(id)
  }

  const handleDeleteConversation = (e, id) => {
    e?.stopPropagation?.()
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
    setMenuOpenId(null)
  }

  const handleStartRename = (e, conv) => {
    e?.stopPropagation?.()
    setEditingId(conv.id)
    setEditTitle(conv.title)
    setMenuOpenId(null)
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

  const handleTogglePinConversation = (e, id) => {
    e.stopPropagation()
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, pinned: !c.pinned } : c))
    )
    setMenuOpenId(null)
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

  const updateMessageById = (convId, msgId, updater) => {
    updateConversation(convId, (c) => ({
      ...c,
      messages: c.messages.map((m) => (m.id === msgId ? updater(m) : m))
    }))
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
      isDraft: false,
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

  const getMockPredictionByFileName = (fileName = 'data.csv') => {
    const raw = String(fileName || 'data.csv')
    const normalized = raw.toLowerCase().replace(/\s/g, '')
    if (normalized.includes('demo(1)') || normalized.includes('demo1')) {
      return { barcode: 'demo(1)', cycleLife: 2860 }
    }
    if (normalized.includes('demo(2)') || normalized.includes('demo2')) {
      return { barcode: 'demo(2)', cycleLife: 3240 }
    }
    return { barcode: 'demo', cycleLife: 3114 }
  }

  const createPredictionTask = (fileName) => {
    const id = `PR-${String(Date.now()).slice(-3)}`
    const now = new Date()
    const prediction = getMockPredictionByFileName(fileName)
    const predictionTime = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`
    addTask({
      id,
      type: 'prediction',
      category: 'predicts',
      tool: 'Life Prediction',
      title: `Prediction ${id}`,
      fileName: fileName || 'data.csv',
      predictionTime,
      createdAt: now.getTime(),
      userId: 'U-10001',
      batteryCount: 1,
      barcode: prediction.barcode,
      cycleLife: prediction.cycleLife,
      status: 'done'
    })
    return { taskId: id, fileName: fileName || 'data.csv', ...prediction }
  }

  const finalizePredictionRun = (convId, msgId, predictionMeta) => {
    updateMessageById(convId, msgId, (m) => ({
      ...m,
      content: 'Prediction complete.',
      thinkingDone: true,
      taskId: predictionMeta.taskId,
      fileName: predictionMeta.fileName,
      barcode: predictionMeta.barcode,
      cycleLife: predictionMeta.cycleLife
    }))
  }

  const startPredictionRun = ({ convId, cycles, predictionMeta }) => {
    const runMsg = {
      id: Date.now() + 1,
      role: 'assistant',
      content: 'Initializing prediction...',
      block: 'predictionRun',
      thinkingDone: false,
      thinkingExpanded: false,
      trace: []
    }

    const streamSteps = [
      { phase: 'Data Preparation', detail: `Using ${cycles} cycles for inference...` },
      { phase: 'Data Preparation', detail: 'Validating schema: barcode, cycle_id, current, voltage, time...' },
      { phase: 'Data Preparation', detail: 'Cleaning missing values and outliers...' },
      { phase: 'Feature Engineering', detail: 'Aligning charge/discharge segments...' },
      { phase: 'Feature Engineering', detail: 'Computing dQ/dV and voltage-plateau features...' },
      { phase: 'Feature Engineering', detail: 'Extracting degradation trend embeddings...' },
      { phase: 'Model Inference', detail: 'Matching nearest historical degradation trajectories...' },
      { phase: 'Model Inference', detail: 'Running life prediction ensemble model...' },
      { phase: 'Model Inference', detail: 'Calibrating uncertainty and generating final estimate...' }
    ]

    streamSteps.forEach((step, idx) => {
      setTimeout(() => {
        updateMessageById(convId, runMsg.id, (m) => ({
          ...m,
          content: `${step.phase}: ${step.detail}`,
          trace: [...(m.trace || []), step]
        }))
      }, 700 * (idx + 1))
    })

    setTimeout(() => finalizePredictionRun(convId, runMsg.id, predictionMeta), 5000)
    return runMsg
  }

  const handleCycleSelect = (cycles) => {
    const conv = conversations.find(c => c.id === currentId) || conversations[0]
    const lastPreview = [...conv.messages].reverse().find(m => m.block === 'uploadPreview')
    const fileName = lastPreview?.fileName
    const predictionMeta = createPredictionTask(fileName)
    const convId = currentId

    const userMsg = { id: Date.now(), role: 'user', content: String(cycles) }
    const assistantMsg = startPredictionRun({ convId, cycles, predictionMeta })
    updateConversation(currentId, c => ({
      ...c,
      isDraft: false,
      messages: [...c.messages, userMsg, assistantMsg]
    }))
  }

  const handleToggleThinkingExpand = (msgId) => {
    skipNextAutoScrollRef.current = true
    updateMessageById(currentId, msgId, (m) => ({
      ...m,
      thinkingExpanded: !m.thinkingExpanded
    }))
  }

  const groupThinkingTrace = (trace = []) =>
    trace.reduce((acc, step) => {
      const prev = acc[acc.length - 1]
      if (!prev || prev.phase !== step.phase) {
        acc.push({ phase: step.phase, details: [step.detail] })
      } else {
        prev.details.push(step.detail)
      }
      return acc
    }, [])

  const isCycleCountReply = (text, messages) => {
    const n = parseInt(text.trim(), 10)
    if (Number.isNaN(n) || n < 1) return false
    const lastAssistant = [...messages].reverse().find(m => m.role === 'assistant')
    return lastAssistant?.block === 'uploadPreview'
  }

  const isPredictionComparisonRequest = (text) => {
    const t = text.trim().toLowerCase()
    return (
      (t.includes('对比') && (t.includes('电芯') || t.includes('demo') || t.includes('分析'))) ||
      ((t.includes('compare') || t.includes('comparison')) && (t.includes('cell') || t.includes('demo') || t.includes('analysis')))
    )
  }

  const isLiteratureResearchIntent = (text) => {
    const t = text.trim().toLowerCase()
    return (
      text.includes('我想研究') ||
      text.includes('文献研究') ||
      t.includes('literature research') ||
      t.includes('research papers') ||
      t.includes('study this topic')
    )
  }

  const parseMDElectrolyteFromText = (text) => {
    const raw = String(text || '')
    const t = raw.replace(/\s+/g, ' ').trim()
    if (!t) return null

    const hasEC = /\bEC\b/i.test(t)
    const hasDMC = /\bDMC\b/i.test(t)
    const hasSalt = /LiPF6/i.test(t) || /LiFSI/i.test(t) || /LiTFSI/i.test(t)
    const hasRoom = /室温|room\s*temp|room\s*temperature/i.test(t)
    const concMatch = t.match(/(\d+(?:\.\d+)?)\s*M\b/i)
    const ratioMatch = t.match(/(\d+(?:\.\d+)?)\s*:\s*(\d+(?:\.\d+)?)/)

    if (!hasSalt || !(hasEC && hasDMC) || !concMatch) return null

    const conc = Number(concMatch[1])
    if (!Number.isFinite(conc) || conc <= 0) return null

    let anion = 'PF6-'
    if (/LiFSI/i.test(t)) anion = 'FSI-'
    if (/LiTFSI/i.test(t)) anion = 'TFSI-'

    const temperatureK = hasRoom ? 298.15 : 298.15

    let ecFrac = 0.3
    let dmcFrac = 0.7
    if (ratioMatch) {
      const a = Number(ratioMatch[1])
      const b = Number(ratioMatch[2])
      const s = a + b
      if (Number.isFinite(s) && s > 0) {
        ecFrac = a / s
        dmcFrac = b / s
      }
    }

    return {
      temperatureK,
      pressureAtm: 1.0,
      cation: 'Li+',
      anions: [anion],
      totalSaltMolKg: conc,
      anionFractions: { [anion]: 1.0 },
      fractionType: 'mole',
      solvents: [
        { smiles: 'O=C1OCCOC1', fraction: ecFrac },
        { smiles: 'COC(=O)OC', fraction: dmcFrac },
      ],
    }
  }

  const isMDSimIntent = (text) => {
    const t = text.trim()
    if (!t) return false
    // Match either exact phrasing in requirement or close variants.
    return (
      t.includes('MD模拟') ||
      t.includes('md模拟') ||
      t.includes('MD 模拟') ||
      t.includes('分子动力学') ||
      !!parseMDElectrolyteFromText(text) ||
      ((t.includes('配方') || t.includes('新配方')) &&
        (t.includes('MD') || t.includes('md') || t.includes('模拟')) &&
        (t.includes('评估') || t.includes('跑') || t.includes('跑一下') || t.includes('跑一跑')))
    )
  }

  const isElectrolyteDesignIntent = (text) => {
    const t = text.trim()
    if (!t) return false
    return t.includes('帮我设计一下电解液配方') || t.includes('对比电解液配方性能')
  }

  const isStressCorrosionCGRIntent = (text) => {
    const t = String(text || '').trim().toLowerCase()
    if (!t) return false
    return (
      text.includes('应力腐蚀裂纹扩展速率预测') ||
      (t.includes('stress corrosion') && (t.includes('cgr') || t.includes('crack growth')))
    )
  }

  const SULFIDE_LITERATURE_FOLLOWUPS = [
    '「硫化物固态电解质最新方向」文献综述提纲',
    '按材料体系分类的研究路线图',
    '适合开题答辩的 1 页选题框架',
    '最近 3–5 年代表性论文清单'
  ]

  const buildGeneralResearchAnswerMeta = (questionText) => {
    const q = String(questionText || '').toLowerCase()
    if (q.includes('硫化物') || q.includes('sulfide')) {
      const leadMarkdown = `如果你想研究**硫化物固态电解质在全固态电池（ASSBs, all-solid-state batteries）中的最新方向**，我建议先默认以**锂金属/高镍正极体系**作为主线，因为这是当前最具代表性的应用场景之一。硫化物电解质的最新研究重点，已经从“单纯追求高离子电导率”转向“**电导率 + 界面稳定性 + 可制造性 + 实际电池表现**”的综合优化。[1,2]

## 你可以重点关注的 6 个最新方向

### 1) 材料本体设计：从“更快”走向“更稳”
当前主流方向仍然是围绕 **thiophosphate（硫代磷酸盐）**、**argyrodite（银铜矿型）** 等体系做掺杂、组分替换和合成路线优化，以提高 Li⁺ 迁移率并兼顾化学稳定性与空气稳定性。[1]  
这类工作背后的机制逻辑是：通过引入晶格缺陷、调整局域配位环境和迁移通道，降低离子迁移势垒，同时减少结构对水/氧的敏感性。[1]

### 2) 空气稳定性和湿敏性治理
硫化物电解质最现实的工程瓶颈之一是**遇湿易分解、可能释放 H2S**，所以“空气稳定性”现在是非常重要的研究主线。[1]  
最新思路包括：  
- 体相掺杂改善化学稳定性  
- 表面包覆/钝化  
- 优化合成与处理工艺，减少暴露和副反应  
- 与更耐空气的盐/卤化物体系做复合设计[1,3]

### 3) 界面工程：锂负极侧的稳定性
锂负极/硫化物电解质界面仍然是关键难点，主要问题包括**界面副反应、锂枝晶/锂丝穿透、电子泄漏诱发分解**。[1,2]  
所以最新研究非常重视：  
- 构建**人工固态电解质界面层（ASEI）**  
- 使用低电子电导的中间层抑制界面分解  
- 合金化负极（如 Li–In、Li–Al 思路）  
- 复合电解质或梯度界面设计[1]

### 4) 正极侧高电压兼容性
硫化物电解质与高电压氧化物正极之间，常会出现**空间电荷层、界面反应层和接触退化**，导致阻抗快速上升。[1,2]  
因此，最新方向包括：  
- 正极颗粒表面包覆  
- 采用更匹配的正极/电解质组合  
- 用卤化物电解质或混合电解质缓解高电压氧化问题  
- 设计更适合硫化物体系的复合正极结构[1,3]

### 5) 致密化、薄膜化和可制造性
真正走向应用，必须解决**电解质膜成型、压实、薄化、以及高负载正极层制造**的问题。[1]  
所以你会看到很多新工作聚焦在：  
- 冷压/湿法/干法成膜  
- 薄电解质膜制备  
- 高面容量正极复合电极  
- pouch cell（软包）装配与堆叠压力管理[1]

### 6) 机理研究：从“经验试错”转向“可解释设计”
越来越多工作开始用**阻抗分解、原位/后解析表征、力学分析和计算模拟**，去拆分到底是离子传输受限，还是界面反应、颗粒开裂、压力失配导致退化。[2]  
这意味着未来更有价值的研究，不只是报一个电导率数字，而是回答：  
- 离子到底走哪条通道？  
- 晶界阻抗有多大？  
- 界面层是如何生成和长大的？  
- 压力、孔隙、裂纹分别起什么作用？[2]

---

## 如果你要选题，我建议的优先级

### 适合做基础研究
1. **硫化物电解质的离子迁移机制与晶界工程**  
2. **Li/硫化物界面反应与人工界面层设计**  
3. **高电压正极/硫化物界面的空间电荷层和副反应机制**

### 适合做偏工程化/应用研究
1. **空气稳定性提升与可规模化制备**  
2. **薄膜化、干法工艺与高载量电极制造**  
3. **软包电池中的堆压管理和界面寿命**

---

## 一个很实用的研究判断
如果你希望你的课题更“新”，目前最有价值的不是再重复“哪种硫化物电导率更高”，而是把重点放在：

- **电解质本体稳定性**
- **界面稳定性**
- **可制造性**
- **实际电池条件下的失效机理**

因为这四个方向正是硫化物固态电解质从论文走向应用的关键门槛。[1,2]`

      const tailMarkdown = `## References

[1] Liu, Y., Yu, T., Guo, S., Zhou, H. *Designing High-Performance Sulfide-Based All-Solid-State Lithium Batteries: From Laboratory to Practical Application*. Acta Physico-Chimica Sinica, 2023. [DOI:10.3866/pku.whxb202301027](https://doi.org/10.3866/pku.whxb202301027).

[2] Yun, J., Shin, H.R., Hoang, T.D., Kim, S., Choi, J.H., Kim, B., Jung, H., Moon, J., Lee, J.-W. *Deciphering the critical degradation factors of solid composite electrodes with halide electrolytes: Interfacial reaction versus ionic transport*. Energy Storage Materials, 2023. [DOI:10.1016/j.ensm.2023.102787](https://doi.org/10.1016/j.ensm.2023.102787).

[3] Chen, X., Zhao, N., Jia, Z., Guo, X. *Garnet solid electrolytes: Material design, microstructural engineering, and pathways to high-energy density solid-state lithium batteries*. Solid State Ionics, 2025. [DOI:10.1016/j.ssi.2025.116943](https://doi.org/10.1016/j.ssi.2025.116943).`

      return {
        kind: 'split',
        leadMarkdown,
        tailMarkdown,
        followUps: SULFIDE_LITERATURE_FOLLOWUPS
      }
    }
    if (q.includes('算法') || q.includes('model') || q.includes('gnn')) {
      return {
        kind: 'single',
        markdown: [
          '置信度：Medium-High',
          '结论：算法性能提升主要来自“高质量特征体系 + 严格泛化验证”，模型结构本身通常是次级增益。',
          '关键机制：若训练/测试分布存在化学体系偏移，单纯增加模型复杂度（如更深 GNN）往往无法稳定提升外推性能。',
          '可验证方向：建议采用跨批次/跨体系切分，联合评估误差、校准度与可解释性，并通过消融实验确认关键特征贡献。',
          '参考占位：[Ref-1] Battery ML benchmark；[Ref-2] GNN generalization study；[Ref-3] Uncertainty calibration practice。'
        ].join('\n'),
        followUps: []
      }
    }
    return {
      kind: 'single',
      markdown: [
        '置信度：Medium',
        '结论：该问题可通过“文献证据 + 内部资产数据”联合分析，形成可执行的研究结论与验证路径。',
        '关键机制：研究结论的可信度主要取决于证据层级、数据一致性及方法可复现性，而不仅是单篇文献结果。',
        '可验证方向：建议先定义研究边界与评价指标，再做方法-数据-结果三维对比，最终输出可落地的实验或建模计划。',
        '参考占位：[Ref-1] Domain review；[Ref-2] Representative methodology paper；[Ref-3] Reproducibility guideline。'
      ].join('\n'),
      followUps: []
    }
  }

  const buildGeneralResearchAnswer = (questionText) => {
    const meta = buildGeneralResearchAnswerMeta(questionText)
    if (meta.kind === 'split') {
      return `${meta.leadMarkdown}\n\n${meta.tailMarkdown}`
    }
    return meta.markdown
  }

  const handlePredictionComparisonDemo = (conv) => {
    const completed = (conv.messages || [])
      .filter((m) => m.block === 'predictionRun' && m.thinkingDone)
      .filter((m) => m.barcode && Number.isFinite(Number(m.cycleLife)))

    let left = completed.find((m) => m.barcode === 'demo(1)')
    let right = completed.find((m) => m.barcode === 'demo(2)')
    if (!left || !right) {
      const lastTwo = completed.slice(-2)
      left = left || lastTwo[0]
      right = right || lastTwo[1]
    }

    if (!left || !right) {
      appendAssistantMessage({
        id: Date.now() + 1,
        role: 'assistant',
        content: 'I can do a side-by-side analysis once two prediction results are available. Please run predictions for demo(1) and demo(2) first.'
      })
      return
    }

    const leftLife = Number(left.cycleLife)
    const rightLife = Number(right.cycleLife)
    const better = rightLife >= leftLife ? right : left
    const worse = rightLife >= leftLife ? left : right
    const gap = Math.abs(rightLife - leftLife)
    const gapPct = ((gap / Math.max(Math.min(leftLife, rightLife), 1)) * 100).toFixed(1)

    appendAssistantMessage({
      id: Date.now() + 1,
      role: 'assistant',
      content: null,
      block: 'predictionCompare',
      left: { barcode: left.barcode, cycleLife: leftLife, fileName: left.fileName || 'demo(1).csv' },
      right: { barcode: right.barcode, cycleLife: rightLife, fileName: right.fileName || 'demo(2).csv' },
      better: better.barcode,
      worse: worse.barcode,
      gap,
      gapPct
    })
  }

  const handleLiteratureSelectionPhase = (questionText) => {
    const meta = buildGeneralResearchAnswerMeta(questionText)
    appendAssistantMessage({
      id: Date.now() + 1,
      role: 'assistant',
      content: null,
      block: 'literatureIntro',
      questionText,
      followUpSuggestions: meta.followUps || []
    })
  }

  const handleLiteratureAssistantSelect = (assistantType) => {
    if (assistantType === 'industryNews') {
      const userMsg = { id: Date.now(), role: 'user', content: '实时行业新闻' }
      const formMsg = {
        id: Date.now() + 1,
        role: 'assistant',
        content: null,
        block: 'industryNewsForm',
        formConfirmed: false,
        formData: {
          timeWindow: '24h',
          domains: ['固态电池', '产业链'],
          includePolicy: true
        }
      }
      updateConversation(currentId, (c) => ({
        ...c,
        isDraft: false,
        messages: [...c.messages, userMsg, formMsg]
      }))
      return
    }
    const userMsg = { id: Date.now(), role: 'user', content: 'MU 文献助手' }
    const formMsg = {
      id: Date.now() + 1,
      role: 'assistant',
      content: null,
      block: 'literatureForm',
      formConfirmed: false,
      formData: {
        timeSpan: '近5年',
        focus: '材料工艺',
        needCode: true
      }
    }
    updateConversation(currentId, (c) => ({
      ...c,
      isDraft: false,
      messages: [...c.messages, userMsg, formMsg]
    }))
    if (tourActive && step === TOUR_STEP.LITERATURE_PICK) {
      goToTourStep(TOUR_STEP.LITERATURE_FORM)
    }
  }

  const handleLiteratureFormUpdate = (msgId, key, value) => {
    updateMessageById(currentId, msgId, (m) => ({
      ...m,
      formData: {
        ...(m.formData || {}),
        [key]: value
      }
    }))
  }

  const handleShareLiteratureReport = async () => {
    const shareUrl = 'https://mu-demo.local/reports/literature-2026'
    try {
      if (navigator?.clipboard?.writeText) await navigator.clipboard.writeText(shareUrl)
      appendAssistantMessage({
        id: Date.now() + 1,
        role: 'assistant',
        content: `分享链接已生成（模拟）：${shareUrl}`
      })
    } catch {
      appendAssistantMessage({
        id: Date.now() + 1,
        role: 'assistant',
        content: `分享链接（模拟）：${shareUrl}`
      })
    }
  }

  const handleDownloadLiteraturePdf = () => {}

  const handleLiteratureStartResearch = (formMsgId, formData) => {
    const convId = currentId
    updateMessageById(convId, formMsgId, (m) => ({ ...m, formConfirmed: true }))

    const userSummaryMsg = {
      id: Date.now() + 1,
      role: 'user',
      content: `开始研究\n时间跨度：${formData?.timeSpan || '近5年'}\n侧重点：${formData?.focus || '材料工艺'}\n代码提取：${formData?.needCode ? '是' : '否'}`
    }

    const runMsg = {
      id: Date.now() + 2,
      role: 'assistant',
      content: '',
      block: 'literatureRun',
      done: false,
      formData,
      statuses: [],
      literatureSteps: [],
    }
    updateConversation(convId, (c) => ({
      ...c,
      isDraft: false,
      messages: [...c.messages, userSummaryMsg, runMsg]
    }))

    if (tourActive && step === TOUR_STEP.LITERATURE_FORM) {
      goToTourStep(TOUR_STEP.LITERATURE_WAIT)
    }

    const defs = buildLiteraturePipelineDefs(formData)
    const gapMs = 400
    ;(async () => {
      for (let i = 0; i < defs.length; i++) {
        await streamLiteratureStep(convId, runMsg.id, defs[i], i, updateMessageById)
        if (i < defs.length - 1) await new Promise((r) => setTimeout(r, gapMs))
      }
      updateMessageById(convId, runMsg.id, (m) => ({
        ...m,
        done: true,
        content: 'Structured literature synthesis report ready.',
      }))
    })()
  }

  const toggleLiteratureStepDetail = (msgId, stepIdx) => {
    updateMessageById(currentId, msgId, (m) => {
      const literatureSteps = (m.literatureSteps || []).map((s, i) =>
        i === stepIdx ? { ...s, expanded: !s.expanded } : s
      )
      return { ...m, literatureSteps }
    })
  }

  const handleIndustryFormUpdate = (msgId, key, value) => {
    updateMessageById(currentId, msgId, (m) => ({
      ...m,
      formData: {
        ...(m.formData || {}),
        [key]: value
      }
    }))
  }

  const handleIndustryDomainToggle = (msgId, domain) => {
    updateMessageById(currentId, msgId, (m) => {
      const prev = m.formData?.domains || []
      const next = prev.includes(domain) ? prev.filter((d) => d !== domain) : [...prev, domain]
      return {
        ...m,
        formData: {
          ...(m.formData || {}),
          domains: next
        }
      }
    })
  }

  const handleShareIndustryReport = async () => {
    const shareUrl = 'https://mu-demo.local/reports/industry-news-2026'
    try {
      if (navigator?.clipboard?.writeText) await navigator.clipboard.writeText(shareUrl)
      appendAssistantMessage({
        id: Date.now() + 1,
        role: 'assistant',
        content: `行业快讯链接已生成（模拟）：${shareUrl}`
      })
    } catch {
      appendAssistantMessage({
        id: Date.now() + 1,
        role: 'assistant',
        content: `行业快讯链接（模拟）：${shareUrl}`
      })
    }
  }

  const handleDownloadIndustryPdf = () => {}

  const handleIndustryStartFetch = (formMsgId, formData) => {
    const convId = currentId
    updateMessageById(convId, formMsgId, (m) => ({ ...m, formConfirmed: true }))

    const userSummaryMsg = {
      id: Date.now() + 1,
      role: 'user',
      content: `开始抓取行业快讯\n时间窗口：${formData?.timeWindow || '24h'}\n关注方向：${(formData?.domains || []).join('、') || '固态电池'}\n包含政策监管：${formData?.includePolicy ? '是' : '否'}`
    }

    const runMsg = {
      id: Date.now() + 2,
      role: 'assistant',
      content: '准备抓取行业快讯...',
      block: 'industryNewsRun',
      done: false,
      formData,
      statuses: [],
      items: []
    }
    updateConversation(convId, (c) => ({
      ...c,
      isDraft: false,
      messages: [...c.messages, userSummaryMsg, runMsg]
    }))

    const steps = [
      '🛰️ 正在抓取 30+ 行业信息源（官网/媒体/数据库）...',
      `🧭 正在按“${(formData?.domains || []).join('、') || '固态电池'}”进行主题过滤与去重...`,
      '📊 正在提取价格、扩产、供给、技术路线等结构化信号...',
      ...(formData?.includePolicy ? ['🏛️ 正在聚合政策与监管动态并评估影响等级...'] : []),
      '📝 正在生成 24h 行业快讯卡片报告...'
    ]

    steps.forEach((step, idx) => {
      setTimeout(() => {
        updateMessageById(convId, runMsg.id, (m) => ({
          ...m,
          content: step,
          statuses: [...(m.statuses || []), step]
        }))
      }, 1500 * (idx + 1))
    })

    setTimeout(() => {
      updateMessageById(convId, runMsg.id, (m) => ({
        ...m,
        done: true,
        content: '行业快讯报告已生成。',
        items: [
          {
            title: '硫化物电解质上游前驱体价格周环比下降 3.2%',
            level: 'Medium',
            source: 'MarketWire / 4h ago',
            impact: '短期利好成本端，建议关注 2-4 周库存传导。'
          },
          {
            title: '头部厂商公布新一代固态样线扩产计划',
            level: 'High',
            source: 'Company PR / 9h ago',
            impact: '设备与材料验证节奏可能前移，建议跟踪产线良率爬坡。'
          },
          {
            title: '海外监管草案更新电池安全与回收条款',
            level: 'Medium',
            source: 'Policy Tracker / 20h ago',
            impact: '对出口型号认证与回收流程提出新增合规要求。'
          }
        ]
      }))
    }, 1500 * (steps.length + 1))
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
      content: '新建预测'
    }
    const assistantMsg = {
      id: Date.now() + 1,
      role: 'assistant',
      content: null,
      block: 'uploadFormat',
      uploadTip: '可直接在本对话中通过输入框旁的「上传」选择文件；准备好数据后点击下方按钮即可。'
    }
    updateConversation(currentId, c => ({
      ...c,
      isDraft: false,
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
      isDraft: false,
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
      isDraft: false,
      messages: [...c.messages, userMsg, assistantMsg]
    }))
  }

  const openMoleculeDrawer = (name) => {
    const mol = MOLECULE_INDEX[name]
    if (!mol) return
    setActiveMolecule(mol)
    setSimilarOpen(false)
    setMoleculeDrawerOpen(true)
  }

  const closeMoleculeDrawer = () => {
    setMoleculeDrawerOpen(false)
  }

  const getSimilarFor = (name) => {
    const pool = Object.values(MOLECULE_INDEX)
    return pool.filter((m) => m?.name && m.name !== name).slice(0, 6)
  }

  const renderTextWithMoleculeLinks = (text) => {
    const tokens = ['EC', 'DMC', 'EMC', 'DEC', 'FEC']
    const re = new RegExp(`\\b(${tokens.join('|')})\\b`, 'g')
    const parts = String(text || '').split(re)
    return parts.map((p, idx) => {
      if (tokens.includes(p)) {
        return (
          <button
            key={`${p}-${idx}`}
            type="button"
            className="ask-mol-link"
            onClick={() => openMoleculeDrawer(p)}
          >
            {p}
          </button>
        )
      }
      return <span key={idx}>{p}</span>
    })
  }

  const buildMDSimCommonAnswer = (questionText) => {
    const _ = String(questionText || '').trim()
    return `已理解您的目标：对该配方进行 **MD（分子动力学）模拟评估**，以得到更接近分子尺度的结构与性质线索（例如离子-溶剂相互作用、局域溶剂化与动态稳定性等）。

为了让仿真能顺利进入调度队列，我需要您确认的关键参数主要是：

1. **环境设定**：温度（K）
2. **组分**：盐（LiPF6 / LiFSI / LiTFSI）及其浓度（M）
3. **溶剂体系**：EC / DMC / EMC 的质量比（wt%），且所有溶剂 wt% 总和需为 **100%**

如果您同意，我可以直接帮您进入下一步的仿真参数配置卡片，您只需逐项填写即可。`
  }

  const handleMDSimSelectionPhase = (questionText) => {
    appendAssistantMessage({
      id: Date.now() + 1,
      role: 'assistant',
      content: null,
      block: 'mdSimIntro',
      questionText,
      prefill: parseMDElectrolyteFromText(questionText),
    })
  }

  const handleElectrolyteDesignStart = (userQuestion) => {
    appendAssistantMessage({
      id: Date.now() + 1,
      role: 'assistant',
      content: null,
      block: 'electrolyteDesignIntro',
      userQuestion,
    })
  }

  const handleElectrolyteDesignExpertSelect = (introMsgId, userQuestion) => {
    const conv = conversations.find((c) => c.id === currentId)
    const intro = conv?.messages?.find((m) => m.id === introMsgId)
    if (!intro || intro.block !== 'electrolyteDesignIntro' || intro.expertActivated) return
    updateMessageById(currentId, introMsgId, (m) => ({ ...m, expertActivated: true }))
    const userMsg = { id: Date.now(), role: 'user', content: '电解液设计专家' }
    const assistantMsg = {
      id: Date.now() + 1,
      role: 'assistant',
      content: null,
      block: 'electrolyteDesignSystemPick',
      userQuestion,
    }
    updateConversation(currentId, (c) => ({
      ...c,
      isDraft: false,
      messages: [...c.messages, userMsg, assistantMsg],
    }))
  }

  const handleElectrolyteDesignPickSystem = (systemPickMsgId, systemId) => {
    const conv = conversations.find((c) => c.id === currentId)
    const pick = conv?.messages?.find((m) => m.id === systemPickMsgId)
    if (!pick || pick.block !== 'electrolyteDesignSystemPick' || pick.picked) return
    const opt = ELECTROLYTE_DESIGN_SYSTEMS.find((s) => s.id === systemId)
    if (!opt || opt.disabled) return
    const sys = opt
    updateMessageById(currentId, systemPickMsgId, (m) => ({ ...m, picked: true }))
    const userQuestion = pick?.userQuestion
    const userMsg = { id: Date.now(), role: 'user', content: formatElectrolyteSystemLine(sys) || systemId }
    const assistantMsg = {
      id: Date.now() + 1,
      role: 'assistant',
      content: null,
      block: 'electrolyteDesignConfig',
      userQuestion,
      batterySystem: systemId,
      formulaA: createElectrolyteDesignFormula('A'),
      formulaB: createElectrolyteDesignFormula('B'),
      formSubmitted: false,
    }
    updateConversation(currentId, (c) => ({
      ...c,
      isDraft: false,
      messages: [...c.messages, userMsg, assistantMsg],
    }))
  }

  const handleElectrolyteDesignToggleSystemDetail = (systemPickMsgId, systemId) => {
    skipNextAutoScrollRef.current = true
    updateMessageById(currentId, systemPickMsgId, (m) => {
      if (!m || m.block !== 'electrolyteDesignSystemPick') return m
      const prev = Array.isArray(m.expandedSystemIds) ? m.expandedSystemIds : []
      const has = prev.includes(systemId)
      const next = has ? prev.filter((id) => id !== systemId) : [...prev, systemId]
      return { ...m, expandedSystemIds: next }
    })
  }

  const handleElectrolyteDesignPatchFormula = (msgId, side, patchFn) => {
    skipNextAutoScrollRef.current = true
    const key = side === 'B' ? 'formulaB' : 'formulaA'
    updateMessageById(currentId, msgId, (m) => ({
      ...m,
      [key]: patchFn(m[key] || createElectrolyteDesignFormula(side)),
    }))
  }

  // (legacy) additive row add/remove removed in new Step-2 UI

  const handleElectrolyteDesignRunCompare = (configMsgId) => {
    const convId = currentId
    const conv = conversations.find((c) => c.id === convId)
    const cfg = conv?.messages?.find((m) => m.id === configMsgId)
    if (!cfg || cfg.block !== 'electrolyteDesignConfig' || cfg.formSubmitted) return

    const formulaA = JSON.parse(JSON.stringify(cfg.formulaA || createElectrolyteDesignFormula('A')))
    const formulaB = JSON.parse(JSON.stringify(cfg.formulaB || createElectrolyteDesignFormula('B')))
    const { batterySystem } = cfg

    updateMessageById(convId, configMsgId, (m) => ({ ...m, formSubmitted: true }))

    const userMsg = { id: Date.now(), role: 'user', content: '📊 生成性能预测对比' }
    const thinkingMsg = {
      id: Date.now() + 1,
      role: 'assistant',
      content: null,
      block: 'electrolyteDesignThinking',
      thinkingIndex: 0,
      thinkingDone: false,
      thinkingExpanded: true,
      formulaA,
      formulaB,
      batterySystem,
      result: null,
    }
    updateConversation(convId, (c) => ({
      ...c,
      isDraft: false,
      messages: [...c.messages, userMsg, thinkingMsg],
    }))

    const tid = thinkingMsg.id
    const bump = (ms, idx) =>
      setTimeout(() => {
        updateMessageById(convId, tid, (m) => ({ ...m, thinkingIndex: idx }))
      }, ms)
    bump(500, 1)
    bump(1300, 2)
    bump(2100, 3)
    setTimeout(() => {
      const result = buildElectrolyteDesignDemoResult(formulaA, formulaB, batterySystem)
      updateMessageById(convId, tid, (m) => ({ ...m, thinkingDone: true, result }))
    }, 3000)
  }

  const handleElectrolyteDesignLLMAnalyze = (resultMsgId) => {
    const convId = currentId
    const conv = conversations.find((c) => c.id === convId)
    const msg = conv?.messages?.find((m) => m.id === resultMsgId)
    if (!msg || msg.block !== 'electrolyteDesignThinking' || !msg.result || msg.llmAnalyzed) return
    updateMessageById(convId, resultMsgId, (m) => ({ ...m, llmAnalyzed: true }))

    const perf = msg.result?.cellPerformance
    const t25 = perf?.temps?.[0]
    const t45 = perf?.temps?.[1]
    const getPct = (t, key) => Number(t?.metrics?.find((mm) => mm.key === key)?.value ?? 0)
    const cycle25 = getPct(t25, 'cycleLife')
    const rate25 = getPct(t25, 'rate')
    const cycle45 = getPct(t45, 'cycleLife')
    const rate45 = getPct(t45, 'rate')
    const ce = t25?.metrics?.find((mm) => mm.key === 'ce')?.value === 'up' ? '↑' : '↓'

    const summary =
      `## LLM Analysis\n\n- **Overall**: Formulation B shows ${cycle25 >= 0 ? 'improved' : 'reduced'} cycle life at 25°C (**${cycle25.toFixed(2)}%**) and ${rate25 >= 0 ? 'improved' : 'reduced'} rate performance (**${rate25.toFixed(2)}%**). Coulombic efficiency trend: **${ce}**.\n- **High temperature (45°C)**: Cycle life **${cycle45.toFixed(2)}%**, rate performance **${rate45.toFixed(2)}%** — temperature sensitivity suggests validating SEI robustness and gas evolution under 45°C.\n\n### What this implies\n- If your target is **fast charging / rate**, prioritize the formulation with higher rate uplift at both temperatures.\n- If your target is **cycle life**, ensure the additive package improves SEI/CEI uniformity without raising impedance.\n\n### Recommended next checks (demo)\n1. Run a small DOE around additive wt% (±0.5–1.0 wt%) and confirm CE stability.\n2. At 45°C, check impedance growth and gas generation proxies.\n3. Verify whether the performance gain persists with your specific cell design and benchmark electrolyte.\n`

    const userMsg = { id: Date.now(), role: 'user', content: 'LLM 分析' }
    const assistantMsg = {
      id: Date.now() + 1,
      role: 'assistant',
      content: null,
      block: 'electrolyteDesignLLMAnalysis',
      markdown: summary,
    }
    updateConversation(convId, (c) => ({ ...c, messages: [...c.messages, userMsg, assistantMsg] }))
  }

  const handleElectrolyteDesignToggleThinking = (msgId) => {
    skipNextAutoScrollRef.current = true
    updateMessageById(currentId, msgId, (m) => ({
      ...m,
      thinkingExpanded: !m.thinkingExpanded,
    }))
  }

  const handleStressCorrosionDemoStart = () => {
    appendAssistantMessage({
      id: Date.now() + 1,
      role: 'assistant',
      content: null,
      block: 'stressCorrosionCGRDemo',
      traceExpanded: true,
      trace: [
        '用户想进行应力腐蚀裂纹扩展速率预测，材料是316，盐是LiBF，温度是500℃。从现有的技能列表来看，有一个名为stress-corrosion-cgr-inference的技能，这个技能可能就是用于应力腐蚀裂纹扩展速率预测的。我需要先加载这个技能来了解它的具体使用方法。',
        '我需要检查一下这个技能的具体路径。从技能列表中看到，它位于/mnt/skills/custom/stress-corrosion-cgr-inference/SKILL.md。我应该先读取这个技能文件，了解它的使用方法和要求。然后根据技能指引来进行预测。',
        '用户提供了具体的参数：材料是316，盐是LiBF，温度是500℃。我需要确认这个技能是否支持这些参数，以及是否需要其他参数（比如应力强度因子、pH值等）。可能还需要用户提供更多信息。',
        '不过，按照我的工作流程，在开始之前需要先澄清任何模糊或缺失的信息。用户只提供了材料、盐和温度，但应力腐蚀裂纹扩展速率预测通常还需要其他参数，比如应力强度因子范围(ΔK)、频率、波形、环境条件（如pH值、电位）等。我需要询问用户是否知道这些参数，或者是否希望使用默认值。另外，盐是LiBF，这可能是锂盐，但具体的浓度是多少？用户没有提供浓度信息。',
        '我需要调用ask_clarification来获取更多信息。问题类型是missing_info，因为缺少必要的参数。',
        '那么，我应该询问用户：是否知道应力强度因子范围(ΔK)？频率是多少？盐的浓度是多少？pH值是多少？电位是多少？是否有其他环境条件？另外，用户是否希望使用默认值或典型值进行预测？',
        '不过，在询问之前，我应该先查看技能文件，了解这个技能具体需要哪些输入参数。这样我可以更精确地询问缺失的信息。让我先读取技能文件。',
        '了解stress-corrosion-cgr-inference技能所需的输入参数和预测流程',
        '/mnt/skills/custom/stress-corrosion-cgr-inference/SKILL.md',
        '我读了技能文件。这个技能需要一个预训练的模型包（bundle.pkl），其中包含模型、特征缩放器等。默认路径是/mnt/skills/custom/stress-corrosion-cgr-train-predict/checkpoints/latest/bundle.pkl。我需要检查这个文件是否存在。如果不存在，用户可能需要先使用训练技能。另外，还需要输入模式文件（input_schema.json）来了解所需的特征列。',
        '首先，检查这些文件是否存在。让我列出相关目录。',
        '检查bundle.pkl和input_schema.json是否存在',
        '/mnt/skills/custom/stress-corrosion-cgr-train-predict/checkpoints',
        '看起来存在一个run_20260401_150916目录，里面包含了bundle.pkl和input_schema.json文件。不过，这里似乎有重复的条目，可能是由于符号链接或列表显示问题。但文件应该是存在的。',
        '现在，我需要读取input_schema.json文件，以了解模型需要哪些特征列。然后，我才能向用户询问缺失的参数。让我先读取这个文件。',
        '读取input_schema.json以了解所需的特征列',
        '/mnt/skills/custom/stress-corrosion-cgr-train-predict/checkpoints/run_20260401_150916/input_schema.json',
        '很好！模型需要以下特征列：material、stress_MPa、temp_C、exposure_h、chloride_ppm。用户已经提供了材料（316）、温度（500℃），但还没有提供应力（stress_MPa）、暴露时间（exposure_h）和氯化物浓度（chloride_ppm）。另外，盐是LiBF，但特征列中要求的是chloride_ppm，这可能是氯化物浓度。LiBF是四氟硼酸锂，可能含有氟化物而不是氯化物。不过，模型可能是在氯化物环境下训练的。我需要询问用户如何将这些参数映射到模型特征上。',
        '我需要调用ask_clarification来获取缺失的信息。但首先，我需要确定要问哪些问题。',
        '问题如下：\n1. 应力（stress_MPa）：应力值是多少？单位是MPa。\n2. 暴露时间（exposure_h）：暴露时间是多少小时？\n3. 氯化物浓度（chloride_ppm）：模型需要氯化物浓度（ppm）。但用户提到盐是LiBF（四氟硼酸锂）。这是否意味着环境中的氯离子浓度？或者用户想用LiBF作为盐类，但模型可能是在氯化物环境下训练的。我需要询问氯离子浓度（ppm），或者确认是否可以使用其他盐类。模型可能只接受氯化物浓度作为特征。也许用户需要知道模型是在氯化物环境下训练的，因此需要提供氯离子浓度。',
        '我应该询问用户是否知道氯离子浓度（ppm）。如果不知道，也许可以假设一个值？但技能文件强调不能猜测默认值，除非用户明确授权。所以，我需要询问用户。',
        '另外，用户可能希望使用默认值或典型值。我可以提供一些典型值供用户选择。',
        '因此，我需要调用ask_clarification。我将询问以下问题：\n* 应力值（stress_MPa）是多少？\n* 暴露时间（exposure_h）是多少小时？\n* 氯离子浓度（chloride_ppm）是多少？如果不知道，是否可以提供典型值（例如，1000 ppm）？',
        '另外，材料是“316”，但模型可能期望像“316SS”这样的字符串。我需要检查训练数据中材料的确切表示形式。不过，我可以假设是“316”或“316SS”。但为了确保一致性，也许可以询问用户材料的具体表示形式。',
        '然而，技能文件提到，对于类别特征，需要使用与训练CSV中一致的字符串。我不知道训练数据中使用了什么。我可以尝试从bundle.pkl中推断，但那样可能比较麻烦。也许我可以假设是“316”。或者，我可以询问用户是否知道材料的具体表示形式。',
        '考虑到用户可能不熟悉这些细节，我可以先尝试使用“316”作为材料值。如果模型无法识别，预测脚本会报错。不过，我可以先检查一下训练数据。也许在checkpoints目录中有一个训练数据的CSV文件。让我看看有没有其他文件。',
        '检查checkpoints目录下是否有训练数据CSV文件',
        '/mnt/skills/custom/stress-corrosion-cgr-train-predict/checkpoints/run_20260401_150916',
        '只有这两个文件。没有CSV文件。也许训练技能使用了用户上传的数据。我不确定材料的具体表示形式。不过，我可以尝试使用“316”作为字符串。如果模型是在包含“316”或“316SS”的数据上训练的，它应该能处理。',
        '现在，我需要调用ask_clarification。我将询问缺失的参数。我会提供一个示例JSON模板，并询问用户如何填写这些值。',
        '我将使用ask_clarification，类型为missing_info。问题会详细说明需要哪些信息。我还会提到，模型需要氯化物浓度（chloride_ppm），但用户提到的是LiBF盐，这可能不含氯离子。我需要询问用户是否知道氯离子浓度，或者是否想使用其他盐类。也许模型可以接受其他盐类，但特征列是“chloride_ppm”，所以可能只接受氯化物浓度。',
        '那么，开始提问。',
      ],
      expertReply:
        '已为您匹配 [应力腐蚀预测专家]。检测到模型训练环境与输入组分存在偏置。为了确保预测的严谨性，我已为您准备好参数配置表，并对冲突项进行了标注。',
      formData: {
        material: '316',
        temperatureC: 500,
        stressMPa: '',
        exposureH: '',
        chloridePpm: 1000,
      },
      submitted: false,
    })
  }

  const handleStressCorrosionTraceToggle = (msgId) => {
    skipNextAutoScrollRef.current = true
    updateMessageById(currentId, msgId, (m) => ({ ...m, traceExpanded: !m.traceExpanded }))
  }

  const handleStressCorrosionFormUpdate = (msgId, patch) => {
    skipNextAutoScrollRef.current = true
    updateMessageById(currentId, msgId, (m) => ({
      ...m,
      formData: {
        ...(m.formData || {}),
        ...(patch || {}),
      },
    }))
  }

  const handleStressCorrosionSubmit = (msgId) => {
    const conv = conversations.find((c) => c.id === currentId)
    const cfg = conv?.messages?.find((m) => m.id === msgId)
    const fd = cfg?.formData || {}
    const stress = Number(fd.stressMPa)
    const exposure = Number(fd.exposureH)
    if (!Number.isFinite(stress) || stress <= 0 || !Number.isFinite(exposure) || exposure <= 0) return
    updateMessageById(currentId, msgId, (m) => ({ ...m, submitted: true }))
    appendAssistantMessage({
      id: Date.now() + 1,
      role: 'assistant',
      content:
        `已收到参数：Material=316，T=500°C，Stress=${stress} MPa，Exposure=${exposure} h，Chloride=${Number(fd.chloridePpm || 1000)} ppm。` +
        ' 已进入裂纹扩展速率预测队列（demo）。',
    })
  }

  const parseElectrolyteDesignNLFill = (text) => {
    const raw = String(text || '').trim()
    if (!raw) return null
    const lower = raw.toLowerCase()
    const side =
      lower.includes('formula b') || raw.includes('配方B') || raw.includes('B配方')
        ? 'B'
        : lower.includes('formula a') || raw.includes('配方A') || raw.includes('A配方')
          ? 'A'
          : null
    const additiveMatch = raw.match(/\b(FEC|VC|PS|DTD)\b/i)
    const wtMatch = raw.match(/(\d+(?:\.\d+)?)\s*%/)
    if (!side || !additiveMatch || !wtMatch) return null
    return {
      side,
      additive: additiveMatch[1].toUpperCase(),
      wt: Number(wtMatch[1]),
    }
  }

  const applyElectrolyteDesignNLFill = (formula, fill) => {
    const nf = normalizeElectrolyteDesignFormula(formula)
    const next = [...(nf.commonAdditives || [])]
    while (next.length < 3) next.push({ name: '', wt: 0 })
    const existingIdx = next.findIndex((x) => String(x?.name || '').toUpperCase() === fill.additive)
    const emptyIdx = next.findIndex((x) => !String(x?.name || '').trim())
    const targetIdx = existingIdx >= 0 ? existingIdx : emptyIdx >= 0 ? emptyIdx : 0
    next[targetIdx] = { ...next[targetIdx], name: fill.additive, wt: fill.wt }
    return { ...nf, commonAdditives: next }
  }

  const handleMDSimAssistantSelect = (questionText, prefill) => {
    const userMsg = { id: Date.now(), role: 'user', content: 'MD 模拟评估' }
    const base = {
      temperatureK: 298.15,
      pressureAtm: 1.0,
      cation: 'Li+',
      anions: ['PF6-'],
      totalSaltMolKg: 1.0,
      anionFractions: { 'PF6-': 1.0 },
      fractionType: 'mole', // mole | weight
      solvents: [
        { smiles: 'O=C1OCCOC1', fraction: 0.3 },
        { smiles: 'COC(=O)OC', fraction: 0.7 },
      ],
    }
    const mergedFormData = { ...base, ...(prefill || {}) }
    const formMsg = {
      id: Date.now() + 1,
      role: 'assistant',
      content: null,
      block: 'mdSimForm',
      mdStep: 1,
      questionText,
      formData: {
        ...mergedFormData,
      },
      submitted: false,
      taskId: null,
    }

    updateConversation(currentId, (c) => ({
      ...c,
      isDraft: false,
      messages: [...c.messages, userMsg, formMsg]
    }))
  }

  const handleMDSimFormUpdate = (msgId, patch) => {
    // In-card edits should not force scroll-to-bottom.
    skipNextAutoScrollRef.current = true
    updateMessageById(currentId, msgId, (m) => ({
      ...m,
      formData: {
        ...(m.formData || {}),
        ...(patch || {}),
      },
    }))
  }

  const handleMDSimToggleAnion = (msgId, anion) => {
    skipNextAutoScrollRef.current = true
    updateMessageById(currentId, msgId, (m) => {
      const prev = m.formData?.anions || []
      const exists = prev.includes(anion)
      let next = prev
      if (exists) {
        next = prev.filter((a) => a !== anion)
      } else {
        if (prev.length >= 2) return m
        next = [...prev, anion]
      }

      const prevFractions = m.formData?.anionFractions || {}
      const nextFractions = { ...prevFractions }
      // Ensure fractions exist for selected anions
      for (const a of next) {
        if (!Number.isFinite(Number(nextFractions[a]))) nextFractions[a] = next.length === 1 ? 1.0 : 0.5
      }
      // Remove fractions for deselected anions
      for (const k of Object.keys(nextFractions)) {
        if (!next.includes(k)) delete nextFractions[k]
      }
      // If only one anion selected, force to 1.0
      if (next.length === 1) nextFractions[next[0]] = 1.0

      return {
        ...m,
        formData: {
          ...(m.formData || {}),
          anions: next,
          anionFractions: nextFractions,
        },
      }
    })
  }

  const handleMDSimAnionFractionUpdate = (msgId, anion, value) => {
    skipNextAutoScrollRef.current = true
    updateMessageById(currentId, msgId, (m) => {
      const anions = m.formData?.anions || []
      const prev = m.formData?.anionFractions || {}
      const next = { ...prev, [anion]: value }
      // If only one anion, keep it pinned to 1.0
      if (anions.length === 1 && anions[0] === anion) next[anion] = 1.0
      return {
        ...m,
        formData: {
          ...(m.formData || {}),
          anionFractions: next,
        },
      }
    })
  }

  const handleMDSimSolventUpdate = (msgId, idx, patch) => {
    skipNextAutoScrollRef.current = true
    updateMessageById(currentId, msgId, (m) => {
      const prev = m.formData?.solvents || []
      const next = prev.map((row, i) => (i === idx ? { ...row, ...(patch || {}) } : row))
      return {
        ...m,
        formData: {
          ...(m.formData || {}),
          solvents: next,
        },
      }
    })
  }

  const handleMDSimAddSolventRow = (msgId) => {
    skipNextAutoScrollRef.current = true
    updateMessageById(currentId, msgId, (m) => {
      const prev = m.formData?.solvents || []
      if (prev.length >= 3) return m
      const next = [...prev, { smiles: '', fraction: 0 }]
      return {
        ...m,
        formData: {
          ...(m.formData || {}),
          solvents: next,
        },
      }
    })
  }

  const handleMDSimRemoveSolventRow = (msgId, idx) => {
    skipNextAutoScrollRef.current = true
    updateMessageById(currentId, msgId, (m) => {
      const prev = m.formData?.solvents || []
      const next = prev.filter((_, i) => i !== idx)
      return {
        ...m,
        formData: {
          ...(m.formData || {}),
          solvents: next.length ? next : [{ smiles: '', fraction: 0 }],
        },
      }
    })
  }

  const handleMDSimStep1Next = (formMsgId) => {
    const conv = conversations.find((c) => c.id === currentId) || conversations[0]
    const msg = conv?.messages?.find((m) => m.id === formMsgId)
    const fd = msg?.formData || {}
    const temperatureK = Number(fd.temperatureK ?? 298.15)
    const pressureAtm = 1.0

    // Mark current step as confirmed (frozen)
    updateMessageById(currentId, formMsgId, (m) => ({ ...m, formConfirmed: true }))

    const userMsg = {
      id: Date.now(),
      role: 'user',
      content: `环境设定\nTemperature (K)：${temperatureK}`
    }
    const assistantMsg = {
      id: Date.now() + 1,
      role: 'assistant',
      content: null,
      block: 'mdSimForm',
      mdStep: 2,
      formConfirmed: false,
      questionText: msg?.questionText,
      formData: {
        ...(msg?.formData || {}),
        temperatureK,
        pressureAtm,
      },
      submitted: false,
      taskId: null,
    }
    updateConversation(currentId, (c) => ({
      ...c,
      isDraft: false,
      messages: [...c.messages, userMsg, assistantMsg]
    }))
  }

  const handleMDSimSubmit = (formMsgId) => {
    const DISPLAY_TASK_ID = 'MD-SIM-20240311-001'
    const conv = conversations.find((c) => c.id === currentId) || conversations[0]
    const thisMsg = conv?.messages?.find((mm) => mm.id === formMsgId)
    const fd = thisMsg?.formData || {}

    // Mark step 2 as confirmed (frozen)
    updateMessageById(currentId, formMsgId, (m) => ({ ...m, formConfirmed: true }))

    const solvents = (fd.solvents || [])
      .map((s, i) => `SMILES${i + 1}=${(s?.smiles || '—').trim() || '—'} (${Number(s?.fraction ?? 0).toFixed(2)})`)
      .join('，')
    const anions = (fd.anions || []).join(' + ') || '—'
    const fracTypeLabel = fd.fractionType === 'weight' ? 'Weight fraction' : 'Mole fraction'
    const fracText = (fd.anions || [])
      .map((a) => `${a}=${Number(fd.anionFractions?.[a] ?? 0).toFixed(2)}`)
      .join('，')
    const userMsg = {
      id: Date.now(),
      role: 'user',
      content:
        `组分配置\nCation：${fd.cation || 'Li+'}\nAnions：${anions}\nTotal salt (mol/kg)：${Number(fd.totalSaltMolKg ?? 1.0)}\nSalt fractions（${fracTypeLabel}）：${fracText || '—'}\nSolvent fractions（${fracTypeLabel}）：${solvents || '—'}`
    }

    const assistantMsg = {
      id: Date.now() + 1,
      role: 'assistant',
      content: null,
      block: 'mdSimForm',
      mdStep: 3,
      formConfirmed: true,
      questionText: thisMsg?.questionText,
      formData: fd,
      submitted: true,
      taskId: DISPLAY_TASK_ID,
      progress: {
        percent: 6,
        stage: 'Queued',
        updatedAt: Date.now(),
      },
    }

    updateConversation(currentId, (c) => ({
      ...c,
      isDraft: false,
      messages: [...c.messages, userMsg, assistantMsg]
    }))

    // Simulate async progress updates (demo only)
    const step3MsgId = assistantMsg.id
    const convId = currentId
    const bump = (ms, progress) =>
      setTimeout(() => {
        updateMessageById(convId, step3MsgId, (m) => ({
          ...m,
          progress: { ...(m.progress || {}), ...progress, updatedAt: Date.now() }
        }))
      }, ms)
    bump(1200, { percent: 12, stage: 'Scheduled' })
    bump(3200, { percent: 22, stage: 'Running' })
    bump(6200, { percent: 31, stage: 'Analysis' })

    // Data deposition: add a Formulate task record as "In progress"
    const titleSalt = `${fd.cation || 'Li+'}/${(fd.anions || []).join('+') || 'Salt'}`
    const titleConc = fd.totalSaltMolKg != null ? `${fd.totalSaltMolKg} mol/kg` : ''
    addTask({
      id: DISPLAY_TASK_ID,
      type: 'asset',
      category: 'formulate',
      tool: 'Formulate',
      title: `MD simulation request · ${titleSalt} ${titleConc}`.trim(),
      meta: 'Ask · Scheduled',
      status: 'inProgress',
      createdAt: Date.now(),
      userId: 'U-10001',
    })
  }

  const processUserMessage = (userContent) => {
    if (!userContent.trim() || isTyping) return
    const conv = conversations.find(c => c.id === currentId) || conversations[0]
    const isFirstUserMessage = conv.messages.every(m => m.role !== 'user')

    if (isCycleCountReply(userContent, conv.messages)) {
      const cycles = parseInt(userContent, 10)
      const lastPreview = [...conv.messages].reverse().find(m => m.block === 'uploadPreview')
      const predictionMeta = createPredictionTask(lastPreview?.fileName)
      const convId = currentId

      const userMessage = { id: Date.now(), role: 'user', content: userContent }
      const assistantMsg = startPredictionRun({ convId, cycles, predictionMeta })
      updateConversation(currentId, c => ({
        ...c,
        isDraft: false,
        title: isFirstUserMessage ? `${userContent} cycles` : c.title,
        messages: [...c.messages, userMessage, assistantMsg]
      }))
      setInput('')
      return
    }

    const userMessage = { id: Date.now(), role: 'user', content: userContent }
    updateConversation(currentId, c => ({
      ...c,
      isDraft: false,
      title: isFirstUserMessage && userContent ? (userContent.slice(0, 20) + (userContent.length > 20 ? '...' : '')) : c.title,
      messages: [...c.messages, userMessage]
    }))
    setInput('')

    // Demo: natural-language form fill in electrolyte design config step.
    const activeConfigMsg = [...(conv.messages || [])]
      .reverse()
      .find((m) => m.role === 'assistant' && m.block === 'electrolyteDesignConfig' && !m.formSubmitted)
    const nlFill = parseElectrolyteDesignNLFill(userContent)
    if (activeConfigMsg && nlFill) {
      const baseA = normalizeElectrolyteDesignFormula(activeConfigMsg.formulaA || createElectrolyteDesignFormula('A'))
      const baseB = normalizeElectrolyteDesignFormula(activeConfigMsg.formulaB || createElectrolyteDesignFormula('B'))
      const nextA = nlFill.side === 'A' ? applyElectrolyteDesignNLFill(baseA, nlFill) : baseA
      const nextB = nlFill.side === 'B' ? applyElectrolyteDesignNLFill(baseB, nlFill) : baseB

      handleElectrolyteDesignPatchFormula(activeConfigMsg.id, nlFill.side, (prev) => {
        return applyElectrolyteDesignNLFill(prev, nlFill)
      })

      appendAssistantMessage({
        id: Date.now() + 1,
        role: 'assistant',
        content: null,
        block: 'electrolyteDesignConfig',
        userQuestion: activeConfigMsg.userQuestion,
        batterySystem: activeConfigMsg.batterySystem,
        formulaA: nextA,
        formulaB: nextB,
        formSubmitted: false,
        autoFilledNotice: `已将 Formula ${nlFill.side} 自动填写为：${nlFill.additive} = ${nlFill.wt}%。请确认是否继续提交预测。`,
      })
      return
    }

    if (isLifePredictionQuestion(userContent)) {
      handleLifePredictionDemo()
      return
    }

    if (isEcQuestion(userContent)) {
      handleEcDemo()
      return
    }

    if (isPredictionComparisonRequest(userContent)) {
      handlePredictionComparisonDemo(conv)
      return
    }

    if (isLiteratureResearchIntent(userContent)) {
      handleLiteratureSelectionPhase(userContent)
      return
    }

    if (isMDSimIntent(userContent)) {
      handleMDSimSelectionPhase(userContent)
      return
    }

    if (isElectrolyteDesignIntent(userContent)) {
      handleElectrolyteDesignStart(userContent)
      return
    }

    if (isStressCorrosionCGRIntent(userContent)) {
      handleStressCorrosionDemoStart()
      return
    }

    if (userContent.trim() === ELECTROLYTE_SOLVENT_DEMO_Q || userContent.includes('电解质溶剂选择')) {
      appendAssistantMessage({
        id: Date.now() + 1,
        role: 'assistant',
        content: null,
        block: 'moleculeSkillDemo',
        questionText: userContent,
        answerText: buildElectrolyteSolventDemoAnswer(),
      })
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

  const handleLiteratureFollowUpClick = (promptText) => {
    if (!promptText?.trim() || isTyping) return
    processUserMessage(promptText.trim())
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const userContent = input.trim()
    if (!userContent || isTyping) return
    setInput('')
    processUserMessage(userContent)
  }

  const formatMsgTime = (id) => {
    const t = new Date(Number(id) || Date.now())
    const pad = (n) => String(n).padStart(2, '0')
    return `${t.getFullYear()}/${pad(t.getMonth() + 1)}/${pad(t.getDate())} ${pad(t.getHours())}:${pad(t.getMinutes())}`
  }

  const handleWelcomePrompt = (text) => {
    const advanceToLitPick =
      tourActive && step === TOUR_STEP.ASK_PROMPT && isLiteratureResearchIntent(text)
    processUserMessage(text)
    if (advanceToLitPick) {
      queueMicrotask(() => goToTourStep(TOUR_STEP.LITERATURE_PICK))
    }
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
    <div className={`ask-page ${sidebarCollapsed ? 'ask-page--sidebar-collapsed' : ''}`}>
      <aside className={`ask-sidebar ${sidebarCollapsed ? 'ask-sidebar--collapsed' : ''}`}>
        <button type="button" className="ask-quick-item ask-quick-item--new ask-search-trigger" onClick={() => setIsSearchOpen(true)}>
          <span className="ask-quick-icon" aria-hidden>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-3.2-3.2" />
            </svg>
          </span>
          <span className="ask-sidebar-label">Search</span>
        </button>

        <div className="ask-quick-menu">
          <button type="button" className="ask-quick-item ask-quick-item--new" onClick={handleNewConversation}>
            <span className="ask-quick-icon">⊕</span>
            <span className="ask-sidebar-label">New Chat</span>
          </button>
        </div>

        <div className="ask-history">
          <div className="ask-history-label">HISTORY</div>
          <ul className="ask-research-list">
            {displayedConversations.map((conv) => (
              <li key={conv.id}>
                <div className={`ask-research-item-wrap ${conv.id === currentId ? 'active' : ''}`}>
                  <button
                    type="button"
                    className="ask-research-item"
                    onClick={() => handleSelectConversation(conv.id)}
                    title={conv.title}
                  >
                    {conv.pinned ? <span className="ask-research-icon">📌</span> : null}
                    {editingId === conv.id ? (
                      <input
                        ref={renameInputRef}
                        type="text"
                        className="ask-research-input"
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
                      <span className="ask-research-text">{conv.title}</span>
                    )}
                  </button>
                  <button
                    type="button"
                    className="ask-research-menu-btn"
                    onClick={(e) => {
                      e.stopPropagation()
                      setMenuOpenId((prev) => (prev === conv.id ? null : conv.id))
                    }}
                    aria-label="Conversation settings"
                    aria-haspopup="menu"
                    aria-expanded={menuOpenId === conv.id}
                    title="Conversation settings"
                  >
                    <svg className="ask-research-menu-icon" width="16" height="16" viewBox="0 0 16 16" aria-hidden>
                      <circle cx="3.5" cy="8" r="1.5" fill="currentColor" />
                      <circle cx="8" cy="8" r="1.5" fill="currentColor" />
                      <circle cx="12.5" cy="8" r="1.5" fill="currentColor" />
                    </svg>
                  </button>
                  {menuOpenId === conv.id && (
                    <div className="ask-research-menu" role="menu" onClick={(e) => e.stopPropagation()}>
                      <button type="button" className="ask-research-menu-item" role="menuitem" onClick={(e) => handleTogglePinConversation(e, conv.id)}>
                        {conv.pinned ? 'Unpin' : 'Pin'}
                      </button>
                      <button type="button" className="ask-research-menu-item" role="menuitem" onClick={(e) => handleStartRename(e, conv)}>
                        Rename
                      </button>
                      <button type="button" className="ask-research-menu-item danger" role="menuitem" onClick={(e) => handleDeleteConversation(e, conv.id)}>
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="ask-sidebar-spacer" aria-hidden="true" />
      </aside>
      {isSearchOpen && (
        <div className="ask-search-modal-overlay" onClick={() => setIsSearchOpen(false)}>
          <div className="ask-search-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ask-search-modal-top">
              <input
                type="text"
                className="ask-search-modal-input"
                placeholder="Search chats..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
              <button
                type="button"
                className="ask-search-close-btn"
                onClick={() => setIsSearchOpen(false)}
                aria-label="Close search"
              >
                ×
              </button>
            </div>

            <button
              type="button"
              className="ask-search-new-chat-row"
              onClick={() => {
                handleNewConversation()
                setIsSearchOpen(false)
                setSearchQuery('')
              }}
            >
              <span className="ask-search-new-chat-plus">＋</span>
              New Chat
            </button>

            <div className="ask-search-modal-list-wrap">
              <div className="ask-search-modal-label">RECENT CHATS</div>
              <ul className="ask-search-modal-list">
                {searchableConversations.map((conv) => (
                  <li key={conv.id}>
                    <button
                      type="button"
                      className="ask-search-modal-item"
                      onClick={() => {
                        handleSelectConversation(conv.id)
                        setIsSearchOpen(false)
                      }}
                      title={conv.title}
                    >
                      <span className="ask-search-modal-item-icon">◦</span>
                      <span className="ask-search-modal-item-text">{conv.title}</span>
                    </button>
                  </li>
                ))}
                {searchableConversations.length === 0 && (
                  <li className="ask-search-empty">No chat found</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}

      <div className="ask-main">
        <div className="ask-main-topbar">
          <button
            type="button"
            className="ask-sidebar-floating-toggle"
            onClick={() => setSidebarCollapsed((v) => !v)}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <span aria-hidden>☰</span>
          </button>
          {!showWelcomeState && (
            <div className="ask-conv-title-wrap">
              <div className="ask-conv-title" title={current.title}>{current.title}</div>
              <div className="ask-conv-meta">
                <span className="ask-conv-tokens-value">
                  {estimateTokensForConversation(current).toLocaleString()} tokens
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="chat-container">
          {showWelcomeState ? (
            <div className="ask-welcome" data-onboarding-anchor="ask-welcome">
              <h2 className="ask-welcome-title">{welcomeTitle}</h2>
              <p className="ask-welcome-subtitle">{welcomeSubtitle}</p>
              <div className="ask-welcome-tools-grid">
                {toolCards.map((card) => (
                  <button
                    key={card.title}
                    type="button"
                    className="ask-welcome-tool-card"
                    onClick={() => handleWelcomeToolClick(card.title)}
                  >
                    <div className={`ask-welcome-tool-icon tone-${card.tone}`}>{card.icon}</div>
                    <div className="ask-welcome-tool-content">
                      <div className="ask-welcome-tool-title">{card.title}</div>
                      <div className="ask-welcome-tool-desc">{card.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
              <p className="ask-welcome-subtitle ask-welcome-questions-title">Suggested Research Goals</p>
              <div className="ask-welcome-prompts" data-onboarding-anchor="ask-prompts">
                {prompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    className="ask-welcome-prompt-chip"
                    onClick={() => handleWelcomePrompt(prompt)}
                  >
                    <span>{prompt}</span>
                    <span className="ask-welcome-prompt-arrow">↗</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="messages">
              {messages.map((msg) => (
                <div key={msg.id} className={`message message-${msg.role}`}>
                  <div
                    className={`message-content${
                      msg.block === 'assetForwardCard' ||
                      (msg.role === 'assistant' &&
                        (msg.block === 'literatureForm' ||
                          msg.block === 'industryNewsForm' ||
                          msg.block === 'electrolyteDesignIntro' ||
                          msg.block === 'electrolyteDesignSystemPick' ||
                          msg.block === 'electrolyteDesignConfig' ||
                          msg.block === 'electrolyteDesignThinking' ||
                          msg.block === 'electrolyteDesignResult' ||
                          msg.block === 'stressCorrosionCGRDemo' ||
                          msg.block === 'lifePrediction'))
                        ? ' message-content--fit-card'
                        : ''
                    }`}
                  >
                  {msg.block === 'lifePrediction' && (
                    <div className="ask-lit-intro">
                      <div className="ask-lit-answer-box">
                        <h4 className="ask-msg-heading">常用思路</h4>
                        <ul className="ask-msg-list">
                          <li>用容量或内阻随循环次数衰减的曲线做经验拟合（例如容量–圈数关系）。</li>
                          <li>从完整充放电曲线（电压、电流、时间等）提取特征，训练回归或可靠性模型。</li>
                          <li>测试数据更充分时，可结合退化机理或物理信息模型，提升外推可信度。</li>
                        </ul>
                        <p className="ask-msg-para">
                          在 MU <strong>Workbench</strong> 中可使用内置 <strong>Life Prediction</strong> 工具：上传循环 CSV
                          后会自动抽取特征，并给出剩余寿命估计与置信区间。
                        </p>
                      </div>

                      <div className="ask-lifeprediction-tools-grid">
                        <div className="ask-lit-select-grid">
                          <button
                            type="button"
                            className="ask-lit-select-card ask-lit-select-card--primary"
                            onClick={handleNewPredictionInfo}
                          >
                            <div className="ask-lit-select-head">
                              <span className="ask-lit-select-icon wrap-primary" aria-hidden>
                                ⏱
                              </span>
                              <div className="ask-lit-select-text">
                                <div className="ask-lit-select-title">Life Prediction 工具</div>
                                <div className="ask-lit-select-desc">上传数据 → 自动抽取特征 → 预测剩余寿命。</div>
                              </div>
                            </div>
                            <span className="ask-lit-select-foot">新建预测 →</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                  {msg.block === 'uploadFormat' && (
                    <>
                      <div className="ask-format-card">
                        <div className="ask-format-title">CSV 数据格式要求</div>
                        <div className="ask-format-body">
                          <div className="ask-format-row">
                            <span className="ask-format-key">必填列：</span>
                            barcode, cycle_id, current (A), voltage (V), time (s)
                          </div>
                          <div className="ask-format-row">
                            <span className="ask-format-key">电流方向：</span>
                            充电为 +，放电为 −
                          </div>
                          <div className="ask-format-row">
                            <span className="ask-format-key">单位：</span>
                            电流 A，电压 V，时间 s
                          </div>
                          <div className="ask-format-row">
                            <span className="ask-format-key">数据要求：</span>
                            建议 ≥100 圈，且按时间排序
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
                        上传数据
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
                  {msg.block === 'predictionRun' && (
                    <>
                      <div className="ask-thinking-card">
                        <div className="ask-thinking-stream">
                          <span className="ask-thinking-label">Thinking</span>
                          <span className="ask-thinking-text">{msg.content || 'Processing...'}</span>
                          {msg.thinkingDone && (
                            <button
                              type="button"
                              className="ask-thinking-toggle"
                              onClick={() => handleToggleThinkingExpand(msg.id)}
                            >
                              {msg.thinkingExpanded ? 'Collapse details' : 'Expand details'}
                            </button>
                          )}
                        </div>
                        {msg.thinkingDone && msg.thinkingExpanded && (
                          <div className="ask-thinking-phases">
                            {groupThinkingTrace(msg.trace || []).map((group, idx) => (
                              <div className="ask-thinking-phase" key={`${group.phase}-${idx}`}>
                                <div className="ask-thinking-phase-title">{group.phase}</div>
                                <ul className="ask-thinking-trace">
                                  {group.details.map((detail, detailIdx) => (
                                    <li key={detailIdx}>{detail}</li>
                                  ))}
                                </ul>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      {msg.thinkingDone && (
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
                    </>
                  )}
                  {msg.block === 'predictionCompare' && (
                    <>
                      <p className="ask-msg-para">Simulated comparison analysis for the two cells:</p>
                      <div className="ask-preview-table-wrap">
                        <table className="ask-preview-table">
                          <thead>
                            <tr>
                              <th>Cell</th>
                              <th>Source File</th>
                              <th>Predicted Cycle Life</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td>{msg.left?.barcode}</td>
                              <td>{msg.left?.fileName}</td>
                              <td>{msg.left?.cycleLife}</td>
                            </tr>
                            <tr>
                              <td>{msg.right?.barcode}</td>
                              <td>{msg.right?.fileName}</td>
                              <td>{msg.right?.cycleLife}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      <PredictionCompareChartInline left={msg.left} right={msg.right} />
                      <div className="ask-compare-summary">
                        <p><strong>Key finding:</strong> {msg.better} shows longer predicted life than {msg.worse} by about {msg.gap} cycles ({msg.gapPct}%).</p>
                        <p><strong>Possible reason (simulated):</strong> {msg.better} has a slower early-stage degradation slope and better voltage-plateau stability.</p>
                        <p><strong>Recommendation:</strong> Prioritize process/window review for {msg.worse} and run one more verification batch before model retraining.</p>
                      </div>
                    </>
                  )}
                  {msg.block === 'literatureIntro' && (() => {
                    const litMeta = buildGeneralResearchAnswerMeta(msg.questionText)
                    const followUps = msg.followUpSuggestions?.length
                      ? msg.followUpSuggestions
                      : litMeta.followUps || []
                    return (
                    <div className="ask-lit-intro">
                      <div className="ask-lit-answer-box">
                        {litMeta.kind === 'split' ? (
                          <>
                            <div
                              className="ask-markdown"
                              dangerouslySetInnerHTML={{
                                __html: marked.parse(litMeta.leadMarkdown)
                              }}
                            />
                            {followUps.length > 0 && (
                              <div className="ask-lit-suggested" role="group" aria-label="建议下一步">
                                <div className="ask-lit-suggested-label">
                                  如果你愿意，我下一步可以直接帮你整理成以下任意一种形式：
                                </div>
                                <div className="ask-lit-suggested-chips">
                                  {followUps.map((label, idx) => (
                                    <button
                                      key={`${label}-${idx}`}
                                      type="button"
                                      className="ask-lit-suggested-chip"
                                      disabled={isTyping}
                                      onClick={() => handleLiteratureFollowUpClick(label)}
                                    >
                                      {label}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                            <div
                              className="ask-markdown"
                              dangerouslySetInnerHTML={{
                                __html: marked.parse(litMeta.tailMarkdown)
                              }}
                            />
                          </>
                        ) : (
                          <div
                            className="ask-markdown"
                            dangerouslySetInnerHTML={{
                              __html: marked.parse(buildGeneralResearchAnswer(msg.questionText))
                            }}
                          />
                        )}
                      </div>
                      <div className="ask-lit-tools-section">
                        <div className="ask-lit-tools-hint" role="note">
                          <div className="ask-lit-tools-hint-body">
                            <div className="ask-lit-tools-hint-title">想要更系统、更深入的分析？</div>
                            <p className="ask-lit-tools-hint-text">
                              下面的工具可以按你的问题自动组织文献证据、提炼方法逻辑，并生成可复用的结构化报告；若你更关注市场与产业节奏，可选择行业快讯先行概览。
                            </p>
                          </div>
                        </div>
                        <div className="ask-lit-select-grid">
                          <button
                            type="button"
                            className="ask-lit-select-card ask-lit-select-card--primary"
                            data-onboarding-anchor="tour-literature-assistant"
                            onClick={() => handleLiteratureAssistantSelect('muLiterature')}
                          >
                            <div className="ask-lit-select-head">
                              <span className="ask-lit-select-icon wrap-primary" aria-hidden>📚</span>
                              <div className="ask-lit-select-text">
                                <div className="ask-lit-select-title">MU 文献助手</div>
                                <div className="ask-lit-select-desc">深入学术库检索，含算法解析、参数对比与综述报告。</div>
                              </div>
                            </div>
                            <span className="ask-lit-select-foot">进入文献研究与报告 →</span>
                          </button>
                          <button
                            type="button"
                            className="ask-lit-select-card ask-lit-select-card--news"
                            onClick={() => handleLiteratureAssistantSelect('industryNews')}
                          >
                            <div className="ask-lit-select-head">
                              <span className="ask-lit-select-icon wrap-news" aria-hidden>📰</span>
                              <div className="ask-lit-select-text">
                                <div className="ask-lit-select-title">实时行业新闻</div>
                                <div className="ask-lit-select-desc">聚合近 24–72h 关键动态，适合把握热点与政策风向。</div>
                              </div>
                            </div>
                            <span className="ask-lit-select-foot">抓取行业快讯 →</span>
                          </button>
                        </div>
                      </div>
                    </div>
                    )
                  })()}
                  {msg.block === 'mdSimIntro' && (
                    <div className="ask-lit-intro">
                      <div className="ask-lit-answer-box">
                        <div
                          className="ask-markdown"
                          dangerouslySetInnerHTML={{
                            __html: marked.parse(buildMDSimCommonAnswer(msg.questionText))
                          }}
                        />
                      </div>
                      <div className="ask-lit-tools-section">
                        <div className="ask-lit-tools-hint" role="note">
                          <div className="ask-lit-tools-hint-body">
                            <div className="ask-lit-tools-hint-title">想直接进入仿真配置？</div>
                            <p className="ask-lit-tools-hint-text">
                              我们将基于 **高级极化力场** 自动调度 MD 仿真。下一步只需补齐温度、压力与组分参数即可。
                            </p>
                          </div>
                        </div>
                        <div className="ask-lit-select-grid">
                          <button
                            type="button"
                            className="ask-lit-select-card ask-lit-select-card--primary"
                            onClick={() => handleMDSimAssistantSelect(msg.questionText, msg.prefill)}
                          >
                            <div className="ask-lit-select-head">
                              <span className="ask-lit-select-icon wrap-primary" aria-hidden>🧬</span>
                              <div className="ask-lit-select-text">
                                <div className="ask-lit-select-title">MD 模拟专家</div>
                                <div className="ask-lit-select-desc">极化力场 · 自动调度 · 预计 1-3 天</div>
                              </div>
                            </div>
                            <span className="ask-lit-select-foot">进入 MD 参数配置 →</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                  {msg.block === 'electrolyteDesignIntro' && (
                    <div className="ask-lit-intro">
                      <div className="ask-lit-answer-box">
                        <div
                          className="ask-markdown"
                          dangerouslySetInnerHTML={{
                            __html: marked.parse(buildElectrolyteDesignCommonAnswer(msg.userQuestion)),
                          }}
                        />
                      </div>
                      <div className="ask-lit-tools-section">
                        <div className="ask-lit-tools-hint" role="note">
                          <div className="ask-lit-tools-hint-body">
                            <div className="ask-lit-tools-hint-title">需要结构化工具？</div>
                            <p className="ask-lit-tools-hint-text">
                              点击下方卡片进入 <strong>电解液设计专家</strong>，将按步骤完成体系选择、A/B 配方配置与性能预测对比。
                            </p>
                          </div>
                        </div>
                        <div className="ask-lit-select-grid">
                          <button
                            type="button"
                            className="ask-lit-select-card ask-lit-select-card--primary"
                            disabled={!!msg.expertActivated}
                            onClick={() => handleElectrolyteDesignExpertSelect(msg.id, msg.userQuestion)}
                          >
                            <div className="ask-lit-select-head">
                              <span className="ask-lit-select-icon wrap-primary" aria-hidden>
                                🧪
                              </span>
                              <div className="ask-lit-select-text">
                                <div className="ask-lit-select-title">电解液设计专家</div>
                                <div className="ask-lit-select-desc">物性预测引擎 · A/B 配方对比 · 界面 SEI 评估</div>
                              </div>
                            </div>
                            <span className="ask-lit-select-foot">进入电解液设计配置 →</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                  {msg.block === 'electrolyteDesignSystemPick' && (
                    <div className="ask-lit-intro">
                      <p className="ask-ed-step-lead">
                        已为您激活 <strong>电解液设计专家</strong>。请先选择您的目标电池体系，我将为您调取针对性的物理预测引擎。
                      </p>
                      <div className="ask-lit-select-grid ask-ed-system-grid ask-ed-system-grid--2col">
                        {ELECTROLYTE_DESIGN_SYSTEMS.map((s) => (
                          <div
                            key={s.id}
                            role="button"
                            tabIndex={0}
                            aria-disabled={!!msg.picked || s.disabled}
                            className={`ask-lit-select-card ask-ed-system-card ${s.disabled ? 'ask-lit-select-card--future' : ''}`}
                            onClick={() => {
                              if (msg.picked || s.disabled) return
                              handleElectrolyteDesignPickSystem(msg.id, s.id)
                            }}
                            onKeyDown={(e) => {
                              if (e.key !== 'Enter' && e.key !== ' ') return
                              e.preventDefault()
                              if (msg.picked || s.disabled) return
                              handleElectrolyteDesignPickSystem(msg.id, s.id)
                            }}
                          >
                            <div className="ask-lit-select-head">
                              <span className="ask-lit-select-icon wrap-primary" aria-hidden>
                                🔋
                              </span>
                              <div className="ask-lit-select-text">
                                <div className="ask-lit-select-title">{s.name}</div>
                                <div className="ask-lit-select-desc">{s.remark}</div>
                              </div>
                            </div>
                            <div className="ask-lit-select-foot ask-ed-system-foot">
                              <span className="ask-ed-system-foot-left">
                                <button
                                  type="button"
                                  className="ask-ed-view-detail"
                                  onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    handleElectrolyteDesignToggleSystemDetail(msg.id, s.id)
                                  }}
                                >
                                  {(Array.isArray(msg.expandedSystemIds) ? msg.expandedSystemIds : []).includes(s.id) ? '收起详情' : '查看详情'}
                                </button>
                              </span>
                              <span className="ask-ed-system-foot-right">
                                {s.disabled ? '(to be launched in MU3)' : '选择此体系 →'}
                              </span>
                            </div>
                            {(Array.isArray(msg.expandedSystemIds) ? msg.expandedSystemIds : []).includes(s.id) && (
                              <div className="ask-ed-system-detail" onClick={(e) => e.stopPropagation()}>
                                <div className="ask-ed-system-detail-title">Cell Specifications</div>
                                {(() => {
                                  const spec = ELECTROLYTE_SYSTEM_SPECS[s.id]
                                  if (!spec) return <div className="ask-ed-system-detail-empty">No details available.</div>
                                  return (
                                    <div className="ask-ed-system-spec-grid">
                                      <div className="ask-ed-spec-row">
                                        <div className="ask-ed-spec-k">Cathode</div>
                                        <div className="ask-ed-spec-v">{spec.cathode}</div>
                                      </div>
                                      <div className="ask-ed-spec-row">
                                        <div className="ask-ed-spec-k">Anode</div>
                                        <div className="ask-ed-spec-v">{spec.anode}</div>
                                      </div>
                                      <div className="ask-ed-spec-row">
                                        <div className="ask-ed-spec-k">Benchmark Electrolyte</div>
                                        <div className="ask-ed-spec-v">{spec.benchmarkElectrolyte}</div>
                                      </div>
                                      <div className="ask-ed-spec-row">
                                        <div className="ask-ed-spec-k">Cell Design</div>
                                        <div className="ask-ed-spec-v">{spec.cellDesign}</div>
                                      </div>
                                    </div>
                                  )
                                })()}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {msg.block === 'electrolyteDesignConfig' && (() => {
                    const sys = ELECTROLYTE_DESIGN_SYSTEMS.find((s) => s.id === msg.batterySystem)
                    const frozen = !!msg.formSubmitted
                    const renderFormulaPanel = (side) => {
                      const key = side === 'B' ? 'formulaB' : 'formulaA'
                      const label = side === 'B' ? 'Formula B' : 'Formula A'
                      const f = normalizeElectrolyteDesignFormula(msg[key] || createElectrolyteDesignFormula(side))
                      return (
                        <div className="ask-ed-panel" key={key}>
                          <div className="ask-ed-panel-title">{label}</div>
                          <div className="ask-ed-subsection ask-ed-subsection--card">
                            <div className="ask-ed-additive-grid">
                              {[0, 1, 2].map((i) => {
                                const row = (f.commonAdditives || [])[i] || { name: '', wt: 0 }
                                return (
                                  <div key={`${side}-common-${i}`} className="ask-ed-additive-row2">
                                    <label className="ask-ed-additive-label">
                                      <span className="ask-ed-additive-label-text">Common Additive {i + 1}</span>
                                      <select
                                        value={row.name || ''}
                                        disabled={frozen}
                                        onChange={(e) =>
                                          handleElectrolyteDesignPatchFormula(msg.id, side, (prev) => {
                                            const nf = normalizeElectrolyteDesignFormula(prev)
                                            const next = [...(nf.commonAdditives || [])]
                                            while (next.length < 3) next.push({ name: '', wt: 0 })
                                            next[i] = { ...next[i], name: e.target.value }
                                            return { ...nf, commonAdditives: next }
                                          })
                                        }
                                      >
                                        <option value="" disabled>
                                          Select additive
                                        </option>
                                        {ELECTROLYTE_DESIGN_ADDITIVES.map((n) => (
                                          <option key={n} value={n}>
                                            {n}
                                          </option>
                                        ))}
                                      </select>
                                    </label>
                                    <label className="ask-ed-additive-wt">
                                      <span className="ask-ed-additive-label-text">Weight Percentage (wt%)</span>
                                      <input
                                        type="number"
                                        inputMode="decimal"
                                        step="0.1"
                                        min="0"
                                        max="20"
                                        value={Number(row.wt ?? 0)}
                                        disabled={frozen}
                                        onChange={(e) =>
                                          handleElectrolyteDesignPatchFormula(msg.id, side, (prev) => {
                                            const nf = normalizeElectrolyteDesignFormula(prev)
                                            const next = [...(nf.commonAdditives || [])]
                                            while (next.length < 3) next.push({ name: '', wt: 0 })
                                            next[i] = { ...next[i], wt: Number(e.target.value) }
                                            return { ...nf, commonAdditives: next }
                                          })
                                        }
                                      />
                                    </label>
                                  </div>
                                )
                              })}

                              <div className="ask-ed-additive-row2 ask-ed-additive-row2--smiles">
                                <label className="ask-ed-additive-label">
                                  <span className="ask-ed-additive-label-text">New Additive SMILES</span>
                                  <input
                                    type="text"
                                    value={String(f.customAdditive?.smiles || '')}
                                    placeholder="Enter valid SMILES for additive of interest"
                                    disabled={frozen}
                                    onChange={(e) =>
                                      handleElectrolyteDesignPatchFormula(msg.id, side, (prev) => {
                                        const nf = normalizeElectrolyteDesignFormula(prev)
                                        return {
                                          ...nf,
                                          customAdditive: { ...(nf.customAdditive || {}), smiles: e.target.value },
                                        }
                                      })
                                    }
                                  />
                                </label>
                                <label className="ask-ed-additive-wt">
                                  <span className="ask-ed-additive-label-text">Weight Percentage (wt%)</span>
                                  <input
                                    type="number"
                                    inputMode="decimal"
                                    step="0.1"
                                    min="0"
                                    max="20"
                                    value={Number(f.customAdditive?.wt ?? 0)}
                                    disabled={frozen}
                                    onChange={(e) =>
                                      handleElectrolyteDesignPatchFormula(msg.id, side, (prev) => {
                                        const nf = normalizeElectrolyteDesignFormula(prev)
                                        return {
                                          ...nf,
                                          customAdditive: { ...(nf.customAdditive || {}), wt: Number(e.target.value) },
                                        }
                                      })
                                    }
                                  />
                                </label>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    }
                    return (
                      <div className="ask-ed-follow ask-ed-follow--solo">
                        {msg.autoFilledNotice ? (
                          <div className="ask-ed-autofill-note">{msg.autoFilledNotice}</div>
                        ) : null}
                        <div className="ask-ed-system-picked">
                          目标体系：
                          <strong>{sys?.name || msg.batterySystem}</strong>
                          {sys?.remark ? (
                            <span className="ask-ed-system-picked-remark"> - {sys.remark}</span>
                          ) : null}
                        </div>
                        <p className="ask-ed-config-hint">请配置 Formula A 与 Formula B，完成后生成预测对比。</p>
                        <div className="ask-ed-dual-grid">
                          {renderFormulaPanel('A')}
                          {renderFormulaPanel('B')}
                        </div>
                        <button
                          type="button"
                          className="inline-action-btn ask-ed-submit"
                          disabled={frozen}
                          onClick={() => handleElectrolyteDesignRunCompare(msg.id)}
                        >
                          📊 生成性能预测对比
                        </button>
                      </div>
                    )
                  })()}
                  {msg.block === 'electrolyteDesignThinking' && (() => {
                    const thinkingLines = [
                      '🔍 正在提取分子官能团特征...',
                      '🧠 正在运行极化力场神经元网络推理...',
                      '⚖️ 正在进行界面成膜（SEI）稳定性评估...',
                    ]
                    return (
                      <div className="ask-ed-thinking-stack">
                        <div className="ask-ed-thinking">
                          <div className="ask-ed-thinking-head">
                            <div className="ask-ed-thinking-title">The Live Thinking</div>
                            <button
                              type="button"
                              className="ask-ed-thinking-toggle"
                              onClick={() => handleElectrolyteDesignToggleThinking(msg.id)}
                            >
                              {msg.thinkingExpanded ? '收起' : '展开'}
                            </button>
                          </div>
                          {msg.thinkingExpanded && (
                            <ul className="ask-ed-thinking-list">
                              {thinkingLines.map((line, i) => {
                                const done = msg.thinkingIndex > i || !!msg.thinkingDone
                                const active = !msg.thinkingDone && msg.thinkingIndex === i
                                return (
                                  <li
                                    key={line}
                                    className={`ask-ed-thinking-item ${done ? 'done' : ''} ${active ? 'active' : ''}`}
                                  >
                                    <span className="ask-ed-thinking-dot" aria-hidden />
                                    {line}
                                  </li>
                                )
                              })}
                            </ul>
                          )}
                        </div>
                        {msg.thinkingDone && msg.result && (
                          <div className="ask-ed-perf-card">
                            <div className="ask-ed-perf-head">
                              <div className="ask-ed-perf-head-left">
                                <div className="ask-ed-perf-title">{msg.result.cellPerformance?.title || 'Cell Performance Prediction'}</div>
                                <div className="ask-ed-perf-sub">{msg.result.cellPerformance?.subtitle || 'Performances of Formulation B compared with Formulation A'}</div>
                              </div>
                            </div>
                            <div className="ask-ed-perf-note">{msg.result.cellPerformance?.note}</div>
                            <div className="ask-ed-perf-body">
                              {(msg.result.cellPerformance?.temps || []).map((t) => (
                                <div key={t.label} className="ask-ed-perf-section">
                                  <div className="ask-ed-perf-section-title">{t.label}</div>
                                  <div className="ask-ed-perf-metrics">
                                    {(t.metrics || []).map((m) => (
                                      <div key={m.key} className="ask-ed-perf-metric">
                                        <div className="ask-ed-perf-metric-label">{m.label}</div>
                                        {m.kind === 'pct' ? (
                                          <div className={`ask-ed-perf-pill ${Number(m.value) >= 0 ? 'up' : 'down'}`}>
                                            <span className="ask-ed-perf-arrow" aria-hidden>
                                              {Number(m.value) >= 0 ? '↑' : '↓'}
                                            </span>
                                            <span>{Math.abs(Number(m.value) || 0).toFixed(2)}%</span>
                                          </div>
                                        ) : (
                                          <div
                                            className={`ask-ed-perf-ce ${m.value === 'up' ? 'up' : 'down'}`}
                                            aria-label="Coulombic Efficiency trend"
                                          >
                                            <span aria-hidden>{m.value === 'up' ? '↑' : '↓'}</span>
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                            <div className="ask-ed-perf-actions">
                              <button
                                type="button"
                                className="inline-action-btn"
                                disabled={!!msg.llmAnalyzed}
                                onClick={() => handleElectrolyteDesignLLMAnalyze(msg.id)}
                              >
                                LLM 分析
                              </button>
                              <button
                                type="button"
                                className="inline-action-btn"
                                onClick={() => navigate('/tasks-data/electrolyte-design')}
                              >
                                在 Assets 中查看
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })()}
                  {msg.block === 'electrolyteDesignLLMAnalysis' && (
                    <div className="ask-lit-answer-box">
                      <div
                        className="ask-markdown"
                        dangerouslySetInnerHTML={{
                          __html: marked.parse(msg.markdown || ''),
                        }}
                      />
                    </div>
                  )}
                  {msg.block === 'stressCorrosionCGRDemo' && (() => {
                    const fd = msg.formData || {}
                    const stressOk = Number.isFinite(Number(fd.stressMPa)) && Number(fd.stressMPa) > 0
                    const exposureOk = Number.isFinite(Number(fd.exposureH)) && Number(fd.exposureH) > 0
                    const canRun = stressOk && exposureOk
                    return (
                      <div className="ask-scc-root">
                        <div className="ask-format-card ask-scc-thinking-card">
                          <div className="ask-format-title ask-scc-thinking-title-row">
                            <span className="ask-scc-thinking-label">Omni Thinking...</span>
                            <button
                              type="button"
                              className="ask-scc-trace-toggle"
                              onClick={() => handleStressCorrosionTraceToggle(msg.id)}
                            >
                              {msg.traceExpanded ? '收起' : '展开'}
                            </button>
                          </div>
                          {msg.traceExpanded && (
                            <div className="ask-format-body ask-scc-thinking-body">
                              <ul className="ask-msg-list ask-scc-trace-msg-list">
                                {(msg.trace || []).map((line, idx) => (
                                  <li key={`${idx}-${line}`}>{line}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>

                        <h4 className="ask-msg-heading">常用思路</h4>
                        <ul className="ask-msg-list">
                          <li>用实验得到的裂纹尺寸–时间或 da/dN–ΔK 数据拟合经验扩展曲线。</li>
                          <li>以应力（MPa）、温度、暴露时长与介质浓度等工况为特征，训练回归或可靠性模型。</li>
                          <li>在具备更完整的载荷谱与腐蚀化学数据时，可叠加机理约束或物理信息模型以改善外推。</li>
                        </ul>
                        <p className="ask-msg-para">{msg.expertReply}</p>

                        <div className="ask-format-card ask-scc-params-card">
                          <div className="ask-format-title">参数配置</div>
                          <div className="ask-format-body ask-scc-form-body">
                            <div className="ask-scc-field">
                              <span>Material</span>
                              <input type="text" value={fd.material || '316'} disabled />
                            </div>
                            <div className="ask-scc-field">
                              <span>Temperature (°C)</span>
                              <input type="number" value={fd.temperatureC ?? 500} disabled />
                            </div>
                            <div className={`ask-scc-field ${stressOk ? '' : 'missing'}`}>
                              <span>Stress (MPa)</span>
                              <input
                                type="number"
                                inputMode="decimal"
                                placeholder="请输入数值"
                                value={fd.stressMPa ?? ''}
                                disabled={!!msg.submitted}
                                onChange={(e) => handleStressCorrosionFormUpdate(msg.id, { stressMPa: e.target.value })}
                              />
                              {!stressOk && <small className="ask-scc-missing-tip">缺失项</small>}
                            </div>
                            <div className={`ask-scc-field ${exposureOk ? '' : 'missing'}`}>
                              <span>Exposure (h)</span>
                              <input
                                type="number"
                                inputMode="decimal"
                                placeholder="请输入数值"
                                value={fd.exposureH ?? ''}
                                disabled={!!msg.submitted}
                                onChange={(e) => handleStressCorrosionFormUpdate(msg.id, { exposureH: e.target.value })}
                              />
                              {!exposureOk && <small className="ask-scc-missing-tip">缺失项</small>}
                            </div>
                            <div className="ask-scc-field">
                              <span>Chloride (ppm)</span>
                              <input
                                type="number"
                                inputMode="decimal"
                                value={fd.chloridePpm ?? 1000}
                                disabled={!!msg.submitted}
                                onChange={(e) => handleStressCorrosionFormUpdate(msg.id, { chloridePpm: Number(e.target.value) })}
                              />
                              <small className="ask-scc-warn">
                                当前模型基于氯离子环境；针对 LiBF 盐输入，已推荐典型氯浓度供参考。
                              </small>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          className="inline-action-btn"
                          disabled={!canRun || !!msg.submitted}
                          onClick={() => handleStressCorrosionSubmit(msg.id)}
                        >
                          开始计算
                        </button>
                      </div>
                    )
                  })()}
                  {msg.block === 'literatureForm' && (
                    <div className={`ask-lit-form-card ${msg.formConfirmed ? 'confirmed' : ''}`}>
                      <div className="ask-lit-form-head">
                        <span>研究配置</span>
                        {msg.formConfirmed && <span className="ask-lit-confirmed-tag">已确认</span>}
                      </div>
                      <label className="ask-lit-field">
                        <span>时间跨度</span>
                        <select
                          value={msg.formData?.timeSpan || '近5年'}
                          disabled={msg.formConfirmed}
                          onChange={(e) => handleLiteratureFormUpdate(msg.id, 'timeSpan', e.target.value)}
                        >
                          <option>近3年</option>
                          <option>近5年</option>
                          <option>10年内</option>
                        </select>
                      </label>
                      <div className="ask-lit-field">
                        <span>侧重点</span>
                        <div className="ask-lit-radio-row">
                          {['材料工艺', '算法实现'].map((opt) => (
                            <label key={opt} className="ask-lit-radio">
                              <input
                                type="radio"
                                checked={(msg.formData?.focus || '材料工艺') === opt}
                                disabled={msg.formConfirmed}
                                onChange={() => handleLiteratureFormUpdate(msg.id, 'focus', opt)}
                              />
                              {opt}
                            </label>
                          ))}
                        </div>
                      </div>
                      <label className="ask-lit-switch-row">
                        <span>代码提取（伪代码复现）</span>
                        <input
                          type="checkbox"
                          checked={!!msg.formData?.needCode}
                          disabled={msg.formConfirmed}
                          onChange={(e) => handleLiteratureFormUpdate(msg.id, 'needCode', e.target.checked)}
                        />
                      </label>
                      {!msg.formConfirmed && (
                        <button
                          type="button"
                          className="inline-action-btn"
                          data-onboarding-anchor="tour-literature-submit"
                          onClick={() => handleLiteratureStartResearch(msg.id, msg.formData)}
                        >
                          开始研究
                        </button>
                      )}
                    </div>
                  )}
                  {msg.block === 'industryNewsForm' && (
                    <div className={`ask-lit-form-card ${msg.formConfirmed ? 'confirmed' : ''}`}>
                      <div className="ask-lit-form-head">
                        <span>行业快讯筛选条件</span>
                        {msg.formConfirmed && <span className="ask-lit-confirmed-tag">已确认</span>}
                      </div>
                      <label className="ask-lit-field">
                        <span>时间窗口</span>
                        <select
                          value={msg.formData?.timeWindow || '24h'}
                          disabled={msg.formConfirmed}
                          onChange={(e) => handleIndustryFormUpdate(msg.id, 'timeWindow', e.target.value)}
                        >
                          <option>24h</option>
                          <option>48h</option>
                          <option>7d</option>
                        </select>
                      </label>
                      <div className="ask-lit-field">
                        <span>关注方向</span>
                        <div className="ask-lit-chip-row">
                          {['固态电池', '材料价格', '产业链', '政策监管', '融资并购'].map((domain) => (
                            <button
                              key={domain}
                              type="button"
                              className={`ask-lit-chip ${(msg.formData?.domains || []).includes(domain) ? 'active' : ''}`}
                              disabled={msg.formConfirmed}
                              onClick={() => handleIndustryDomainToggle(msg.id, domain)}
                            >
                              {domain}
                            </button>
                          ))}
                        </div>
                      </div>
                      <label className="ask-lit-switch-row">
                        <span>包含政策监管解读</span>
                        <input
                          type="checkbox"
                          checked={!!msg.formData?.includePolicy}
                          disabled={msg.formConfirmed}
                          onChange={(e) => handleIndustryFormUpdate(msg.id, 'includePolicy', e.target.checked)}
                        />
                      </label>
                      {!msg.formConfirmed && (
                        <button
                          type="button"
                          className="inline-action-btn"
                          onClick={() => handleIndustryStartFetch(msg.id, msg.formData)}
                        >
                          开始抓取
                        </button>
                      )}
                    </div>
                  )}
                  {msg.block === 'mdSimForm' && (
                    <div className={`ask-lit-form-card ask-md-form-card ${Number(msg.mdStep || 1) === 2 ? 'ask-md-form-card--compact' : ''}`}>
                      {Number(msg.mdStep || 1) === 1 && (
                        <>
                          <div className="ask-lit-form-head">
                            <span>Molecular Simulation Parameters</span>
                          </div>
                          <p className="ask-md-step-hint">
                            Set the thermodynamic conditions for the MD run. You can keep the defaults unless your experimental protocol requires otherwise.
                          </p>
                          <div className="ask-md-two-col">
                            <label className="ask-lit-field">
                              <span>Temperature (K)</span>
                              <input
                                type="number"
                                inputMode="decimal"
                                step="0.01"
                                value={msg.formData?.temperatureK ?? 298.15}
                                disabled={!!msg.formConfirmed}
                                onChange={(e) => handleMDSimFormUpdate(msg.id, { temperatureK: Number(e.target.value) })}
                              />
                            </label>
                          </div>
                          {!msg.formConfirmed && (
                            <button type="button" className="inline-action-btn" onClick={() => handleMDSimStep1Next(msg.id)}>
                              下一步
                            </button>
                          )}
                        </>
                      )}

                      {Number(msg.mdStep || 1) === 2 && (() => {
                        const solvents = msg.formData?.solvents || []
                        const solventMin = 0.05
                        const solventSum = solvents.reduce((acc, row) => acc + (Number(row?.fraction) || 0), 0)
                        const solventOk =
                          solvents.length > 0 &&
                          Math.abs(solventSum - 1) < 1e-6 &&
                          solvents.every((s) => (Number(s?.fraction) || 0) >= solventMin && String(s?.smiles || '').trim().length > 0)
                        const anions = msg.formData?.anions || []
                        const fractions = msg.formData?.anionFractions || {}
                        const minFrac = 0.05
                        const fracSum = anions.reduce((acc, a) => acc + (Number(fractions?.[a]) || 0), 0)
                        const fracOk =
                          anions.length === 1
                            ? (Number(fractions?.[anions[0]]) || 0) >= minFrac
                            : anions.length === 2 &&
                              Math.abs(fracSum - 1) < 1e-6 &&
                              anions.every((a) => (Number(fractions?.[a]) || 0) >= minFrac)

                        const canSubmit = solventOk && fracOk
                        return (
                          <>
                            <div className="ask-lit-form-head">
                              <span>MD 模拟参数配置 · Step 2/3</span>
                            </div>

                            <div className="ask-md-subsection">
                              <div className="ask-md-subtitle">Salts Configuration</div>

                              <div className="ask-md-salt-block">
                                <div className="ask-md-salt-label">Cation Selection</div>
                                <div className="ask-md-card-grid">
                                  {[
                                    { key: 'Li+', title: 'Li⁺', sub: 'Lithium', enabled: true },
                                    { key: 'Na+', title: 'Na⁺', sub: 'Sodium', enabled: false },
                                    { key: 'Mg2+', title: 'Mg²⁺', sub: 'Magnesium', enabled: false },
                                    { key: 'Zn2+', title: 'Zn²⁺', sub: 'Zinc', enabled: false },
                                  ].map((opt) => {
                                    const active = (msg.formData?.cation || 'Li+') === opt.key
                                    return (
                                      <button
                                        key={opt.key}
                                        type="button"
                                        className={`ask-md-card ${active ? 'active' : ''} ${opt.enabled ? '' : 'disabled'}`}
                                        disabled={!opt.enabled || !!msg.formConfirmed}
                                        onClick={() => handleMDSimFormUpdate(msg.id, { cation: opt.key })}
                                      >
                                        <div className="ask-md-card-title">{opt.title}</div>
                                        <div className="ask-md-card-sub">{opt.sub}</div>
                                        {!opt.enabled ? <div className="ask-md-card-note">to be launched in MU2</div> : null}
                                      </button>
                                    )
                                  })}
                                </div>
                              </div>

                              <div className="ask-md-salt-block">
                                <div className="ask-md-salt-label">Anion Selection (Max 2)</div>
                                <div className="ask-md-card-grid ask-md-card-grid--anion">
                                  {[
                                    { key: 'PF6-', title: 'PF₆⁻', sub: 'Hexafluorophosphate', enabled: true },
                                    { key: 'FSI-', title: 'FSI⁻', sub: 'Bis(fluorosulfonyl)imide', enabled: true },
                                    { key: 'TFSI-', title: 'TFSI⁻', sub: 'Bis(trifluoromethylsulfonyl)imide', enabled: true },
                                    { key: 'BF4-', title: 'BF₄⁻', sub: 'Tetrafluoroborate', enabled: false },
                                  ].map((opt) => {
                                    const active = (msg.formData?.anions || []).includes(opt.key)
                                    return (
                                      <button
                                        key={opt.key}
                                        type="button"
                                        className={`ask-md-card ${active ? 'active' : ''} ${opt.enabled ? '' : 'disabled'}`}
                                        disabled={!opt.enabled || !!msg.formConfirmed}
                                        onClick={() => handleMDSimToggleAnion(msg.id, opt.key)}
                                      >
                                        <div className="ask-md-card-title">{opt.title}</div>
                                        <div className="ask-md-card-sub">{opt.sub}</div>
                                        {!opt.enabled ? <div className="ask-md-card-note">to be launched in MU2</div> : null}
                                      </button>
                                    )
                                  })}
                                </div>
                              </div>

                              <label className="ask-lit-field">
                                <span>Total Salt Concentration (mol/kg)</span>
                                <input
                                  type="number"
                                  inputMode="decimal"
                                  step="0.01"
                                  value={msg.formData?.totalSaltMolKg ?? 1.0}
                                  disabled={!!msg.formConfirmed}
                                  onChange={(e) => handleMDSimFormUpdate(msg.id, { totalSaltMolKg: Number(e.target.value) })}
                                />
                              </label>

                              {(anions || []).map((a) => (
                                <label key={a} className="ask-lit-field">
                                  <span>{a} Fraction (min: {minFrac})</span>
                                  <input
                                    type="number"
                                    inputMode="decimal"
                                    step="0.01"
                                    min={0}
                                    max={1}
                                    value={Number((msg.formData?.anionFractions || {})[a] ?? (anions.length === 1 ? 1.0 : 0.5))}
                                    disabled={!!msg.formConfirmed}
                                    onChange={(e) => handleMDSimAnionFractionUpdate(msg.id, a, Number(e.target.value))}
                                  />
                                </label>
                              ))}

                              {!fracOk && (
                                <div className="ask-md-warn">
                                  盐的 fraction 需满足：最多 2 个阴离子；若选择 2 个则两者之和需为 1，且每个 ≥ {minFrac}（当前和：{Number.isFinite(fracSum) ? fracSum.toFixed(2) : '0.00'}）
                                </div>
                              )}
                            </div>

                            <div className="ask-md-subsection">
                              <div className="ask-md-subtitle ask-md-subtitle-row">
                                <span>Solvents Configuration</span>
                                {!msg.formConfirmed && (
                                  <button
                                    type="button"
                                    className="ask-md-add-smiles"
                                    onClick={() => handleMDSimAddSolventRow(msg.id)}
                                    disabled={(msg.formData?.solvents || []).length >= 3}
                                  >
                                    + Add SMILES (Max 3)
                                  </button>
                                )}
                              </div>
                              <div className="ask-md-smiles-grid">
                                {solvents.map((row, idx) => (
                                  <div key={idx} className="ask-md-smiles-row">
                                    <label className="ask-md-smiles-field">
                                      <span>SMILES String {idx + 1}</span>
                                      <input
                                        type="text"
                                        value={row?.smiles ?? ''}
                                        disabled={!!msg.formConfirmed}
                                        onChange={(e) => handleMDSimSolventUpdate(msg.id, idx, { smiles: e.target.value })}
                                      />
                                    </label>
                                    <label className="ask-md-smiles-field">
                                      <span>Fraction (min: {solventMin})</span>
                                      <input
                                        type="number"
                                        inputMode="decimal"
                                        step="0.01"
                                        min={0}
                                        max={1}
                                        value={row?.fraction ?? 0}
                                        disabled={!!msg.formConfirmed}
                                        onChange={(e) => handleMDSimSolventUpdate(msg.id, idx, { fraction: Number(e.target.value) })}
                                      />
                                    </label>
                                    {!msg.formConfirmed && (
                                      <button
                                        type="button"
                                        className="ask-md-row-remove"
                                        onClick={() => handleMDSimRemoveSolventRow(msg.id, idx)}
                                        aria-label="Remove solvent row"
                                      >
                                        ×
                                      </button>
                                    )}
                                  </div>
                                ))}
                              </div>

                              {!solventOk && (
                                <div className="ask-md-warn">
                                  溶剂 fraction 需满足：最多 3 个；每个 ≥ {solventMin}；总和需为 1（当前和：{Number.isFinite(solventSum) ? solventSum.toFixed(2) : '0.00'}）
                                </div>
                              )}

                              <div className="ask-md-fraction-type">
                                <div className="ask-md-salt-label">Fraction Type</div>
                                <div className="ask-md-radio-row">
                                  {[
                                    { key: 'mole', label: 'Mole fraction' },
                                    { key: 'weight', label: 'Weight fraction' },
                                  ].map((opt) => (
                                    <label key={opt.key} className="ask-lit-radio">
                                      <input
                                        type="radio"
                                        checked={(msg.formData?.fractionType || 'mole') === opt.key}
                                        disabled={!!msg.formConfirmed}
                                        onChange={() => handleMDSimFormUpdate(msg.id, { fractionType: opt.key })}
                                      />
                                      {opt.label}
                                    </label>
                                  ))}
                                </div>
                              </div>
                            </div>

                            {!msg.formConfirmed && (
                              <button
                                type="button"
                                className="inline-action-btn"
                                disabled={!canSubmit}
                                onClick={() => handleMDSimSubmit(msg.id)}
                              >
                                提交计算
                              </button>
                            )}
                          </>
                        )
                      })()}

                      {Number(msg.mdStep || 1) === 3 && (
                        <>
                          <div className="ask-lit-form-head">
                            <span>MD 模拟提交 · Step 3/3</span>
                          </div>
                          <div className="ask-md-result">
                            <div className="ask-md-result-row">
                              <span className="ask-md-k">状态</span>
                              <span className="ask-md-v ask-md-v--success">Success - 任务已进入调度队列</span>
                            </div>
                            <div className="ask-md-result-row">
                              <span className="ask-md-k">任务 ID</span>
                              <span className="ask-md-v">{msg.taskId || 'MD-SIM-20240311-001'}</span>
                            </div>
                            <div className="ask-md-progress">
                              <div className="ask-md-progress-head">
                                <span className="ask-md-progress-title">当前计算进度</span>
                                <span className="ask-md-progress-meta">
                                  {Math.max(0, Math.min(100, Number(msg.progress?.percent ?? 0)))}% · {msg.progress?.stage || 'Queued'}
                                </span>
                              </div>
                              <div className="ask-md-progress-bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.max(0, Math.min(100, Number(msg.progress?.percent ?? 0)))}>
                                <div
                                  className="ask-md-progress-fill"
                                  style={{ width: `${Math.max(0, Math.min(100, Number(msg.progress?.percent ?? 0)))}%` }}
                                />
                              </div>
                              <div className="ask-md-progress-stages">
                                {['Queued', 'Scheduled', 'Running', 'Analysis', 'Report'].map((s) => (
                                  <span
                                    key={s}
                                    className={`ask-md-stage ${msg.progress?.stage === s ? 'active' : ''}`}
                                  >
                                    {s}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <div className="ask-md-note">预计耗时 1-3 天。完成后我会在这里和 Assets-Task 中同步提醒您。</div>
                            <button
                              type="button"
                              className="inline-action-btn"
                              onClick={() => navigate(`/tasks-data/formulate?openTask=${encodeURIComponent(msg.taskId || 'MD-SIM-20240311-001')}`)}
                            >
                              在 Assets-Task 中查看
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                  {msg.block === 'literatureRun' && (
                    <>
                      <div data-onboarding-anchor="tour-literature-run">
                        <LiteratureRunBlock msg={msg} onToggleStepDetail={(idx) => toggleLiteratureStepDetail(msg.id, idx)} />
                      </div>
                      {msg.done && (
                        <div className="ask-lit-report ask-lit-report--professional">
                          <header className="ask-lit-report-hero">
                            <p className="ask-lit-report-type">Solid-state electrolyte · structured synthesis</p>
                            <h3 className="ask-lit-report-title">Structured literature synthesis report</h3>
                            <p className="ask-lit-report-meta">
                              <span>Scope: {msg.formData?.timeSpan || '近5年'}</span>
                              <span>Focus: {msg.formData?.focus || '材料工艺'}</span>
                              <span>Code appendix: {msg.formData?.needCode ? 'Yes' : 'No'}</span>
                              <span>Corpus: n = 12 independent studies (15 retrieved, 3 merged by DOI)</span>
                            </p>
                          </header>

                          <section className="ask-lit-report-section">
                            <h4 className="ask-lit-report-h">Executive summary</h4>
                            <p>
                              Within <strong>{msg.formData?.timeSpan || '近5年'}</strong>, sulfide solid-electrolyte interface engineering converges on{' '}
                              <em>coating-enabled ionic continuity</em> and <em>stress-biased degradation modes</em>.{' '}
                              {msg.formData?.focus === '算法实现'
                                ? 'Learning-based surrogates (GNN + temporal fusion) now explain a majority of cross-chemistry variance in reported cycle life, with calibrated tails suitable for early-stage screening.'
                                : 'Process levers—particle size, stack pressure ramps, and wetting control—remain the highest leverage knobs before algorithmic refinement is justified.'}{' '}
                              Conflicts cluster around Li-metal anode pairing protocols; we surface both camps quantitatively in the evidence matrix below.
                            </p>
                          </section>

                          <section className="ask-lit-report-section">
                            <h4 className="ask-lit-report-h">Scope, retrieval, and quality controls</h4>
                            <ul className="ask-lit-report-list">
                              <li>Corpora: ArXiv, ScienceDirect, CrossRef, MU internal index — Boolean + embedding rerank.</li>
                              <li>Inclusion: empirical cells with ≥100 cycles or full symmetric-cell EIS traces; DFT-only works excluded unless validating a cell study.</li>
                              <li>Deduplication & provenance: DOI merges, pre-print resolution, span-level hashes for each numeric claim.</li>
                            </ul>
                          </section>

                          <section className="ask-lit-report-section">
                            <h4 className="ask-lit-report-h">Quantitative evidence matrix</h4>
                            <div className="ask-preview-table-wrap ask-lit-report-table-wrap">
                              <table className="ask-preview-table ask-lit-report-table">
                                <thead>
                                  <tr>
                                    <th>Ref.</th>
                                    <th>Study</th>
                                    <th>Electrolyte</th>
                                    <th>Mechanism focus</th>
                                    <th>Key metric</th>
                                    <th>μ estimate (cycles)</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  <tr>
                                    <td>[1]</td>
                                    <td>Li et al., Nat. Energy-styled rev. (2023)</td>
                                    <td>Argyrodite</td>
                                    <td>Coating + Li inhibitor</td>
                                    <td>80% SOH @ N</td>
                                    <td>2,850 ± 180</td>
                                  </tr>
                                  <tr>
                                    <td>[2]</td>
                                    <td>Zhang et al. (2024)</td>
                                    <td>LPSCl</td>
                                    <td>GNN feature fusion</td>
                                    <td>Median life</td>
                                    <td>3,120 ± 210</td>
                                  </tr>
                                  <tr>
                                    <td>[3]</td>
                                    <td>Park et al. (2025)</td>
                                    <td>LGPS-class</td>
                                    <td>Domain adaptation</td>
                                    <td>95% PI width</td>
                                    <td>2,960 ± 240</td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                            <p className="ask-lit-report-note">
                              Uncertainty bands reflect study-reported variance only; extrapolated tails (dashed in internal charts) are flagged when N exceeds
                              observed experimental windows.
                            </p>
                          </section>

                          <section className="ask-lit-report-section">
                            <h4 className="ask-lit-report-h">Cross-study synthesis</h4>
                            <p>
                              <strong>Agreement:</strong> interfacial resistance growth tracks void nucleation in 9/12 studies; reducing initial porosity below 4% correlates with &gt;15% longer median life in LPSCl systems.
                            </p>
                            <p>
                              <strong>Tension:</strong> argyrodite vs Li-metal stacks show divergent EIS interpretations— attributed to differences in stack pressure calibration (reported range 2–8 MPa) rather than chemistry alone.
                            </p>
                          </section>

                          <section className="ask-lit-report-section">
                            <h4 className="ask-lit-report-h">Implications for R&amp;D</h4>
                            <ol className="ask-lit-report-ordered">
                              <li>Prioritize coating thickness uniformity metrology before scaling graph-learning surrogates.</li>
                              <li>Hold paired symmetrical-cell baselines constant when comparing sulfide chemistries across vendors.</li>
                              <li>Export calibrated models only after isotonic adjustment on held-out chemistries (see pipeline log).</li>
                            </ol>
                          </section>

                          <section className="ask-lit-report-section">
                            <h4 className="ask-lit-report-h">Limitations</h4>
                            <p>
                              Demo synthesis — no live retrieval; figures tabulated from representative priors. Production would attach open PDFs, FAIR metadata,
                              and reviewer-grade conflict statements per claim.
                            </p>
                          </section>

                          {msg.formData?.needCode ? (
                            <section className="ask-lit-report-section">
                              <h4 className="ask-lit-report-h">Appendix A · Pseudocode</h4>
                              <pre className="ask-lit-code">
                                <code>{`# Core graph-temporal scaffold (MU Literature template)
features = extract_interface_features(cell_curves, chemistry_meta, tomography_optional=True)
graph = build_heterogeneous_gnn(features, edge_modes=("ionic", "crack", "blocked"))
life_pred, ci = calibrated_head(graph, temporal_encoder=True, seed=42)
report = synthesize_with_assets(life_pred, citations=corpus_aligned_spans)`}</code>
                              </pre>
                            </section>
                          ) : null}

                          <section className="ask-lit-report-section ask-lit-report-refs">
                            <h4 className="ask-lit-report-h">References (abridged)</h4>
                            <ol className="ask-lit-report-reflist">
                              <li>Li et al., sulfide interface engineering — cited for coating protocol and NMC811 pairing.</li>
                              <li>Zhang et al., graph-native feature fusion — cited for multi-chemistry generalization metrics.</li>
                              <li>Park et al., domain adaptation under distribution shift — cited for confidence calibration.</li>
                            </ol>
                          </section>

                          <div className="ask-result-actions">
                            <button
                              type="button"
                              className="inline-action-btn"
                              data-onboarding-anchor="tour-literature-view-assets"
                              onClick={() => navigate('/tasks-data')}
                            >
                              在 Assets 中查看
                            </button>
                            <button type="button" className="inline-action-btn" onClick={handleShareLiteratureReport}>
                              分享链接
                            </button>
                            <button type="button" className="inline-action-btn" onClick={handleDownloadLiteraturePdf}>
                              下载为PDF
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                  {msg.block === 'industryNewsRun' && (
                    <>
                      <div className="ask-thinking-card">
                        <div className="ask-thinking-stream">
                          <span className="ask-thinking-label">News</span>
                          <span className="ask-thinking-text">{msg.content || '处理中...'}</span>
                        </div>
                        <ul className="ask-thinking-trace">
                          {(msg.statuses || []).map((item, idx) => (
                            <li key={idx}>{item}</li>
                          ))}
                        </ul>
                      </div>
                      {msg.done && (
                        <div className="ask-lit-report">
                          <h4>24h 行业快讯报告（模拟）</h4>
                          <p><strong>摘要：</strong>过去 {msg.formData?.timeWindow || '24h'} 内，重点方向“{(msg.formData?.domains || []).join('、') || '固态电池'}”出现 3 条高价值动态，整体信号偏中性偏积极，建议关注成本端与扩产节奏的联动。</p>
                          <div className="ask-news-cards">
                            {(msg.items || []).map((item, idx) => (
                              <div className="ask-news-card" key={idx}>
                                <div className="ask-news-card-top">
                                  <div className="ask-news-title">{item.title}</div>
                                  <span className={`ask-news-level ${item.level.toLowerCase()}`}>{item.level}</span>
                                </div>
                                <div className="ask-news-source">{item.source}</div>
                                <div className="ask-news-impact">{item.impact}</div>
                              </div>
                            ))}
                          </div>
                          <div className="ask-result-actions">
                            <button type="button" className="inline-action-btn" onClick={() => navigate('/tasks-data')}>
                              View Assets
                            </button>
                            <button type="button" className="inline-action-btn" onClick={handleShareIndustryReport}>
                              分享链接
                            </button>
                            <button type="button" className="inline-action-btn" onClick={handleDownloadIndustryPdf}>
                              下载为PDF
                            </button>
                          </div>
                        </div>
                      )}
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
                  {msg.block === 'moleculeSkillDemo' && (
                    <div className="ask-mol-skill">
                      <div className="ask-mol-skill-head">
                        <div className="ask-mol-skill-title">Molecule skill demo</div>
                        <div className="ask-mol-skill-sub">点击回答中的分子名，右侧将滑出分子卡片</div>
                      </div>
                      <div className="ask-mol-skill-body">
                        {String(msg.answerText || '')
                          .split('\n')
                          .map((line, idx) => (
                            <p key={idx} className="ask-msg-para">
                              {renderTextWithMoleculeLinks(line)}
                            </p>
                          ))}
                      </div>
                    </div>
                  )}
                  {msg.block === 'assetForwardCard' && (
                    <div className="ask-asset-forward-wrapper">
                      <div
                        className="ask-asset-forward-card"
                        role="button"
                        tabIndex={0}
                        onClick={() => {
                          const route =
                            msg.assetOpenTaskRoute ||
                            (msg.assetTaskId ? `/tasks-data?openTask=${encodeURIComponent(msg.assetTaskId)}` : '/tasks-data')
                          navigate(route)
                        }}
                        onKeyDown={(e) => {
                          if (e.key !== 'Enter' && e.key !== ' ') return
                          e.preventDefault()
                          const route =
                            msg.assetOpenTaskRoute ||
                            (msg.assetTaskId ? `/tasks-data?openTask=${encodeURIComponent(msg.assetTaskId)}` : '/tasks-data')
                          navigate(route)
                        }}
                        aria-label="Open in Assets"
                        title="Click to open in Assets"
                      >
                        <div className="ask-asset-forward-top">
                          <div className="ask-asset-forward-title">
                            {msg.assetTaskTitle || msg.content?.split('\n')?.[1] || 'Assets task'}
                          </div>
                          <div className="ask-asset-forward-meta">
                            {msg.assetTaskId ? `ID: ${msg.assetTaskId}` : null}
                            {msg.assetFeature ? ` · ${msg.assetFeature}` : null}
                            {msg.assetStatus ? ` · ${msg.assetStatus}` : null}
                          </div>
                        </div>

                        {msg.assetPredictionDetails ? (
                          <div className="ask-asset-forward-details">
                            {msg.assetPredictionDetails.fileName ? (
                              <div>文件：{msg.assetPredictionDetails.fileName}</div>
                            ) : null}
                            {msg.assetPredictionDetails.barcode ? (
                              <div>Barcode：{msg.assetPredictionDetails.barcode}</div>
                            ) : null}
                            {msg.assetPredictionDetails.cycleLife != null ? (
                              <div>预测寿命（循环）：{msg.assetPredictionDetails.cycleLife}</div>
                            ) : null}
                          </div>
                        ) : null}

                        <div className="ask-asset-forward-foot">查看 Assets 详情 →</div>
                      </div>

                      {msg.assetNoteText ? (
                        <p className="ask-asset-forward-note ask-msg-para">{msg.assetNoteText}</p>
                      ) : null}
                    </div>
                  )}
                  {!msg.block && msg.content != null && (
                    msg.role === 'assistant' ? (
                      <div className="ask-assistant-panel">
                        <div className="ask-assistant-panel-main">
                          {msg.content.split('\n').map((line, idx) => (
                            <p key={idx}>{line}</p>
                          ))}
                        </div>
                        {msg.action === 'newPrediction' && (
                          <button
                            type="button"
                            className="inline-action-btn"
                            onClick={handleNewPredictionInfo}
                          >
                            New Prediction
                          </button>
                        )}
                      </div>
                    ) : (
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
                    )
                  )}
                  </div>
                <div className={`message-time message-time-${msg.role}`}>{formatMsgTime(msg.id)}</div>
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
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSubmit(e)
                  }
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
                  <div className="ask-mode-switch" role="tablist" aria-label="Model mode">
                    <button
                      type="button"
                      className={`ask-mode-chip ${modelTier === 'lightning' ? 'active' : ''}`}
                      role="tab"
                      aria-selected={modelTier === 'lightning'}
                      onClick={() => setModelTier('lightning')}
                      disabled={isTyping}
                    >
                      Lightning
                    </button>
                    <button
                      type="button"
                      className={`ask-mode-chip ${modelTier === 'pro' ? 'active' : ''}`}
                      role="tab"
                      aria-selected={modelTier === 'pro'}
                      onClick={() => setModelTier('pro')}
                      disabled={isTyping}
                    >
                      Pro <span className="ask-mode-badge">LITE</span>
                    </button>
                    <button
                      type="button"
                      className={`ask-mode-chip ${modelTier === 'deepSpace' ? 'active' : ''}`}
                      role="tab"
                      aria-selected={modelTier === 'deepSpace'}
                      onClick={() => setModelTier('deepSpace')}
                      disabled={isTyping}
                    >
                      Deep Space <span className="ask-mode-badge">LITE</span>
                    </button>
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
          </form>
        </div>
      </div>

      {moleculeDrawerOpen ? (
        <div className="ask-mol-drawer-overlay" onClick={closeMoleculeDrawer} role="presentation">
          <aside
            className={`ask-mol-drawer ${similarOpen ? 'ask-mol-drawer--full' : ''}`}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label="Molecule Details"
          >
            <div className="ask-mol-drawer-head">
              <div className="ask-mol-drawer-title">Molecule Details</div>
              <button type="button" className="ask-mol-drawer-close" onClick={closeMoleculeDrawer} aria-label="Close">
                ×
              </button>
            </div>
            {activeMolecule ? (
              <div className={`ask-mol-drawer-body ${similarOpen ? 'ask-mol-drawer-body--two' : 'ask-mol-drawer-body--one'}`}>
                <div className="ask-mol-col ask-mol-col--scroll">
                  <div className="ask-mol-col-head">Original Molecule</div>
                  <div className="ask-mol-card">
                    <div className="ask-mol-card-top">
                      <div className="ask-mol-card-name">{activeMolecule.name}</div>
                      <button
                        type="button"
                        className="ask-mol-fav-mini"
                        onClick={() => addFavorite({ ...activeMolecule.favPayload, addedDate: new Date().toISOString() })}
                      >
                        + Favorites
                      </button>
                    </div>
                    <div className="ask-mol-structure-box" aria-hidden>
                      <div className="ask-mol-structure-placeholder" />
                    </div>
                    <div className="ask-mol-metrics">
                      <div className="ask-mol-metric"><span className="k">SMILES:</span><span className="v mono">{activeMolecule.smiles}</span></div>
                      <div className="ask-mol-metric"><span className="k">Mol Weight:</span><span className="v">{activeMolecule.molWeight}</span></div>
                      <div className="ask-mol-metric"><span className="k">Predicted MP:</span><span className="v">{activeMolecule.meltingPoint} ℃</span></div>
                      <div className="ask-mol-metric"><span className="k">Predicted BP:</span><span className="v">{activeMolecule.boilingPoint} ℃</span></div>
                      <div className="ask-mol-metric"><span className="k">Predicted Flash Point:</span><span className="v">{activeMolecule.flashPoint} ℃</span></div>
                      <div className="ask-mol-metric"><span className="k">Combustion Enthalpy:</span><span className="v">{activeMolecule.combEnthalpy}</span></div>
                      <div className="ask-mol-metric"><span className="k">HOMO:</span><span className="v">{activeMolecule.homo}</span></div>
                      <div className="ask-mol-metric"><span className="k">LUMO:</span><span className="v">{activeMolecule.lumo}</span></div>
                      <div className="ask-mol-metric"><span className="k">Esp Max:</span><span className="v">{activeMolecule.espMax}</span></div>
                      <div className="ask-mol-metric"><span className="k">Esp Min:</span><span className="v">{activeMolecule.espMin}</span></div>
                      <div className="ask-mol-metric"><span className="k">Commercial Viability:</span><span className="v">{activeMolecule.commercial}</span></div>
                    </div>
                    <button type="button" className="ask-mol-expand" aria-expanded="false">
                      Click to expand for more details
                    </button>
                    <div className="ask-mol-controls">
                      <select className="ask-mol-select" defaultValue="SOLVENT" aria-label="Category">
                        <option value="SOLVENT">SOLVENT</option>
                      </select>
                      <button type="button" className="ask-mol-find" onClick={() => setSimilarOpen(true)}>
                        FIND SIMILAR
                      </button>
                    </div>
                    <div className="ask-mol-search-row">
                      <div className="ask-mol-search-label">Intelligent Search</div>
                      <select className="ask-mol-select" defaultValue="Low" aria-label="Search level">
                        <option>Low</option>
                        <option>Medium</option>
                        <option>High</option>
                      </select>
                    </div>
                    <textarea className="ask-mol-textarea" rows={3} placeholder="" />
                    <button type="button" className="ask-mol-adv">Advanced options ▾</button>
                  </div>
                </div>

                {similarOpen ? (
                  <div className="ask-mol-col ask-mol-col--right ask-mol-col--scroll">
                    <div className="ask-mol-col-head">
                      Similar Molecules ({getSimilarFor(activeMolecule.name).length})
                    </div>
                    <div className="ask-mol-similar-list">
                      {getSimilarFor(activeMolecule.name).map((mol) => (
                        <div key={mol.name} className="ask-mol-card ask-mol-card--similar">
                          <div className="ask-mol-card-top">
                            <div className="ask-mol-card-name">{String(mol.name || '').toLowerCase()}</div>
                            <button
                              type="button"
                              className="ask-mol-fav-mini"
                              onClick={() => addFavorite({ ...mol.favPayload, addedDate: new Date().toISOString() })}
                            >
                              + Favorites
                            </button>
                          </div>
                          <div className="ask-mol-structure-box" aria-hidden>
                            <div className="ask-mol-structure-placeholder" />
                          </div>
                          <div className="ask-mol-metrics ask-mol-metrics--compact">
                            <div className="ask-mol-metric"><span className="k">Status:</span><span className="v">{mol.status}</span></div>
                            <div className="ask-mol-metric"><span className="k">SMILES:</span><span className="v mono">{mol.smiles}</span></div>
                            <div className="ask-mol-metric"><span className="k">Mol Weight:</span><span className="v">{mol.molWeight}</span></div>
                            <div className="ask-mol-metric"><span className="k">Predicted MP:</span><span className="v">{mol.meltingPoint} ℃</span></div>
                            <div className="ask-mol-metric"><span className="k">Predicted BP:</span><span className="v">{mol.boilingPoint} ℃</span></div>
                            <div className="ask-mol-metric"><span className="k">Predicted Flash Point:</span><span className="v">{mol.flashPoint} ℃</span></div>
                            <div className="ask-mol-metric"><span className="k">Combustion Enthalpy:</span><span className="v">{mol.combEnthalpy}</span></div>
                            <div className="ask-mol-metric"><span className="k">HOMO:</span><span className="v">{mol.homo}</span></div>
                            <div className="ask-mol-metric"><span className="k">LUMO:</span><span className="v">{mol.lumo}</span></div>
                            <div className="ask-mol-metric"><span className="k">Commercial Viability:</span><span className="v">{mol.commercial}</span></div>
                          </div>
                          <button type="button" className="ask-mol-expand" aria-expanded="false">
                            Click to expand for more details
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
          </aside>
        </div>
      ) : null}
    </div>
  )
}
