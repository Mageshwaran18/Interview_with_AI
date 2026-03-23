import './Toast.css';

/**
 * Toast — Notification toast component
 * Replaces alert() calls and inline notification divs.
 */
function Toast({ message, type = 'success', onClose }) {
  if (!message) return null;

  return (
    <div className="toast-container">
      <div className={`toast toast-${type}`}>
        <span className="toast-message">{message}</span>
        {onClose && (
          <button className="toast-close" onClick={onClose} aria-label="Close notification">
            ✕
          </button>
        )}
      </div>
    </div>
  );
}

export default Toast;
