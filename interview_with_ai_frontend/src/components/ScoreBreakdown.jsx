import { useState } from "react";

/*
  ScoreBreakdown — Detailed metric breakdown for all 5 GUIDE pillars.
  
  Props:
    - pillars: Array of { pillar_id, pillar_name, score, weight, sub_metrics: [{name, value, description}] }
*/

const PILLAR_COLORS = {
  G: { primary: "#58a6ff", bg: "rgba(88, 166, 255, 0.1)", border: "rgba(88, 166, 255, 0.3)" },
  U: { primary: "#a371f7", bg: "rgba(163, 113, 247, 0.1)", border: "rgba(163, 113, 247, 0.3)" },
  I: { primary: "#3fb950", bg: "rgba(63, 185, 80, 0.1)", border: "rgba(63, 185, 80, 0.3)" },
  D: { primary: "#f0883e", bg: "rgba(240, 136, 62, 0.1)", border: "rgba(240, 136, 62, 0.3)" },
  E: { primary: "#f85149", bg: "rgba(248, 81, 73, 0.1)", border: "rgba(248, 81, 73, 0.3)" },
};

const PILLAR_ICONS = {
  G: "🎯", U: "⚡", I: "🔄", D: "🔍", E: "✨",
};

function getScoreColor(score) {
  if (score >= 80) return "#3fb950";
  if (score >= 60) return "#f0883e";
  return "#f85149";
}

function ScoreBreakdown({ pillars = [] }) {
  const [expandedPillar, setExpandedPillar] = useState(null);

  if (!pillars || pillars.length === 0) {
    return (
      <div className="score-breakdown-empty">
        <p style={{ color: "#8b949e", textAlign: "center", padding: "20px" }}>
          No pillar data available
        </p>
      </div>
    );
  }

  return (
    <div className="score-breakdown">
      {pillars.map((pillar) => {
        const colors = PILLAR_COLORS[pillar.pillar_id] || PILLAR_COLORS.G;
        const icon = PILLAR_ICONS[pillar.pillar_id] || "📊";
        const isExpanded = expandedPillar === pillar.pillar_id;

        return (
          <div
            key={pillar.pillar_id}
            className={`pillar-section ${isExpanded ? "expanded" : ""}`}
            style={{
              borderColor: isExpanded ? colors.border : "transparent",
              background: isExpanded ? colors.bg : "rgba(22, 27, 34, 0.5)",
            }}
          >
            {/* Pillar Header */}
            <div
              className="pillar-header"
              onClick={() => setExpandedPillar(isExpanded ? null : pillar.pillar_id)}
              style={{ cursor: "pointer" }}
            >
              <div className="pillar-header-left">
                <span className="pillar-icon">{icon}</span>
                <div>
                  <div className="pillar-name">
                    <span className="pillar-id-badge" style={{ background: colors.primary }}>
                      {pillar.pillar_id}
                    </span>
                    {pillar.pillar_name}
                  </div>
                  <span className="pillar-weight">Weight: {((pillar.weight || 0) * 100).toFixed(0)}%</span>
                </div>
              </div>
              <div className="pillar-header-right">
                <span className="pillar-score" style={{ color: getScoreColor(pillar.score) }}>
                  {(pillar.score || 0).toFixed(1)}
                </span>
                <span className="pillar-expand-arrow">{isExpanded ? "▲" : "▼"}</span>
              </div>
            </div>

            {/* Score Bar */}
            <div className="pillar-score-bar-container">
              <div
                className="pillar-score-bar-fill"
                style={{
                  width: `${Math.min(pillar.score || 0, 100)}%`,
                  background: `linear-gradient(90deg, ${colors.primary}, ${getScoreColor(pillar.score)})`,
                }}
              />
            </div>

            {/* Sub-Metrics (Expanded) */}
            {isExpanded && pillar.sub_metrics && pillar.sub_metrics.length > 0 && (
              <div className="sub-metrics-panel">
                {pillar.sub_metrics.map((metric, idx) => (
                  <div key={idx} className="sub-metric-row">
                    <div className="sub-metric-info">
                      <span className="sub-metric-name-badge">{metric.name}</span>
                      {metric.description && (
                        <span className="sub-metric-desc">{metric.description}</span>
                      )}
                    </div>
                    <div className="sub-metric-score-area">
                      <div className="sub-metric-bar-container">
                        <div
                          className="sub-metric-bar-fill"
                          style={{
                            width: `${Math.min(metric.value || 0, 100)}%`,
                            background: getScoreColor(metric.value || 0),
                          }}
                        />
                      </div>
                      <span className="sub-metric-value" style={{ color: getScoreColor(metric.value || 0) }}>
                        {(metric.value || 0).toFixed(1)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default ScoreBreakdown;
