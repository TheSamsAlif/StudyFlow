import { useEffect, useRef, useState } from "react";
import { api } from "../lib/api";
import { useToast } from "../lib/toast";
import { Send, Trash2, Bot, User as UserIcon } from "lucide-react";

export default function Chat() {
  const { toast } = useToast();
  const [msgs, setMsgs] = useState([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef(null);

  useEffect(() => { api.get("/chat/history").then(r => setMsgs(r.data)); }, []);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, busy]);

  const send = async () => {
    if (!text.trim() || busy) return;
    const u = text;
    setMsgs(m => [...m, { role: "user", content: u, id: Math.random().toString() }]);
    setText(""); setBusy(true);
    try {
      const { data } = await api.post("/chat", { message: u });
      setMsgs(m => [...m, { role: "assistant", content: data.reply, id: Math.random().toString() }]);
    } catch { toast("AI সাড়া দিচ্ছে না", "error"); }
    finally { setBusy(false); }
  };

  const clear = async () => {
    if (!window.confirm("চ্যাট মুছবেন?")) return;
    await api.delete("/chat/history"); setMsgs([]);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)] md:h-[calc(100vh-5rem)] animate-fadeUp">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="font-bn-h text-2xl font-bold">🤖 StudyFlow AI</h1>
          <p className="text-xs text-ink-muted">তোমার পড়াশোনার সঙ্গী</p>
        </div>
        <button onClick={clear} className="text-ink-muted hover:text-red-400 text-sm flex items-center gap-1"><Trash2 size={14} /> মুছুন</button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {msgs.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-3xl bg-primary/15 grid place-items-center mx-auto mb-4">
              <Bot className="text-primary" size={28} />
            </div>
            <p className="font-bn-h text-lg">যেকোনো প্রশ্ন জিজ্ঞেস করো</p>
            <p className="text-sm text-ink-muted mt-1">গণিত, বিজ্ঞান, বাংলা — সব বিষয়ে</p>
          </div>
        )}
        {msgs.map(m => (
          <div key={m.id} className={`flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            {m.role === "assistant" && <div className="w-8 h-8 rounded-full bg-primary/20 grid place-items-center shrink-0"><Bot size={16} className="text-primary" /></div>}
            <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm whitespace-pre-wrap leading-relaxed ${
              m.role === "user" ? "bg-primary text-white rounded-tr-sm" : "glass rounded-tl-sm"
            }`}>
              {m.content}
            </div>
            {m.role === "user" && <div className="w-8 h-8 rounded-full bg-secondary/20 grid place-items-center shrink-0"><UserIcon size={16} className="text-secondary" /></div>}
          </div>
        ))}
        {busy && (
          <div className="flex gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/20 grid place-items-center"><Bot size={16} className="text-primary" /></div>
            <div className="glass rounded-2xl rounded-tl-sm px-4 py-3">
              <span className="dot1">●</span><span className="dot2 ml-1">●</span><span className="dot3 ml-1">●</span>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="mt-4 flex gap-2 glass rounded-full p-1.5">
        <input data-testid="chat-input" value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} placeholder="তোমার প্রশ্ন লিখো..." className="flex-1 bg-transparent outline-none px-4 py-2" />
        <button data-testid="chat-send" onClick={send} disabled={busy} className="bg-primary hover:bg-primary-hover text-white w-10 h-10 rounded-full grid place-items-center disabled:opacity-50 shadow-lg shadow-primary/30"><Send size={16} /></button>
      </div>
    </div>
  );
}
