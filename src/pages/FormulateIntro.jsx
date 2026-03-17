import { useNavigate } from 'react-router-dom'
import './FormulateIntro.css'

export default function FormulateIntro() {
  const navigate = useNavigate()
  return (
    <div className="formulate-intro-page">
      <header className="page-header page-header-with-back">
        <div>
          <h1>Formulate · Molecular Dynamics (MD) Service</h1>
          <p className="page-subtitle">
            Use MU&apos;s MD simulations to quantitatively evaluate electrolyte formulations, capturing ion–solvent interactions with
            high fidelity.
          </p>
        </div>
        <button
          type="button"
          className="page-back-btn"
          onClick={() => navigate('/workbench/manage-features')}
        >
          ← Back to Manage Features
        </button>
      </header>

      <section className="fi-section">
        <p className="fi-text">
          Molecular dynamics (MD) simulations in MU&apos;s platform uniquely combine advanced polarizable force fields with an automated
          workflow, capturing ion–solvent interactions with high fidelity. Users simply submit desired electrolyte formulations through
          the MU portal containing any known or unknown molecules, and within days will receive quantitative predictions of key
          properties—delivering faster and more accurate insights than conventional trial‑and‑error or classical modeling approaches.
        </p>

        <div className="fi-flow">
          <div className="fi-flow-card">
            <div className="fi-flow-icon">🧑‍💻</div>
            <div className="fi-flow-title">MD simulation request</div>
            <div className="fi-flow-sub">Submitted in MU user portal</div>
          </div>
          <div className="fi-flow-arrow">➜</div>
          <div className="fi-flow-card">
            <div className="fi-flow-icon">🧬</div>
            <div className="fi-flow-title">MD simulations</div>
            <div className="fi-flow-sub">Using polarizable force fields</div>
          </div>
          <div className="fi-flow-arrow">➜</div>
          <div className="fi-flow-card">
            <div className="fi-flow-icon">📈</div>
            <div className="fi-flow-title">Trajectory analysis</div>
            <div className="fi-flow-sub">Electrolyte properties and KPIs</div>
          </div>
        </div>

        <p className="fi-caption">Our proprietary Molecular Dynamics (MD) service for electrolyte formulation</p>
      </section>

      <section className="fi-section">
        <p className="fi-text">
          MU&apos;s proprietary MD service provides molecular‑level snapshots of electrolyte formulations, capturing how Li⁺, anions, and
          solvent molecules organize at different salt concentrations.
        </p>
        <p className="fi-text">
          Each standard simulation run completes in approximately three days depending on the complexity of the formulation, after which
          customers receive quantitative property predictions—delivering fast and reliable insights to guide electrolyte design and
          optimization, which saves tremendous cost and time.
        </p>

        <div className="fi-concentration-row">
          <div className="fi-box">
            <div className="fi-box-label">1 M</div>
            <div className="fi-box-body">MD snapshot</div>
          </div>
          <div className="fi-box">
            <div className="fi-box-label">2 M</div>
            <div className="fi-box-body">MD snapshot</div>
          </div>
          <div className="fi-box">
            <div className="fi-box-label">4 M</div>
            <div className="fi-box-body">MD snapshot</div>
          </div>
        </div>

        <p className="fi-caption">
          Accelerating electrolyte design with MD simulations across concentrations.
        </p>
      </section>
    </div>
  )
}

