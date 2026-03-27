import ShapePips from "../components/ShapePips";
import AnimatedHeadline from "../components/AnimatedHeadline";
import "./ShapeDemo.css";

function ShapeDemo() {
  return (
    <div className="shape-demo-page">
      <div className="shape-demo-shell">
        <div className="shape-demo-header">
          <div>
            <AnimatedHeadline
              as="div"
              className="shape-demo-title"
              text="Neutral Shape Loader Examples"
            />
            <div className="shape-demo-note">
              Uses Red Noir tokens (colors, radius, shadows) and staggered pulse animations.
              Adjust the items array or size prop to match different contexts.
            </div>
          </div>
          <div className="shape-row-inline">
            <span className="shape-micro">○</span>
            <span className="shape-micro">◻</span>
            <span className="shape-micro">△</span>
            <span className="shape-micro">◇</span>
            <span className="shape-micro">◎</span>
            <span className="shape-micro">⊙</span>
          </div>
        </div>

        <div className="shape-grid">
          <div className="shape-card">
            <h4>Default (md)</h4>
            <ShapePips label="Loading" animation="wave" />
            <p>Balanced spacing for most panels or inline status rows.</p>
          </div>

          <div className="shape-card">
            <h4>Compact (sm)</h4>
            <ShapePips
              label="Syncing"
              size="sm"
              animation="orbit"
              items={["circle", "triangle", "square", "diamond"]}
            />
            <p>Use in tight spaces like table rows or sidebars.</p>
          </div>

          <div className="shape-card">
            <h4>Large (lg)</h4>
            <ShapePips
              label="Rendering"
              size="lg"
              animation="orbit"
              items={["solidCircle", "diamond", "triangle", "dotBullseye", "square"]}
            />
            <p>Suited for modal loading or hero-level feedback.</p>
          </div>

          <div className="shape-card">
            <h4>Bullseye Mix</h4>
            <ShapePips
              label="Calibrating"
              items={["bullseye", "dotBullseye", "circle", "diamond"]}
            />
            <p>Alternates hollow/filled rings to hint at focus or targeting.</p>
          </div>

          <div className="shape-card">
            <h4>Squares + Triangles</h4>
            <ShapePips
              label="Preparing"
              items={["square", "solidSquare", "triangle", "triangle", "diamond"]}
            />
            <p>Blocky feel with a touch of motion via repeated triangles.</p>
          </div>

          <div className="shape-card">
            <h4>Mono Accent</h4>
            <ShapePips
              label="Connecting"
              items={["circle", "circle", "circle", "circle"]}
            />
            <p>Single-shape repetition for calm, minimal feedback.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ShapeDemo;
