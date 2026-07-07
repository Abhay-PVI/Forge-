import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";

import SignIn from "../components/SignIn";
import useAuth from "../../../shared/hooks/useAuth";

export default function SignInPage() {
  const { user, loading, signIn, requestPasswordReset, bypassAuth } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const canUseDevBypass = import.meta.env.DEV && import.meta.env.VITE_ENABLE_DEV_BYPASS === "true";
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(() => {
    if (location.state?.email) {
      return `Welcome back. We prefilled ${location.state.email}.`;
    }
    return "";
  });

  const from = location.state?.from?.pathname || "/dashboard";

  if (!loading && user) {
    return <Navigate to={from} replace />;
  }

  const handleSubmit = async ({ email, password }) => {
    setSubmitting(true);
    setError("");
    setNotice("");
    try {
      await signIn(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(normalizeAuthError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotPassword = async (email) => {
    setError("");
    setNotice("");
    try {
      await requestPasswordReset(email);
      setNotice("Password reset email sent. Check your inbox.");
    } catch (err) {
      setError(normalizeAuthError(err));
    }
  };

  const handleBypass = () => {
    bypassAuth();
    navigate(from, { replace: true });
  };

  return (
    <SignIn
      loading={submitting}
      error={error}
      notice={notice}
      onSubmit={handleSubmit}
      onForgotPassword={handleForgotPassword}
      onGoToSignUp={() => navigate("/sign-up")}
      onBypass={canUseDevBypass ? handleBypass : undefined}
      defaultEmail={location.state?.email || ""}
    />
  );
}

function normalizeAuthError(err) {
  const msg = (err?.message || "").toLowerCase();
  if (msg.includes("invalid login credentials")) return "Email or password is incorrect.";
  if (msg.includes("email not confirmed")) return "Please confirm your email before signing in.";
  if (msg.includes("network")) return "Network error. Please try again.";
  return err?.message || "Authentication failed.";
}
