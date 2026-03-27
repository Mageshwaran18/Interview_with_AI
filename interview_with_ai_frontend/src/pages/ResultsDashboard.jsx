import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ScoreRadarChart from "../components/ScoreRadarChart";
import ScoreBreakdown from "../components/ScoreBreakdown";
import SessionRankingTable from "../components/SessionRankingTable";
import ScoreTrendChart from "../components/ScoreTrendChart";
import PillarDetailModal from "../components/PillarDetailModal";
import HyperLoader from "../components/HyperLoader";
import BallpitBackground from "../components/BallpitBackground";
import {
  getDashboardStats,
  getSessionRankings,
  getSessionDetail,
  getScoreTrends,
} from "../services/api";
import "./ResultsDashboard.css";

/*
  ResultsDashboard — Phase 4 Main Dashboard Page

  Two modes:
  1. Overview (/results) — Stats cards + Rankings table + Trend chart
  2. Session Detail (/results/:sessionId) — Radar chart + Pillar breakdown
*/

function getScoreColor(score) {
  if (score >= 80) return "#3fb950";
  if (score >= 60) return "#f0883e";
  return "#f85149";
}

function getScoreGrade(score) {
  if (score >= 90) return "A+";
  if (score >= 80) return "A";
  if (score >= 70) return "B";
  if (score >= 60) return "C";
  if (score >= 50) return "D";
  return "F";
}

