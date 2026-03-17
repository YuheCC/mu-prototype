import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './TrainLifePredictionModel.css'

export default function TrainLifePredictionModel() {
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
  const [modelName, setModelName] = useState('')
  const [remarks, setRemarks] = useState('')
  const [baseModel, setBaseModel] = useState('base_model_v1')
  const [files, setFiles] = useState([])

  const handleFileChange = (e) => {
    const list = e.target.files ? Array.from(e.target.files) : []
    setFiles(list)
  }

  return (
    <div className="train-page">
      <div className="train-top">
        <h1 className="train-title">Train New Model</h1>
        <button type="button" className="train-back-btn" onClick={() => navigate(-1)}>
          ← Back
        </button>
      </div>

      <div className="train-content">
        {/* 1 Model Information */}
        <section className="train-section">
          <h2 className="train-section-title">1 Model Information</h2>
          <div className="train-field">
            <label className="train-label">
              Model Name <span className="train-required">*</span>
            </label>
            <input
              type="text"
              className="train-input"
              placeholder="Enter model name"
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
            />
          </div>
          <div className="train-field">
            <label className="train-label">Remarks</label>
            <textarea
              className="train-textarea"
              placeholder="Enter any additional notes or remarks"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows={3}
            />
          </div>
        </section>

        {/* 2 Base Model */}
        <section className="train-section">
          <h2 className="train-section-title">2 Base Model</h2>
          <div className="train-field">
            <div className="train-select-wrap">
              <select
                value={baseModel}
                onChange={(e) => setBaseModel(e.target.value)}
                className="train-select"
              >
                <option value="base_model_v1">base_model_v1</option>
                <option value="base_model_v2">base_model_v2</option>
              </select>
              <span className="train-select-caret">▾</span>
            </div>
          </div>
        </section>

        {/* 3 Training Dataset */}
        <section className="train-section">
          <h2 className="train-section-title">3 Training Dataset</h2>
          <div className="train-field">
            <label className="train-label">
              Upload Dataset <span className="train-required">*</span>
              <span className="train-count">({files.length})</span>
            </label>
            <p className="train-hint">
              Upload data for at least 30 cells with each cell cycled to at least SOH=80%
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.nda,.ndax"
              multiple
              className="train-file-input"
              onChange={handleFileChange}
            />
            <div
              role="button"
              tabIndex={0}
              className="train-upload-zone"
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
            >
              <div className="train-upload-icon">☁</div>
              <div className="train-upload-text">
                Drag and drop your files here, or click to browse
              </div>
              <div className="train-upload-formats">Supported formats: CSV, NDA, NDAX</div>
              <button
                type="button"
                className="train-choose-btn"
                onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click() }}
              >
                Choose Files
              </button>
            </div>
          </div>
        </section>

        <div className="train-footer">
          <button type="button" className="train-start-btn">
            Start Train
          </button>
        </div>
      </div>
    </div>
  )
}
