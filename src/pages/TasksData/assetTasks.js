/** Category keys for Assets tabs (task-type grouping). */
export const ASSET_CATEGORY = {
  predicts: 'predicts',
  paperResearch: 'paperResearch',
  formulate: 'formulate',
  electrolyteDesign: 'electrolyteDesign',
  electrodeForwardDesign: 'electrodeForwardDesign',
  electrodeInverseDesign: 'electrodeInverseDesign',
  moleculeSearch: 'moleculeSearch',
}

export const DEMO_ASSET_TASKS = [
  {
    id: 'demo-paper-1',
    title: 'Literature review: solid electrolyte interface (demo)',
    meta: 'Ask · Report generated',
    status: 'done',
    type: 'asset',
    category: ASSET_CATEGORY.paperResearch,
    createdAt: 1_713_864_000_000,
    userId: 'U-10001',
  },
  {
    id: 'demo-form-1',
    title: 'Formulation screening plan · batch A',
    meta: 'Workbench · Scheduled',
    status: 'inProgress',
    type: 'asset',
    category: ASSET_CATEGORY.formulate,
    createdAt: 1_713_777_600_000,
    userId: 'U-20002',
  },
  {
    id: 'demo-el-1',
    title: 'Electrolyte DMC–EMC ratio optimization',
    meta: 'Workbench · Yesterday',
    status: 'done',
    type: 'asset',
    category: ASSET_CATEGORY.electrolyteDesign,
    createdAt: 1_713_691_200_000,
    userId: 'U-20002',
  },
  {
    id: 'demo-efw-1',
    title: 'Cathode–electrolyte matching (forward design)',
    meta: 'Workbench · In progress',
    status: 'inProgress',
    type: 'asset',
    category: ASSET_CATEGORY.electrodeForwardDesign,
    createdAt: 1_713_604_800_000,
    userId: 'U-20002',
  },
  {
    id: 'demo-einv-1',
    title: 'Electrode microstructure inverse design (target capacity)',
    meta: 'Ask · Draft',
    status: 'inProgress',
    type: 'asset',
    category: ASSET_CATEGORY.electrodeInverseDesign,
    createdAt: 1_713_518_400_000,
    userId: 'U-10001',
  },
  {
    id: 'daily-1',
    title: 'Daily data sync',
    meta: 'Last run: 2 hours ago',
    status: 'done',
    type: 'other',
    category: ASSET_CATEGORY.formulate,
    createdAt: 1_713_432_000_000,
    userId: 'U-20002',
  },
  {
    id: 'batch-1',
    title: 'Battery cycle analysis',
    meta: 'Scheduled for today',
    status: 'inProgress',
    type: 'other',
    category: ASSET_CATEGORY.predicts,
    createdAt: 1_713_345_600_000,
    userId: 'U-20002',
  },
  {
    id: 'export-1',
    title: 'Export report to CSV',
    meta: 'Created yesterday',
    status: 'inProgress',
    type: 'other',
    category: ASSET_CATEGORY.paperResearch,
    createdAt: 1_713_259_200_000,
    userId: 'U-10001',
  },
]

export function parsePredictionTime(s) {
  if (!s || typeof s !== 'string') return 0
  const [datePart, timePart = '0:0:0'] = s.trim().split(/\s+/)
  const [y, mo, da] = datePart.split('/').map((x) => parseInt(x, 10))
  const [h, mi, se = 0] = timePart.split(':').map((x) => parseInt(x, 10))
  if (!Number.isFinite(y) || !Number.isFinite(mo) || !Number.isFinite(da)) return 0
  return new Date(y, mo - 1, da, h || 0, mi || 0, se || 0).getTime()
}

function taskSortKey(task) {
  if (task.type === 'prediction' && task.predictionTime) {
    return parsePredictionTime(task.predictionTime)
  }
  if (task.createdAt != null) return task.createdAt
  return 0
}

export function formatCreatedAtDisplay(ms) {
  if (ms == null || !Number.isFinite(ms)) return '—'
  const d = new Date(ms)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function getTaskCreatedAtMs(task) {
  if (task.createdAt != null && Number.isFinite(task.createdAt)) return task.createdAt
  if (task.type === 'prediction' && task.predictionTime) {
    return parsePredictionTime(task.predictionTime)
  }
  return null
}

export function normalizeTaskStatus(task) {
  if (task.status === 'done') return 'done'
  if (task.status === 'scheduled') return 'scheduled'
  return 'inProgress'
}

export function getTaskStatusLabel(task) {
  const s = normalizeTaskStatus(task)
  if (s === 'done') return 'Done'
  if (s === 'scheduled') return 'Scheduled'
  return 'In progress'
}

/** Value for Recent Tasks Feature filter */
export function getTaskTypeFilterKey(task) {
  if (task.type === 'prediction') return 'prediction'
  if (task.type === 'moleculeSearch') return ASSET_CATEGORY.moleculeSearch
  if (task.category === ASSET_CATEGORY.predicts) return 'prediction'
  if (task.category) return task.category
  if (task.type === 'other') return 'other'
  return 'other'
}

export const RECENT_FEATURE_FILTER_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'prediction', label: 'Predicts' },
  { value: ASSET_CATEGORY.paperResearch, label: 'Paper Research' },
  { value: ASSET_CATEGORY.formulate, label: 'Formulate' },
  { value: ASSET_CATEGORY.electrolyteDesign, label: 'Electrolyte Design' },
  { value: ASSET_CATEGORY.electrodeForwardDesign, label: 'Electrode Forward Design' },
  { value: ASSET_CATEGORY.electrodeInverseDesign, label: 'Electrode Inverse Design' },
  { value: ASSET_CATEGORY.moleculeSearch, label: 'Molecule Search' },
  { value: 'other', label: 'Other' },
]

export const RECENT_STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'done', label: 'Done' },
  { value: 'inProgress', label: 'In progress' },
]

export const RECENT_TIME_FILTER_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'today', label: 'Today' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
]

export function taskCreatedInTimeRange(createdMs, range) {
  if (range === 'all' || createdMs == null || !Number.isFinite(createdMs)) return true
  const now = Date.now()
  const day = 86_400_000
  if (range === 'today') {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return createdMs >= d.getTime()
  }
  if (range === '7d') return createdMs >= now - 7 * day
  if (range === '30d') return createdMs >= now - 30 * day
  return true
}

export function getTaskTypeLabel(task) {
  return getTaskFeatureLabel(task)
}

export function getTaskFeatureLabel(task) {
  const key = getTaskTypeFilterKey(task)
  const opt = RECENT_FEATURE_FILTER_OPTIONS.find((o) => o.value === key)
  return opt?.label ?? 'Other'
}

export function enrichTask(task) {
  if (task.type === 'prediction') {
    const createdAt = task.createdAt ?? parsePredictionTime(task.predictionTime)
    return {
      ...task,
      category: ASSET_CATEGORY.predicts,
      createdAt,
      userId: task.userId ?? 'U-10001',
    }
  }
  if (!task.category && task.tool === 'Life Prediction') {
    return { ...task, category: ASSET_CATEGORY.predicts, userId: task.userId ?? '—' }
  }
  return {
    ...task,
    userId: task.userId ?? '—',
  }
}

export function getMergedAssetTasks(contextTasks) {
  const predictionTasks = (contextTasks || []).map(enrichTask)
  const demo = DEMO_ASSET_TASKS.map(enrichTask)
  const all = [...predictionTasks, ...demo]
  return [...all].sort((a, b) => taskSortKey(b) - taskSortKey(a))
}
