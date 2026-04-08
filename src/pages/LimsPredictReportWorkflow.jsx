import { useNavigate } from 'react-router-dom'
import './DailyDataAnalysis.css'

const mockBatches = [
  {
    batchId: 'LIMS-BATCH-20260403-A',
    limsSlot: 'East Lab · Slot-2',
    cells: 12,
    aggRows: 1840,
    lastFetch: '2026-04-03 09:00:12',
  },
  {
    batchId: 'LIMS-BATCH-20260402-C',
    limsSlot: 'Pilot Line · P1',
    cells: 8,
    aggRows: 1216,
    lastFetch: '2026-04-02 09:00:05',
  },
  {
    batchId: 'LIMS-BATCH-20260401-B',
    limsSlot: 'East Lab · Slot-1',
    cells: 15,
    aggRows: 2195,
    lastFetch: '2026-04-01 09:00:18',
  },
]

export default function LimsPredictReportWorkflow() {
  const navigate = useNavigate()
  return (
    <div className="dda-page">
      <header className="page-header page-header-with-back">
        <div>
          <h1>LIMS → Predict → Report</h1>
          <p className="page-subtitle">
            Automated pipeline that pulls battery cell test data from LIMS every day at <strong>09:00</strong>, cleans and
            aggregates it, runs life prediction, and generates a daily report.
          </p>
        </div>
        <div className="dda-header-actions">
          <button
            type="button"
            className="dda-history-btn"
            onClick={() => navigate('/workbench/lims-predict-report-history')}
          >
            History
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

      <section className="dda-workflow dda-workflow--lims">
        <div className="dda-step">
          <div className="dda-step-badge">1</div>
          <div className="dda-step-body">
            <h2 className="dda-step-title">LIMS data fetch</h2>
            <p className="dda-step-desc">
              Sync raw cycling and operating-condition data from LIMS by batch / experimental slot for the current day.
            </p>
          </div>
        </div>
        <div className="dda-arrow">➜</div>
        <div className="dda-step">
          <div className="dda-step-badge">2</div>
          <div className="dda-step-body">
            <h2 className="dda-step-title">Clean &amp; wide-table aggregate</h2>
            <p className="dda-step-desc">
              Rule checks, denoise and alignment; output an aggregated wide table ready for modeling.
            </p>
          </div>
        </div>
        <div className="dda-arrow">➜</div>
        <div className="dda-step">
          <div className="dda-step-badge">3</div>
          <div className="dda-step-body">
            <h2 className="dda-step-title">Life Prediction</h2>
            <p className="dda-step-desc">
              Call Predict Skill to batch-infer cycle life and confidence intervals for eligible cells.
            </p>
          </div>
        </div>
        <div className="dda-arrow">➜</div>
        <div className="dda-step">
          <div className="dda-step-badge">4</div>
          <div className="dda-step-body">
            <h2 className="dda-step-title">Daily report &amp; delivery</h2>
            <p className="dda-step-desc">
              Roll up results into a daily report and push to email / Feishu channels.
            </p>
          </div>
        </div>
      </section>

      <section className="dda-section">
        <h2 className="dda-section-title">Step 1 · LIMS batches pulled today (simulation)</h2>
        <p className="dda-section-desc">
          Demo table. In production, refreshed automatically by the scheduler around 09:00 each day.
        </p>
        <div className="dda-table-wrap">
          <table className="dda-table">
            <thead>
              <tr>
                <th>Batch ID</th>
                <th>LIMS source</th>
                <th>Cell count</th>
                <th>Aggregated rows</th>
                <th>Last pull time</th>
              </tr>
            </thead>
            <tbody>
              {mockBatches.map((row) => (
                <tr key={row.batchId}>
                  <td>{row.batchId}</td>
                  <td>{row.limsSlot}</td>
                  <td>{row.cells}</td>
                  <td>{row.aggRows}</td>
                  <td>{row.lastFetch}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="dda-section">
        <h2 className="dda-section-title">Step 2 · Prediction &amp; report status (summary)</h2>
        <p className="dda-section-desc">
          Demo summary only. A full implementation would link to prediction tasks and report archives in Assets.
        </p>
        <div className="dda-summary">
          <div className="dda-summary-item">
            <div className="dda-summary-label">Today&apos;s batches</div>
            <div className="dda-summary-value">{mockBatches.length}</div>
          </div>
          <div className="dda-summary-item">
            <div className="dda-summary-label">Prediction tool</div>
            <div className="dda-summary-value">Life Prediction · Predict Skill</div>
          </div>
          <div className="dda-summary-item">
            <div className="dda-summary-label">Scheduled run</div>
            <div className="dda-summary-value">Daily 09:00</div>
          </div>
          <div className="dda-summary-item">
            <div className="dda-summary-label">Report delivery</div>
            <div className="dda-summary-value">Email / Feishu · #battery-ops</div>
          </div>
        </div>
      </section>
    </div>
  )
}
