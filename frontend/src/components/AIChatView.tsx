import { useId, useRef, useState } from "react";
import "./AIChatView.css";

type Msg = { id: string; role: "user" | "assistant"; text: string };

const SEED: Msg[] = [
  {
    id: "s1",
    role: "assistant",
    text: "This is the AI chat area. Backend wiring will connect here later.",
  },
];

export function AIChatView() {
  const inputId = useId();
  const endRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Msg[]>(SEED);
  const [draft, setDraft] = useState("");

  const send = () => {
    const t = draft.trim();
    if (!t) return;
    const user: Msg = { id: crypto.randomUUID(), role: "user", text: t };
    const stub: Msg = {
      id: crypto.randomUUID(),
      role: "assistant",
      text: "Draft UI only — no model attached yet.",
    };
    setMessages((m) => [...m, user, stub]);
    setDraft("");
    queueMicrotask(() => endRef.current?.scrollIntoView({ behavior: "smooth" }));
  };

  return (
    <div className="chat-view">
      <div className="chat-thread" role="log" aria-live="polite">
        {messages.map((m) => (
          <div key={m.id} className={`chat-bubble chat-bubble--${m.role}`}>
            <span className="chat-bubble-label">{m.role === "user" ? "You" : "Assistant"}</span>
            <p className="chat-bubble-text">{m.text}</p>
          </div>
        ))}
        <div ref={endRef} />
      </div>
      <form
        className="chat-composer"
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <label htmlFor={inputId} className="visually-hidden">
          Message
        </label>
        <textarea
          id={inputId}
          className="chat-input"
          rows={2}
          placeholder="Ask about your system or AR session…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
        />
        <button type="submit" className="chat-send">
          Send
        </button>
      </form>
    </div>
  );
}
