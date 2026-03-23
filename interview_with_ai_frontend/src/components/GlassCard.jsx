import './GlassCard.css';

/**
 * GlassCard — Reusable glassmorphic card wrapper
 * Uses backdrop-filter blur, subtle borders, and optional hover glow.
 */
function GlassCard({ children, className = '', glowOnHover = true, style = {} }) {
  return (
    <div 
      className={`glass-card ${glowOnHover ? 'glass-card-glow' : ''} ${className}`}
      style={style}
    >
      <div className="glass-card-inner">
        {children}
      </div>
    </div>
  );
}

export default GlassCard;
