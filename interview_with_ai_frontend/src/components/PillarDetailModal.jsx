import { useState } from "react";
import { generatePillarFeedback, getSeverityColor } from "../utils/feedbackGenerator";
import "./PillarDetailModal.css";

/**
 * PillarDetailModal — Shows detailed metrics and specific feedback for a pillar
 *
 * Props:
 *   - pillar: { pillar_id, pillar_name, score, weight, sub_metrics }
 *   - onClose: callback to close modal
 */

const PILLAR_ICONS = {
  G: "🎯",
  U: "⚡",
  I: "🔄",
  D: "🔍",
  E: "✨",
};

const PILLAR_COLORS = {
  G: { primary: "#58a6ff", bg: "rgba(88, 166, 255, 0.08)" },
  U: { primary: "#a371f7", bg: "rgba(163, 113, 247, 0.08)" },
  I: { primary: "#3fb950", bg: "rgba(63, 185, 80, 0.08)" },
  D: { primary: "#f0883e", bg: "rgba(240, 136, 62, 0.08)" },
  E: { primary: "#f85149", bg: "rgba(248, 81, 73, 0.08)" },
};

function PillarDetailModal({ pillar, onClose }) {
  const [expandedMetric, setExpandedMetric] = useState(null);

  if (!pillar) return null;

  // Generate comprehensive feedback
  const feedback = generatePillarFeedback(pillar.pillar_id, pillar.sub_metrics || [], pillar.score);
  if (!feedback) return null;

  const colors = PILLAR_COLORS[pillar.pillar_id] || PILLAR_COLORS.G;
  const icon = PILLAR_ICONS[pillar.pillar_id] || "📊";
  const severityColor = getSeverityColor(feedback.severity);

  return (
    <div className="pillar-modal-overlay" onClick={onClose}>
      <div className="pillar-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="pmd-header" style={{ background: colors.bg, borderBottomColor: colors.primary }}>
          <div className="pmd-header-left">
            <span className="pmd-icon">{icon}</span>
            <div className="pmd-titles">
              <h2 className="pmd-pillar-name">{feedback.pillarName}</h2>
              <p className="pmd-objective">{feedback.objective}</p>
            </div>
          </div>
          <button className="pmd-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="pmd-content">
          {/* Score Card */}
          <div className="pmd-score-card">
            <div className="pmd-score-large" style={{ color: severityColor }}>
              {feedback.score.toFixed(1)}/100
            </div>
            <div className="pmd-score-label">{feedback.severity.toUpperCase()}</div>
            <div className="pmd-key-success">
              <span className="pmd-ks-label">Key to Success:</span>
              <span className="pmd-ks-text">{feedback.keySuccess}</span>
            </div>
          </div>

          {/* Summary Feedback */}
          <div className="pmd-summary-section">
            <h3 className="pmd-section-title">Summary</h3>
            <p className="pmd-summary-text">{feedback.summary}</p>
          </div>

          {/* Strong Areas */}
          {feedback.strongAreas.length > 0 && (
            <div className="pmd-strengths-section">
              <h3 className="pmd-section-title">✨ Your Strengths</h3>
              <div className="pmd-strength-list">
                {feedback.strongAreas.map((area) => (
                  <div key={area.metricName} className="pmd-strength-item">
                    <div className="pmd-strength-badge" style={{ background: "#3fb950" }}>
                      {area.score}
                    </div>
                    <div className="pmd-strength-content">
                      <div className="pmd-strength-name">{area.displayName}</div>
                      <div className="pmd-strength-feedback">{area.feedback}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Weak Areas */}
          {feedback.weakAreas.length > 0 && (
            <div className="pmd-weaknesses-section">
              <h3 className="pmd-section-title">⚠️ Areas to Improve</h3>
              <div className="pmd-weakness-list">
                {feedback.weakAreas.map((area) => (
                  <div key={area.metricName} className="pmd-weakness-item">
                    <div className="pmd-weakness-badge" style={{ background: getSeverityColor(area.severity) }}>
                      {area.score}
                    </div>
                    <div className="pmd-weakness-content">
                      <div className="pmd-weakness-name">{area.displayName}</div>
                      <div className="pmd-weakness-feedback">{area.feedback}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Detailed Metrics */}
          <div className="pmd-metrics-section">
            <h3 className="pmd-section-title">📊 All Metrics</h3>
            <div className="pmd-metrics-list">
              {feedback.metricFeedbacks.map((metric) => (
                <div
                  key={metric.metricName}
                  className={`pmd-metric-card ${expandedMetric === metric.metricName ? "expanded" : ""}`}
                >
                  {/* Metric Header */}
                  <div
                    className="pmd-metric-header"
                    onClick={() => setExpandedMetric(expandedMetric === metric.metricName ? null : metric.metricName)}
                    style={{ cursor: "pointer" }}
                  >
                    <div className="pmd-metric-left">
                      <div className="pmd-metric-name">{metric.displayName}</div>
                      <div className="pmd-metric-full">{metric.full}</div>
                    </div>
                    <div className="pmd-metric-right">
                      <div className="pmd-metric-score" style={{ color: getSeverityColor(metric.severity) }}>
                        {metric.score}
                      </div>
                      <div className="pmd-metric-expand">{expandedMetric === metric.metricName ? "▲" : "▼"}</div>
                    </div>
                  </div>

                  {/* Metric Bar */}
                  <div className="pmd-metric-bar-container">
                    <div
                      className="pmd-metric-bar-fill"
                      style={{
                        width: `${metric.score}%`,
                        background: `linear-gradient(90deg, ${colors.primary}, ${getSeverityColor(metric.severity)})`,
                      }}
                    />
                  </div>

                  {/* Expanded Feedback */}
                  {expandedMetric === metric.metricName && (
                    <div className="pmd-metric-feedback">
                      <p className="pmd-feedback-text">{metric.feedback}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Top Actions */}
          {feedback.topActions.length > 0 && (
            <div className="pmd-actions-section">
              <h3 className="pmd-section-title">🎯 Action Items</h3>
              <div className="pmd-actions-list">
                {feedback.topActions.map((action, idx) => (
                  <div
                    key={idx}
                    className={`pmd-action-item pmd-priority-${action.priority.toLowerCase()}`}
                  >
                    <div className="pmd-action-priority">{action.priority}</div>
                    <div className="pmd-action-content">
                      <div className="pmd-action-title">{action.action}</div>
                      <div className="pmd-action-description">{action.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pmd-footer">
          <button className="pmd-close-action-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default PillarDetailModal;
