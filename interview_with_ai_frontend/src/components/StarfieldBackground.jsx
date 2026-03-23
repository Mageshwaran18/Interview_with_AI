import './StarfieldBackground.css';

/**
 * StarfieldBackground — CSS-only animated star background
 * Replaces the CPU-heavy Canvas-based Particles component.
 * Renders a fixed-position backdrop with:
 * - Dark red tint gradient
 * - Two layers of drifting star dots
 * - Central radial red glow orb
 * - Faint grid overlay with radial mask
 */
function StarfieldBackground() {
  return (
    <div className="starfield">
      <div className="starfield-gradient" />
      <div className="starfield-stars starfield-stars-layer1" />
      <div className="starfield-stars starfield-stars-layer2" />
      <div className="starfield-orb" />
      <div className="starfield-grid" />
    </div>
  );
}

export default StarfieldBackground;
