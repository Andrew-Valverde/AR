import { useEffect, useId, useRef, useState } from "react";
import "./AIChatView.css";
import { getAuthToken } from "./LoginScreen";

type Msg = { id: string; role: "user" | "assistant"; text: string };

type ChatHistoryRecord = {
  id: number;
  userText: string;
  aiResponse: string;
  createdAt: string;
};

export function AIChatView() {
  const inputId = useId();
  const endRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchHistory() {
      try {
        const token = getAuthToken();
        if (!token) {
          setLoading(false);
          return;
        }

        const res = await fetch("/api/chat/history", {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });

        if (!res.ok) throw new Error("Failed to fetch history");

        const data: ChatHistoryRecord[] = await res.json();
        
        if (cancelled) return;

        const historyMsgs: Msg[] = [];
        data.forEach(record => {
          historyMsgs.push({ id: `history-${record.id}-u`, role: "user", text: record.userText });
          historyMsgs.push({ id: `history-${record.id}-a`, role: "assistant", text: record.aiResponse });
        });

        if (historyMsgs.length === 0) {
           historyMsgs.push({
             id: "s1",
             role: "assistant",
             text: "Hello! I am your AI assistant. How can I help you today?",
           });
        }

        setMessages(historyMsgs);
      } catch (err) {
        console.error("Error fetching chat history", err);
        if (!cancelled) {
          setMessages([{
             id: "error",
             role: "assistant",
             text: "Could not load chat history. Please check your connection."
          }]);
        }
      } finally {
        if (!cancelled) setLoading(false);
        queueMicrotask(() => endRef.current?.scrollIntoView({ behavior: "smooth" }));
      }
    }

    fetchHistory();

    return () => { cancelled = true; };
  }, []);

  const send = async () => {
    const t = draft.trim();
    if (!t || sending) return;
    
    const userMsg: Msg = { id: crypto.randomUUID(), role: "user", text: t };
    setMessages((m) => [...m, userMsg]);
    setDraft("");
    setSending(true);
    queueMicrotask(() => endRef.current?.scrollIntoView({ behavior: "smooth" }));

    try {
      const token = getAuthToken();
      const res = await fetch("/api/chat/message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ message: t })
      });

      if (!res.ok) throw new Error("Failed to send message");

      const data: ChatHistoryRecord = await res.json();
      
      const assistantMsg: Msg = { 
        id: `msg-${data.id}-a`, 
        role: "assistant", 
        text: data.aiResponse 
      };

      setMessages((m) => [...m, assistantMsg]);
    } catch (err) {
      console.error("Error sending message", err);
      setMessages((m) => [...m, { 
        id: crypto.randomUUID(), 
        role: "assistant", 
        text: "Sorry, I encountered an error. Please try again." 
      }]);
    } finally {
      setSending(false);
      queueMicrotask(() => endRef.current?.scrollIntoView({ behavior: "smooth" }));
    }
  };

  return (
    <div className="chat-view">
      <div className="chat-thread" role="log" aria-live="polite">
        {loading && (
          <div className="chat-bubble chat-bubble--assistant">
            <span className="chat-bubble-label">Assistant</span>
            <p className="chat-bubble-text">Loading history...</p>
          </div>
        )}
        {!loading && messages.map((m) => (
          <div key={m.id} className={`chat-bubble chat-bubble--${m.role}`}>
            <span className="chat-bubble-label">{m.role === "user" ? "You" : "Assistant"}</span>
            <p className="chat-bubble-text">{m.text}</p>
          </div>
        ))}
        {sending && (
          <div className="chat-bubble chat-bubble--assistant">
            <span className="chat-bubble-label">Assistant</span>
            <p className="chat-bubble-text">Thinking...</p>
          </div>
        )}
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
          disabled={loading || sending}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
        />
        <button type="submit" className="chat-send" disabled={loading || sending || !draft.trim()}>
          Send
        </button>
      </form>
    </div>
  );
}
