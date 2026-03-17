import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTasks } from '../../context/TasksContext'

const TOOL_OPTIONS = ['Formulate', 'Life Prediction', 'Electrolyte Design', 'Electrode Design']

const demoTasks = [
  { id: 'daily-1', title: 'Daily data sync', meta: 'Last run: 2 hours ago', status: 'done', type: 'other' },
  { id: 'batch-1', title: 'Battery cycle analysis', meta: 'Scheduled for today', status: 'pending', type: 'other' },
  { id: 'export-1', title: 'Export report to CSV', meta: 'Created yesterday', status: 'pending', type: 'other' },
]

export default function Tasks() {
  const { tasks } = useTasks()
  const [toolFilter, setToolFilter] = useState('')
  const predictionTasks = tasks.filter((t) => t.type === 'prediction')
  const allTasks = [...predictionTasks, ...demoTasks]
  const filteredTasks = !toolFilter
    ? allTasks
    : allTasks.filter((t) => t.tool === toolFilter)

  return (
    <div className="tasks-with-filter">
      <div className="tasks-filter-bar">
        <label className="tasks-filter-label" htmlFor="tasks-tool-filter">Tool</label>
        <select
          id="tasks-tool-filter"
          className="tasks-filter-select"
          value={toolFilter}
          onChange={(e) => setToolFilter(e.target.value)}
        >
          <option value="">All</option>
          {TOOL_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>
      <div className="card-list">
      {filteredTasks.map((task) => {
        const content = (
          <>
            <div>
              <div className="card-title">{task.title}</div>
              <div className="card-meta">
                {task.type === 'prediction' ? task.predictionTime : task.meta}
              </div>
            </div>
            <span className={`card-badge ${task.status === 'done' ? 'done' : 'pending'}`}>
              {task.status === 'done' ? 'Done' : 'Pending'}
            </span>
          </>
        )
        return task.type === 'prediction' ? (
          <Link key={task.id} to={`/tasks-data/task/${task.id}`} className="card card-link">
            {content}
          </Link>
        ) : (
          <div key={task.id} className="card">
            {content}
          </div>
        )
      })}
      </div>
    </div>
  )
}
