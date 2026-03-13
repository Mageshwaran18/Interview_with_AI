import { Routes, Route } from "react-router-dom";
import Signup from "./pages/Signup";
import Signin from "./pages/Signin";
import Dashboard from "./pages/Dashboard";
import GuidePage from "./pages/GuidePage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Signin />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/guide" element={<GuidePage />} />
    </Routes>
  );
}

export default App;

/*
Routes:
Maps URL paths to React components.

"/" → Signin page
"/signup" → Signup page
"/dashboard" → Protected page
"/guide" → GUIDE session page (Phase 1)
*/