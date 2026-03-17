import { useNavigate } from 'react-router-dom'
import './ToolsDocs.css'

const tools = [
  {
    name: 'Formulate',
    desc: 'Formulation optimization and recipe design. Use it to explore candidate compositions and constraints.'
  },
  {
    name: 'Life Prediction',
    desc: 'Battery life prediction and degradation trend estimation from cycling data.'
  },
  {
    name: 'Electrolyte Design',
    desc: 'Electrolyte composition analysis and property-driven design suggestions.'
  },
  {
    name: 'Electrode Design',
    desc: 'Electrode parameter exploration (loading, porosity, composition) and performance trade-off insights.'
  },
]

export default function ToolsDocs() {
  const navigate = useNavigate()

  return (
    <div className="tools-docs-page">
      <div className="tools-docs-top">
        <h1>Tools</h1>
        <button type="button" className="tools-docs-back" onClick={() => navigate(-1)}>
          ← Back
        </button>
      </div>

      <p className="tools-docs-subtitle">
        Learn what each tool does and when to use it.
      </p>

      <div className="tools-docs-grid">
        {tools.map((t) => (
          <div key={t.name} className="tools-docs-card">
            <div className="tools-docs-name">{t.name}</div>
            <div className="tools-docs-desc">{t.desc}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

