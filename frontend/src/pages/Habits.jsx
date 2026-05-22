import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { useToast } from "../lib/toast";
import { Plus, Trash2, Check } from "lucide-react";

const MOODS = [
  { id: "great", emoji: "😄", label: "দারুণ" },
  { id: "good", emoji: "🙂", label: "ভালো" },
  { id: "okay", emoji: "😐", label: "ঠিকঠাক" },
  { id: "bad", emoji: "😕", label: "খারাপ" },
  { id: "awful", emoji: "😞", label: "খুব খারাপ" },
];

export default function Habits() {
  const { toast } = useToast();
  const [habits, setHabits] = useState([]);
  const [moods, setMoods] = useState([]);
  const [name, setName] = useState("");
  const today = new Date().toISOString().slice(0, 10);
  const todayMood = moods.find(m => m.date === today);

  const load = async () => {
    const [h, m] = await Promise.all([api.get("/habits"), api.get("/mood")]);
    setHabits(h.data); setMoods(m.data);
  };
  useEffect(() => { load(); }, []);

  const addHabit = async () => {
    if (!name.trim()) return;
    await api.post("/habits", { name });
    setName(""); load();
  };

  const toggle = async (h) => { await api.post("/habits/log", { habit_id: h.id, date: today }); load(); };
  const delHabit = async (id) => { if (!window.confirm("মুছবেন?")) return; await api.delete(`/habits/${id}`); load(); };
  const setMood = async (mood) => { await api.post("/mood", { mood, date: today }); load(); toast("মুড সংরক্ষিত", "success"); };

  return (
    <div className="space-y-6 animate-fadeUp">
      <h1 className="font-bn-h text-3xl font-bold">💗 অভ্যাস ও মুড</h1>

      <div className="glass rounded-3xl p-5">
        <h3 className="font-bn-h font-semibold mb-3">আজকের মুড</h3>
        <div className="flex gap-2 flex-wrap">
          {MOODS.map(m => (
            <button key={m.id} onClick={() => setMood(m.id)} className={`flex flex-col items-center gap-1 px-4 py-3 rounded-2xl border-2 transition ${todayMood?.mood === m.id ? "border-primary bg-primary/10 scale-105" : "border-outline hover:border-primary/50"}`}>
              <span className="text-2xl">{m.emoji}</span>
              <span className="text-xs font-bn-h">{m.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="glass rounded-3xl p-5 space-y-3">
        <h3 className="font-bn-h font-semibold">দৈনিক অভ্যাস</h3>
        <div className="flex gap-2">
          <input value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === "Enter" && addHabit()} placeholder="যেমন: সকালে পড়া" className="flex-1 glass rounded-xl px-4 py-2.5 outline-none border-0" />
          <button onClick={addHabit} className="bg-primary text-white w-10 h-10 rounded-xl grid place-items-center shadow-lg shadow-primary/30"><Plus size={18} /></button>
        </div>
        <div className="space-y-2 mt-2">
          {habits.map(h => (
            <div key={h.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-2xl border border-outline">
              <button onClick={() => toggle(h)} className={`w-7 h-7 rounded-full grid place-items-center border-2 transition ${h.done_today ? "bg-secondary border-secondary text-white" : "border-outline hover:border-secondary"}`}>
                {h.done_today && <Check size={14} />}
              </button>
              <span className={`flex-1 font-bn-h ${h.done_today ? "line-through text-ink-muted" : ""}`}>{h.name}</span>
              <span className="text-xs text-ink-muted">{h.completed_dates?.length || 0} দিন</span>
              <button onClick={() => delHabit(h.id)} className="text-ink-muted hover:text-red-400"><Trash2 size={14} /></button>
            </div>
          ))}
          {habits.length === 0 && <p className="text-ink-muted text-sm py-4 text-center">কোনো অভ্যাস যোগ হয়নি</p>}
        </div>
      </div>

      {moods.length > 0 && (
        <div className="glass rounded-3xl p-5">
          <h3 className="font-bn-h font-semibold mb-3">সাম্প্রতিক মুড</h3>
          <div className="flex gap-2 flex-wrap">
            {moods.slice(0, 14).map(m => {
              const md = MOODS.find(x => x.id === m.mood);
              return (
                <div key={m.id} className="flex flex-col items-center px-3 py-2 bg-white/5 rounded-xl border border-outline" title={m.date}>
                  <span className="text-xl">{md?.emoji}</span>
                  <span className="text-[10px] text-ink-muted">{m.date.slice(5)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
