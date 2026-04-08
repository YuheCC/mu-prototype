import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './AccountSettings.css'

const NAV = [
  { id: 'account', label: '账户管理' },
  { id: 'subscription', label: '订阅和使用' },
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
  const navigate = useNavigate()
  const [tab, setTab] = useState('account')
  const [firstName, setFirstName] = useState('yuhe')
  const [lastName, setLastName] = useState('chen')
  const [theme, setTheme] = useState('System')
  const loginMethods = [
    {
      id: 'phone',
      label: 'Phone',
      icon: '📱',
      iconBg: '#f97316',
      value: '(+86) 181 **** 1084',
      actionText: 'Edit',
    },
    {
      id: 'email',
      label: 'Email',
      icon: '✉️',
      iconBg: '#3b82f6',
      value: 'Not set',
      actionText: 'Edit',
    },
    {
      id: 'wechat',
      label: 'WeChat',
      icon: '💚',
      iconBg: '#22c55e',
      value: 'Connected',
      actionText: 'Disconnect',
      actionVariant: 'danger',
    },
    {
      id: 'google',
      label: 'Google',
      icon: 'G',
      iconBg: '#ffffff',
      value: 'Not connected',
      actionText: 'Connect',
      iconColor: '#1a73e8',
      iconBorder: '1px solid rgba(148, 163, 184, 0.5)',
    },
    {
      id: 'apple',
      label: 'Apple',
      icon: '',
      iconBg: '#111827',
      value: 'Not connected',
      actionText: 'Connect',
      iconColor: '#fff',
    },
  ]

  return (
    <div className="acct-page">
      <header className="acct-header">
        <div className="acct-header-left">
          <h1>Account settings</h1>
        </div>
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

              <div className="acct-section-title">Sign-in methods</div>
              <div className="acct-card">
                {loginMethods.map((m) => (
                  <div key={m.id} className="acct-method-row">
                    <div className="acct-method-left">
                      <div
                        className="acct-method-icon"
                        style={{
                          background: m.iconBg,
                          color: m.iconColor || 'inherit',
                          border: m.iconBorder || 'none',
                        }}
                      >
                        {m.icon}
                      </div>
                      <div className="acct-method-label">{m.label}</div>
                    </div>

                    <div className="acct-method-right">
                      <div className="acct-method-value">{m.value}</div>
                      <button
                        type="button"
                        className={`acct-method-action ${m.actionVariant === 'danger' ? 'danger' : ''}`}
                      >
                        {m.actionText}
                      </button>
                    </div>
                  </div>
                ))}
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

          {tab === 'subscription' && (
            <div className="acct-section">
              <div className="acct-card">
                <div className="acct-plan-header">
                  <div className="acct-mini-label">CURRENT PLAN</div>
                  <button
                    type="button"
                    className="acct-plan-view-btn"
                    onClick={() => navigate('/account/plans')}
                  >
                    View plans
                  </button>
                </div>
                <div className="acct-plan-title">
                  Pro <span className="acct-plan-price">$20/mo</span>
                </div>
                <div className="acct-row-sub">Resets on Apr 16 (14 days)</div>
                <button type="button" className="acct-btn subtle" style={{ marginTop: 10 }}>
                  Adjust plan
                </button>
              </div>

              <div className="acct-mini-label" style={{ marginTop: 14 }}>
                Included in Pro. When included tokens are used up, you can purchase extra tokens separately.
              </div>
              <div className="acct-card">
                <UsageBar value={47} />
              </div>

              <div className="acct-card acct-usage-history-card">
                <div className="acct-usage-history-header">
                  <div className="acct-usage-history-filters">
                    <button type="button" className="acct-usage-chip">
                      Mar 05 - Apr 03
                    </button>
                    <div className="acct-usage-chip-group">
                      <button type="button" className="acct-usage-chip ghost">
                        1d
                      </button>
                      <button type="button" className="acct-usage-chip ghost">
                        7d
                      </button>
                      <button type="button" className="acct-usage-chip ghost active">
                        30d
                      </button>
                    </div>
                  </div>
                  <button type="button" className="acct-usage-export-btn">
                    Export CSV
                  </button>
                </div>

                <div className="acct-usage-table-wrap">
                  <table className="acct-usage-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Type</th>
                        <th>Model</th>
                        <th>Tokens</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Apr 3, 03:23 PM</td>
                        <td>Included</td>
                        <td>auto</td>
                        <td>0</td>
                      </tr>
                      <tr>
                        <td>Apr 3, 02:42 PM</td>
                        <td>Included</td>
                        <td>auto</td>
                        <td>494.2K</td>
                      </tr>
                      <tr>
                        <td>Apr 3, 02:10 PM</td>
                        <td>Included</td>
                        <td>auto</td>
                        <td>1.4M</td>
                      </tr>
                      <tr>
                        <td>Apr 3, 02:01 PM</td>
                        <td>Included</td>
                        <td>auto</td>
                        <td>791.2K</td>
                      </tr>
                      <tr>
                        <td>Apr 3, 01:49 PM</td>
                        <td>Included</td>
                        <td>auto</td>
                        <td>1.5M</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

