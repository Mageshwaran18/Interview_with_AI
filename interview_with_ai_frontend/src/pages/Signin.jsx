import { useState } from "react";
import { signinUser } from "../services/api";
import { useNavigate } from "react-router-dom";
import ElectricBorder from "../components/ElectricBorder";
import Particles from "../components/Particles";
import ErrorBoundary from "../components/ErrorBoundary";

function Signin() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(""); // ← Error state instead of alert()
  const [isLoading, setIsLoading] = useState(false);

  const handleSignin = async (e) => {
    e.preventDefault();
    setError(""); // Clear previous errors
    setIsLoading(true);

    try {
      const response = await signinUser({ email, password });

      // Store JWT in localStorage
      localStorage.setItem("token", response.data.access_token);

      navigate("/dashboard");

    } catch (error) {
      // Display error inline instead of alert
      setError(error.response?.data?.detail || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden', backgroundColor: '#000000' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }}>
        <Particles
          particleColors={["#ffffff"]}
          particleCount={200}
          particleSpread={10}
          speed={0.1}
          particleBaseSize={100}
          moveParticlesOnHover
          alphaParticles={false}
          disableRotation={false}
          pixelRatio={1}
        />
      </div>
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <ErrorBoundary>
          <ElectricBorder
            color="#ffffff"
            speed={1}
            chaos={0.12}
            borderRadius={16}
          >
            <div style={{ padding: '2rem', background: '#1a1a1a', borderRadius: '16px', textAlign: 'center' }}>
            <h2>Signin</h2>

            {error && (
              <div style={{
                background: '#c74444',
                color: '#fff',
                padding: '0.75rem',
                borderRadius: '4px',
                marginBottom: '1rem',
                fontSize: '0.9rem',
                border: '1px solid #a43333'
              }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSignin}>
              <input
                type="email"
                placeholder="Enter email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                style={{ padding: '0.5rem', margin: '0.5rem 0', borderRadius: '4px', border: '1px solid #ccc', opacity: isLoading ? 0.6 : 1 }}
              />

              <br />

              <input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                style={{ padding: '0.5rem', margin: '0.5rem 0', borderRadius: '4px', border: '1px solid #ccc', opacity: isLoading ? 0.6 : 1 }}
              />

              <br /><br />

              <button
                type="submit"
                disabled={isLoading}
                style={{
                  padding: '0.75rem 1.5rem',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  borderRadius: '8px',
                  border: 'none',
                  background: isLoading ? '#888888' : '#ffffff',
                  color: '#000',
                  fontWeight: 'bold',
                  fontSize: '1rem',
                  letterSpacing: '0.5px',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 0 10px rgba(255,255,255,0.2)',
                  opacity: isLoading ? 0.7 : 1
                }}
                onMouseOver={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.boxShadow = '0 0 20px rgba(255,255,255,0.6)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }
                }}
                onMouseOut={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.boxShadow = '0 0 10px rgba(255,255,255,0.2)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }
                }}
              >
                {isLoading ? "Signing in..." : "Signin"}
              </button>
            </form>

            <div style={{ marginTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem' }}>
              <p style={{ color: '#aaaaaa', margin: '0 0 0.5rem 0', fontSize: '0.9rem' }}>
                Don't have an account?
              </p>
              <button
                onClick={() => navigate("/signup")}
                style={{
                  cursor: 'pointer',
                  color: '#ffffff',
                  fontWeight: 'bold',
                  fontSize: '1.1rem',
                  margin: 0,
                  display: 'inline-block',
                  position: 'relative',
                  transition: 'all 0.3s ease',
                  textShadow: '0 0 10px rgba(255,255,255,0.5)',
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  font: 'inherit'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.textShadow = '0 0 20px rgba(255,255,255,1), 0 0 30px rgba(255,255,255,0.8)';
                  e.currentTarget.style.transform = 'scale(1.05)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.textShadow = '0 0 10px rgba(255,255,255,0.5)';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                Create one now ✨
              </button>
            </div>
          </div>
        </ElectricBorder>
        </ErrorBoundary>
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