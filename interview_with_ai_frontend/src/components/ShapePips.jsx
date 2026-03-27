import "./ShapePips.css";

const SHAPES = {
  circle: "○",
  solidCircle: "●",
  square: "◻",
  solidSquare: "◼",
  triangle: "△",
  diamond: "◇",
  bullseye: "◎",
  dotBullseye: "⊙",
};

// Animated neutral-shape glyphs aligned to Red Noir tokens
function ShapePips({
  items = ["circle", "triangle", "square", "diamond", "bullseye"],
  label = "Loading",
  size = "md",
  animation = "wave", // pulse | wave | drift | orbit
}) {
  return (
    <div
      className={`shape-pips shape-${size} shape-anim-${animation}`}
      role="status"
      aria-label={label}
    >
      <div className="shape-row">
        {items.map((shape, idx) => (
          <span
            key={`${shape}-${idx}`}
            className={`shape-pip shape-${shape}`}
            aria-hidden="true"
            style={{ animationDelay: `${idx * 0.12}s` }}
          >
            {SHAPES[shape] ?? "○"}
          </span>
        ))}
      </div>
      <span className="shape-label">{label}</span>
    </div>
  );
}

export default ShapePips;
