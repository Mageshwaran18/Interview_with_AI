import { useState } from "react";
import { signupUser } from "../services/api";
import { useNavigate } from "react-router-dom";
import ElectricBorder from "../components/ElectricBorder";
import Particles from "../components/Particles";

function Signup() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSignup = async (e) => {
    e.preventDefault();

    try {
      await signupUser({ email, password });
      navigate("/"); // Go to login page after signup
    } catch (error) {
      alert(error.response?.data?.detail || "Signup failed");
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
        <ElectricBorder
          color="#ffffff"
          speed={1}
          chaos={0.12}
          borderRadius={16}
        >
          <div style={{ padding: '2rem', background: '#1a1a1a', borderRadius: '16px', textAlign: 'center' }}>
            <h2>Signup</h2>

            <form onSubmit={handleSignup}>
              <input
                type="email"
                placeholder="Enter email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ padding: '0.5rem', margin: '0.5rem 0', borderRadius: '4px', border: '1px solid #ccc' }}
              />

              <br />

              <input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ padding: '0.5rem', margin: '0.5rem 0', borderRadius: '4px', border: '1px solid #ccc' }}
              />

              <br /><br />

              <button
                type="submit"
                style={{
                  padding: '0.75rem 1.5rem',
                  cursor: 'pointer',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#ffffff',
                  color: '#000',
                  fontWeight: 'bold',
                  fontSize: '1rem',
                  letterSpacing: '0.5px',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 0 10px rgba(255,255,255,0.2)'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.boxShadow = '0 0 20px rgba(255,255,255,0.6)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.boxShadow = '0 0 10px rgba(255,255,255,0.2)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                Signup
              </button>
            </form>

            <div style={{ marginTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem' }}>
              <p style={{ color: '#aaaaaa', margin: '0 0 0.5rem 0', fontSize: '0.9rem' }}>
                Already have an account?
              </p>
              <p
                onClick={() => navigate("/")}
                style={{
                  cursor: 'pointer',
                  color: '#ffffff',
                  fontWeight: 'bold',
                  fontSize: '1.1rem',
                  margin: 0,
                  display: 'inline-block',
                  position: 'relative',
                  transition: 'all 0.3s ease',
                  textShadow: '0 0 10px rgba(255,255,255,0.5)'
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
                Sign in instead 🚀
              </p>
            </div>
          </div>
        </ElectricBorder>
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