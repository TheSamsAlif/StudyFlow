import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { useToast } from "../../lib/toast";
import { Megaphone, Trash2, Sparkles, AlertTriangle, Bell } from "lucide-react";

const TYPES = [
  { id: "motivation", label: "মোটিভেশন", icon: Sparkles, c: "bg-accent text-accent-fg" },
  { id: "announcement", label: "ঘোষণা", icon: Bell, c: "bg-secondary text-secondary-fg" },
  { id: "emergency", label: "জরুরি", icon: AlertTriangle, c: "bg-red-500 text-white" },
];

export default function AdminAnnouncements() {
  const { toast } = useToast();
  const [list, setList] = useState([]);
  const [students, setStudents] = useState([]);
  const [form, setForm] = useState({ title: "", body: "", type: "motivation", target_ids: [] });
  const [allStudents, setAllStudents] = useState(true);

  const load = async () => {
    const [a, s] = await Promise.all([api.get("/admin/announcements"), api.get("/admin/students")]);
    setList(a.data); setStudents(s.data);
  };
  useEffect(() => { load(); }, []);

  const send = async () => {
    if (!form.title.trim() || !form.body.trim()) return toast("সব ফিল্ড পূরণ করুন", "error");
    await api.post("/admin/announce", {
      title: form.title, body: form.body, type: form.type,
      target_ids: allStudents ? null : form.target_ids,
    });
    setForm({ title: "", body: "", type: "motivation", target_ids: [] });
    setAllStudents(true);
    toast("পাঠানো হয়েছে", "success");
    load();
  };

  const del = async (id) => {
    if (!window.confirm("মুছবেন?")) return;
    await api.delete(`/admin/announcements/${id}`);
    load();
  };

  const inp = "w-full glass rounded-xl px-4 py-3 outline-none border-0";
  return (
    <div className="space-y-6 animate-fadeUp">
      <h1 className="font-bn-h text-3xl font-bold">📢 ঘোষণা ও মোটিভেশন</h1>

      <div className="glass rounded-3xl p-5 space-y-3">
        <div className="flex gap-2">
          {TYPES.map(t => (
            <button key={t.id} onClick={() => setForm({ ...form, type: t.id })}
                    className={`flex-1 py-2.5 rounded-full text-sm font-bn-h flex items-center justify-center gap-2 ${form.type === t.id ? t.c : "glass text-ink-muted"}`}>
              <t.icon size={14} /> {t.label}
            </button>
          ))}
        </div>
        <input placeholder="শিরোনাম" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className={inp} />
        <textarea placeholder="বার্তা..." rows={4} value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} className={inp} />
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={allStudents} onChange={e => setAllStudents(e.target.checked)} />
          সবাইকে পাঠাবো
        </label>
        {!allStudents && (
          <div className="space-y-1 max-h-40 overflow-y-auto glass rounded-xl p-2">
            {students.map(s => (
              <label key={s.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 cursor-pointer">
                <input type="checkbox" checked={form.target_ids.includes(s.id)} onChange={e => {
                  setForm(f => ({ ...f, target_ids: e.target.checked ? [...f.target_ids, s.id] : f.target_ids.filter(x => x !== s.id) }));
                }} />
                <span>{s.name} <span className="text-ink-muted text-xs">@{s.username}</span></span>
              </label>
            ))}
          </div>
        )}
        <button onClick={send} className="w-full bg-primary text-white py-3 rounded-full font-bn-h font-semibold flex items-center justify-center gap-2">
          <Megaphone size={16} /> পাঠান
        </button>
      </div>

      <h3 className="font-bn-h font-semibold text-sm text-ink-muted uppercase tracking-wider">পূর্ববর্তী ঘোষণা</h3>
      <div className="space-y-2">
        {list.map(a => (
          <div key={a.id} className="glass rounded-2xl p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`w-2 h-2 rounded-full ${a.type === "emergency" ? "bg-red-400" : a.type === "motivation" ? "bg-accent" : "bg-secondary"}`} />
                  <span className="font-bn-h font-semibold">{a.title}</span>
                </div>
                <p className="text-sm text-ink-muted whitespace-pre-wrap">{a.body}</p>
                <div className="text-xs text-ink-muted mt-2">{new Date(a.created_at).toLocaleString("bn-BD")} · {a.target_ids?.length ? `${a.target_ids.length} জন` : "সবাই"}</div>
              </div>
              <button onClick={() => del(a.id)} className="text-ink-muted hover:text-red-400"><Trash2 size={16} /></button>
            </div>
          </div>
        ))}
        {list.length === 0 && <p className="text-ink-muted text-sm py-4">কোনো ঘোষণা নেই</p>}
      </div>
    </div>
  );
}
