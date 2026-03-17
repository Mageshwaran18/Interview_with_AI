import { useState, useRef, useEffect } from "react";
import { sendChatMessage } from "../services/api";
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
 
 💡 Key Concept: async/await
 When we call the API, it takes time to get a response.
 'async/await' lets us wait for the response without freezing the UI.
   const response = await sendChatMessage(...)  ← waits here
   // ... then continues after response arrives
*/

function ChatPanel({ sessionId }) {
  // State: array of message objects { role: "user"|"ai", content: "..." }
  const [messages, setMessages] = useState([
    {
      role: "ai",
      content:
        "👋 Hello! I'm your AI assistant. Ask me anything about building the Library Management System. I can help with code, architecture, debugging, and more!",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Ref to the bottom of messages for auto-scroll
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send message to AI
  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return; // Don't send empty or while loading

    // Step 1: Add user's message to the chat
    const userMessage = { role: "user", content: trimmed };
    setMessages((prev) => [...prev, userMessage]);
    setInput(""); // Clear input box

    // Step 2: Show typing indicator
    setIsLoading(true);

    try {
      // Step 3: Send to backend → Gemini API
      const response = await sendChatMessage(sessionId, trimmed);

      // Step 4: Add AI's response to chat
      const aiMessage = { role: "ai", content: response.data.response };
      setMessages((prev) => [...prev, aiMessage]);
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
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault(); // Prevent newline
      handleSend();
    }
  };

  return (
    <div className="chat-panel">
      {/* Chat Header */}
      <div className="chat-header">
        <h2 className="chat-title">🤖 AI Assistant</h2>
        <span className="chat-model">Gemini 2.0 Flash</span>
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
      </div>
    </div>
  );
}

export default ChatPanel;
