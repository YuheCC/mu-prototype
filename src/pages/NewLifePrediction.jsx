import { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './NewLifePrediction.css'

export default function NewLifePrediction() {
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
  const [model, setModel] = useState('')
  const [file, setFile] = useState(null)

  const fileLabel = useMemo(() => {
    if (!file) return 'Click to upload battery data file'
    return file.name
  }, [file])

  return (
    <div className="nlp-page">
      <div className="nlp-top">
        <h1 className="nlp-title">New Prediction</h1>
        <div className="nlp-actions">
          <button type="button" className="nlp-primary-btn">
            New Prediction
          </button>
          <button type="button" className="nlp-secondary-btn" onClick={() => navigate(-1)}>
            ← Back
          </button>
        </div>
      </div>

      <div className="nlp-stepper">
        <div className="nlp-step active">
          <div className="nlp-step-dot">⬆</div>
          <div className="nlp-step-label">Data Upload</div>
        </div>
        <div className="nlp-step-line" />
        <div className="nlp-step">
          <div className="nlp-step-dot">∿</div>
          <div className="nlp-step-label">AI Prediction</div>
        </div>
        <div className="nlp-step-line" />
        <div className="nlp-step">
          <div className="nlp-step-dot">▦</div>
          <div className="nlp-step-label">Results Display</div>
        </div>
      </div>

      <div className="nlp-content">
        <div className="nlp-field">
          <div className="nlp-field-label">Select a Model</div>
          <div className="nlp-select">
            <select value={model} onChange={(e) => setModel(e.target.value)}>
              <option value="" disabled>
                Choose a model
              </option>
              <option value="life-v1">Life Prediction v1</option>
              <option value="life-v2">Life Prediction v2</option>
            </select>
            <span className="nlp-select-caret">▾</span>
          </div>
        </div>

        <div className="nlp-field">
          <div className="nlp-field-label">Upload Data</div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="nlp-file-input"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />

          <button
            type="button"
            className="nlp-upload"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="nlp-upload-icon">↑</div>
            <div className="nlp-upload-title">{fileLabel}</div>
            <div className="nlp-upload-subtitle">
              Currently only support CSV and the default file format of Neware (NDA/NDAX). More file types will be supported in the future
            </div>
            <div className="nlp-upload-cta">Select File</div>
          </button>
        </div>

        <div className="nlp-card">
          <div className="nlp-card-top">
            <div className="nlp-card-title">CSV Data Format Requirements</div>
            <button type="button" className="nlp-link-btn">
              Sample Data
            </button>
          </div>
          <div className="nlp-card-body">
            <div className="nlp-req">
              <span className="nlp-req-key">Required Fields:</span> barcode, cycle_id, current (A), voltage (V), time (s)
            </div>
            <div className="nlp-req">
              <span className="nlp-req-key">Current Direction:</span> + for charging, − for discharging
            </div>
            <div className="nlp-req">
              <span className="nlp-req-key">Unit Requirements:</span> Current in A, Voltage in V, Time in s
            </div>
            <div className="nlp-req">
              <span className="nlp-req-key">Data Requirements:</span> Upload data ≥100 cycles, data must be sorted by time
            </div>
          </div>
        </div>

        <div className="nlp-footer">
          <button type="button" className="nlp-start-btn" disabled={!model || !file}>
            Start Prediction
          </button>
        </div>
      </div>
    </div>
  )
}

