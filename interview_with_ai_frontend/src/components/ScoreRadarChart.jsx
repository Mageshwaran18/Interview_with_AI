import { useRef, useEffect } from "react";

/*
  ScoreRadarChart — Canvas-based 5-axis radar chart for GUIDE pillar scores.
  
  Props:
    - scores: { G: number, U: number, I: number, D: number, E: number }
    - size: canvas width/height in px (default 320)
*/

const PILLAR_LABELS = [
  { key: "G", label: "Goal", color: "#58a6ff" },
  { key: "U", label: "Usage", color: "#a371f7" },
  { key: "I", label: "Iteration", color: "#3fb950" },
  { key: "D", label: "Detection", color: "#f0883e" },
  { key: "E", label: "End Result", color: "#f85149" },
];

function ScoreRadarChart({ scores = {}, size = 320 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;

    // Set canvas size for HiDPI
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.scale(dpr, dpr);

    const cx = size / 2;
    const cy = size / 2;
    const maxR = size * 0.36;
    const levels = [20, 40, 60, 80, 100];
    const axes = PILLAR_LABELS.length;
    const angleStep = (2 * Math.PI) / axes;
    const startAngle = -Math.PI / 2;

    // Clear canvas
    ctx.clearRect(0, 0, size, size);

    // Draw concentric guide polygons
    levels.forEach((level) => {
      const r = (level / 100) * maxR;
      ctx.beginPath();
      for (let i = 0; i < axes; i++) {
        const angle = startAngle + i * angleStep;
        const x = cx + r * Math.cos(angle);
        const y = cy + r * Math.sin(angle);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.strokeStyle = "rgba(48, 54, 61, 0.6)";
      ctx.lineWidth = 1;
      ctx.stroke();

      // Level label
      const labelAngle = startAngle;
      ctx.fillStyle = "rgba(139, 148, 158, 0.5)";
      ctx.font = "10px 'Segoe UI', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(String(level), cx + r * Math.cos(labelAngle) + 14, cy + r * Math.sin(labelAngle) + 4);
    });

    // Draw axis lines
    for (let i = 0; i < axes; i++) {
      const angle = startAngle + i * angleStep;
      const x = cx + maxR * Math.cos(angle);
      const y = cy + maxR * Math.sin(angle);
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(x, y);
      ctx.strokeStyle = "rgba(48, 54, 61, 0.4)";
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Draw axis labels
    for (let i = 0; i < axes; i++) {
      const angle = startAngle + i * angleStep;
      const labelR = maxR + 24;
      const x = cx + labelR * Math.cos(angle);
      const y = cy + labelR * Math.sin(angle);

      ctx.fillStyle = PILLAR_LABELS[i].color;
      ctx.font = "bold 12px 'Segoe UI', sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(PILLAR_LABELS[i].label, x, y);

      // Score value below label
      const val = scores[PILLAR_LABELS[i].key] ?? 0;
      ctx.fillStyle = "#e6edf3";
      ctx.font = "11px 'Segoe UI', sans-serif";
      ctx.fillText(val.toFixed(1), x, y + 14);
    }

    // Animate the score polygon
    let progress = 0;
    const animDuration = 800;
    const startTime = performance.now();

    function animateFrame(now) {
      progress = Math.min((now - startTime) / animDuration, 1);
      const ease = 1 - Math.pow(1 - progress, 3); // easeOutCubic

      // Re-clear and redraw static elements
      ctx.clearRect(0, 0, size, size);

      // Redraw guides
      levels.forEach((level) => {
        const r = (level / 100) * maxR;
        ctx.beginPath();
        for (let i = 0; i < axes; i++) {
          const angle = startAngle + i * angleStep;
          const x = cx + r * Math.cos(angle);
          const y = cy + r * Math.sin(angle);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.strokeStyle = "rgba(48, 54, 61, 0.6)";
        ctx.lineWidth = 1;
        ctx.stroke();

        const labelAngle = startAngle;
        ctx.fillStyle = "rgba(139, 148, 158, 0.5)";
        ctx.font = "10px 'Segoe UI', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(String(level), cx + r * Math.cos(labelAngle) + 14, cy + r * Math.sin(labelAngle) + 4);
      });

      // Redraw axis lines
      for (let i = 0; i < axes; i++) {
        const angle = startAngle + i * angleStep;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + maxR * Math.cos(angle), cy + maxR * Math.sin(angle));
        ctx.strokeStyle = "rgba(48, 54, 61, 0.4)";
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Redraw labels
      for (let i = 0; i < axes; i++) {
        const angle = startAngle + i * angleStep;
        const labelR = maxR + 24;
        const x = cx + labelR * Math.cos(angle);
        const y = cy + labelR * Math.sin(angle);
        ctx.fillStyle = PILLAR_LABELS[i].color;
        ctx.font = "bold 12px 'Segoe UI', sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(PILLAR_LABELS[i].label, x, y);
        const val = scores[PILLAR_LABELS[i].key] ?? 0;
        ctx.fillStyle = "#e6edf3";
        ctx.font = "11px 'Segoe UI', sans-serif";
        ctx.fillText(val.toFixed(1), x, y + 14);
      }

      // Draw score polygon (animated)
      ctx.beginPath();
      for (let i = 0; i < axes; i++) {
        const angle = startAngle + i * angleStep;
        const val = (scores[PILLAR_LABELS[i].key] ?? 0) * ease;
        const r = (val / 100) * maxR;
        const x = cx + r * Math.cos(angle);
        const y = cy + r * Math.sin(angle);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();

      // Glow fill
      const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR);
      gradient.addColorStop(0, "rgba(88, 166, 255, 0.25)");
      gradient.addColorStop(1, "rgba(163, 113, 247, 0.08)");
      ctx.fillStyle = gradient;
      ctx.fill();

      // Border
      ctx.strokeStyle = "rgba(88, 166, 255, 0.8)";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw dots at vertices
      for (let i = 0; i < axes; i++) {
        const angle = startAngle + i * angleStep;
        const val = (scores[PILLAR_LABELS[i].key] ?? 0) * ease;
        const r = (val / 100) * maxR;
        const x = cx + r * Math.cos(angle);
        const y = cy + r * Math.sin(angle);

        ctx.beginPath();
        ctx.arc(x, y, 4, 0, 2 * Math.PI);
        ctx.fillStyle = PILLAR_LABELS[i].color;
        ctx.fill();
        ctx.strokeStyle = "#0d1117";
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      if (progress < 1) {
        requestAnimationFrame(animateFrame);
      }
    }

    requestAnimationFrame(animateFrame);
  }, [scores, size]);

  return (
    <div className="radar-chart-container" style={{ textAlign: "center" }}>
      <canvas
        ref={canvasRef}
        style={{ display: "block", margin: "0 auto" }}
      />
    </div>
  );
}

export default ScoreRadarChart;
