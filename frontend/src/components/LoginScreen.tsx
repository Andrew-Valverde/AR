import { FormEvent, useId, useState } from "react";
import "./LoginScreen.css";

type LoginScreenProps = {
  onAuthenticated: (displayName: string, username: string) => void;
};

const AUTH_STORAGE_KEY = "ar_auth";
const TOKEN_STORAGE_KEY = "ar_auth_token";

export function readStoredSession(): { displayName: string; username: string } | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { displayName?: string; username?: string };
    if (!parsed.displayName || !parsed.username) return null;
    return { displayName: parsed.displayName, username: parsed.username };
  } catch {
    return null;
  }
}

export function persistSession(displayName: string, username: string, token: string) {
  sessionStorage.setItem(
    AUTH_STORAGE_KEY,
    JSON.stringify({ displayName, username }),
  );
  sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
}

export function clearSession() {
  sessionStorage.removeItem(AUTH_STORAGE_KEY);
  sessionStorage.removeItem(TOKEN_STORAGE_KEY);
}

export function getAuthToken(): string | null {
  if (typeof sessionStorage === "undefined") return null;
  return sessionStorage.getItem(TOKEN_STORAGE_KEY);
}

export function LoginScreen({ onAuthenticated }: LoginScreenProps) {
  const formId = useId();
  const [isRegistering, setIsRegistering] = useState(false);
  
  // Login fields
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  
  // Register fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onLoginSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      const { token, user } = data;
      const displayName = `${user.name} ${user.lastName}`;
      persistSession(displayName, user.userName, token);
      onAuthenticated(displayName, user.userName);
    } catch (err: any) {
      setSubmitError(err.message || "An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  const onRegisterSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: firstName,
          lastName,
          userName: username,
          email: registerEmail,
          password: registerPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Registration failed");
      }

      const { token, user } = data;
      const displayName = `${user.name} ${user.lastName}`;
      persistSession(displayName, user.userName, token);
      onAuthenticated(displayName, user.userName);
    } catch (err: any) {
      setSubmitError(err.message || "An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-screen">
      <div className="login-card">
        <h1 className="login-title">AR Lookup</h1>
        <p className="login-subtitle">
          {isRegistering ? "Create a new account" : "Sign in to continue"}
        </p>

        {!isRegistering ? (
          <form className="login-form" onSubmit={onLoginSubmit} aria-labelledby={`${formId}-heading-login`}>
            <h2 id={`${formId}-heading-login`} className="visually-hidden">Sign in</h2>
            
            <label className="login-field">
              <span className="login-label">Email</span>
              <input
                className="login-input"
                name="email"
                type="email"
                autoComplete="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
              />
            </label>
            <label className="login-field">
              <span className="login-label">Password</span>
              <input
                className="login-input"
                name="password"
                type="password"
                autoComplete="current-password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
              />
            </label>

            {submitError && (
              <p className="login-inline-error" role="alert">{submitError}</p>
            )}

            <button type="submit" className="login-submit" disabled={submitting}>
              {submitting ? "Signing in…" : "Sign in"}
            </button>
          </form>
        ) : (
          <form className="login-form" onSubmit={onRegisterSubmit} aria-labelledby={`${formId}-heading-register`}>
            <h2 id={`${formId}-heading-register`} className="visually-hidden">Register</h2>
            
            <label className="login-field">
              <span className="login-label">First Name</span>
              <input
                className="login-input"
                name="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </label>
            <label className="login-field">
              <span className="login-label">Last Name</span>
              <input
                className="login-input"
                name="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </label>
            <label className="login-field">
              <span className="login-label">Username</span>
              <input
                className="login-input"
                name="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </label>
            <label className="login-field">
              <span className="login-label">Email</span>
              <input
                className="login-input"
                name="email"
                type="email"
                autoComplete="email"
                value={registerEmail}
                onChange={(e) => setRegisterEmail(e.target.value)}
                required
              />
            </label>
            <label className="login-field">
              <span className="login-label">Password</span>
              <input
                className="login-input"
                name="password"
                type="password"
                autoComplete="new-password"
                value={registerPassword}
                onChange={(e) => setRegisterPassword(e.target.value)}
                required
              />
            </label>

            {submitError && (
              <p className="login-inline-error" role="alert">{submitError}</p>
            )}

            <button type="submit" className="login-submit" disabled={submitting}>
              {submitting ? "Registering…" : "Register"}
            </button>
          </form>
        )}

        <div className="login-hint" style={{ marginTop: '1rem', cursor: 'pointer' }}>
          {isRegistering ? (
            <p onClick={() => { setIsRegistering(false); setSubmitError(null); }}>
              Already have an account? <u>Sign in</u>
            </p>
          ) : (
            <p onClick={() => { setIsRegistering(true); setSubmitError(null); }}>
              Don't have an account? <u>Register</u>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
