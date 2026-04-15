import { useState } from "react";
import { Ribbon, type AppMode } from "./components/Ribbon";
import { ARAnalysisView } from "./components/ARAnalysisView";
import { AIChatView } from "./components/AIChatView";
import {
  LoginScreen,
  readStoredSession,
  clearSession,
} from "./components/LoginScreen";
import "./App.css";

export default function App() {
  const [session, setSession] = useState(() => readStoredSession());
  const [mode, setMode] = useState<AppMode>("ar");

  if (!session) {
    return (
      <LoginScreen
        onAuthenticated={(displayName, username) => {
          setSession({ displayName, username });
        }}
      />
    );
  }

  return (
    <div className="app">
      <Ribbon
        mode={mode}
        onModeChange={setMode}
        userDisplayName={session.displayName}
        onSignOut={() => {
          clearSession();
          setSession(null);
        }}
      />
      <main className="app-main">
        {mode === "ar" ? (
          <ARAnalysisView key={session.username} username={session.username} />
        ) : (
          <AIChatView />
        )}
      </main>
    </div>
  );
}
