import { useNavigate } from 'react-router-dom'
import './AccountSettings.css'

export default function AccountPlans() {
  const navigate = useNavigate()
  return (
    <div className="acct-page">
      <header className="acct-header">
        <div className="acct-header-left">
          <h1>Plans</h1>
        </div>
        <button
          type="button"
          className="acct-plan-close-btn"
          aria-label="Close"
          onClick={() => navigate('/account')}
        >
          ✕
        </button>
      </header>

      <div className="acct-section">
        <div className="acct-plans-grid">
          <div className="acct-card acct-plan-card">
            <div className="acct-mini-label">BASIC</div>
            <div className="acct-plan-price-row">
              <div className="acct-plan-price-main">$0</div>
              <div className="acct-plan-price-meta">/ month</div>
            </div>
            <button type="button" className="acct-plan-cta" disabled>
              Current plan
            </button>
            <div className="acct-row-sub" style={{ marginTop: 10 }}>
              Best for getting started and light personal use.
            </div>
            <ul className="acct-plan-list">
              <li>Includes a small monthly token quota</li>
              <li>Access to Ask and core tools</li>
              <li>Community support</li>
            </ul>
          </div>

          <div className="acct-card acct-plan-card acct-plan-card--highlight">
            <div className="acct-plan-tag">Most popular</div>
            <div className="acct-mini-label">PRO</div>
            <div className="acct-plan-price-row">
              <div className="acct-plan-price-main">$20</div>
              <div className="acct-plan-price-meta">/ month</div>
            </div>
            <button type="button" className="acct-plan-cta acct-plan-cta--primary">
              Upgrade to Pro
            </button>
            <div className="acct-row-sub" style={{ marginTop: 10 }}>
              For individual power users who need higher limits.
            </div>
            <ul className="acct-plan-list">
              <li>Higher monthly token quota</li>
              <li>Priority access to new Agent features</li>
              <li>Usage analytics and history</li>
            </ul>
          </div>

          <div className="acct-card acct-plan-card">
            <div className="acct-mini-label">ENTERPRISE</div>
            <div className="acct-plan-price-row">
              <div className="acct-plan-price-main">Custom</div>
              <div className="acct-plan-price-meta">per org</div>
            </div>
            <button type="button" className="acct-plan-cta">
              Contact sales
            </button>
            <div className="acct-row-sub" style={{ marginTop: 10 }}>
              For teams and organizations that need control and scale.
            </div>
            <ul className="acct-plan-list">
              <li>Custom limits and pricing</li>
              <li>Team seats and admin controls</li>
              <li>Dedicated support and onboarding</li>
            </ul>
          </div>
        </div>

        <div className="acct-card acct-plan-notes">
          <div className="acct-section-title">Notes</div>
          <div className="acct-row-sub" style={{ marginTop: 8 }}>
            Verified educational users can upgrade to Pro for free after passing student or faculty verification.
          </div>
          <div className="acct-row-sub" style={{ marginTop: 6 }}>
            When the tokens included in your plan are used up, you can purchase additional token bundles separately.
          </div>
        </div>
      </div>
    </div>
  )
}

