import { Routes, Route } from "react-router-dom";
import Signup from "./pages/Signup";
import Signin from "./pages/Signin";
import Dashboard from "./pages/Dashboard";
import GuidePage from "./pages/GuidePage";
import ResultsDashboard from "./pages/ResultsDashboard";
import HiringManagerDashboard from "./pages/HiringManagerDashboard";
import CandidateOnboarding from "./pages/CandidateOnboarding";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Signin />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/hiring-manager" element={<HiringManagerDashboard />} />
      <Route path="/session/:session_id" element={<CandidateOnboarding />} />
      <Route path="/guide/:session_id" element={<GuidePage />} />
      <Route path="/guide" element={<GuidePage />} />
      <Route path="/results" element={<ResultsDashboard />} />
      <Route path="/results/:sessionId" element={<ResultsDashboard />} />
    </Routes>
  );
}

export default App;

/*
Routes (Phase 5 Updated):
Maps URL paths to React components.

"/" → Signin page
"/signup" → Signup page
"/dashboard" → Protected page (authenticated users)
"/hiring-manager" → Hiring Manager Dashboard (create sessions)
"/session/:session_id" → Candidate Onboarding (name entry)
"/guide/:session_id" → GUIDE session page (coding interface) (Phase 1)
"/guide" → Legacy guide path (Phase 1)
"/results" → Results Dashboard (Phase 4)
"/results/:sessionId" → Session Detail (Phase 4)
*/