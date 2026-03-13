import { useRef } from "react";
import Editor from "@monaco-editor/react";

/*
 ─── CodeEditor Component ───
 
 📚 What this does:
 Embeds the Monaco Editor (the same editor used in VS Code!) into our React app.
 The candidate writes their Python code here.
 
 🧠 What you'll learn:
 - @monaco-editor/react package
 - useRef hook (to store a reference to the editor instance)
 - Controlled vs uncontrolled components
 - Props: passing data from parent to child component
 
 💡 Key Concept: Props
 Props = Properties passed from a parent component to a child.
 Example: <CodeEditor code={myCode} onCodeChange={handleChange} />
 Here, 'code' and 'onCodeChange' are props.
*/

// Starter template that appears when the editor first loads
const STARTER_CODE = `# Library Management System
# Start building your solution below

class Library:
    def __init__(self):
        self.books = {}
        self.members = {}
        self.loans = []
    
    # TODO: Implement book management (add, update, delete, list)
    
    # TODO: Implement member management (register, update, remove)
    
    # TODO: Implement loan tracking (checkout, return, 3-book limit)
    
    # TODO: Implement search (by title, by author - partial match)
    
    # TODO: Implement overdue detection (> 14 days)
    
    # TODO: Add error handling for all operations

`;

function CodeEditor({ code, onCodeChange }) {
  // useRef stores the Monaco editor instance
  // Unlike useState, changing a ref does NOT trigger a re-render
  // We need this to access editor features later (like computing diffs in Phase 2)
  const editorRef = useRef(null);

  // Called when the editor first mounts (loads)
  // We save the editor instance so we can access it later
  const handleEditorDidMount = (editor) => {
    editorRef.current = editor;
  };

  return (
    <div className="code-editor-container">
      {/* Editor Header */}
      <div className="editor-header">
        <span className="editor-tab">
          <span className="file-icon">🐍</span>
          main.py
        </span>
        <span className="editor-language">Python</span>
      </div>

      {/* Monaco Editor */}
      <Editor
        height="calc(100% - 40px)"
        language="python"
        theme="vs-dark"
        value={code || STARTER_CODE}
        onChange={(value) => onCodeChange(value)}
        onMount={handleEditorDidMount}
        options={{
          minimap: { enabled: false },   // Hide the minimap (small code preview)
          fontSize: 14,                   // Comfortable reading size
          wordWrap: "on",                 // Wrap long lines
          scrollBeyondLastLine: false,    // Don't scroll past the last line
          automaticLayout: true,          // Auto-resize when container changes
          padding: { top: 16 },           // Add some top padding
          lineNumbers: "on",              // Show line numbers
          renderLineHighlight: "line",    // Highlight current line
          cursorBlinking: "smooth",       // Smooth cursor animation
          smoothScrolling: true,          // Smooth scrolling
          bracketPairColorization: {      // Color matching brackets
            enabled: true,
          },
        }}
      />
    </div>
  );
}

export default CodeEditor;
