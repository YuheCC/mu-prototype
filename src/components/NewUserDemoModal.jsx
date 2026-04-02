import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DEMO_INTERESTS, DEMO_ROLES } from '../lib/welcomePersonalization'
import { useUserDemo } from '../context/UserDemoContext'
import { DemoInterestIcon, DemoRoleIcon } from './NewUserDemoIcons'
import './NewUserDemoModal.css'

export default function NewUserDemoModal() {
  const navigate = useNavigate()
  const { demoModalOpen, closeUserDemoModal, completeUserDemo } = useUserDemo()
  const [step, setStep] = useState(1)
  const [role, setRole] = useState(null)
  const [interests, setInterests] = useState(() => new Set())

  useEffect(() => {
    if (!demoModalOpen) return
    setStep(1)
    setRole(null)
    setInterests(new Set())
  }, [demoModalOpen])

  useEffect(() => {
    if (!demoModalOpen) return
    const onKey = (e) => {
      if (e.key === 'Escape') closeUserDemoModal()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [demoModalOpen, closeUserDemoModal])

  if (!demoModalOpen) return null

  const toggleInterest = (id) => {
    setInterests((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleFinish = () => {
    const list = [...interests]
    if (!role || list.length === 0) return
    completeUserDemo(role, list)
    navigate('/')
  }

  return (
    <div className="new-user-demo-overlay" role="presentation">
      <div
        className="new-user-demo-backdrop"
        aria-hidden
        onClick={closeUserDemoModal}
      />
      <div
        className="new-user-demo-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-user-demo-title"
      >
        <header className="new-user-demo-top">
          <h2 id="new-user-demo-title" className="new-user-demo-title">
            新用户 Demo
          </h2>
          <div className="new-user-demo-progress" aria-hidden>
            <div
              className={`new-user-demo-progress-seg ${step >= 1 ? 'is-active' : ''} ${step === 1 ? 'is-current' : ''}`}
            />
            <div
              className={`new-user-demo-progress-seg ${step >= 2 ? 'is-active' : ''} ${step === 2 ? 'is-current' : ''}`}
            />
          </div>
          <p className="new-user-demo-step-count">第 {step} 步 / 共 2 步</p>
          <div className="new-user-demo-section-head">
            <h3 className="new-user-demo-section-title">
              {step === 1 ? '选择身份' : '选择感兴趣的领域'}
            </h3>
            <span className="new-user-demo-badge">{step === 1 ? '单选' : '多选'}</span>
          </div>
        </header>

        {step === 1 && (
          <div className="new-user-demo-body" role="radiogroup" aria-label="用户身份">
            {DEMO_ROLES.map((r) => (
              <label key={r.id} className={`new-user-demo-card ${role === r.id ? 'is-selected' : ''}`}>
                <span className="new-user-demo-card-icon" aria-hidden>
                  <DemoRoleIcon id={r.id} className="new-user-demo-svg" />
                </span>
                <span className="new-user-demo-card-label">{r.label}</span>
                <span className="new-user-demo-card-control" aria-hidden>
                  <span className={`new-user-demo-radio-ring ${role === r.id ? 'is-on' : ''}`} />
                </span>
                <input
                  type="radio"
                  name="demo-role"
                  className="new-user-demo-sr-only"
                  value={r.id}
                  checked={role === r.id}
                  onChange={() => setRole(r.id)}
                />
              </label>
            ))}
          </div>
        )}

        {step === 2 && (
          <div className="new-user-demo-body" role="group" aria-label="感兴趣的领域">
            <p className="new-user-demo-helper">可选择多项，至少选一项</p>
            {DEMO_INTERESTS.map((it) => {
              const on = interests.has(it.id)
              return (
                <button
                  key={it.id}
                  type="button"
                  className={`new-user-demo-card new-user-demo-card--multi ${on ? 'is-selected' : ''}`}
                  aria-pressed={on}
                  onClick={() => toggleInterest(it.id)}
                >
                  <span className="new-user-demo-card-icon" aria-hidden>
                    <DemoInterestIcon id={it.id} className="new-user-demo-svg new-user-demo-svg--sm" />
                  </span>
                  <span className="new-user-demo-card-label">{it.label}</span>
                  <span className="new-user-demo-card-control" aria-hidden>
                    <span className={`new-user-demo-check-box ${on ? 'is-on' : ''}`}>
                      {on ? '✓' : ''}
                    </span>
                  </span>
                </button>
              )
            })}
          </div>
        )}

        <footer className="new-user-demo-footer">
          <button type="button" className="new-user-demo-cancel" onClick={closeUserDemoModal}>
            取消
          </button>
          {step === 1 ? (
            <button
              type="button"
              className="new-user-demo-next"
              disabled={!role}
              onClick={() => setStep(2)}
            >
              下一步 <span aria-hidden>→</span>
            </button>
          ) : (
            <div className="new-user-demo-footer-right">
              <button type="button" className="new-user-demo-cancel" onClick={() => setStep(1)}>
                上一步
              </button>
              <button
                type="button"
                className="new-user-demo-next"
                disabled={interests.size === 0}
                onClick={handleFinish}
              >
                完成 <span aria-hidden>→</span>
              </button>
            </div>
          )}
        </footer>
      </div>
    </div>
  )
}
