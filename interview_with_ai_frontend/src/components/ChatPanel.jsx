import { useState, useRef, useEffect } from "react";
import { sendChatMessage, sendEvent } from "../services/api";
import TokenBudgetIndicator from "./TokenBudgetIndicator";

/*
 ─── ChatPanel Component ───
 
 📚 What this does:
 The AI chat interface on the right side. Users type messages,
 and the AI (Google Gemini) responds. It looks like a messaging app.
 Includes token budget tracking to monitor API usage (Phase 5.3).
 
 🧠 What you'll learn:
 - useState for managing messages and input
 - useRef for auto-scrolling to bottom
 - useEffect for side effects (scrolling)
 - async/await for API calls
 - Conditional rendering (showing/hiding typing indicator)
 - Token budget tracking and warning system
 - localStorage for persistent chat history across page refreshes
 
 💾 Chat Persistence (Phase 5.4):
 - All messages are automatically saved to localStorage
 - Uses key: "chat_{sessionId}" 
 - Messages persist across page refreshes, tab closures, etc.
 - User can manually clear chat with 🗑️ button
 - On page refresh, chat history is automatically restored
 
 💡 Key Concept: async/await
 When we call the API, it takes time to get a response.
 'async/await' lets us wait for the response without freezing the UI.
   const response = await sendChatMessage(...)  ← waits here
   // ... then continues after response arrives
*/

function ChatPanel({ sessionId, readOnly = false }) {
  // Initial state: greeting message
  const initialMessages = [
    {
      role: "ai",
      content:
        "👋 Hello! I'm your AI assistant. Ask me anything about building the Library Management System. I can help with code, architecture, debugging, and more!",
    },
  ];

  // State: array of message objects { role: "user"|"ai", content: "..." }
  // Load from localStorage if available, otherwise use initial greeting
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
  const [showClearConfirm, setShowClearConfirm] = useState(false); // ← Confirmation dialog state

  // Ref to the bottom of messages for auto-scroll
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Persist messages to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(`chat_${sessionId}`, JSON.stringify(messages));
    } catch (error) {
      console.warn("Failed to save chat history:", error);
    }
  }, [messages, sessionId]);

  // Send message to AI
  const handleSend = async () => {
    // Prevent sending if readonly
    if (readOnly) return;

    const trimmed = input.trim();
    if (!trimmed || isLoading) return; // Don't send empty or while loading

    // Step 1: Add user's message to the chat
    const userMessage = { role: "user", content: trimmed };
    setMessages((prev) => [...prev, userMessage]);
    setInput(""); // Clear input box

    // Note: PROMPT event is logged by the backend in chat_service.py

    // Step 2: Show typing indicator
    setIsLoading(true);

    try {
      // Step 3: Send to backend → Gemini API
      const response = await sendChatMessage(sessionId, trimmed);

      // Step 4: Add AI's response to chat
      const aiMessage = { role: "ai", content: response.data.response };
      setMessages((prev) => [...prev, aiMessage]);

      // Note: RESPONSE event is logged by the backend in chat_service.py
    } catch (error) {
      // If something goes wrong, show an error message in chat
      const errorMessage = {
        role: "ai",
        content: "⚠️ Sorry, I encountered an error. Please try again.",
      };
      setMessages((prev) => [...prev, errorMessage]);
      console.error("Chat error:", error);
    } finally {
      // Step 5: Hide typing indicator (runs whether success or error)
      setIsLoading(false);
    }
  };

  // Handle Enter key to send message
  const handleKeyDown = (e) => {
    if (readOnly) return; // Don't allow keyboard input in readonly
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault(); // Prevent newline
      handleSend();
    }
  };

  // Clear chat history
  const handleClearChat = () => {
    setShowClearConfirm(true); // Show confirmation dialog instead of browser confirm()
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
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1 }}>
          <h2 className="chat-title">🤖 AI Assistant</h2>
          <span className="chat-model">Gemini 2.5 Flash</span>
        </div>
        <button
          onClick={handleClearChat}
          style={{
            background: "none",
            border: "none",
            color: "#8b949e",
            cursor: "pointer",
            fontSize: "16px",
            padding: "4px 8px",
            borderRadius: "4px",
            transition: "all 0.2s",
          }}
          aria-label="Clear chat history"
          title="Clear chat history"
          onMouseEnter={(e) => {
            e.target.style.background = "rgba(88, 166, 255, 0.1)";
            e.target.style.color = "#58a6ff";
          }}
          onMouseLeave={(e) => {
            e.target.style.background = "none";
            e.target.style.color = "#8b949e";
          }}
          title="Clear chat history"
        >
          🗑️
        </button>
      </div>

      {/* Token Budget Indicator (Phase 5.3) */}
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

        {/* Invisible element for auto-scrolling */}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="chat-input-area">
        {readOnly ? (
          <div style={{
            padding: "16px",
            backgroundColor: "#1a1a2e",
            borderTop: "1px solid #444",
            textAlign: "center",
            color: "#888",
            fontSize: "13px",
            fontWeight: "500"
          }}>
            🔒 This is a view-only session. Chat is disabled.
          </div>
        ) : (
          <>
            <textarea
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
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            background: '#1a1a1a',
            borderRadius: '12px',
            padding: '2rem',
            maxWidth: '400px',
            textAlign: 'center',
            border: '1px solid #444'
          }}>
            <h3 style={{ marginBottom: '1rem', fontSize: '1.2rem' }}>⚠️ Clear Chat History?</h3>
            <p style={{ marginBottom: '1.5rem', color: '#aaa', fontSize: '0.95rem' }}>
              This will permanently delete all messages. This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button
                onClick={() => setShowClearConfirm(false)}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  border: '1px solid #444',
                  background: 'transparent',
                  color: '#fff',
                  cursor: 'pointer',
                  flex: 1
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmClearChat}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  border: 'none',
                  background: '#c74444',
                  color: '#fff',
                  cursor: 'pointer',
                  flex: 1,
                  fontWeight: 'bold'
                }}
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
