import './ShinyButton.css';

/**
 * ShinyButton — Pill-shaped CTA with spinning conic-gradient border
 * 
 * Variants:
 * - primary: spinning red conic border (main CTA)
 * - secondary: static zinc border
 * - ghost: transparent with hover glow
 */
function ShinyButton({ 
  children, 
  variant = 'primary', 
  onClick, 
  disabled = false, 
  type = 'button',
  className = '' 
}) {
  return (
    <button
      type={type}
      className={`shiny-btn shiny-btn-${variant} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      <span className="shiny-btn-content">{children}</span>
    </button>
  );
}

export default ShinyButton;
