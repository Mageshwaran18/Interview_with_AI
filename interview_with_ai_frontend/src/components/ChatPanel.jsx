import { useState, useRef, useEffect } from "react";
import { sendChatMessage, sendEvent } from "../services/api";
import TokenBudgetIndicator from "./TokenBudgetIndicator";
import "./ChatPanel.css";

/*
 ─── ChatPanel Component ───
 
 📚 What this does:
 The AI chat interface on the right side. Users type messages,
 and the AI (Google Gemini) responds. It looks like a messaging app.
 Includes token budget tracking to monitor API usage (Phase 5.3).
 
 💾 Chat Persistence (Phase 5.4):
 - All messages are automatically saved to localStorage
 - Uses key: "chat_{sessionId}" 
 - Messages persist across page refreshes, tab closures, etc.
 - User can manually clear chat with 🗑️ button
*/

function ChatPanel({ sessionId, readOnly = false }) {
  const initialMessages = [
    {
      role: "ai",
      content:
        "👋 I'm here strictly for coding support (architecture, debugging, tests, APIs). I will decline non-technical or unrelated requests.",
    },
  ];

  const [messages, setMessages] = useState(() => {
    try {
      const savedMessages = localStorage.getItem(`chat_${sessionId}`);
      return savedMessages ? JSON.parse(savedMessages) : initialMessages;
    } catch (error) {
      console.warn("Failed to load chat history:", error);
      return initialMessages;
    }
  });
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    try {
      localStorage.setItem(`chat_${sessionId}`, JSON.stringify(messages));
    } catch (error) {
      console.warn("Failed to save chat history:", error);
    }
  }, [messages, sessionId]);

  const handleSend = async () => {
    if (readOnly) return;
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMessage = { role: "user", content: trimmed };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const guardrails =
        "SYSTEM: You are a strict code assistant. ONLY respond to programming, debugging, tests, API usage, algorithms, or architecture. Decline anything unrelated to code with a brief refusal.";
      const guardedPrompt = `${guardrails}\n\nUser prompt:\n${trimmed}`;
      const response = await sendChatMessage(sessionId, guardedPrompt);
      const aiMessage = { role: "ai", content: response.data.response };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage = {
        role: "ai",
        content: "⚠️ Sorry, I encountered an error. Please try again.",
      };
      setMessages((prev) => [...prev, errorMessage]);
      console.error("Chat error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (readOnly) return;
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClearChat = () => {
    setShowClearConfirm(true);
  };

  const confirmClearChat = () => {
    setMessages(initialMessages);
    localStorage.removeItem(`chat_${sessionId}`);
    setShowClearConfirm(false);
  };

  return (
    <div className="chat-panel">
      {/* Chat Header */}
      <div className="chat-header">
        <div className="chat-header-left">
          <h2 className="chat-title">🤖 AI Assistant</h2>
          <span className="chat-model">Gemini 2.5 Flash</span>
          <span className="chat-guardrail">Code help only</span>
        </div>
        <button
          onClick={handleClearChat}
          className="chat-clear-btn"
          aria-label="Clear chat history"
          title="Clear chat history"
        >
          🗑️
        </button>
      </div>

      {/* Token Budget Indicator */}
      <TokenBudgetIndicator sessionId={sessionId} />

      {/* Message Thread */}
      <div className="chat-messages">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`chat-message ${msg.role === "user" ? "user-message" : "ai-message"}`}
          >
            <div className="message-avatar">
              {msg.role === "user" ? "👤" : "🤖"}
            </div>
            <div className="message-bubble">
              <pre className="message-text">{msg.content}</pre>
            </div>
          </div>
        ))}

        {/* Typing Indicator */}
        {isLoading && (
          <div className="chat-message ai-message">
            <div className="message-avatar">🤖</div>
            <div className="message-bubble typing-indicator">
              <span className="dot"></span>
              <span className="dot"></span>
              <span className="dot"></span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="chat-input-area">
        {readOnly ? (
          <div className="chat-readonly-notice">
            🔒 This is a view-only session. Chat is disabled.
          </div>
        ) : (
          <>
            <textarea
              id="chat-message-input"
              name="chatMessage"
              className="chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask the AI for help..."
              rows={2}
              disabled={isLoading}
            />
            <button
              className="chat-send-btn"
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
            >
              {isLoading ? "⏳" : "🚀"}
            </button>
          </>
        )}
      </div>

      {/* Clear Chat Confirmation Dialog */}
      {showClearConfirm && (
        <div className="chat-confirm-overlay">
          <div className="chat-confirm-dialog">
            <h3 className="chat-confirm-title">⚠️ Clear Chat History?</h3>
            <p className="chat-confirm-text">
              This will permanently delete all messages. This action cannot be undone.
            </p>
            <div className="chat-confirm-actions">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="chat-confirm-cancel"
              >
                Cancel
              </button>
              <button
                onClick={confirmClearChat}
                className="chat-confirm-delete"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ChatPanel;
