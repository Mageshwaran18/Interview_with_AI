import { useState } from "react";
import { signupUser } from "../services/api";
import { useNavigate } from "react-router-dom";
import StarfieldBackground from "../components/StarfieldBackground";
import GlassCard from "../components/GlassCard";
import ShinyButton from "../components/ShinyButton";
import "./Signup.css";

function Signup() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Password strength calculator
  const getPasswordStrength = (pwd) => {
    if (!pwd) return { level: 0, label: '', color: '' };
    let score = 0;
    if (pwd.length >= 6) score++;
    if (pwd.length >= 10) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    if (score <= 1) return { level: 1, label: 'Weak', color: 'var(--error)' };
    if (score <= 2) return { level: 2, label: 'Fair', color: 'var(--warning)' };
    if (score <= 3) return { level: 3, label: 'Good', color: 'var(--accent-red)' };
    return { level: 4, label: 'Strong', color: 'var(--success)' };
  };

  const strength = getPasswordStrength(password);

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);

    try {
      await signupUser({ email, password });
      navigate("/");
    } catch (error) {
      setError(error.response?.data?.detail || "Signup failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="signup-page">
      <StarfieldBackground />

      <div className="signup-content">
        <GlassCard className="signup-card">
          <div className="signup-card-inner">
            {/* Logo */}
            <div className="signup-logo">
              <div className="signup-logo-icon" />
              <span>GUIDE</span>
            </div>

            {/* Heading */}
            <h2 className="signup-heading">Create Account</h2>
            <p className="signup-subtext">Join the AI collaboration platform</p>

            {/* Error Banner */}
            {error && (
              <div className="signup-error">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSignup} className="signup-form">
              <div className="signup-field">
                <label htmlFor="signup-email">Email</label>
                <input
                  id="signup-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className="signup-input"
                  autoComplete="email"
                />
              </div>

              <div className="signup-field">
                <label htmlFor="signup-password">Password</label>
                <input
                  id="signup-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="signup-input"
                  autoComplete="new-password"
                />
                {/* Password Strength Bar */}
                {password && (
                  <div className="signup-strength">
                    <div className="signup-strength-bar">
                      <div
                        className="signup-strength-fill"
                        style={{
                          width: `${(strength.level / 4) * 100}%`,
                          background: strength.color,
                        }}
                      />
                    </div>
                    <span className="signup-strength-label" style={{ color: strength.color }}>
                      {strength.label}
                    </span>
                  </div>
                )}
              </div>

              <div className="signup-field">
                <label htmlFor="signup-confirm">Confirm Password</label>
                <input
                  id="signup-confirm"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                  className="signup-input"
                  autoComplete="new-password"
                />
              </div>

              <ShinyButton
                type="submit"
                variant="primary"
                disabled={isLoading}
                className="signup-submit"
              >
                {isLoading ? "Creating account..." : "Create Account →"}
              </ShinyButton>
            </form>

            {/* Divider */}
            <div className="signup-divider">
              <span>or</span>
            </div>

            {/* Navigate to Signin */}
            <p className="signup-alt-text">Already have an account?</p>
            <button
              className="signup-alt-link"
              onClick={() => navigate("/")}
            >
              Sign in instead
            </button>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

export default Signup;

/*
Flow:
User fills form → handleSignup()
→ Calls backend /auth/signup
→ On success → redirect to signin
*/