import { useEffect, useRef, useState } from "react";
import { api } from "../lib/api";
import { useToast } from "../lib/toast";
import { Play, Pause, RotateCcw, Coffee, Brain } from "lucide-react";
import { BarChart, Bar, ResponsiveContainer, XAxis, Tooltip } from "recharts";

const PRESETS = { focus: 25, short: 5, long: 15 };

export default function Timer() {
  const { toast } = useToast();
  const [mode, setMode] = useState("focus");
  const [secs, setSecs] = useState(PRESETS.focus * 60);
  const [running, setRunning] = useState(false);
  const [stats, setStats] = useState(null);
  const [subject, setSubject] = useState("");
  const [subjects, setSubjects] = useState([]);
  const ref = useRef(null);

  useEffect(() => {
    api.get("/subjects").then(r => setSubjects(r.data));
    api.get("/stats").then(r => setStats(r.data));
  }, []);

  useEffect(() => {
    if (!running) return;
    ref.current = setInterval(() => setSecs(s => {
      if (s <= 1) { clearInterval(ref.current); setRunning(false); complete(); return 0; }
      return s - 1;
    }), 1000);
    return () => clearInterval(ref.current);
  }, [running]);

  const complete = async () => {
    const minutes = PRESETS[mode];
    try {
      await api.post("/sessions", { duration_minutes: minutes, subject, type: mode === "focus" ? "pomodoro" : "break" });
      const s = await api.get("/stats"); setStats(s.data);
      toast(`${minutes} মিনিট সম্পন্ন!`, "success");
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("StudyFlow Pro", { body: `${minutes} মিনিটের সেশন শেষ — দারুণ!` });
      }
    } catch { toast("সংরক্ষণ ব্যর্থ", "error"); }
  };

  const setPreset = (m) => { setMode(m); setSecs(PRESETS[m] * 60); setRunning(false); };
  const reset = () => { setSecs(PRESETS[mode] * 60); setRunning(false); };
  const requestNotif = () => { if ("Notification" in window) Notification.requestPermission(); };

  const mm = String(Math.floor(secs / 60)).padStart(2, "0");
  const ss = String(secs % 60).padStart(2, "0");
  const total = PRESETS[mode] * 60;
  const pct = ((total - secs) / total) * 100;

  return (
    <div className="space-y-6 animate-fadeUp">
      <h1 className="font-bn-h text-3xl font-bold">⏱️ ফোকাস টাইমার</h1>

      <div className="flex gap-2">
        <button onClick={() => setPreset("focus")} className={`flex-1 py-2.5 rounded-full text-sm font-bn-h ${mode === "focus" ? "bg-primary text-white" : "glass text-ink-muted"}`}><Brain size={14} className="inline mr-1" /> ফোকাস (২৫)</button>
        <button onClick={() => setPreset("short")} className={`flex-1 py-2.5 rounded-full text-sm font-bn-h ${mode === "short" ? "bg-secondary text-white" : "glass text-ink-muted"}`}><Coffee size={14} className="inline mr-1" /> ছোট (৫)</button>
        <button onClick={() => setPreset("long")} className={`flex-1 py-2.5 rounded-full text-sm font-bn-h ${mode === "long" ? "bg-secondary text-white" : "glass text-ink-muted"}`}>লম্বা (১৫)</button>
      </div>

      <div className="glass rounded-3xl p-8 grid place-items-center">
        <div className="relative w-64 h-64">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            <circle cx="50" cy="50" r="46" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
            <circle cx="50" cy="50" r="46" fill="none" stroke={mode === "focus" ? "#E07A5F" : "#81B29A"} strokeWidth="6" strokeDasharray={`${pct * 2.89} 999`} strokeLinecap="round" />
          </svg>
          <div className="absolute inset-0 grid place-items-center">
            <div className="text-center">
              <div className="font-mono text-6xl font-bold tabular">{mm}:{ss}</div>
              <div className="text-xs uppercase tracking-widest text-ink-muted mt-2">{mode === "focus" ? "ফোকাস" : "বিরতি"}</div>
            </div>
          </div>
        </div>
        <select value={subject} onChange={e => setSubject(e.target.value)} className="mt-6 glass rounded-full px-4 py-2 text-sm border-0 outline-none">
          <option value="">বিষয় (ঐচ্ছিক)</option>
          {subjects.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
        </select>
        <div className="flex gap-3 mt-5">
          <button onClick={() => { requestNotif(); setRunning(r => !r); }} className="bg-primary hover:bg-primary-hover text-white w-14 h-14 rounded-full grid place-items-center shadow-lg shadow-primary/40 active:scale-95 transition">
            {running ? <Pause size={22} /> : <Play size={22} />}
          </button>
          <button onClick={reset} className="glass w-14 h-14 rounded-full grid place-items-center"><RotateCcw size={20} /></button>
        </div>
      </div>

      <div className="glass rounded-3xl p-6">
        <h3 className="font-bn-h font-semibold mb-4">📊 ৭ দিনের পরিসংখ্যান</h3>
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats?.week_data || []}>
              <Bar dataKey="minutes" fill="#81B29A" radius={[8, 8, 0, 0]} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#9CA3B5" }} tickFormatter={(d) => d.slice(8)} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "#141928", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="grid grid-cols-3 gap-3 mt-4">
          <Stat label="মোট সেশন" v={stats?.total_sessions ?? 0} />
          <Stat label="মোট মিনিট" v={stats?.total_minutes ?? 0} />
          <Stat label="স্ট্রিক" v={stats?.streak ?? 0} />
        </div>
      </div>
    </div>
  );
}
function Stat({ label, v }) {
  return <div className="bg-white/5 rounded-2xl p-3 text-center"><div className="font-bn-h text-2xl font-bold text-primary">{v}</div><div className="text-xs text-ink-muted">{label}</div></div>;
}
