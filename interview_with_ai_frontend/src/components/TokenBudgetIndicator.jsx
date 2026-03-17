import { useState, useEffect } from "react";
import axios from "axios";

/**
 * TokenBudgetIndicator Component
 *
 * 📊 What this does:
 * Displays the current token budget usage for a session.
 * Shows warning when usage exceeds 80% threshold.
 * Updates every 5 seconds or after each chat message.
 *
 * 🎨 Visual States:
 * - Green: < 50% usage (healthy)
 * - Yellow: 50-80% usage (caution)
 * - Red: > 80% usage (warning)
 *
 * 💡 Why separate component:
 * - Reusable in different panels (chat, evaluation, etc.)
 * - Can be positioned flexibly
 * - Easy to test independently
 */

function TokenBudgetIndicator({ sessionId }) {
  const [budget, setBudget] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch token budget info from backend
  const fetchTokenBudget = async () => {
    if (!sessionId) return;

    try {
      const response = await axios.get(
        `http://127.0.0.1:8000/api/sessions/${sessionId}/budget`
      );
      setBudget(response.data);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch token budget:", err);
      // Don't show error to user, just silently fail
      setError(null);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchTokenBudget();
  }, [sessionId]);

  // Poll for updates every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchTokenBudget, 30000);
    return () => clearInterval(interval);
  }, [sessionId]);

  if (!budget || loading) {
    return null; // Don't show anything if loading or no data
  }

  const { tokens_used, tokens_total, usage_percentage } = budget;

  // Determine color based on usage
  let statusColor = "#3fb950"; // Green
  let statusLabel = "Healthy";
  if (usage_percentage >= 80) {
    statusColor = "#f85149"; // Red
    statusLabel = "⚠️ High Usage";
  } else if (usage_percentage >= 50) {
    statusColor = "#d29922"; // Yellow
    statusLabel = "Moderate";
  }

  // Format numbers for display
  const formatNumber = (num) => {
    return (num / 1000).toFixed(1) + "K";
  };

  return (
    <div className="token-budget-indicator">
      {/* Token Bar */}
      <div className="token-bar-container">
        <div className="token-bar-label">
          <span className="token-label-text">Tokens</span>
          <span className="token-label-count">
            {formatNumber(tokens_used)} / {formatNumber(tokens_total)}
          </span>
        </div>

        <div className="token-bar-background">
          <div
            className="token-bar-fill"
            style={{
              width: `${Math.min(usage_percentage, 100)}%`,
              backgroundColor: statusColor,
            }}
          />
        </div>

        <div className="token-percentage-text" style={{ color: statusColor }}>
          {usage_percentage.toFixed(1)}% {statusLabel}
        </div>
      </div>

      {/* Warning Message (if usage > 80%) */}
      {usage_percentage >= 80 && (
        <div className="token-warning">
          <span className="warning-icon">⚠️</span>
          <span className="warning-text">
            Token budget running low. Consider saving your work.
          </span>
        </div>
      )}

      {/* Hard Cutoff at 100% */}
      {usage_percentage >= 100 && (
        <div className="token-error">
          <span className="error-icon">🛑</span>
          <span className="error-text">
            Token budget exhausted. Chat disabled.
          </span>
        </div>
      )}
    </div>
  );
}

export default TokenBudgetIndicator;
