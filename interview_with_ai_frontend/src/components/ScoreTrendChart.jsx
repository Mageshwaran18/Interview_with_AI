import { useRef, useEffect } from "react";

/*
  ScoreTrendChart — Canvas-based line chart showing Q score over time.
  
  Props:
    - trends: Array of { session_id, composite_q_score, created_at }
    - width: chart width (default 600)
    - height: chart height (default 200)
*/

function ScoreTrendChart({ trends = [], width = 600, height = 200 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    const padLeft = 44;
    const padRight = 16;
    const padTop = 16;
    const padBottom = 32;

    const chartW = width - padLeft - padRight;
    const chartH = height - padTop - padBottom;

    // Clear
    ctx.clearRect(0, 0, width, height);

    // Background
    ctx.fillStyle = "rgba(13, 17, 23, 0.5)";
    ctx.fillRect(0, 0, width, height);

    if (!trends || trends.length === 0) {
      ctx.fillStyle = "#8b949e";
      ctx.font = "13px 'Segoe UI', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("No trend data available", width / 2, height / 2);
      return;
    }

    // Y-axis grid lines and labels (0, 25, 50, 75, 100)
    const yLevels = [0, 25, 50, 75, 100];
    yLevels.forEach((level) => {
      const y = padTop + chartH - (level / 100) * chartH;

      // Grid line
      ctx.beginPath();
      ctx.moveTo(padLeft, y);
      ctx.lineTo(padLeft + chartW, y);
      ctx.strokeStyle = "rgba(48, 54, 61, 0.5)";
      ctx.lineWidth = 1;
      ctx.stroke();

      // Label
      ctx.fillStyle = "#8b949e";
      ctx.font = "10px 'Segoe UI', sans-serif";
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      ctx.fillText(String(level), padLeft - 6, y);
    });

    // Data points
    const points = trends.map((t, i) => ({
      x: padLeft + (i / Math.max(trends.length - 1, 1)) * chartW,
      y: padTop + chartH - ((t.composite_q_score || 0) / 100) * chartH,
      score: t.composite_q_score || 0,
      label: t.session_id ? t.session_id.slice(0, 12) : `#${i + 1}`,
    }));

    // Animate
    let progress = 0;
    const animDuration = 1000;
    const startTime = performance.now();

    function draw(now) {
      progress = Math.min((now - startTime) / animDuration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);

      // Redraw background
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "rgba(13, 17, 23, 0.5)";
      ctx.fillRect(0, 0, width, height);

      // Y-axis grid
      yLevels.forEach((level) => {
        const y = padTop + chartH - (level / 100) * chartH;
        ctx.beginPath();
        ctx.moveTo(padLeft, y);
        ctx.lineTo(padLeft + chartW, y);
        ctx.strokeStyle = "rgba(48, 54, 61, 0.5)";
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = "#8b949e";
        ctx.font = "10px 'Segoe UI', sans-serif";
        ctx.textAlign = "right";
        ctx.textBaseline = "middle";
        ctx.fillText(String(level), padLeft - 6, y);
      });

      // Draw visible portion of line
      const visibleCount = Math.ceil(points.length * ease);

      if (visibleCount > 1) {
        // Area fill under the line
        ctx.beginPath();
        ctx.moveTo(points[0].x, padTop + chartH);
        for (let i = 0; i < visibleCount; i++) {
          ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.lineTo(points[visibleCount - 1].x, padTop + chartH);
        ctx.closePath();
        const grad = ctx.createLinearGradient(0, padTop, 0, padTop + chartH);
        grad.addColorStop(0, "rgba(88, 166, 255, 0.2)");
        grad.addColorStop(1, "rgba(88, 166, 255, 0.02)");
        ctx.fillStyle = grad;
        ctx.fill();

        // Line
        ctx.beginPath();
        for (let i = 0; i < visibleCount; i++) {
          if (i === 0) ctx.moveTo(points[i].x, points[i].y);
          else ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.strokeStyle = "#58a6ff";
        ctx.lineWidth = 2.5;
        ctx.lineJoin = "round";
        ctx.lineCap = "round";
        ctx.stroke();

        // Points
        for (let i = 0; i < visibleCount; i++) {
          ctx.beginPath();
          ctx.arc(points[i].x, points[i].y, 4, 0, 2 * Math.PI);
          ctx.fillStyle = "#58a6ff";
          ctx.fill();
          ctx.strokeStyle = "#0d1117";
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      }

      // X-axis labels (show first, middle, last)
      const labelIndices = [0];
      if (points.length > 2) labelIndices.push(Math.floor(points.length / 2));
      if (points.length > 1) labelIndices.push(points.length - 1);

      labelIndices.forEach((i) => {
        if (i < points.length) {
          ctx.fillStyle = "#8b949e";
          ctx.font = "9px 'Segoe UI', sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "top";
          ctx.fillText(points[i].label, points[i].x, padTop + chartH + 6);
        }
      });

      if (progress < 1) {
        requestAnimationFrame(draw);
      }
    }

    requestAnimationFrame(draw);
  }, [trends, width, height]);

  return (
    <div className="trend-chart-container">
      <canvas ref={canvasRef} style={{ display: "block", width: "100%" }} />
    </div>
  );
}

export default ScoreTrendChart;
