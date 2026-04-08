import { useState } from "react";
import { Ribbon, type AppMode } from "./components/Ribbon";
import { ARAnalysisView } from "./components/ARAnalysisView";
import { AIChatView } from "./components/AIChatView";
import "./App.css";

export default function App() {
  const [mode, setMode] = useState<AppMode>("ar");

  return (
    <div className="app">
      <Ribbon mode={mode} onModeChange={setMode} />
      <main className="app-main">
        {mode === "ar" ? <ARAnalysisView /> : <AIChatView />}
      </main>
    </div>
  );
}
