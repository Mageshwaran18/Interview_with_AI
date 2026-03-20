import { useState, useEffect } from "react";
import api from "../services/api";
import "./TokenBudgetIndicator.css";

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
      const response = await api.get(
        `/api/sessions/${sessionId}/budget`
      );
      setBudget(response.data);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch token budget:", err);
      // Display error message instead of silently failing
      setError(`Failed to load token budget: ${err.response?.data?.detail || err.message}`);
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

  if (loading) {
    return null; // Don't show anything while loading
  }

  // Show error state if fetch failed
  if (error) {
    return (
      <div className="token-budget-indicator" style={{
        background: '#c74444',
        padding: '0.75rem',
        borderRadius: '8px',
        fontSize: '0.85rem',
        color: '#fff',
        border: '1px solid #a43333',
        marginBottom: '1rem'
      }}>
        ⚠️ {error}
      </div>
    );
  }

  if (!budget) {
    return null; // Don't show anything if no data
  }

  const tokens_used = budget.tokens_used || 0;
  const tokens_total = budget.total_budget || 200000;
  const usage_percentage = budget.percentage_used || (tokens_used / tokens_total) * 100;

  // Ensure values are numbers
  const safePercentage = Number(usage_percentage) || 0;
  
  // Determine color based on usage
  let statusColor = "#3fb950"; // Green
  let statusLabel = "Healthy";
  if (safePercentage >= 80) {
    statusColor = "#f85149"; // Red
    statusLabel = "⚠️ High Usage";
  } else if (safePercentage >= 50) {
    statusColor = "#d29922"; // Yellow
    statusLabel = "Moderate";
  }

  // Format numbers for display
  const formatNumber = (num) => {
    if (!num && num !== 0) return "0K";
    const numValue = Number(num) || 0;
    return (numValue / 1000).toFixed(1) + "K";
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
              width: `${Math.min(safePercentage, 100)}%`,
              backgroundColor: statusColor,
            }}
          />
        </div>

        <div className="token-percentage-text" style={{ color: statusColor }}>
          {safePercentage.toFixed(1)}% {statusLabel}
        </div>
      </div>

      {/* Warning Message (if usage > 80%) */}
      {safePercentage >= 80 && (
        <div className="token-warning">
          <span className="warning-icon">⚠️</span>
          <span className="warning-text">
            Token budget running low. Consider saving your work.
          </span>
        </div>
      )}

      {/* Hard Cutoff at 100% */}
      {safePercentage >= 100 && (
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
