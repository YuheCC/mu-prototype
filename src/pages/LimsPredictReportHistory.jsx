import { useNavigate } from 'react-router-dom'
import './DailyDataHistory.css'

const mockHistory = [
  {
    date: '2026-04-03',
    batches: 3,
    limsRows: 5251,
    generatedAt: '09:05',
    reportId: 'LPR-20260403',
    status: 'Done',
  },
  {
    date: '2026-04-02',
    batches: 2,
    limsRows: 4102,
    generatedAt: '09:03',
    reportId: 'LPR-20260402',
    status: 'Done',
  },
  {
    date: '2026-04-01',
    batches: 4,
    limsRows: 6120,
    generatedAt: '09:06',
    reportId: 'LPR-20260401',
    status: 'Done',
  },
]

export default function LimsPredictReportHistory() {
  const navigate = useNavigate()
  return (
    <div className="ddh-page">
      <header className="page-header page-header-with-back">
        <div>
          <h1>LIMS → Predict → Report · History</h1>
          <p className="page-subtitle">
            Past runs from the daily 09:00 schedule: batches, predictions, and report summaries.
          </p>
        </div>
        <button
          type="button"
          className="page-back-btn"
          onClick={() => navigate('/workbench/lims-predict-report')}
        >
          ← Back to workflow
        </button>
      </header>

      <section className="ddh-section">
        <div className="ddh-table-wrap">
          <table className="ddh-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Batches</th>
                <th>LIMS aggregated rows</th>
                <th>Finished at</th>
                <th>Report ID</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {mockHistory.map((row) => (
                <tr key={row.reportId}>
                  <td>{row.date}</td>
                  <td>{row.batches}</td>
                  <td>{row.limsRows}</td>
                  <td>{row.generatedAt}</td>
                  <td>{row.reportId}</td>
                  <td>{row.status}</td>
                  <td>
                    <button type="button" className="ddh-view-btn" disabled title="Demo">
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
