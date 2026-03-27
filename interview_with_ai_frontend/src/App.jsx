import { Routes, Route } from "react-router-dom";
import Signup from "./pages/Signup";
import Signin from "./pages/Signin";
import Dashboard from "./pages/Dashboard";
import GuidePage from "./pages/GuidePage";
import ResultsDashboard from "./pages/ResultsDashboard";
import HiringManagerDashboard from "./pages/HiringManagerDashboard";
import CandidateOnboarding from "./pages/CandidateOnboarding";
import ShapeDemo from "./pages/ShapeDemo";
import GroupSessionsPage from "./pages/GroupSessionsPage";
import ErrorBoundary from "./components/ErrorBoundary";

function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <ErrorBoundary>
            <Signin />
          </ErrorBoundary>
        }
      />
      <Route
        path="/signup"
        element={
          <ErrorBoundary>
            <Signup />
          </ErrorBoundary>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ErrorBoundary>
            <Dashboard />
          </ErrorBoundary>
        }
      />
      <Route
        path="/hiring-manager"
        element={
          <ErrorBoundary>
            <HiringManagerDashboard />
          </ErrorBoundary>
        }
      />
      <Route
        path="/session/:session_id"
        element={
          <ErrorBoundary>
            <CandidateOnboarding />
          </ErrorBoundary>
        }
      />
      <Route
        path="/guide/:session_id"
        element={
          <ErrorBoundary>
            <GuidePage />
          </ErrorBoundary>
        }
      />
      <Route
        path="/results"
        element={
          <ErrorBoundary>
            <ResultsDashboard />
          </ErrorBoundary>
        }
      />
      <Route
        path="/results/:sessionId"
        element={
          <ErrorBoundary>
            <ResultsDashboard />
          </ErrorBoundary>
        }
      />
      <Route
        path="/shapes-demo"
        element={
          <ErrorBoundary>
            <ShapeDemo />
          </ErrorBoundary>
        }
      />
      <Route
        path="/group-sessions"
        element={
          <ErrorBoundary>
            <GroupSessionsPage />
          </ErrorBoundary>
        }
      />
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