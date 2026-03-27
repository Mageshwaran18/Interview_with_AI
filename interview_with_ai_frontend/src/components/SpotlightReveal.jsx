import "./SpotlightReveal.css";

// Full-page black overlay with expanding circular mask (auto zoom-out)
// Use on landing/home after login to reveal UI beneath.
function SpotlightReveal({
  durationMs = 3200,
  delayMs = 200,
  maxScalePercent = 180,
  origin = "50% 30%",
}) {
  return (
    <div
      className="spotlight-overlay"
      style={{
        "--spotlight-duration": `${durationMs}ms`,
        "--spotlight-delay": `${delayMs}ms`,
        "--spotlight-max": `${maxScalePercent}%`,
        "--spotlight-origin": origin,
      }}
      aria-hidden="true"
    />
  );
}

export default SpotlightReveal;
