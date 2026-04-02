import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import './AccountSettings.css'

const NAV = [
  { id: 'account', label: '账户管理' },
  { id: 'subscription', label: '订阅' },
  { id: 'usage', label: '使用' },
]

function UsageBar({ value = 0 }) {
  const pct = Math.max(0, Math.min(100, Number(value) || 0))
  return (
    <div className="acct-usage-row" aria-label="Usage">
      <div className="acct-usage-top">
        <div className="acct-usage-label">Total</div>
        <div className="acct-usage-value">{pct}%</div>
      </div>
      <div className="acct-usage-bar" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div className="acct-usage-bar-fill" style={{ width: `${pct}%` }} />
      </div>
      <div className="acct-usage-sub">61% Auto and 0% API used</div>
    </div>
  )
}

export default function AccountSettings() {
  const [tab, setTab] = useState('account')
  const [firstName, setFirstName] = useState('yuhe')
  const [lastName, setLastName] = useState('chen')
  const [theme, setTheme] = useState('System')

  const sessions = useMemo(
    () => [
      { id: 'web', name: 'Web', time: '20 days ago' },
      { id: 'desktop-1', name: 'Desktop App', time: '20 days ago' },
      { id: 'desktop-2', name: 'Desktop App', time: '13 days ago' },
      { id: 'desktop-3', name: 'Desktop App', time: '6 days ago' },
    ],
    []
  )

  return (
    <div className="acct-page">
      <header className="acct-header">
        <Link to="/" className="acct-back">
          ← 返回 Ask
        </Link>
        <h1>Account settings</h1>
      </header>

      <div className="acct-layout">
        <aside className="acct-nav" aria-label="Settings navigation">
          {NAV.map((n) => (
            <button
              key={n.id}
              type="button"
              className={`acct-nav-item ${tab === n.id ? 'active' : ''}`}
              onClick={() => setTab(n.id)}
            >
              {n.label}
            </button>
          ))}
        </aside>

        <main className="acct-main">
          {tab === 'account' && (
            <div className="acct-section">
              <div className="acct-section-title">Student Verification</div>
              <div className="acct-card">
                <div className="acct-row">
                  <div>
                    <div className="acct-row-title">Student Status</div>
                    <div className="acct-row-sub">
                      Only .edu emails and specific educational domains are eligible for student verification.
                    </div>
                  </div>
                  <div className="acct-pill muted">Not eligible</div>
                </div>
              </div>

              <div className="acct-section-title">Profile</div>
              <div className="acct-card">
                <div className="acct-form-row">
                  <div className="acct-form-label">First Name</div>
                  <input className="acct-input" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                </div>
                <div className="acct-form-row">
                  <div className="acct-form-label">Last Name</div>
                  <input className="acct-input" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                </div>
                <div className="acct-actions">
                  <button type="button" className="acct-btn primary" disabled>
                    Save
                  </button>
                </div>
              </div>

              <div className="acct-section-title">Appearance</div>
              <div className="acct-card">
                <div className="acct-form-row">
                  <div className="acct-form-label">Theme</div>
                  <select className="acct-select" value={theme} onChange={(e) => setTheme(e.target.value)}>
                    <option>System</option>
                    <option>Light</option>
                    <option>Dark</option>
                  </select>
                </div>
              </div>

              <div className="acct-section-title">Active Sessions</div>
              <div className="acct-card">
                {sessions.map((s) => (
                  <div key={s.id} className="acct-session-row">
                    <div className="acct-session-left">
                      <span className="acct-session-dot" aria-hidden />
                      <span className="acct-session-name">{s.name}</span>
                    </div>
                    <div className="acct-session-right">
                      <span className="acct-session-time">{s.time}</span>
                      <button type="button" className="acct-btn subtle">
                        Revoke
                      </button>
                    </div>
                  </div>
                ))}
                <div className="acct-hint">Session revocation may take up to 10 minutes to complete.</div>
              </div>

              <div className="acct-section-title">More</div>
              <div className="acct-card">
                <div className="acct-session-row">
                  <div className="acct-session-name">Log Out</div>
                  <button type="button" className="acct-btn subtle">
                    Log Out
                  </button>
                </div>
                <div className="acct-session-row">
                  <div className="acct-session-name">Delete Account</div>
                  <button type="button" className="acct-btn danger">
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}

          {(tab === 'subscription' || tab === 'usage') && (
            <div className="acct-section">
              <div className="acct-grid-2">
                <div className="acct-card">
                  <div className="acct-mini-label">CURRENT PLAN</div>
                  <div className="acct-plan-title">
                    Pro <span className="acct-plan-price">$20/mo</span>
                  </div>
                  <div className="acct-row-sub">Resets on Apr 16 (14 days)</div>
                  <button type="button" className="acct-btn subtle" style={{ marginTop: 10 }}>
                    Adjust plan
                  </button>
                </div>
                <div className="acct-card acct-card-dark">
                  <div className="acct-mini-label">UPGRADE AVAILABLE</div>
                  <div className="acct-plan-title">
                    Pro+ <span className="acct-plan-price">$60/mo</span>
                  </div>
                  <div className="acct-row-sub">Unlock 3x more usage on Agent &amp; more</div>
                  <button type="button" className="acct-btn solid" style={{ marginTop: 10 }}>
                    Upgrade
                  </button>
                </div>
              </div>

              <div className="acct-mini-label" style={{ marginTop: 14 }}>
                Included in Pro
              </div>
              <div className="acct-card">
                <UsageBar value={47} />
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

