import './DailyDataHistory.css'
import { useNavigate } from 'react-router-dom'

const mockHistory = [
  {
    date: '2026-03-15',
    cells: 3,
    generatedAt: '10:00',
    reportId: 'DDA-20260315',
    status: 'Done',
  },
  {
    date: '2026-03-14',
    cells: 5,
    generatedAt: '10:02',
    reportId: 'DDA-20260314',
    status: 'Done',
  },
  {
    date: '2026-03-13',
    cells: 2,
    generatedAt: '10:01',
    reportId: 'DDA-20260313',
    status: 'Done',
  },
]

export default function DailyDataHistory() {
  const navigate = useNavigate()
  return (
    <div className="ddh-page">
      <header className="page-header page-header-with-back">
        <div>
          <h1>Daily Data Analysis · History</h1>
          <p className="page-subtitle">
            View past daily batches and life prediction summaries.
          </p>
        </div>
        <button
          type="button"
          className="page-back-btn"
          onClick={() => navigate('/workbench/daily-data-analysis')}
        >
          ← Back to today
        </button>
      </header>

      <section className="ddh-section">
        <div className="ddh-table-wrap">
          <table className="ddh-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Cells in batch</th>
                <th>Generated at</th>
                <th>Report ID</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {mockHistory.map((row) => (
                <tr key={row.reportId}>
                  <td>{row.date}</td>
                  <td>{row.cells}</td>
                  <td>{row.generatedAt}</td>
                  <td>{row.reportId}</td>
                  <td>{row.status}</td>
                  <td>
                    <button
                      type="button"
                      className="ddh-view-btn"
                      onClick={() => navigate(`/workbench/daily-data-history/${row.reportId}`)}
                    >
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

