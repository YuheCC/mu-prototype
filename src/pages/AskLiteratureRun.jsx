/**
 * Literature assistant: streaming pipeline steps with expandable technical detail.
 */

import { useEffect, useMemo, useState } from 'react'

export default function LiteratureRunBlock({ msg, onToggleStepDetail }) {
  const [cardCollapsed, setCardCollapsed] = useState(true)
  const regionId = `ask-lit-pipeline-steps-${msg.id ?? 'run'}`

  const legacyStatuses = msg.statuses || []
  const steps =
    msg.literatureSteps?.length > 0
      ? msg.literatureSteps
      : legacyStatuses.map((text) => ({
          headline: text,
          detail: '',
          streaming: false,
          expanded: false,
        }))

  const isStreaming = useMemo(() => steps.some((s) => !!s?.streaming), [steps])

  useEffect(() => {
    // Auto behavior:
    // - while streaming: keep expanded so users can watch progress
    // - once done: collapse to reduce visual noise
    if (isStreaming) {
      setCardCollapsed(false)
      return
    }
    if (msg?.done) {
      setCardCollapsed(true)
    }
  }, [isStreaming, msg?.done])

  return (
    <div className={`ask-lit-pipeline-card ${cardCollapsed ? 'ask-lit-pipeline-card--collapsed' : ''}`}>
      <div className="ask-lit-pipeline-head ask-lit-pipeline-head--row">
        <div className="ask-lit-pipeline-head-main">
          <span className="ask-lit-pipeline-badge">MU Agent 4.27 Literature</span>
          <div className="ask-lit-pipeline-head-text">
            <span className="ask-lit-pipeline-title">Agent pipeline</span>
            <span className="ask-lit-pipeline-sub">Streaming trace · expand any step for methodology detail</span>
          </div>
        </div>
        <button
          type="button"
          className="ask-lit-pipeline-collapse-text"
          onClick={() => setCardCollapsed((c) => !c)}
          aria-expanded={!cardCollapsed}
          aria-controls={regionId}
          id={`${regionId}-head`}
        >
          {cardCollapsed ? '展开' : '收起'}
        </button>
      </div>
      <div
        id={regionId}
        className={`ask-lit-pipeline-steps ${cardCollapsed ? 'ask-lit-pipeline-steps--collapsed' : ''}`}
        hidden={cardCollapsed}
        role="region"
        aria-labelledby={`${regionId}-head`}
      >
        {steps.map((step, idx) => (
          <div
            key={idx}
            className={`ask-lit-step ${step.streaming ? 'ask-lit-step--streaming' : 'ask-lit-step--idle'} ${step.expanded ? 'ask-lit-step--open' : ''}`}
          >
            <div className="ask-lit-step-row">
              <div className="ask-lit-step-line">
                <span className="ask-lit-step-dot" aria-hidden />
                {idx < steps.length - 1 ? <span className="ask-lit-step-connector" aria-hidden /> : null}
              </div>
              <div className="ask-lit-step-body">
                <p className="ask-lit-step-headline">
                  {step.headline}
                  {step.streaming ? <span className="ask-lit-step-caret" aria-hidden>▍</span> : null}
                </p>
                {step.detail ? (
                  <button
                    type="button"
                    className="ask-lit-step-toggle"
                    onClick={() => onToggleStepDetail(idx)}
                    aria-expanded={!!step.expanded}
                  >
                    {step.expanded ? 'Hide detail' : 'Show detail'}
                  </button>
                ) : null}
                {step.expanded && step.detail ? (
                  <div className="ask-lit-step-detail">{step.detail}</div>
                ) : null}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
