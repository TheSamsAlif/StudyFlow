import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Calendar() {
  const [tasks, setTasks] = useState([]);
  const [cur, setCur] = useState(new Date());
  const [selected, setSelected] = useState(new Date().toISOString().slice(0, 10));

  useEffect(() => { api.get("/tasks").then((r) => setTasks(r.data)); }, []);

  const year = cur.getFullYear();
  const month = cur.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const taskDates = new Set(tasks.filter(t => t.deadline).map(t => t.deadline));

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    cells.push({ d, dateStr });
  }

  const dayTasks = tasks.filter(t => t.deadline === selected);
  const monthName = cur.toLocaleDateString("bn-BD", { month: "long", year: "numeric" });
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-6 animate-fadeUp">
      <h1 className="font-bn-h text-3xl font-bold">🗓️ ক্যালেন্ডার</h1>
      <div className="glass rounded-3xl p-5">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => setCur(new Date(year, month - 1, 1))} className="p-2 hover:bg-white/5 rounded-full"><ChevronLeft size={18} /></button>
          <span className="font-bn-h font-semibold text-lg">{monthName}</span>
          <button onClick={() => setCur(new Date(year, month + 1, 1))} className="p-2 hover:bg-white/5 rounded-full"><ChevronRight size={18} /></button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-xs text-ink-muted mb-2">
          {["রবি","সোম","মঙ্গল","বুধ","বৃহঃ","শুক্র","শনি"].map(d => <div key={d}>{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((c, i) => {
            if (!c) return <div key={i} />;
            const has = taskDates.has(c.dateStr);
            const isSel = selected === c.dateStr;
            const isToday = c.dateStr === today;
            return (
              <button key={i} onClick={() => setSelected(c.dateStr)}
                className={`aspect-square rounded-xl text-sm flex items-center justify-center relative transition ${
                  isSel ? "bg-primary text-white" : isToday ? "bg-secondary/20 text-secondary font-semibold" : "hover:bg-white/5"
                }`}>
                {c.d}
                {has && !isSel && <div className="absolute bottom-1 w-1 h-1 rounded-full bg-primary" />}
              </button>
            );
          })}
        </div>
      </div>
      <div className="glass rounded-3xl p-5">
        <h3 className="font-bn-h font-semibold mb-3">{selected} এর টাস্ক</h3>
        {dayTasks.length === 0 ? <p className="text-ink-muted text-sm">এই দিনের কোনো টাস্ক নেই</p> : (
          <ul className="space-y-2">
            {dayTasks.map(t => (
              <li key={t.id} className="p-3 rounded-xl bg-white/5 border border-outline flex items-center justify-between">
                <span className={t.completed ? "line-through text-ink-muted" : ""}>{t.title}</span>
                <span className="text-xs text-ink-muted">{t.subject}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
