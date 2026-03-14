import { Routes, Route } from "react-router-dom";
import Signup from "./pages/Signup";
import Signin from "./pages/Signin";
import Dashboard from "./pages/Dashboard";
import GuidePage from "./pages/GuidePage";
import ResultsDashboard from "./pages/ResultsDashboard";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Signin />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/guide" element={<GuidePage />} />
      <Route path="/results" element={<ResultsDashboard />} />
      <Route path="/results/:sessionId" element={<ResultsDashboard />} />
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
"/results" → Results Dashboard (Phase 4)
"/results/:sessionId" → Session Detail (Phase 4)
*/