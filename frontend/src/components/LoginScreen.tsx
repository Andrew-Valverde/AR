import { FormEvent, useEffect, useId, useState } from "react";
import "./LoginScreen.css";

type AuthUser = {
  username: string;
  password: string;
  displayName: string;
};

type AuthFile = {
  users: AuthUser[];
};

type LoginScreenProps = {
  onAuthenticated: (displayName: string, username: string) => void;
};

const AUTH_STORAGE_KEY = "ar_auth";

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

export function persistSession(displayName: string, username: string) {
  sessionStorage.setItem(
    AUTH_STORAGE_KEY,
    JSON.stringify({ displayName, username }),
  );
}

export function clearSession() {
  sessionStorage.removeItem(AUTH_STORAGE_KEY);
}

export function LoginScreen({ onAuthenticated }: LoginScreenProps) {
  const formId = useId();
  const [users, setUsers] = useState<AuthUser[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/auth.json", { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as AuthFile;
        if (!Array.isArray(data.users)) throw new Error("Invalid auth file");
        if (!cancelled) {
          setUsers(data.users);
          setLoadError(null);
        }
      } catch {
        if (!cancelled) {
          setUsers(null);
          setLoadError("Could not load sign-in data. Check that auth.json is available.");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    if (!users?.length) {
      setSubmitError(loadError ?? "Sign-in data is not ready yet.");
      return;
    }
    const u = username.trim().toLowerCase();
    const match = users.find(
      (row) => row.username.toLowerCase() === u && row.password === password,
    );
    if (!match) {
      setSubmitError("Unknown username or password.");
      return;
    }
    setSubmitting(true);
    persistSession(match.displayName, match.username);
    onAuthenticated(match.displayName, match.username);
    setSubmitting(false);
  };

  return (
    <div className="login-screen">
      <div className="login-card">
        <h1 className="login-title">AR Lookup</h1>
        <p className="login-subtitle">Sign in to continue. Credentials are loaded from auth.json.</p>

        {loadError && <p className="login-banner login-banner--error">{loadError}</p>}

        <form className="login-form" onSubmit={onSubmit} aria-labelledby={`${formId}-heading`}>
          <h2 id={`${formId}-heading`} className="visually-hidden">
            Sign in
          </h2>
          <label className="login-field">
            <span className="login-label">Username</span>
            <input
              className="login-input"
              name="username"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={!users?.length}
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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={!users?.length}
              required
            />
          </label>

          {submitError && (
            <p className="login-inline-error" role="alert">
              {submitError}
            </p>
          )}

          <button type="submit" className="login-submit" disabled={!users?.length || submitting}>
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="login-hint">
          Demo accounts: <kbd>demo</kbd> / <kbd>demo123</kbd> · <kbd>field</kbd> / <kbd>fieldops</kbd>
        </p>
      </div>
    </div>
  );
}
