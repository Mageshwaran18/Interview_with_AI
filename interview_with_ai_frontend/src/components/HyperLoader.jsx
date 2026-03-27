import "./HyperLoader.css";

// HyperLoader — animated loading scene inspired by hyper-speed spinner
function HyperLoader({ label = "Processing", subtitle = "Please wait" }) {
  return (
    <div className="hyper-loader-wrap">
      <div className="hyper-noise" />
      <div className="hyper-longfazers">
        <span></span>
        <span></span>
        <span></span>
        <span></span>
      </div>

      <div className="hyper-loader">
        <span>
          <span></span>
          <span></span>
          <span></span>
          <span></span>
        </span>
        <div className="hyper-base">
          <span></span>
          <div className="hyper-face"></div>
        </div>
      </div>

      <div className="hyper-text">
        <h3>{label}</h3>
        <p>{subtitle}</p>
        <div className="hyper-progress">
          <div className="hyper-progress-bar" />
        </div>
      </div>
    </div>
  );
}

export default HyperLoader;
