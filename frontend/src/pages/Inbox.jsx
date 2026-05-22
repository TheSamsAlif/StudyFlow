import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { Inbox as InboxIcon, AlertTriangle, Megaphone, Mail } from "lucide-react";

export default function Inbox() {
  const [messages, setMessages] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [tab, setTab] = useState("messages");

  const load = async () => {
    const [m, a] = await Promise.all([api.get("/messages"), api.get("/announcements")]);
    setMessages(m.data); setAnnouncements(a.data);
  };
  useEffect(() => { load(); }, []);

  const markRead = async (id) => {
    await api.post(`/messages/${id}/read`);
    load();
  };

  return (
    <div className="space-y-6 animate-fadeUp">
      <h1 className="font-bn-h text-3xl font-bold">📬 ইনবক্স</h1>

      <div className="flex gap-2">
        <button onClick={() => setTab("messages")} className={`flex-1 py-2.5 rounded-full text-sm font-bn-h flex items-center justify-center gap-2 ${tab === "messages" ? "bg-primary text-white" : "glass text-ink-muted"}`}>
          <Mail size={14} /> বার্তা ({messages.filter(m=>!m.read).length})
        </button>
        <button onClick={() => setTab("announcements")} className={`flex-1 py-2.5 rounded-full text-sm font-bn-h flex items-center justify-center gap-2 ${tab === "announcements" ? "bg-primary text-white" : "glass text-ink-muted"}`}>
          <Megaphone size={14} /> ঘোষণা ({announcements.length})
        </button>
      </div>

      {tab === "messages" ? (
        <div className="space-y-3">
          {messages.length === 0 && <Empty text="কোনো বার্তা নেই" />}
          {messages.map(m => (
            <div key={m.id} onClick={() => !m.read && markRead(m.id)}
                 className={`glass rounded-2xl p-4 cursor-pointer transition hover:-translate-y-0.5 ${
                   !m.read ? "border-l-4 border-l-primary" : ""
                 } ${m.urgent ? "bg-gradient-to-r from-red-500/15 to-transparent border-red-400/40" : ""}`}>
              <div className="flex items-start gap-3">
                {m.urgent && <AlertTriangle className="text-red-400 shrink-0 mt-1" size={18} />}
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-bn-h font-semibold">{m.by}</span>
                    <span className="text-xs text-ink-muted">{new Date(m.created_at).toLocaleString("bn-BD")}</span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{m.body}</p>
                  {m.urgent && <span className="inline-block mt-2 text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded">🚨 জরুরি</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.length === 0 && <Empty text="কোনো ঘোষণা নেই" />}
          {announcements.map(a => (
            <div key={a.id} className="glass rounded-2xl p-4">
              <div className="flex items-start gap-3">
                <span className={`w-2.5 h-2.5 rounded-full mt-2 ${a.type === "emergency" ? "bg-red-400" : a.type === "motivation" ? "bg-accent" : "bg-secondary"}`} />
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                    <span className="font-bn-h font-semibold">{a.title}</span>
                    <span className="text-xs text-ink-muted">{new Date(a.created_at).toLocaleString("bn-BD")}</span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{a.body}</p>
                  <div className="flex gap-2 mt-2 text-xs">
                    <span className="text-ink-muted">— {a.by}</span>
                    <span className={`px-2 py-0.5 rounded ${a.type === "emergency" ? "bg-red-500/20 text-red-400" : a.type === "motivation" ? "bg-accent/20 text-accent" : "bg-secondary/20 text-secondary"}`}>
                      {a.type === "emergency" ? "জরুরি" : a.type === "motivation" ? "মোটিভেশন" : "সাধারণ"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Empty({ text }) {
  return <div className="glass rounded-3xl p-12 text-center"><InboxIcon className="mx-auto mb-3 text-ink-muted" /><p className="text-ink-muted">{text}</p></div>;
}
