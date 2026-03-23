import { useNavigate } from 'react-router-dom';
import './GlassNav.css';

/**
 * GlassNav — Glassmorphic floating pill navbar
 * Used on authenticated pages (Dashboard, HiringManager, Results).
 * Auth pages (Signin/Signup) do NOT use this.
 */
function GlassNav({ email = '', onLogout, children }) {
  const navigate = useNavigate();

  return (
    <div className="glass-nav-wrapper">
      <div className="glass-nav-blur-band" />
      <nav className="glass-nav">
        {/* Logo */}
        <div className="glass-nav-logo" onClick={() => navigate('/dashboard')}>
          <div className="glass-nav-logo-icon" />
          <span>GUIDE</span>
        </div>

        {/* Nav Items */}
        <div className="glass-nav-items">
          {children}
          
          {email && (
            <span className="glass-nav-user" title={email}>
              {email}
            </span>
          )}
          
          {onLogout && (
            <button className="glass-nav-logout" onClick={onLogout}>
              Logout
            </button>
          )}
        </div>
      </nav>
    </div>
  );
}

export default GlassNav;
