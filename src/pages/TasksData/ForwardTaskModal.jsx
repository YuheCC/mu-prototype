import { useEffect, useMemo, useState } from 'react'

export default function ForwardTaskModal({
  task,
  conversations,
  currentId,
  onClose,
  onForward,
}) {
  const [destType, setDestType] = useState('new') // new | existing
  const [destId, setDestId] = useState(null)
  const [noteText, setNoteText] = useState('')

  const filteredConversations = useMemo(() => conversations || [], [conversations])

  useEffect(() => {
    const t = setTimeout(() => {
      const first = filteredConversations[0]?.id ?? null
      setDestId((currentId && filteredConversations.some((c) => c.id === currentId) ? currentId : first) ?? null)
    }, 0)
    return () => clearTimeout(t)
  }, [filteredConversations, currentId])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  if (!task) return null

  const canForward = destType === 'new' || (destType === 'existing' && !!destId)

  return (
    <div className="task-forward-modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="task-forward-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-forward-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="task-forward-modal-head">
          <h2 id="task-forward-modal-title" className="task-forward-modal-title">
            转发到对话
          </h2>
          <button type="button" className="task-forward-modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className="task-forward-modal-body">
          <div className="task-forward-preview">
            <div className="task-forward-preview-title">{task.title}</div>
            <div className="task-forward-preview-meta">
              {task.id} · {task.meta || '—'}
            </div>
          </div>

          <div className="task-forward-section">
            <div className="task-forward-section-title">选择目标</div>
            <div className="task-forward-dest-grid">
              <button
                type="button"
                className={`task-forward-dest-btn ${destType === 'new' ? 'active' : ''}`}
                onClick={() => setDestType('new')}
              >
                新对话
              </button>

              {filteredConversations.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className={`task-forward-dest-btn ${destType === 'existing' && destId === c.id ? 'active' : ''}`}
                  onClick={() => {
                    setDestType('existing')
                    setDestId(c.id)
                  }}
                >
                  <span className="task-forward-dest-title">{c.title || '新对话'}</span>
                  {c.id === currentId ? <span className="task-forward-dest-tag">当前</span> : null}
                </button>
              ))}
            </div>
          </div>

          <div className="task-forward-section">
            <div className="task-forward-section-title">补充给对话的文字（可选）</div>
            <textarea
              className="task-forward-textarea"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="例如：请基于该 Assets 任务继续分析，并告诉我下一步建议。"
              rows={3}
            />
          </div>
        </div>

        <div className="task-forward-modal-foot">
          <button type="button" className="task-forward-cancel-btn" onClick={onClose}>
            取消
          </button>
          <button
            type="button"
            className="task-forward-confirm-btn"
            disabled={!canForward}
            onClick={() => {
              if (!canForward) return
              onForward({
                destType,
                destId: destType === 'existing' ? destId : null,
                  noteText,
              })
            }}
          >
            转发
          </button>
        </div>
      </div>
    </div>
  )
}

