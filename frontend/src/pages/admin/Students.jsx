import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { Link } from "react-router-dom";
import { Search, Flame, Star, Clock } from "lucide-react";

export default function AdminStudents() {
  const [students, setStudents] = useState([]);
  const [q, setQ] = useState("");

  useEffect(() => { api.get("/admin/students").then(r => setStudents(r.data)); }, []);

  const filtered = students.filter(s =>
    s.name?.toLowerCase().includes(q.toLowerCase()) || s.username?.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fadeUp">
      <h1 className="font-bn-h text-3xl font-bold">👥 শিক্ষার্থীগণ</h1>

      <div className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted" />
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="নাম বা ইউজারনেম খুঁজুন..." className="w-full glass rounded-full pl-11 pr-4 py-3 outline-none border-0" />
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        {filtered.map(s => (
          <Link key={s.id} to={`/admin/students/${s.id}`} className="glass rounded-2xl p-4 hover:-translate-y-0.5 transition">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-accent grid place-items-center text-white font-bn-h font-bold">
                {s.name?.[0] || "?"}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-bn-h font-semibold truncate">{s.name}</div>
                <div className="text-xs text-ink-muted truncate">@{s.username}</div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div><div className="font-bn-h font-bold text-primary flex items-center justify-center gap-1"><Flame size={14} />{s.streak || 0}</div><div className="text-[10px] text-ink-muted">স্ট্রিক</div></div>
              <div><div className="font-bn-h font-bold text-accent flex items-center justify-center gap-1"><Star size={14} />{s.xp || 0}</div><div className="text-[10px] text-ink-muted">XP</div></div>
              <div><div className="font-bn-h font-bold text-secondary flex items-center justify-center gap-1"><Clock size={14} />{s.total_minutes || 0}</div><div className="text-[10px] text-ink-muted">মিনিট</div></div>
            </div>
            <div className="mt-3 text-xs text-ink-muted">
              টাস্ক: {s.done_tasks}/{s.total_tasks}
            </div>
          </Link>
        ))}
        {filtered.length === 0 && <p className="text-ink-muted text-center py-8 col-span-2">কোনো শিক্ষার্থী নেই</p>}
      </div>
    </div>
  );
}
