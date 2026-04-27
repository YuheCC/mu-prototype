import { useNavigate, useParams } from 'react-router-dom'
import './DailyDataAnalysis.css'

const historyDetails = {
  'DDA-20260315': {
    date: '2026-03-15',
    cells: [
      { barcode: 'BAT-001', cycles: 128, current: '1.0 A', voltage: '4.20 V', temperature: '28.4 ℃', startTime: '2026-03-15 01:12' },
      { barcode: 'BAT-002', cycles: 115, current: '0.8 A', voltage: '4.18 V', temperature: '27.9 ℃', startTime: '2026-03-15 00:47' },
      { barcode: 'BAT-003', cycles: 102, current: '1.2 A', voltage: '4.22 V', temperature: '29.1 ℃', startTime: '2026-03-14 23:58' },
    ],
  },
  'DDA-20260314': {
    date: '2026-03-14',
    cells: [
      { barcode: 'BAT-010', cycles: 121, current: '1.0 A', voltage: '4.19 V', temperature: '28.0 ℃', startTime: '2026-03-14 01:05' },
      { barcode: 'BAT-011', cycles: 110, current: '0.9 A', voltage: '4.17 V', temperature: '27.5 ℃', startTime: '2026-03-14 00:50' },
    ],
  },
  'DDA-20260313': {
    date: '2026-03-13',
    cells: [
      { barcode: 'BAT-020', cycles: 100, current: '0.8 A', voltage: '4.16 V', temperature: '27.2 ℃', startTime: '2026-03-13 00:40' },
    ],
  },
}

export default function DailyDataHistoryDetail() {
  const navigate = useNavigate()
  const { id } = useParams()
  const detail = historyDetails[id] || null

  if (!detail) {
    return (
      <div className="dda-page">
        <header className="page-header page-header-with-back">
          <div>
            <h1>Daily Data Analysis · History</h1>
            <p className="page-subtitle">Report not found.</p>
          </div>
          <button
            type="button"
            className="page-back-btn"
            onClick={() => navigate('/workbench/daily-data-history')}
          >
            ← Back to history
          </button>
        </header>
      </div>
    )
  }

  return (
    <div className="dda-page">
      <header className="page-header page-header-with-back">
        <div>
          <h1>Daily Data Analysis · {detail.date}</h1>
          <p className="page-subtitle">
            This is a historical run of the Daily Data Analysis workflow for {detail.date}.
          </p>
        </div>
        <button
          type="button"
          className="page-back-btn"
          onClick={() => navigate('/workbench/daily-data-history')}
        >
          ← Back to history
        </button>
      </header>

      <section className="dda-workflow">
        <div className="dda-step">
          <div className="dda-step-badge">1</div>
          <div className="dda-step-body">
            <h2 className="dda-step-title">Collect cells for the day</h2>
            <p className="dda-step-desc">
              At 10:00 the system scanned the testing database and picked out cells whose cycle count reached or exceeded{' '}
              <strong>100 cycles</strong>.
            </p>
          </div>
        </div>
        <div className="dda-arrow">➜</div>
        <div className="dda-step">
          <div className="dda-step-badge">2</div>
          <div className="dda-step-body">
            <h2 className="dda-step-title">Run life prediction</h2>
            <p className="dda-step-desc">
              For each eligible cell, MU Agent triggered the Life Prediction tool, using the first 100 cycles as input to estimate
              full cycle life and generate a monitoring report.
            </p>
          </div>
        </div>
      </section>

      <section className="dda-section">
        <h2 className="dda-section-title">Step 1 · Cells in this batch</h2>
        <p className="dda-section-desc">
          Historical snapshot of the cells that entered the workflow on {detail.date}.
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
              {detail.cells.map((row) => (
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
          In a full implementation this section would link to each prediction task created on this date. For this demo we only show a
          summary.
        </p>
        <div className="dda-summary">
          <div className="dda-summary-item">
            <div className="dda-summary-label">Cells in batch</div>
            <div className="dda-summary-value">{detail.cells.length}</div>
          </div>
          <div className="dda-summary-item">
            <div className="dda-summary-label">Prediction tool</div>
            <div className="dda-summary-value">Life Prediction · 100-cycle input</div>
          </div>
          <div className="dda-summary-item">
            <div className="dda-summary-label">Run date</div>
            <div className="dda-summary-value">{detail.date}</div>
          </div>
        </div>
      </section>
    </div>
  )
}

