import { useState } from "react";
import Icon from "../../../shared/components/Icon";

export default function SignIn({
  loading,
  error,
  notice,
  onSubmit,
  onForgotPassword,
  onGoToSignUp,
  onBypass,
  theme = "light",
  onToggleTheme,
  defaultEmail = "",
}) {
  const [email, setEmail] = useState(defaultEmail);
  const [password, setPassword] = useState("");
  const [localError, setLocalError] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    setLocalError("");

    if (!email.trim() || !password) {
      setLocalError("Please enter both email and password.");
      return;
    }

    await onSubmit?.({ email: email.trim(), password });
  };

  const forgot = async () => {
    if (!email.trim()) {
      setLocalError("Enter your email first, then we can send a reset link.");
      return;
    }

    await onForgotPassword?.(email.trim());
  };

  const message = error || localError;

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        gridTemplateColumns: "1.05fr 0.95fr",
        background: "var(--surface)",
      }}
    >
      <div
        style={{
          position: "relative",
          overflow: "hidden",
          padding: "48px 56px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background:
            "linear-gradient(155deg, oklch(0.30 0.05 200), oklch(0.22 0.04 220))",
          color: "#fff",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0.5,
            backgroundImage:
              "radial-gradient(circle at 1px 1px, oklch(1 0 0 / 0.10) 1px, transparent 0)",
            backgroundSize: "26px 26px",
          }}
        />

        <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 34, height: 34, background: "#fff", borderRadius: "50%" }} />
          <div style={{ fontSize: 19, fontWeight: 700, letterSpacing: "-0.01em" }}>Forge</div>
        </div>

        <div style={{ position: "relative" }}>
          <div className="label-eyebrow" style={{ color: "oklch(0.82 0.05 162)" }}>
            Engineering Report Builder
          </div>
          <h1 style={{ fontSize: 38, lineHeight: 1.12, fontWeight: 600, letterSpacing: "-0.02em", margin: "14px 0 18px", maxWidth: 460 }}>
            Every design basis report, coded once.
          </h1>
          <p style={{ fontSize: 15, lineHeight: 1.6, color: "oklch(0.86 0.01 220)", maxWidth: 430, margin: 0 }}>
            Templates, formulae and formatting for Electrical, Civil and Structure, embedded. Enter your inputs once, generate a standardized, review-ready document.
          </p>
        </div>

        <div style={{ position: "relative", display: "flex", gap: 28 }}>
          <Stat value="12" label="Coded report types" />
          <Stat value="3" label="Engineering verticals" />
          <Stat value="100%" label="Standard formatting" />
        </div>
      </div>

      <div
        style={{
          display: "grid",
          placeItems: "center",
          padding: 40,
          position: "relative",
        }}
      >
        <button
          className="btn btn-ghost btn-sm"
          title="Switch theme"
          onClick={onToggleTheme}
          style={{
            position: "absolute",
            top: 22,
            right: 22,
            width: 34,
            padding: 0,
          }}
        >
          <Icon name={theme === "dark" ? "sun" : "moon"} size={16} />
        </button>

        <div className="fade-up" style={{ width: 380, maxWidth: "100%" }}>
          <div className="label-eyebrow">Forge access</div>
          <h2 style={{ fontSize: 25, fontWeight: 600, letterSpacing: "-0.01em", margin: "8px 0 6px" }}>
            Sign in to your workspace
          </h2>
          <p style={{ fontSize: 14, color: "var(--text-2)", margin: "0 0 28px" }}>
            Use your account to continue into the dashboard and engineering reports.
          </p>

          <form onSubmit={submit} style={{ display: "grid", gap: 14 }}>
            <div>
              <label className="field-label" htmlFor="auth-email">Email</label>
              <input
                id="auth-email"
                className="input"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@company.com"
              />
            </div>

            <div>
              <label className="field-label" htmlFor="auth-password">Password</label>
              <input
                id="auth-password"
                className="input"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
              />
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
              <button type="button" className="btn btn-ghost btn-sm" onClick={forgot} style={{ paddingLeft: 0 }}>
                Forgot password?
              </button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={onGoToSignUp}>
                Create account
              </button>
            </div>

            {notice ? (
              <div
                style={{
                  padding: "12px 14px",
                  borderRadius: "var(--r-md)",
                  background: "var(--green-soft)",
                  color: "var(--green-text)",
                  border: "1px solid color-mix(in oklab, var(--green-text), transparent 82%)",
                  fontSize: 13,
                  lineHeight: 1.45,
                }}
              >
                {notice}
              </div>
            ) : null}

            {message ? (
              <div
                style={{
                  padding: "12px 14px",
                  borderRadius: "var(--r-md)",
                  background: "var(--red-soft)",
                  color: "var(--red-text)",
                  border: "1px solid color-mix(in oklab, var(--red-text), transparent 82%)",
                  fontSize: 13,
                  lineHeight: 1.45,
                }}
              >
                {message}
              </div>
            ) : null}

            <button className="btn btn-lg btn-primary" type="submit" disabled={loading}>
              {loading ? "Authenticating..." : "Sign in"}
            </button>

            {onBypass && (
              <button
                className="btn btn-lg btn-soft"
                type="button"
                onClick={onBypass}
                style={{
                  marginTop: "-4px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                <Icon name="zap" size={14} />
                Bypass Login (Dev Mode)
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

function Stat({ value, label }) {
  return (
    <div>
      <div className="mono" style={{ fontSize: 24, fontWeight: 600 }}>
        {value}
      </div>
      <div style={{ fontSize: 12, color: "oklch(0.78 0.01 220)", marginTop: 2 }}>
        {label}
      </div>
    </div>
  );
}
