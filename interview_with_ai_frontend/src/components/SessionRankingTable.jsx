import { useState } from "react";

/*
  SessionRankingTable — Sortable table showing ranked evaluation sessions.
  
  Props:
    - rankings: Array of { rank, session_id, composite_q_score, pillar_scores: {G,U,I,D,E}, created_at, duration_minutes }
    - onSessionClick: (sessionId) => void
    - sortBy: current sort field
    - sortOrder: "asc" or "desc"
    - onSort: (field) => void
*/

function getScoreColor(score) {
  if (score >= 80) return "#3fb950";
  if (score >= 60) return "#f0883e";
  return "#f85149";
}

function formatDate(isoString) {
  if (!isoString) return "—";
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return "—";
  }
}

const SORT_COLUMNS = [
  { key: "rank", label: "#" },
  { key: "session_id", label: "Session" },
  { key: "composite_q_score", label: "Q Score" },
  { key: "G", label: "G" },
  { key: "U", label: "U" },
  { key: "I", label: "I" },
  { key: "D", label: "D" },
  { key: "E", label: "E" },
  { key: "created_at", label: "Date" },
];

function SessionRankingTable({
  rankings = [],
  onSessionClick,
  sortBy = "composite_q_score",
  sortOrder = "desc",
  onSort,
}) {
  const [hoveredRow, setHoveredRow] = useState(null);

  if (!rankings || rankings.length === 0) {
    return (
      <div className="ranking-empty">
        <div className="ranking-empty-icon">📊</div>
        <p>No evaluations found yet</p>
        <p className="ranking-empty-hint">Run a GUIDE session and trigger evaluation to see results here</p>
      </div>
    );
  }

  return (
    <div className="ranking-table-wrapper">
      <table className="ranking-table">
        <thead>
          <tr>
            {SORT_COLUMNS.map((col) => (
              <th
                key={col.key}
                className={`ranking-th ${sortBy === col.key ? "active-sort" : ""}`}
                onClick={() => onSort && onSort(col.key)}
                style={{ cursor: onSort ? "pointer" : "default" }}
              >
                {col.label}
                {sortBy === col.key && (
                  <span className="sort-indicator">{sortOrder === "desc" ? " ↓" : " ↑"}</span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rankings.map((row, idx) => (
            <tr
              key={row.session_id || idx}
              className={`ranking-row ${hoveredRow === idx ? "hovered" : ""}`}
              onClick={() => onSessionClick && onSessionClick(row.session_id)}
              onMouseEnter={() => setHoveredRow(idx)}
              onMouseLeave={() => setHoveredRow(null)}
              style={{ cursor: onSessionClick ? "pointer" : "default" }}
            >
              <td className="ranking-rank">
                <span className={`rank-badge rank-${row.rank <= 3 ? row.rank : "other"}`}>
                  {row.rank}
                </span>
              </td>
              <td className="ranking-session">
                <span className="session-id-text">{(row.session_id || "").slice(0, 24)}...</span>
              </td>
              <td className="ranking-q-score">
                <div className="q-score-cell">
                  <span className="q-score-value" style={{ color: getScoreColor(row.composite_q_score) }}>
                    {(row.composite_q_score || 0).toFixed(1)}
                  </span>
                  <div className="q-score-bar-mini">
                    <div
                      className="q-score-bar-mini-fill"
                      style={{
                        width: `${Math.min(row.composite_q_score || 0, 100)}%`,
                        background: getScoreColor(row.composite_q_score),
                      }}
                    />
                  </div>
                </div>
              </td>
              {["G", "U", "I", "D", "E"].map((p) => (
                <td key={p} className="ranking-pillar">
                  <span style={{ color: getScoreColor(row.pillar_scores?.[p] || 0) }}>
                    {(row.pillar_scores?.[p] || 0).toFixed(0)}
                  </span>
                </td>
              ))}
              <td className="ranking-date">{formatDate(row.created_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default SessionRankingTable;
