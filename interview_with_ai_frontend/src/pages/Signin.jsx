import { useState } from "react";
import { signinUser } from "../services/api";
import { useNavigate } from "react-router-dom";
import StarfieldBackground from "../components/StarfieldBackground";
import GlassCard from "../components/GlassCard";
import ShinyButton from "../components/ShinyButton";
import "./Signin.css";

function Signin() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSignin = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await signinUser({ email, password });
      localStorage.setItem("token", response.data.access_token);
      navigate("/dashboard");
    } catch (error) {
      setError(error.response?.data?.detail || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="signin-page">
      <StarfieldBackground />

      <div className="signin-content">
        <GlassCard className="signin-card">
          <div className="signin-card-inner">
            {/* Logo */}
            <div className="signin-logo">
              <div className="signin-logo-icon" />
              <span>GUIDE</span>
            </div>

            {/* Heading */}
            <h2 className="signin-heading">Welcome Back</h2>
            <p className="signin-subtext">Sign in to continue your journey</p>

            {/* Error Banner */}
            {error && (
              <div className="signin-error">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSignin} className="signin-form">
              <div className="signin-field">
                <label htmlFor="signin-email">Email</label>
                <input
                  id="signin-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className="signin-input"
                  autoComplete="email"
                />
              </div>

              <div className="signin-field">
                <label htmlFor="signin-password">Password</label>
                <input
                  id="signin-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="signin-input"
                  autoComplete="current-password"
                />
              </div>

              <ShinyButton
                type="submit"
                variant="primary"
                disabled={isLoading}
                className="signin-submit"
              >
                {isLoading ? "Signing in..." : "Sign In →"}
              </ShinyButton>
            </form>

            {/* Divider */}
            <div className="signin-divider">
              <span>or</span>
            </div>

            {/* Navigate to Signup */}
            <p className="signin-alt-text">Don't have an account?</p>
            <button
              className="signin-alt-link"
              onClick={() => navigate("/signup")}
            >
              Create one now
            </button>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

export default Signin;

/*
Flow:
User submits form →
Call backend /auth/signin →
Receive JWT →
Store in localStorage →
Redirect to dashboard
*/