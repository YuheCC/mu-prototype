import { useEffect } from 'react'
import {
  formatCreatedAtDisplay,
  getTaskCreatedAtMs,
  getTaskFeatureLabel,
  getTaskStatusLabel,
} from './assetTasks'

export default function TaskViewModal({ task, onClose }) {
  useEffect(() => {
    if (!task) return
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [task, onClose])

  if (!task) return null

  const createdMs = getTaskCreatedAtMs(task)

  return (
    <div className="task-view-modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="task-view-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-view-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="task-view-modal-head">
          <h2 id="task-view-modal-title" className="task-view-modal-title">
            Task details
          </h2>
          <button type="button" className="task-view-modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <dl className="task-view-modal-body">
          <div className="task-view-row">
            <dt>Task ID</dt>
            <dd>{task.id}</dd>
          </div>
          <div className="task-view-row">
            <dt>Name</dt>
            <dd>{task.title}</dd>
          </div>
          <div className="task-view-row">
            <dt>Feature</dt>
            <dd>{getTaskFeatureLabel(task)}</dd>
          </div>
          <div className="task-view-row">
            <dt>Status</dt>
            <dd>{getTaskStatusLabel(task)}</dd>
          </div>
          <div className="task-view-row">
            <dt>Created</dt>
            <dd>{formatCreatedAtDisplay(createdMs)}</dd>
          </div>
          <div className="task-view-row">
            <dt>User ID</dt>
            <dd>{task.userId ?? '—'}</dd>
          </div>
          {task.meta && (
            <div className="task-view-row">
              <dt>Notes</dt>
              <dd>{task.meta}</dd>
            </div>
          )}
        </dl>
      </div>
    </div>
  )
}
