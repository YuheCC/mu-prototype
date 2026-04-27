import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './ManageFeatures.css'

const GROUPS = [
  {
    id: 'formulate',
    title: 'Formulate',
    icon: '🧪',
    tools: [
      { name: 'Formulate', desc: 'Formulation optimization and recipe design', added: true },
    ],
  },
  {
    id: 'design',
    title: 'Design',
    icon: '🎯',
    tools: [
      { name: 'Electrolyte Design', desc: 'Electrolyte composition and property analysis', added: true },
      { name: 'Train Electrolyte Design Model', desc: 'Train electrolyte property models', added: false },
      { name: 'Performance Prediction (Electrode)', desc: 'Predict electrode performance from design', added: false },
      { name: 'Inverse Design (Electrode)', desc: 'Search electrode designs that meet targets', added: false },
      { name: 'Train (Electrode)', desc: 'Train models for electrode design', added: false },
    ],
  },
  {
    id: 'predict',
    title: 'Predict',
    icon: '⏱',
    tools: [
      { name: 'New Life Prediction', desc: 'Create a new battery life prediction', added: true },
      { name: 'Train Life Prediction Model', desc: 'Train a new life prediction model', added: true },
    ],
  },
  {
    id: 'manufacture',
    title: 'Manufacture',
    icon: '🏭',
    tools: [
      { name: 'Quality Prediction and Correlation Analysis', desc: 'Link process parameters to quality metrics', added: false },
      { name: 'CT/X-ray Assisted Measurement and Anomaly Detection', desc: 'Detect internal structural issues from imaging', added: false },
      { name: 'K-Value Prediction and Batch Consistency Analysis', desc: 'Monitor dispersion and batch-to-batch stability', added: false },
      { name: 'Electrolyte Wetting State Ultrasonic Al-Assisted Detection', desc: 'Assess electrolyte wetting state with ultrasonic signals', added: false },
    ],
  },
  {
    id: 'third-party',
    title: 'Third-party Systems',
    icon: '🔗',
    tools: [
      { name: 'ERP', desc: 'Integrate MU Agent 4.27 workflows with your ERP system', added: false },
      { name: 'LIMS', desc: 'Connect laboratory data from LIMS into MU Agent 4.27', added: false },
    ],
  },
]

export default function ManageFeatures() {
  const navigate = useNavigate()
  const [viewMode, setViewMode] = useState('card') // 'card' | 'table'

  const flatRows = GROUPS.flatMap((group) =>
    group.tools.map((tool) => ({
      group: group.title,
      name: tool.name,
      desc: tool.desc,
      added: tool.added,
    })),
  )
  return (
    <div className="manage-features-page">
      <header className="page-header page-header-with-back">
        <div>
          <h1>Manage Features</h1>
          <p className="page-subtitle">
            View all tools in MU Agent 4.27, organized by Formulate, Design, Predict, and Manufacture.
          </p>
        </div>
        <div className="manage-header-actions">
          <button
            type="button"
            className="view-toggle-btn"
            onClick={() => setViewMode((m) => (m === 'card' ? 'table' : 'card'))}
            title={viewMode === 'card' ? 'Switch to table view' : 'Switch to card view'}
          >
            {viewMode === 'card' ? '☰' : '⬚'}
          </button>
          <button
            type="button"
            className="page-back-btn"
            onClick={() => navigate('/features-workflows')}
          >
            ← Back to Workbench
          </button>
        </div>
      </header>

      {viewMode === 'card' ? (
        <div className="manage-features-groups">
          {GROUPS.map((group) => (
            <section key={group.id} className="mf-group">
              <h2 className="mf-group-title">{group.title}</h2>
              <div className="grid">
                {group.tools.map((tool) => (
                  <div key={tool.name} className="feature-card feature-card-button">
                    <div className="feature-card-top-row">
                      <span className="feature-icon">{group.icon}</span>
                      <span className={`feature-status-badge ${tool.added ? 'added' : 'not-added'}`}>
                        {tool.added ? 'In Workbench' : 'Not added'}
                      </span>
                    </div>
                    <h3 className="feature-name">{tool.name}</h3>
                    <p className="feature-desc">{tool.desc}</p>
                    <button
                      type="button"
                      className="feature-intro-link"
                      onClick={() => {
                        if (group.id === 'formulate') {
                          navigate('/workbench/features/formulate')
                        }
                      }}
                    >
                      Introduction
                    </button>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <section className="mf-table-section">
          <table className="mf-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Feature</th>
                <th>Description</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {flatRows.map((row) => (
                <tr key={`${row.group}-${row.name}`}>
                  <td>{row.group}</td>
                  <td>{row.name}</td>
                  <td>{row.desc}</td>
                  <td>
                    <span className={`feature-status-badge ${row.added ? 'added' : 'not-added'}`}>
                      {row.added ? 'In Workbench' : 'Not added'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  )
}

