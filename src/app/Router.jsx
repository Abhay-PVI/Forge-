import { Navigate, Route, Routes } from "react-router-dom";

import App from "./App";
import SignInPage from "../features/auth/pages/SignInPage";
import SignUpPage from "../features/auth/pages/SignUpPage";
import useAuth from "../shared/hooks/useAuth";

function ProtectedApp({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "var(--surface)" }}>
        <div className="mono" style={{ color: "var(--text-3)", fontSize: 13 }}>Loading session...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/sign-in" replace />;
  }

  return children;
}

export default function Router() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "var(--surface)" }}>
        <div className="mono" style={{ color: "var(--text-3)", fontSize: 13 }}>Loading Forge...</div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to={user ? "/dashboard" : "/sign-in"} replace />} />
      <Route path="/sign-in" element={user ? <Navigate to="/dashboard" replace /> : <SignInPage />} />
      <Route path="/sign-up" element={user ? <Navigate to="/dashboard" replace /> : <SignUpPage />} />
      <Route path="/dashboard/*" element={<ProtectedApp><App /></ProtectedApp>} />
      <Route path="/reports/*" element={<ProtectedApp><App /></ProtectedApp>} />
      <Route path="*" element={<Navigate to={user ? "/dashboard" : "/sign-in"} replace />} />
    </Routes>
  );
}
