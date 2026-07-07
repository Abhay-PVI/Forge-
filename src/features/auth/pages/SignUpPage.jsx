import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";

import SignUp from "../components/SignUp";
import useAuth from "../../../shared/hooks/useAuth";

export default function SignUpPage() {
  const { user, loading, signUp } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!loading && user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (payload) => {
    setSubmitting(true);
    setError("");
    try {
      const res = await signUp(payload);
      const email = payload.email;

      if (res?.session?.access_token) {
        navigate("/dashboard", { replace: true });
        return;
      }

      navigate("/sign-in", {
        replace: true,
        state: {
          email,
        },
      });
    } catch (err) {
      setError(normalizeAuthError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SignUp
      loading={submitting}
      error={error}
      onSubmit={handleSubmit}
      onGoToSignIn={() => navigate("/sign-in")}
    />
  );
}

function normalizeAuthError(err) {
  const msg = (err?.message || "").toLowerCase();
  if (msg.includes("already registered") || msg.includes("already exists")) {
    return "That email is already in use.";
  }
  if (msg.includes("rate limit") || msg.includes("too many requests")) {
    return "Too many signup attempts. Please try again later.";
  }
  if (msg.includes("password") && (msg.includes("weak") || msg.includes("short"))) {
    return "Password is too weak. Use at least 8 characters.";
  }
  if (msg.includes("organization")) {
    return "We could not create or link the organization. Please try again.";
  }
  return err?.message || "Sign up failed.";
}
