import { Link } from 'react-router-dom'
import {
  formatCreatedAtDisplay,
  getTaskCreatedAtMs,
  getTaskFeatureLabel,
  getTaskStatusLabel,
  normalizeTaskStatus,
} from './assetTasks'

export default function AssetTasksTable({
  tasks,
  onView,
  onDelete,
  onForward,
  showFeatureColumn = false,
}) {
  if (!tasks.length) return null

  const showActions = typeof onView === 'function' && typeof onDelete === 'function'
  const showForward = typeof onForward === 'function'

  return (
    <div className="asset-tasks-table-wrap">
      <table className="asset-tasks-table">
        <thead>
          <tr>
            <th scope="col">Task ID</th>
            <th scope="col">Name</th>
            {showFeatureColumn ? <th scope="col">Feature</th> : null}
            <th scope="col">Status</th>
            <th scope="col">Created</th>
            <th scope="col">User ID</th>
            {showActions ? <th scope="col" className="asset-tasks-col-actions">Actions</th> : null}
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => {
            const createdMs = getTaskCreatedAtMs(task)
            const createdDisplay = formatCreatedAtDisplay(createdMs)
            const statusLabel = getTaskStatusLabel(task)
            const st = normalizeTaskStatus(task)
            const isPrediction = task.type === 'prediction'

            return (
              <tr key={task.id}>
                <td>
                  {isPrediction ? (
                    <Link to={`/tasks-data/task/${task.id}`} className="asset-tasks-id-link">
                      {task.id}
                    </Link>
                  ) : (
                    <span className="asset-tasks-id">{task.id}</span>
                  )}
                </td>
                <td>
                  {isPrediction ? (
                    <Link to={`/tasks-data/task/${task.id}`} className="asset-tasks-name-link">
                      {task.title}
                    </Link>
                  ) : (
                    task.title
                  )}
                </td>
                {showFeatureColumn ? (
                  <td className="asset-tasks-feature">{getTaskFeatureLabel(task)}</td>
                ) : null}
                <td>
                  <span
                    className={`asset-tasks-status asset-tasks-status--${st === 'done' ? 'done' : 'inProgress'}`}
                  >
                    {statusLabel}
                  </span>
                </td>
                <td className="asset-tasks-created">{createdDisplay}</td>
                <td className="asset-tasks-userid">{task.userId ?? '—'}</td>
                {showActions ? (
                  <td className="asset-tasks-actions">
                    <button type="button" className="asset-tasks-action-btn" onClick={() => onView(task)}>
                      View
                    </button>
                    {showForward ? (
                      <button type="button" className="asset-tasks-action-btn" onClick={() => onForward(task)}>
                        转发
                      </button>
                    ) : null}
                    <button type="button" className="asset-tasks-action-btn danger" onClick={() => onDelete(task)}>
                      Delete
                    </button>
                  </td>
                ) : null}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
