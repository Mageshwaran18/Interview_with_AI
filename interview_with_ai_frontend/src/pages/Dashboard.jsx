import { useEffect, useState } from "react";
import { getCurrentUser } from "../services/api";
import { useNavigate } from "react-router-dom";
import StarfieldBackground from "../components/StarfieldBackground";
import GlassNav from "../components/GlassNav";
import GlassCard from "../components/GlassCard";
import ShinyButton from "../components/ShinyButton";
import AnimatedHeadline from "../components/AnimatedHeadline";
import "./Dashboard.css";

function Dashboard() {
  const [email, setEmail] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/");
      return;
    }

    const fetchUser = async () => {
      try {
        const response = await getCurrentUser(token);
        setEmail(response.data.email);
      } catch (error) {
        localStorage.removeItem("token");
        navigate("/");
      }
    };

    fetchUser();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <div className="dashboard-page">
      <StarfieldBackground />

      <GlassNav email={email} onLogout={handleLogout}>
        <button className="glass-nav-link" onClick={() => navigate("/hiring-manager")}>
          <span>Sessions</span>
        </button>
        <button className="glass-nav-link" onClick={() => navigate("/results")}>
          <span>Results</span>
        </button>
      </GlassNav>

      <div className="dashboard-content">
        {/* Hero Section */}
        <div className="dashboard-hero">
          <div className="dashboard-badge">AI Collaboration Platform</div>
          <AnimatedHeadline as="h1" className="dashboard-title" text="Welcome to GUIDE" />
          <p className="dashboard-subtitle">
            Evaluate, score, and improve AI collaboration skills
          </p>
        </div>

        {/* Bento Grid */}
        <div className="dashboard-grid">
          <GlassCard className="dashboard-card dashboard-card-primary">
            <div className="dashboard-card-content">
              <div className="dashboard-card-icon">🎯</div>
              <h3 className="dashboard-card-title">Start GUIDE Session</h3>
              <p className="dashboard-card-desc">
                Create a new evaluation session for candidates to complete coding tasks with AI assistance.
              </p>
              <ShinyButton variant="primary" onClick={() => navigate("/hiring-manager")}>
                Create Session →
              </ShinyButton>
            </div>
          </GlassCard>

          <GlassCard className="dashboard-card">
            <div className="dashboard-card-content">
              <div className="dashboard-card-icon">📊</div>
              <h3 className="dashboard-card-title">View Results</h3>
              <p className="dashboard-card-desc">
                Analyze candidate scores, pillar breakdowns, and performance trends across all sessions.
              </p>
              <ShinyButton variant="ghost" onClick={() => navigate("/results")}>
                View Analytics →
              </ShinyButton>
            </div>
          </GlassCard>

          <GlassCard className="dashboard-card">
            <div className="dashboard-card-content">
              <div className="dashboard-card-icon">👔</div>
              <h3 className="dashboard-card-title">Manage Sessions</h3>
              <p className="dashboard-card-desc">
                Track active sessions, copy invite links, and manage the candidate evaluation pipeline.
              </p>
              <ShinyButton variant="secondary" onClick={() => navigate("/hiring-manager")}>
                Open Dashboard →
              </ShinyButton>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;

/*
Dashboard Protection Logic:

1. Check if token exists
2. If not → redirect to login
3. If exists → call /auth/me
4. If valid → show user
5. If invalid → logout automatically
*/