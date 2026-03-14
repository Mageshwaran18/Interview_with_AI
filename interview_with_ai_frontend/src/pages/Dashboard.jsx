import { useEffect, useState } from "react";
import { getCurrentUser } from "../services/api";
import { useNavigate } from "react-router-dom";

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
    <div style={{
      minHeight: "100vh",
      background: "#0d1117",
      color: "#e6edf3",
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      paddingTop: "60px",
    }}>
      <h2 style={{
        fontSize: "28px",
        fontWeight: 700,
        background: "linear-gradient(135deg, #58a6ff, #a371f7)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        marginBottom: "8px",
      }}>Dashboard</h2>

      <p style={{ color: "#8b949e", marginBottom: "32px" }}>
        Logged in as: <strong style={{ color: "#e6edf3" }}>{email}</strong>
      </p>

      <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", justifyContent: "center" }}>
        <button
          onClick={() => navigate("/guide")}
          style={{
            background: "linear-gradient(135deg, #238636, #2ea043)",
            color: "#fff",
            border: "none",
            borderRadius: "10px",
            padding: "14px 28px",
            fontSize: "15px",
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.2s",
          }}
          onMouseOver={(e) => e.target.style.transform = "translateY(-2px)"}
          onMouseOut={(e) => e.target.style.transform = "translateY(0)"}
        >
          🎯 Start GUIDE Session
        </button>

        <button
          onClick={() => navigate("/results")}
          style={{
            background: "linear-gradient(135deg, #58a6ff, #a371f7)",
            color: "#fff",
            border: "none",
            borderRadius: "10px",
            padding: "14px 28px",
            fontSize: "15px",
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.2s",
          }}
          onMouseOver={(e) => e.target.style.transform = "translateY(-2px)"}
          onMouseOut={(e) => e.target.style.transform = "translateY(0)"}
        >
          📊 View All Results
        </button>

        <button
          onClick={handleLogout}
          style={{
            background: "rgba(248, 81, 73, 0.1)",
            color: "#f85149",
            border: "1px solid rgba(248, 81, 73, 0.3)",
            borderRadius: "10px",
            padding: "14px 28px",
            fontSize: "15px",
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.2s",
          }}
          onMouseOver={(e) => e.target.style.transform = "translateY(-2px)"}
          onMouseOut={(e) => e.target.style.transform = "translateY(0)"}
        >
          🚪 Logout
        </button>
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