function ResultsDashboard() {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  // Overview state
  const [stats, setStats] = useState(null);
  const [rankings, setRankings] = useState([]);
  const [trends, setTrends] = useState([]);
  const [sortBy, setSortBy] = useState("composite_q_score");
  const [sortOrder, setSortOrder] = useState("desc");

  // Detail state
  const [sessionDetail, setSessionDetail] = useState(null);

  // Modal state
  const [selectedPillar, setSelectedPillar] = useState(null);

  // Loading/Error
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ✅ Detect if viewing candidate or hiring manager
  const userType = sessionId ? sessionStorage.getItem(`user_type_${sessionId}`) : "hiring_manager";
  const isCandidate = userType === "candidate";

  // Load overview data
  const loadOverview = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, rankingsRes, trendsRes] = await Promise.all([
        getDashboardStats(),
        getSessionRankings(50, sortBy, sortOrder),
        getScoreTrends(20),
      ]);

      setStats(statsRes.data?.stats || null);
      setRankings(rankingsRes.data?.rankings || []);
      setTrends(trendsRes.data?.trends || []);
    } catch (err) {
      console.error("Failed to load dashboard:", err);
      setError("Failed to load dashboard data. Make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  }, [sortBy, sortOrder]);

  // Load session detail
  const loadSessionDetail = useCallback(async (sid) => {
    setLoading(true);
    setError(null);
    try {
      const res = await getSessionDetail(sid);
      setSessionDetail(res.data?.session || null);
    } catch (err) {
      console.error("Failed to load session:", err);
      setError("Failed to load session details.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (sessionId && sessionId !== "thank-you") {
      loadSessionDetail(sessionId);
    } else if (!sessionId) {
      loadOverview();
    }
  }, [sessionId, loadOverview, loadSessionDetail]);

  // Sort handler
  const handleSort = (field) => {
    if (field === sortBy) {
      setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"));
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  // Navigate to session detail
  const handleSessionClick = (sid) => {
    navigate(`/results/${sid}`);
  };

  // ✅ Smart back button - different behavior for candidate vs hiring manager
  const handleBack = () => {
    setSessionDetail(null);
    if (isCandidate) {
      // Show thank you page for candidates instead of navigating away
      navigate("/results/thank-you");
    } else {
      // Hiring managers go back to dashboard
      navigate("/hiring-manager");
    }
  };

  // Handle pillar card click
  const handlePillarClick = (pillarData) => {
    setSelectedPillar(pillarData);
  };

  // ─── THANK YOU PAGE (for candidates) ───
  if (sessionId === "thank-you") {
    return (
      <div className="results-dashboard thankyou-mode">
        <header className="rd-header">
          <div className="rd-header-left">
            <h1 className="rd-title">✅ Submission Complete</h1>
            <span className="rd-subtitle">The hiring team has been notified</span>
          </div>
          <div className="rd-header-right">
            <span className="rd-session-badge">Awaiting review</span>
          </div>
        </header>

        <main className="rd-content thankyou-content">
          <div className="thankyou-stage">
            <BallpitBackground
              count={240}
              colors={["#ff1744", "#ef233c", "#ff6b6b", "#1a0a0f", "#c71c3a"]}
              gravity={0.55}
              friction={0.9965}
              wallBounce={0.92}
              initialKick={0.48}
              minSize={0.65}
              maxSize={1.45}
              lightIntensity={220}
              ambientColor="#0f0509"
              ambientIntensity={0.95}
              followCursor
              className="thankyou-ballpit"
            />
            <div className="thankyou-gradient" />
            <div className="thankyou-card">
              <div className="thankyou-icon" aria-hidden>
                🙏
              </div>
              <p className="thankyou-kicker">Submission received</p>
              <h2 className="thankyou-heading">Thanks for the Attempt!</h2>
              <p className="thankyou-body">
                We've received your submission. The hiring team will review your solution and further steps will be communicated with you shortly.
              </p>
              <p className="thankyou-footnote">
                Thank you for your interest and effort. Good luck! 🚀
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ─── SESSION DETAIL VIEW ───
  if (sessionId) {
    // Show error state if session detail failed to load
    if (error) {
      return (
        <div className="results-dashboard">
          <header className="rd-header">
            <div className="rd-header-left">
              <button className="rd-back-btn" onClick={handleBack}>
                ← Back
              </button>
              <h1 className="rd-title">📊 Session Results</h1>
            </div>
          </header>

          <div className="rd-error-banner" style={{ marginTop: "20px", marginLeft: "20px", marginRight: "20px" }}>
            <span>⚠️ {error}</span>
            <button onClick={() => loadSessionDetail(sessionId)}>Retry</button>
          </div>

          {loading && (
            <div style={{ marginTop: "60px" }}>
              <HyperLoader label="Loading session results" subtitle="Fetching the latest scores" />
            </div>
          )}
        </div>
      );
    }

    if (loading && !sessionDetail) {
      return (
        <div className="results-dashboard">
          <header className="rd-header">
            <div className="rd-header-left">
              <button className="rd-back-btn" onClick={handleBack}>
                ← Back
              </button>
              <h1 className="rd-title">📊 Session Results</h1>
            </div>
          </header>

          <div style={{ marginTop: "60px" }}>
            <HyperLoader label="Loading session results" subtitle="Fetching the latest scores" />
          </div>
        </div>
      );
    }

    // If session detail loaded successfully, show results
    if (sessionDetail) {
      // Handle pending evaluation
      if (sessionDetail.evaluation_status === "PENDING") {
        return (
          <div className="results-dashboard">
            <header className="rd-header">
              <div className="rd-header-left">
                <button className="rd-back-btn" onClick={handleBack}>
                  ← Back
                </button>
                <h1 className="rd-title">📊 Session Results</h1>
              </div>
              <div className="rd-header-right">
                <span className="rd-session-badge">{sessionId.slice(0, 28)}...</span>
              </div>
            </header>

            <main className="rd-content" style={{ paddingTop: "40px" }}>
              <div style={{
                marginBottom: "24px",
                padding: "24px",
                backgroundColor: "#1a2332",
                borderRadius: "8px",
                border: "2px solid #f0883e",
                textAlign: "center",
              }}>
                <div style={{ fontSize: "48px", marginBottom: "16px" }}>⏳</div>
                <h2 style={{ color: "#f0883e", marginBottom: "12px", fontSize: "20px" }}>
                  Evaluation Pending
                </h2>
                <p style={{ color: "#888", marginBottom: "16px", fontSize: "14px" }}>
                  {sessionDetail.evaluation_message || "This session is awaiting evaluation. The evaluation process may take a few moments."}
                </p>
                <p style={{ color: "#666", fontSize: "13px" }}>
                  Candidate: <strong>{sessionDetail.candidate_name || "Unknown"}</strong>
                </p>
                <p style={{ color: "#666", fontSize: "13px" }}>
                  Session Duration: <strong>{sessionDetail.duration_minutes} minutes</strong>
                </p>
                <button
                  onClick={() => loadSessionDetail(sessionId)}
                  style={{
                    marginTop: "16px",
                    padding: "10px 24px",
                    backgroundColor: "#0066cc",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "600",
                  }}
                >
                  🔄 Check Again
                </button>
                <button
                  onClick={handleBack}
                  style={{
                    marginTop: "16px",
                    marginLeft: "12px",
                    padding: "10px 24px",
                    backgroundColor: "#333",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "600",
                  }}
                >
                  ← Back to Dashboard
                </button>
              </div>
            </main>
          </div>
        );
      }
      
      // Show normal results if evaluation is ready
      const qScore = sessionDetail.composite_q_score || 0;
      const pillarScoresMap = {};
      (sessionDetail.pillars || []).forEach((p) => {
        pillarScoresMap[p.pillar_id] = p.score || 0;
      });

      return (
      <div className="results-dashboard">
        <header className="rd-header">
          <div className="rd-header-left">
            <button className="rd-back-btn" onClick={handleBack}>
              ← Back
            </button>
            <h1 className="rd-title">📊 Session Results</h1>
          </div>
          <div className="rd-header-right">
            <span className="rd-session-badge">{sessionId.slice(0, 28)}...</span>
          </div>
        </header>

        <main className="rd-content">
          {/* Top: Composite Score Card */}
          <section className="rd-hero-score">
            <div className="hero-score-card">
              <div className="hero-grade" style={{ color: getScoreColor(qScore) }}>
                {getScoreGrade(qScore)}
              </div>
              <div className="hero-q-score">
                <span className="hero-q-value" style={{ color: getScoreColor(qScore) }}>
                  {qScore.toFixed(1)}
                </span>
                <span className="hero-q-label">Composite Q Score</span>
              </div>
              <div className="hero-meta">
                <div className="hero-meta-item">
                  <span className="meta-icon">📋</span>
                  <span>{sessionDetail.total_events || 0} events</span>
                </div>
                <div className="hero-meta-item">
                  <span className="meta-icon">⏱️</span>
                  <span>{(sessionDetail.duration_minutes || 0).toFixed(1)} min</span>
                </div>
              </div>
            </div>
          </section>

          {/* Radar + Breakdown Grid */}
          <div className="rd-detail-grid">
            <section className="rd-radar-section">
              <h2 className="rd-section-title">Pillar Overview</h2>
              <ScoreRadarChart scores={pillarScoresMap} size={340} />
            </section>

            <section className="rd-breakdown-section">
              <h2 className="rd-section-title">Detailed Breakdown</h2>
              <ScoreBreakdown pillars={sessionDetail.pillars || []} />
            </section>
          </div>

          {/* Clickable Pillar Cards for Detailed Feedback */}
          {sessionDetail.pillars && sessionDetail.pillars.length > 0 && (
            <section className="rd-pillar-cards-section">
              <h2 className="rd-section-title">📋 Pillar Deep Dives</h2>
              <p className="rd-section-subtitle">Click any pillar to see detailed metrics and specific improvement recommendations</p>
              <div className="rd-pillar-cards-grid">
                {sessionDetail.pillars.map((pillar) => {
                  const colors = {
                    G: { primary: "#58a6ff", bg: "rgba(88, 166, 255, 0.1)" },
                    U: { primary: "#a371f7", bg: "rgba(163, 113, 247, 0.1)" },
                    I: { primary: "#3fb950", bg: "rgba(63, 185, 80, 0.1)" },
                    D: { primary: "#f0883e", bg: "rgba(240, 136, 62, 0.1)" },
                    E: { primary: "#f85149", bg: "rgba(248, 81, 73, 0.1)" },
                  };
                  const icons = { G: "🎯", U: "⚡", I: "🔄", D: "🔍", E: "✨" };
                  const c = colors[pillar.pillar_id] || colors.G;
                  const icon = icons[pillar.pillar_id] || "📊";

                  return (
                    <div
                      key={pillar.pillar_id}
                      className="rd-pillar-card"
                      style={{ borderColor: c.primary, background: c.bg }}
                      onClick={() => handlePillarClick(pillar)}
                      role="button"
                      tabIndex="0"
                    >
                      <div className="rd-pillar-card-icon">{icon}</div>
                      <div className="rd-pillar-card-id" style={{ color: c.primary }}>
                        {pillar.pillar_id}
                      </div>
                      <div className="rd-pillar-card-name">{pillar.pillar_name}</div>
                      <div className="rd-pillar-card-score-container">
                        <div
                          className="rd-pillar-card-score"
                          style={{ color: getScoreColor(pillar.score) }}
                        >
                          {(pillar.score || 0).toFixed(1)}
                        </div>
                        <div className="rd-pillar-card-score-label">/100</div>
                      </div>
                      <div className="rd-pillar-card-weight">Weight: {((pillar.weight || 0) * 100).toFixed(0)}%</div>
                      <div className="rd-pillar-card-cta">📖 View Feedback →</div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </main>

        {/* Pillar Detail Modal */}
        {selectedPillar && <PillarDetailModal pillar={selectedPillar} onClose={() => setSelectedPillar(null)} />}
      </div>
      );
    }
  }

  // ─── OVERVIEW VIEW ───
  return (
    <div className="results-dashboard">
      <header className="rd-header">
        <div className="rd-header-left">
          <h1 className="rd-title">📊 GUIDE Results Dashboard</h1>
          <span className="rd-subtitle">AI Collaboration Scoring & Analytics</span>
        </div>
        <div className="rd-header-right">
          <button className="rd-refresh-btn" onClick={loadOverview} disabled={loading}>
            {loading ? "⏳ Loading..." : "🔄 Refresh"}
          </button>
          <button className="rd-home-btn" onClick={() => navigate("/dashboard")}>
            🏠 Home
          </button>
        </div>
      </header>

      {error && (
        <div className="rd-error-banner">
          <span>⚠️ {error}</span>
          <button onClick={loadOverview}>Retry</button>
        </div>
      )}

      {loading && !error && (
        <div className="rd-loading">
          <div className="rd-loading-spinner" />
          <p>Loading dashboard data...</p>
        </div>
      )}

      {!loading && !error && (
        <main className="rd-content">
          {/* Stats Cards */}
          <section className="rd-stats-grid">
            <div className="stat-card">
              <div className="stat-icon">📋</div>
              <div className="stat-info">
                <div className="stat-value">{stats?.total_sessions || 0}</div>
                <div className="stat-label">Total Sessions</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">📈</div>
              <div className="stat-info">
                <div className="stat-value" style={{ color: getScoreColor(stats?.average_q_score || 0) }}>
                  {(stats?.average_q_score || 0).toFixed(1)}
                </div>
                <div className="stat-label">Average Q Score</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🏆</div>
              <div className="stat-info">
                <div className="stat-value" style={{ color: "#3fb950" }}>
                  {(stats?.highest_q_score || 0).toFixed(1)}
                </div>
                <div className="stat-label">Highest Score</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">📉</div>
              <div className="stat-info">
                <div className="stat-value" style={{ color: "#f85149" }}>
                  {(stats?.lowest_q_score || 0).toFixed(1)}
                </div>
                <div className="stat-label">Lowest Score</div>
              </div>
            </div>
          </section>

          {/* Pillar Averages */}
          {stats?.pillar_averages && Object.keys(stats.pillar_averages).length > 0 && (
            <section className="rd-pillar-averages">
              <h2 className="rd-section-title">Average Pillar Scores</h2>
              <div className="pillar-avg-grid">
                {[
                  { key: "G", name: "Goal", icon: "🎯", color: "#58a6ff" },
                  { key: "U", name: "Usage", icon: "⚡", color: "#a371f7" },
                  { key: "I", name: "Iteration", icon: "🔄", color: "#3fb950" },
                  { key: "D", name: "Detection", icon: "🔍", color: "#f0883e" },
                  { key: "E", name: "End Result", icon: "✨", color: "#f85149" },
                ].map((p) => (
                  <div key={p.key} className="pillar-avg-card">
                    <div className="pillar-avg-icon">{p.icon}</div>
                    <div className="pillar-avg-score" style={{ color: p.color }}>
                      {(stats.pillar_averages[p.key] || 0).toFixed(1)}
                    </div>
                    <div className="pillar-avg-name">{p.name}</div>
                    <div className="pillar-avg-bar">
                      <div
                        className="pillar-avg-bar-fill"
                        style={{
                          width: `${stats.pillar_averages[p.key] || 0}%`,
                          background: p.color,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Score Trend Chart */}
          {trends.length > 0 && (
            <section className="rd-trend-section">
              <h2 className="rd-section-title">Score Trends</h2>
              <ScoreTrendChart trends={trends} height={320} />
            </section>
          )}

          {/* Rankings Table */}
          <section className="rd-rankings-section">
            <h2 className="rd-section-title">
              Session Rankings
              <span className="rd-count-badge">{rankings.length}</span>
            </h2>
            <SessionRankingTable
              rankings={rankings}
              onSessionClick={handleSessionClick}
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSort={handleSort}
            />
          </section>
        </main>
      )}
    </div>
  );
}

export default ResultsDashboard;
