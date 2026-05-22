import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../../lib/api";
import { useToast } from "../../lib/toast";
import { ArrowLeft, Send, Plus, AlertTriangle, ListChecks, CheckCircle2 } from "lucide-react";
import { LineChart, Line, ResponsiveContainer, XAxis, Tooltip } from "recharts";

export default function AdminStudentDetail() {
  const { id } = useParams();
  const { toast } = useToast();
  const [data, setData] = useState(null);
  const [messages, setMessages] = useState([]);
  const [tab, setTab] = useState("overview");
  const [msg, setMsg] = useState("");
  const [urgent, setUrgent] = useState(false);
  const [task, setTask] = useState({ title: "", priority: "medium", deadline: "", subject: "", notes: "" });

  const load = async () => {
    const [d, m] = await Promise.all([api.get(`/admin/students/${id}`), api.get(`/admin/messages/${id}`)]);
    setData(d.data); setMessages(m.data);
  };
  useEffect(() => { load(); }, [id]);

  const sendMsg = async () => {
    if (!msg.trim()) return;
    await api.post("/admin/message", { student_id: id, body: msg, urgent });
    setMsg(""); setUrgent(false);
    toast("বার্তা পাঠানো হয়েছে", "success");
    load();
  };

  const assign = async () => {
    if (!task.title.trim()) return toast("শিরোনাম দিন", "error");
    await api.post("/admin/assign-task", { student_ids: [id], ...task });
    setTask({ title: "", priority: "medium", deadline: "", subject: "", notes: "" });
    toast("টাস্ক assign হয়েছে", "success");
    load();
  };

  if (!data) return <p className="text-ink-muted">লোড হচ্ছে...</p>;
  const { student, stats, tasks } = data;
  const inp = "w-full glass rounded-xl px-4 py-2.5 outline-none border-0";

  return (
    <div className="space-y-6 animate-fadeUp">
      <Link to="/admin/students" className="text-ink-muted hover:text-ink flex items-center gap-1 text-sm"><ArrowLeft size={14} /> ফিরে যান</Link>

      <div className="glass rounded-3xl p-6 flex items-center gap-4">
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-primary to-accent grid place-items-center text-white font-bn-h font-bold text-2xl">
          {student.name?.[0]}
        </div>
        <div>
          <div className="font-bn-h text-2xl font-bold">{student.name}</div>
          <div className="text-ink-muted">@{student.username}</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Stat label="স্ট্রিক" v={stats.streak} c="text-primary" />
        <Stat label="XP" v={stats.xp} c="text-accent" />
        <Stat label="মিনিট" v={stats.total_minutes} c="text-secondary" />
      </div>

      <div className="glass rounded-3xl p-5">
        <h3 className="font-bn-h font-semibold mb-2">৭ দিনের ট্রেন্ড</h3>
        <div className="h-32">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={stats.week_data}>
              <Line type="monotone" dataKey="minutes" stroke="#E07A5F" strokeWidth={2} dot={{ r: 3 }} />
              <XAxis dataKey="date" tickFormatter={d => d.slice(8)} tick={{ fontSize: 10, fill: "#9CA3B5" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "#141928", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="flex gap-2">
        {[["overview","অবস্থা"],["tasks","টাস্ক"],["assign","Assign"],["message","বার্তা"]].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} className={`flex-1 py-2 rounded-full text-sm font-bn-h ${tab === k ? "bg-primary text-white" : "glass text-ink-muted"}`}>{l}</button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="glass rounded-3xl p-5 space-y-2">
          <Row icon={ListChecks} label="মোট টাস্ক" v={tasks.length} />
          <Row icon={CheckCircle2} label="সম্পন্ন" v={tasks.filter(t => t.completed).length} />
          <Row icon={ListChecks} label="আজকের লক্ষ্য" v={`${stats.today_minutes}/${stats.daily_goal} মি`} />
        </div>
      )}

      {tab === "tasks" && (
        <div className="space-y-2">
          {tasks.length === 0 && <p className="text-ink-muted text-sm">কোনো টাস্ক নেই</p>}
          {tasks.map(t => (
            <div key={t.id} className="glass rounded-2xl p-3 flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${t.completed ? "bg-secondary" : t.priority === "high" ? "bg-primary" : "bg-accent"}`} />
              <div className="flex-1 min-w-0">
                <div className={`font-medium truncate ${t.completed ? "line-through text-ink-muted" : ""}`}>{t.title}</div>
                <div className="text-xs text-ink-muted">{t.subject || "—"} · {t.priority}</div>
              </div>
              {t.assigned_by && <span className="text-[10px] bg-accent/20 text-accent px-1.5 py-0.5 rounded">আমার</span>}
            </div>
          ))}
        </div>
      )}

      {tab === "assign" && (
        <div className="glass rounded-3xl p-5 space-y-3">
          <h3 className="font-bn-h font-semibold flex items-center gap-2"><Plus size={18} /> নতুন টাস্ক assign করুন</h3>
          <input placeholder="শিরোনাম" value={task.title} onChange={e => setTask({ ...task, title: e.target.value })} className={inp} />
          <input placeholder="বিষয় (ঐচ্ছিক)" value={task.subject} onChange={e => setTask({ ...task, subject: e.target.value })} className={inp} />
          <select value={task.priority} onChange={e => setTask({ ...task, priority: e.target.value })} className={inp}>
            <option value="high">জরুরি</option><option value="medium">মাঝারি</option><option value="low">সহজ</option>
          </select>
          <input type="date" value={task.deadline} onChange={e => setTask({ ...task, deadline: e.target.value })} className={inp} />
          <textarea placeholder="নোট (ঐচ্ছিক)" rows={3} value={task.notes} onChange={e => setTask({ ...task, notes: e.target.value })} className={inp} />
          <button onClick={assign} className="w-full bg-primary text-white py-3 rounded-full font-bn-h font-semibold">Assign করুন</button>
        </div>
      )}

      {tab === "message" && (
        <div className="space-y-3">
          <div className="glass rounded-3xl p-5 space-y-3">
            <h3 className="font-bn-h font-semibold flex items-center gap-2"><Send size={18} /> Direct Message</h3>
            <textarea placeholder="তোমার বার্তা..." rows={4} value={msg} onChange={e => setMsg(e.target.value)} className={inp} />
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={urgent} onChange={e => setUrgent(e.target.checked)} />
              <AlertTriangle size={14} className="text-red-400" />
              জরুরি (urgent) হিসেবে চিহ্নিত করুন
            </label>
            <button onClick={sendMsg} className="w-full bg-primary text-white py-3 rounded-full font-bn-h font-semibold">পাঠান</button>
          </div>

          <h4 className="font-bn-h font-semibold text-sm text-ink-muted uppercase tracking-wider">পাঠানো বার্তা</h4>
          {messages.length === 0 && <p className="text-ink-muted text-sm">এখনো কোনো বার্তা পাঠাননি</p>}
          {messages.map(m => (
            <div key={m.id} className={`glass rounded-2xl p-3 ${m.urgent ? "border-red-400/40" : ""}`}>
              <div className="flex items-center justify-between mb-1 text-xs text-ink-muted">
                <span>{new Date(m.created_at).toLocaleString("bn-BD")}</span>
                <span>{m.read ? "✓ পঠিত" : "⏳ অপঠিত"}</span>
              </div>
              <p className="text-sm whitespace-pre-wrap">{m.body}</p>
              {m.urgent && <span className="inline-block mt-1 text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded">জরুরি</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ label, v, c }) {
  return <div className="glass rounded-2xl p-3 text-center"><div className={`font-bn-h text-2xl font-bold ${c}`}>{v}</div><div className="text-xs text-ink-muted">{label}</div></div>;
}
function Row({ icon: Icon, label, v }) {
  return <div className="flex items-center gap-2 py-1.5"><Icon size={16} className="text-ink-muted" /><span className="text-sm">{label}</span><span className="ml-auto font-bn-h font-semibold">{v}</span></div>;
}
