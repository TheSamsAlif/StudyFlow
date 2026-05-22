import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { useToast } from "../lib/toast";
import { Plus, Trash2, Check, Pencil, Pin } from "lucide-react";

const PRIO = { high: "জরুরি", medium: "মাঝারি", low: "সহজ" };

export default function Tasks() {
  const { toast } = useToast();
  const [tasks, setTasks] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [filter, setFilter] = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  const [edit, setEdit] = useState(null);
  const [form, setForm] = useState({ title: "", subject: "", priority: "medium", deadline: "" });

  const load = async () => {
    const [t, s] = await Promise.all([api.get("/tasks"), api.get("/subjects")]);
    setTasks(t.data); setSubjects(s.data);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.title.trim()) return toast("শিরোনাম লিখুন", "error");
    try {
      if (edit) await api.patch(`/tasks/${edit.id}`, form);
      else await api.post("/tasks", form);
      toast("সংরক্ষিত", "success");
      setShowAdd(false); setEdit(null);
      setForm({ title: "", subject: "", priority: "medium", deadline: "" });
      load();
    } catch { toast("ত্রুটি", "error"); }
  };

  const toggle = async (t) => { await api.patch(`/tasks/${t.id}`, { completed: !t.completed }); load(); };
  const remove = async (id) => { if (!window.confirm("মুছবেন?")) return; await api.delete(`/tasks/${id}`); load(); };
  const startEdit = (t) => { setEdit(t); setForm({ title: t.title, subject: t.subject || "", priority: t.priority, deadline: t.deadline || "" }); setShowAdd(true); };

  const visible = tasks.filter((t) => filter === "all" || t.subject === filter);
  const open = visible.filter((t) => !t.completed);
  const done = visible.filter((t) => t.completed);

  return (
    <div className="space-y-6 animate-fadeUp">
      <div className="flex items-center justify-between">
        <h1 className="font-bn-h text-3xl font-bold">📋 টাস্ক ম্যানেজার</h1>
        <button data-testid="add-task-btn" onClick={() => { setEdit(null); setForm({ title: "", subject: "", priority: "medium", deadline: "" }); setShowAdd(true); }} className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-full flex items-center gap-2 font-medium transition active:scale-95 shadow-lg shadow-primary/30">
          <Plus size={18} /> নতুন
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto hide-scroll pb-2">
        <Chip a={filter === "all"} onClick={() => setFilter("all")}>সব</Chip>
        {subjects.map((s) => <Chip key={s.id} a={filter === s.name} onClick={() => setFilter(s.name)}>{s.name}</Chip>)}
      </div>

      {showAdd && (
        <Modal onClose={() => setShowAdd(false)} title={edit ? "এডিট টাস্ক" : "নতুন টাস্ক"}>
          <input data-testid="task-title" placeholder="শিরোনাম" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inp} />
          <select value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className={inp}>
            <option value="">বিষয় (ঐচ্ছিক)</option>
            {subjects.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
          </select>
          <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className={inp}>
            <option value="high">জরুরি</option>
            <option value="medium">মাঝারি</option>
            <option value="low">সহজ</option>
          </select>
          <input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} className={inp} />
          <div className="flex gap-2 pt-2">
            <button onClick={() => setShowAdd(false)} className="flex-1 py-3 rounded-full glass">বাতিল</button>
            <button data-testid="save-task-btn" onClick={save} className="flex-1 py-3 rounded-full bg-primary text-white font-semibold">সংরক্ষণ</button>
          </div>
        </Modal>
      )}

      <Section title={`চলমান (${open.length})`} tasks={open} onToggle={toggle} onDelete={remove} onEdit={startEdit} />
      {done.length > 0 && <Section title={`সম্পন্ন (${done.length})`} tasks={done} onToggle={toggle} onDelete={remove} onEdit={startEdit} done />}
    </div>
  );
}

const inp = "w-full glass rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary border-0";

function Chip({ a, children, onClick }) {
  return <button onClick={onClick} className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap font-bn-h transition ${a ? "bg-primary text-white" : "glass text-ink-muted"}`}>{children}</button>;
}

function Modal({ children, title, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full md:max-w-md glass rounded-t-3xl md:rounded-3xl p-6 animate-fadeUp shadow-2xl space-y-3">
        <h3 className="font-bn-h text-xl font-bold">{title}</h3>
        {children}
      </div>
    </div>
  );
}

function Section({ title, tasks, onToggle, onDelete, onEdit, done }) {
  return (
    <div>
      <h2 className="font-bn-h font-semibold text-ink-muted text-xs mb-2 uppercase tracking-wider">{title}</h2>
      <ul className="space-y-2">
        {tasks.length === 0 && <p className="text-ink-muted text-sm py-4">কোনো টাস্ক নেই</p>}
        {tasks.map((t) => (
          <li key={t.id} data-testid="task-item" className={`flex items-center gap-3 glass rounded-2xl p-4 group ${done ? "opacity-60" : ""}`}>
            <button onClick={() => onToggle(t)} data-testid="task-check" className={`w-6 h-6 rounded-full border-2 grid place-items-center transition ${t.completed ? "bg-secondary border-secondary text-white" : "border-outline hover:border-primary"}`}>
              {t.completed && <Check size={14} />}
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                {t.assigned_by && <Pin size={12} className="text-accent shrink-0" />}
                <div className={`font-medium truncate ${t.completed ? "line-through" : ""}`}>{t.title}</div>
              </div>
              <div className="text-xs text-ink-muted flex gap-2 flex-wrap mt-0.5">
                {t.subject && <span>{t.subject}</span>}
                {t.deadline && <span>📅 {t.deadline}</span>}
                {t.assigned_by && <span className="text-accent">— {t.assigned_by}</span>}
                <span className={`px-1.5 rounded ${t.priority === "high" ? "bg-primary/20 text-primary" : t.priority === "low" ? "bg-secondary/20 text-secondary" : "bg-accent/20 text-accent"}`}>{PRIO[t.priority]}</span>
              </div>
            </div>
            <button onClick={() => onEdit(t)} className="text-ink-muted hover:text-primary transition"><Pencil size={16} /></button>
            <button onClick={() => onDelete(t.id)} className="text-ink-muted hover:text-red-400"><Trash2 size={16} /></button>
          </li>
        ))}
      </ul>
    </div>
  );
}
