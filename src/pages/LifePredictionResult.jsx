import { useNavigate } from 'react-router-dom'
import './PredictionDetail.css'

const CHART_WIDTH = 560
const CHART_HEIGHT = 280
const PAD = { left: 48, right: 24, top: 16, bottom: 36 }
const X_MAX = 3500
const Y_MIN = 75
const Y_MAX = 105

function buildPath(points) {
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
}

const demoTask = {
  id: 'PR-310',
  fileName: 'demo(2).csv',
  predictionTime: '2026/03/17 13:47:59',
  batteryCount: 1,
  barcode: 'demo',
  cycleLife: 3114,
}

export default function LifePredictionResult() {
  const navigate = useNavigate()
  const task = demoTask

  const innerW = CHART_WIDTH - PAD.left - PAD.right
  const innerH = CHART_HEIGHT - PAD.top - PAD.bottom
  const xScale = (v) => PAD.left + (v / X_MAX) * innerW
  const yScale = (v) => PAD.top + innerH - ((v - Y_MIN) / (Y_MAX - Y_MIN)) * innerH

  const usedPoints = []
  for (let i = 0; i <= 200; i += 10) {
    const x = i
    const y = 100 - (i / 200) * 4
    usedPoints.push({ x: xScale(x), y: yScale(y) })
  }
  const predictedPoints = []
  for (let i = 200; i <= 3200; i += 100) {
    const x = i
    const y = 96 - ((i - 200) / 3000) * 16
    predictedPoints.push({ x: xScale(x), y: yScale(y) })
  }
  const lifeX = xScale(task.cycleLife)
  const lifeY = yScale(80)
  const line80y = yScale(80)

  return (
    <div className="pred-detail-page">
      <div className="pred-detail-top">
        <h1 className="pred-detail-title">Prediction Details - {task.id}</h1>
        <button type="button" className="pred-back-btn" onClick={() => navigate('/features-workflows')}>
          Back to List
        </button>
      </div>

      <section className="pred-section">
        <h2 className="pred-section-title">Uploaded Data</h2>
        <div className="pred-upload-row">
          <span className="pred-filename">{task.fileName}</span>
          <button type="button" className="pred-download-btn">
            <span className="pred-download-icon">↓</span>
            Download
          </button>
        </div>
      </section>

      <section className="pred-section">
        <h2 className="pred-section-title">Prediction Results</h2>
        <div className="pred-summary-cards">
          <div className="pred-summary-card">
            <div className="pred-summary-label">Battery Count</div>
            <div className="pred-summary-value">{task.batteryCount}pcs</div>
          </div>
          <div className="pred-summary-card">
            <div className="pred-summary-label">Prediction Time</div>
            <div className="pred-summary-value">{task.predictionTime}</div>
          </div>
        </div>

        <div className="pred-table-wrap">
          <table className="pred-table">
            <thead>
              <tr>
                <th>Barcode</th>
                <th>Cycle Life</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{task.barcode}</td>
                <td>{task.cycleLife}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="pred-chart-wrap">
          <svg className="pred-chart" viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}>
            <text x={CHART_WIDTH / 2} y={CHART_HEIGHT - 6} className="pred-chart-axis-label" textAnchor="middle">Cycle ID</text>
            <text x={14} y={CHART_HEIGHT / 2} className="pred-chart-axis-label" textAnchor="middle" transform={`rotate(-90, 14, ${CHART_HEIGHT / 2})`}>Capacity Retention(%)</text>
            {[0, 500, 1000, 1500, 2000, 2500, 3000, 3500].map((v) => (
              <line key={v} x1={xScale(v)} y1={PAD.top} x2={xScale(v)} y2={PAD.top + innerH} stroke="var(--border-light)" strokeDasharray="2,2" />
            ))}
            {[75, 80, 85, 90, 95, 100, 105].map((v) => (
              <line key={v} x1={PAD.left} y1={yScale(v)} x2={PAD.left + innerW} y2={yScale(v)} stroke={v === 80 ? '#d93025' : 'var(--border-light)'} strokeDasharray={v === 80 ? '4,4' : '2,2'} />
            ))}
            <path d={buildPath(usedPoints)} fill="none" stroke="#1a73e8" strokeWidth="2" />
            {usedPoints.map((p, i) => (i % 2 === 0 ? <circle key={i} cx={p.x} cy={p.y} r="3" fill="#1a73e8" /> : null))}
            <path d={buildPath(predictedPoints)} fill="none" stroke="#d93025" strokeWidth="2" strokeDasharray="6,4" />
            <line x1={lifeX} y1={line80y} x2={lifeX} y2={lifeY} stroke="#d93025" strokeDasharray="4,4" />
            <circle cx={lifeX} cy={lifeY} r="6" fill="#d93025" />
            <text x={lifeX + 12} y={lifeY + 4} fill="#d93025" fontSize="12" fontWeight="700">{task.cycleLife}</text>
          </svg>
        </div>
        <div className="pred-chart-legend">
          <span className="pred-legend-item pred-legend-used">Uploaded Value (Used)</span>
          <span className="pred-legend-item pred-legend-unused">Uploaded Value (Unused)</span>
          <span className="pred-legend-item pred-legend-pred">Predicted Value</span>
        </div>
      </section>
    </div>
  )
}
