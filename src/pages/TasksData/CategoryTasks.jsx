import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useTasks } from '../../context/TasksContext'
import { getMergedAssetTasks, getTaskFeatureLabel, getTaskStatusLabel, ASSET_CATEGORY } from './assetTasks'
import { loadDismissedTaskIds, saveDismissedTaskIds } from './dismissedTaskIds'
import AssetTasksTable from './AssetTasksTable'
import TaskViewModal from './TaskViewModal'
import ForwardTaskModal from './ForwardTaskModal'
import { useAskConversations } from '../../context/AskContext'

const EMPTY_COPY = {
  paperResearch: 'Paper research reports from Ask or Workbench will appear here.',
  predicts: 'Life prediction and related runs will appear here.',
  formulate: 'Formulation tasks from Workbench will appear here.',
  electrolyteDesign: 'Electrolyte design tasks will appear here.',
  electrodeForwardDesign: 'Electrode forward design tasks will appear here.',
  electrodeInverseDesign: 'Electrode inverse design tasks will appear here.',
}

export default function CategoryTasks({ category }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { tasks, removeTask } = useTasks()
  const { conversations, currentId, setConversations, setCurrentId, createNewConversation } = useAskConversations()
  const [dismissedIds, setDismissedIds] = useState(loadDismissedTaskIds)
  const [previewTask, setPreviewTask] = useState(null)
  const [forwardTask, setForwardTask] = useState(null)

  const merged = getMergedAssetTasks(tasks)
    .filter((t) => t.category === category)
    .filter((t) => !dismissedIds.has(t.id))

  useEffect(() => {
    const params = new URLSearchParams(location.search || '')
    const openTask = params.get('openTask')
    if (!openTask) return
    const target = merged.find((t) => String(t.id) === String(openTask))
    if (!target) return
    setPreviewTask(target)
  }, [location.search, merged])

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

  if (merged.length === 0) {
    return (
      <div className="empty-state">
        <p>No tasks in this category yet.</p>
        <p>{EMPTY_COPY[category] || 'Tasks will show here when available.'}</p>
      </div>
    )
  }

  return (
    <>
      <AssetTasksTable tasks={merged} onView={handleView} onDelete={handleDelete} onForward={(t) => setForwardTask(t)} />
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
