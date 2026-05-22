import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { useToast } from "../lib/toast";
import { Plus, Trash2, Sparkles, Save, X } from "lucide-react";

export default function Notes() {
  const { toast } = useToast();
  const [notes, setNotes] = useState([]);
  const [open, setOpen] = useState(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ title: "", content: "", subject: "" });
  const [busy, setBusy] = useState(false);

  const load = () => api.get("/notes").then(r => setNotes(r.data));
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.title.trim()) return toast("শিরোনাম দিন", "error");
    if (open) await api.patch(`/notes/${open.id}`, form);
    else await api.post("/notes", form);
    toast("সংরক্ষিত", "success");
    setCreating(false); setOpen(null); setForm({ title: "", content: "", subject: "" });
    load();
  };

  const del = async (id) => {
    if (!window.confirm("মুছবেন?")) return;
    await api.delete(`/notes/${id}`);
    setOpen(null); load();
  };

  const summarize = async () => {
    if (!form.content || form.content.length < 30) return toast("অন্তত ৩০ অক্ষর", "error");
    setBusy(true);
    try {
      const { data } = await api.post("/ai/summarize", { text: form.content });
      setForm(f => ({ ...f, content: f.content + "\n\n— সারাংশ —\n" + data.summary }));
      toast("সারাংশ যোগ হয়েছে", "success");
    } catch { toast("AI ত্রুটি", "error"); }
    setBusy(false);
  };

  const isEdit = creating || open;
  const inp = "w-full glass rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary border-0";

  return (
    <div className="space-y-6 animate-fadeUp">
      <div className="flex items-center justify-between">
        <h1 className="font-bn-h text-3xl font-bold">📝 নোটস</h1>
        <button onClick={() => { setCreating(true); setOpen(null); setForm({ title: "", content: "", subject: "" }); }} className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-full flex items-center gap-2 shadow-lg shadow-primary/30"><Plus size={18} /> নতুন</button>
      </div>

      {isEdit && (
        <div className="glass rounded-3xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-bn-h font-semibold text-lg">{open ? "এডিট" : "নতুন নোট"}</h2>
            <button onClick={() => { setCreating(false); setOpen(null); }} className="p-1.5 rounded-full hover:bg-white/5"><X size={16} /></button>
          </div>
          <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="শিরোনাম" className={`${inp} font-bn-h font-semibold text-lg`} />
          <input value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} placeholder="বিষয় (ঐচ্ছিক)" className={inp} />
          <textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} placeholder="এখানে আপনার নোট লিখুন..." rows={12} className={`${inp} leading-relaxed`} />
          <div className="flex gap-2 flex-wrap">
            <button onClick={save} className="bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-full flex items-center gap-2 font-semibold"><Save size={16} /> সংরক্ষণ</button>
            <button onClick={summarize} disabled={busy} className="bg-secondary hover:bg-secondary-hover text-white px-5 py-2.5 rounded-full flex items-center gap-2 disabled:opacity-50"><Sparkles size={16} /> {busy ? "..." : "AI সারাংশ"}</button>
            {open && <button onClick={() => del(open.id)} className="ml-auto text-red-400 hover:bg-red-500/10 px-3 py-2 rounded-full"><Trash2 size={16} /></button>}
          </div>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-3">
        {notes.map(n => (
          <button key={n.id} onClick={() => { setOpen(n); setCreating(false); setForm({ title: n.title, content: n.content, subject: n.subject || "" }); }} className="text-left glass rounded-2xl p-4 hover:-translate-y-0.5 transition">
            <h3 className="font-bn-h font-semibold truncate">{n.title}</h3>
            {n.subject && <span className="text-xs text-secondary">{n.subject}</span>}
            <p className="text-sm text-ink-muted line-clamp-3 mt-2 whitespace-pre-line">{n.content}</p>
          </button>
        ))}
        {notes.length === 0 && !isEdit && <p className="text-ink-muted text-center py-8 col-span-2">কোনো নোট নেই</p>}
      </div>
    </div>
  );
}
