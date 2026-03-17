import { useNavigate } from 'react-router-dom'
import './DailyDataAnalysis.css'

const mockCells = [
  {
    barcode: 'BAT-001',
    cycles: 128,
    current: '1.0 A',
    voltage: '4.20 V',
    temperature: '28.4 ℃',
    startTime: '2026-03-15 01:12',
  },
  {
    barcode: 'BAT-002',
    cycles: 115,
    current: '0.8 A',
    voltage: '4.18 V',
    temperature: '27.9 ℃',
    startTime: '2026-03-15 00:47',
  },
  {
    barcode: 'BAT-003',
    cycles: 102,
    current: '1.2 A',
    voltage: '4.22 V',
    temperature: '29.1 ℃',
    startTime: '2026-03-14 23:58',
  },
]

export default function DailyDataAnalysis() {
  const navigate = useNavigate()
  return (
    <div className="dda-page">
      <header className="page-header page-header-with-back">
        <div>
          <h1>Daily Data Analysis</h1>
          <p className="page-subtitle">
            Simulated workflow that runs every morning at <strong>10:00</strong> to collect cells and predict life.
          </p>
        </div>
        <div className="dda-header-actions">
          <button
            type="button"
            className="dda-history-btn"
            onClick={() => navigate('/workbench/daily-data-history')}
          >
            历史分析
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

      <section className="dda-workflow">
        <div className="dda-step">
          <div className="dda-step-badge">1</div>
          <div className="dda-step-body">
            <h2 className="dda-step-title">Collect cells for today</h2>
            <p className="dda-step-desc">
              At 10:00 every morning, the system scans the testing database and picks out cells whose cycle count has just
              reached or exceeded <strong>100 cycles</strong>.
            </p>
          </div>
        </div>
        <div className="dda-arrow">➜</div>
        <div className="dda-step">
          <div className="dda-step-badge">2</div>
          <div className="dda-step-body">
            <h2 className="dda-step-title">Run life prediction</h2>
            <p className="dda-step-desc">
              For each eligible cell, MU triggers the Life Prediction tool, using the first 100 cycles as input to estimate
              full cycle life and generate a monitoring report.
            </p>
          </div>
        </div>
      </section>

      <section className="dda-section">
        <h2 className="dda-section-title">Step 1 · Cells collected today</h2>
        <p className="dda-section-desc">
          This is a simulated table. In production, it is refreshed automatically every day at 10:00 from your test database.
        </p>
        <div className="dda-table-wrap">
          <table className="dda-table">
            <thead>
              <tr>
                <th>Barcode</th>
                <th>Cycle Count</th>
                <th>Current</th>
                <th>Voltage</th>
                <th>Temperature</th>
                <th>First Cycle Start Time</th>
              </tr>
            </thead>
            <tbody>
              {mockCells.map((row) => (
                <tr key={row.barcode}>
                  <td>{row.barcode}</td>
                  <td>{row.cycles}</td>
                  <td>{row.current}</td>
                  <td>{row.voltage}</td>
                  <td>{row.temperature}</td>
                  <td>{row.startTime}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="dda-section">
        <h2 className="dda-section-title">Step 2 · Life prediction status</h2>
        <p className="dda-section-desc">
          For this demo we only show a summary. In a full implementation this section would show predicted cycle life, confidence,
          and a link to each detailed prediction task.
        </p>
        <div className="dda-summary">
          <div className="dda-summary-item">
            <div className="dda-summary-label">Cells in today&apos;s batch</div>
            <div className="dda-summary-value">{mockCells.length}</div>
          </div>
          <div className="dda-summary-item">
            <div className="dda-summary-label">Prediction tool</div>
            <div className="dda-summary-value">Life Prediction · 100-cycle input</div>
          </div>
          <div className="dda-summary-item">
            <div className="dda-summary-label">Run time</div>
            <div className="dda-summary-value">Every day at 10:00</div>
          </div>
        </div>
      </section>
    </div>
  )
}

