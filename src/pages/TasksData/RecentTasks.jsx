import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTasks } from '../../context/TasksContext'
import {
  getMergedAssetTasks,
  getTaskCreatedAtMs,
  getTaskTypeFilterKey,
  normalizeTaskStatus,
  getTaskFeatureLabel,
  getTaskStatusLabel,
  ASSET_CATEGORY,
  RECENT_FEATURE_FILTER_OPTIONS,
  RECENT_STATUS_FILTER_OPTIONS,
  RECENT_TIME_FILTER_OPTIONS,
  taskCreatedInTimeRange,
} from './assetTasks'
import { loadDismissedTaskIds, saveDismissedTaskIds } from './dismissedTaskIds'
import AssetTasksTable from './AssetTasksTable'
import TaskViewModal from './TaskViewModal'
import ForwardTaskModal from './ForwardTaskModal'
import { useAskConversations } from '../../context/AskContext'

export default function RecentTasks() {
  const navigate = useNavigate()
  const { tasks, removeTask } = useTasks()
  const { conversations, currentId, setConversations, setCurrentId, createNewConversation } = useAskConversations()
  const [dismissedIds, setDismissedIds] = useState(loadDismissedTaskIds)
  const [filterFeature, setFilterFeature] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterTime, setFilterTime] = useState('all')
  const [previewTask, setPreviewTask] = useState(null)
  const [forwardTask, setForwardTask] = useState(null)

  const mergedBase = useMemo(() => {
    return getMergedAssetTasks(tasks).filter((t) => !dismissedIds.has(t.id))
  }, [tasks, dismissedIds])

  const filtered = useMemo(() => {
    return mergedBase.filter((task) => {
      if (filterFeature !== 'all' && getTaskTypeFilterKey(task) !== filterFeature) return false
      if (filterStatus !== 'all' && normalizeTaskStatus(task) !== filterStatus) return false
      const ms = getTaskCreatedAtMs(task)
      if (!taskCreatedInTimeRange(ms, filterTime)) return false
      return true
    })
  }, [mergedBase, filterFeature, filterStatus, filterTime])

  const persistDismissed = (next) => {
    setDismissedIds(next)
    saveDismissedTaskIds(next)
  }

  const handleView = (task) => {
    if (task.type === 'prediction') {
      navigate(`/tasks-data/task/${task.id}`)
      return
    }
    setPreviewTask(task)
  }

  const handleDelete = (task) => {
    if (!window.confirm('Delete this task?')) return
    if (task.type === 'prediction') {
      removeTask(task.id)
      return
    }
    const next = new Set(dismissedIds)
    next.add(task.id)
    persistDismissed(next)
  }

  const hasUserContent = (conv) =>
    (conv?.messages || []).some((m) => m?.role === 'user' && typeof m?.content === 'string' && m.content.trim())

  const buildForwardContent = (task) => {
    const title = task?.title ?? 'Untitled'
    const taskId = task?.id ?? '—'
    const featureLabel = getTaskFeatureLabel(task)
    const status = getTaskStatusLabel(task)
    const meta = task?.meta ? `\n来源：${task.meta}` : ''

    let details = ''
    if (task?.type === 'prediction') {
      details = `\n\n文件：${task.fileName || '—'}\nBarcode：${task.barcode || '—'}\n预测寿命（循环）：${task.cycleLife ?? '—'}`
    }

    const route = `/tasks-data/task/${taskId}`
    return `【已转发自 Assets】\n${title}\nTask ID：${taskId}\n类型：${featureLabel}\n状态：${status}${meta}${details}\n\nAssets 详情：${route}\n\n你可以基于以上内容继续提问。`
  }

  const getAssetOpenRouteForCategory = (task) => {
    const cat = task?.category
    if (cat === ASSET_CATEGORY.predicts) return '/tasks-data/predicts'
    if (cat === ASSET_CATEGORY.paperResearch) return '/tasks-data/paper-research'
    if (cat === ASSET_CATEGORY.formulate) return '/tasks-data/formulate'
    if (cat === ASSET_CATEGORY.electrolyteDesign) return '/tasks-data/electrolyte-design'
    if (cat === ASSET_CATEGORY.electrodeForwardDesign) return '/tasks-data/electrode-forward-design'
    if (cat === ASSET_CATEGORY.electrodeInverseDesign) return '/tasks-data/electrode-inverse-design'
    return '/tasks-data'
  }

  const handleForward = ({ destType, destId, noteText }) => {
    if (!forwardTask) return

    const newMsgId = Date.now()
    const featureLabel = getTaskFeatureLabel(forwardTask)
    const statusLabel = getTaskStatusLabel(forwardTask)
    const routeBase = getAssetOpenRouteForCategory(forwardTask)
    const openTaskRoute = `${routeBase}?openTask=${encodeURIComponent(forwardTask?.id ?? '')}`

    const noteTrimmed = String(noteText || '').trim()
    const forwardedUserMsg = {
      id: newMsgId,
      role: 'user',
      block: 'assetForwardCard',
      content: buildForwardContent(forwardTask),
      assetTaskId: forwardTask?.id,
      assetTaskTitle: forwardTask?.title,
      assetFeature: featureLabel,
      assetStatus: statusLabel,
      assetMeta: forwardTask?.meta,
      assetOpenTaskRoute: openTaskRoute,
      assetNoteText: noteTrimmed || '',
      assetPredictionDetails:
        forwardTask?.type === 'prediction'
          ? {
            fileName: forwardTask?.fileName,
            barcode: forwardTask?.barcode,
            cycleLife: forwardTask?.cycleLife ?? forwardTask?.cycleLife,
          }
          : null,
    }

    if (destType === 'new') {
      const newConv = createNewConversation()
      const nextConv = {
        ...newConv,
        title: `转发：${String(forwardTask?.title || 'Assets').slice(0, 18)}`,
        messages: [...(newConv.messages || []), forwardedUserMsg],
      }

      setConversations((prev) => {
        const cleaned = prev.filter((c) => c.id === currentId || hasUserContent(c))
        return [nextConv, ...cleaned.filter((c) => c.id !== nextConv.id)]
      })
      setCurrentId(nextConv.id)
    } else if (destType === 'existing' && destId) {
      setConversations((prev) =>
        prev.map((c) =>
          c.id === destId
            ? {
              ...c,
              messages: [...(c.messages || []), forwardedUserMsg],
            }
            : c
        )
      )
      setCurrentId(destId)
    }

    setForwardTask(null)
    navigate('/')
  }

  if (mergedBase.length === 0) {
    return (
      <div className="empty-state">
        <p>No tasks yet.</p>
        <p>Runs started in Ask or Workbench will appear here.</p>
      </div>
    )
  }

  return (
    <>
      <div className="asset-tasks-filters">
        <div className="asset-tasks-filter-field">
          <label htmlFor="recent-filter-feature">Feature</label>
          <select
            id="recent-filter-feature"
            value={filterFeature}
            onChange={(e) => setFilterFeature(e.target.value)}
          >
            {RECENT_FEATURE_FILTER_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div className="asset-tasks-filter-field">
          <label htmlFor="recent-filter-status">Status</label>
          <select
            id="recent-filter-status"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            {RECENT_STATUS_FILTER_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div className="asset-tasks-filter-field">
          <label htmlFor="recent-filter-time">Created</label>
          <select
            id="recent-filter-time"
            value={filterTime}
            onChange={(e) => setFilterTime(e.target.value)}
          >
            {RECENT_TIME_FILTER_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <p>No tasks match the current filters.</p>
          <p>Try changing Feature, Status, or Created.</p>
        </div>
      ) : (
        <AssetTasksTable
          tasks={filtered}
          onView={handleView}
          onDelete={handleDelete}
          onForward={(t) => setForwardTask(t)}
          showFeatureColumn
        />
      )}

      {previewTask ? <TaskViewModal task={previewTask} onClose={() => setPreviewTask(null)} /> : null}

      {forwardTask ? (
        <ForwardTaskModal
          task={forwardTask}
          conversations={conversations}
          currentId={currentId}
          onClose={() => setForwardTask(null)}
          onForward={handleForward}
        />
      ) : null}
    </>
  )
}
