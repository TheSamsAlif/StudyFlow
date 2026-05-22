import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { Users, ListChecks, CheckCircle2, Timer } from "lucide-react";
import { Link } from "react-router-dom";

export default function AdminOverview() {
  const [overview, setOverview] = useState(null);
  const [students, setStudents] = useState([]);

  useEffect(() => {
    Promise.all([api.get("/admin/overview"), api.get("/admin/students")]).then(([o, s]) => {
      setOverview(o.data); setStudents(s.data);
    });
  }, []);

  const top = [...students].sort((a, b) => (b.xp || 0) - (a.xp || 0)).slice(0, 5);

  return (
    <div className="space-y-6 animate-fadeUp">
      <header>
        <p className="text-ink-muted text-sm">অ্যাডমিন প্যানেল</p>
        <h1 className="font-bn-h text-3xl md:text-4xl font-bold shimmer-text inline-block">নিয়ন্ত্রণ কেন্দ্র</h1>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="মোট শিক্ষার্থী" value={overview?.students ?? 0} icon={Users} c="text-primary" />
        <Stat label="মোট টাস্ক" value={overview?.total_tasks ?? 0} icon={ListChecks} c="text-secondary" />
        <Stat label="সম্পন্ন" value={overview?.done_tasks ?? 0} icon={CheckCircle2} c="text-accent" />
        <Stat label="আজকের সেশন" value={overview?.today_sessions ?? 0} icon={Timer} c="text-primary" />
      </div>

      <div className="glass rounded-3xl p-6">
        <h3 className="font-bn-h font-semibold mb-4 flex items-center gap-2">🏆 শীর্ষ শিক্ষার্থী (XP অনুসারে)</h3>
        {top.length === 0 ? <p className="text-ink-muted text-sm">কোনো শিক্ষার্থী নেই</p> : (
          <ul className="space-y-2">
            {top.map((s, i) => (
              <li key={s.id}>
                <Link to={`/admin/students/${s.id}`} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-outline hover:border-primary transition">
                  <div className={`w-9 h-9 rounded-full grid place-items-center font-bold ${i === 0 ? "bg-accent text-accent-fg" : i === 1 ? "bg-white/15" : i === 2 ? "bg-primary/30" : "bg-white/5"}`}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bn-h font-semibold truncate">{s.name}</div>
                    <div className="text-xs text-ink-muted">@{s.username} · স্ট্রিক {s.streak || 0} দিন</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bn-h text-lg font-bold text-accent">{s.xp || 0}</div>
                    <div className="text-[10px] text-ink-muted">XP</div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Link to="/admin/students" className="glass rounded-3xl p-6 hover:-translate-y-0.5 transition flex items-center gap-4">
          <Users size={36} className="text-primary" />
          <div>
            <div className="font-bn-h text-lg font-semibold">শিক্ষার্থী তালিকা</div>
            <div className="text-sm text-ink-muted">monitor, message, assign tasks</div>
          </div>
        </Link>
        <Link to="/admin/announce" className="glass rounded-3xl p-6 hover:-translate-y-0.5 transition flex items-center gap-4">
          <ListChecks size={36} className="text-secondary" />
          <div>
            <div className="font-bn-h text-lg font-semibold">ঘোষণা পাঠান</div>
            <div className="text-sm text-ink-muted">motivation / notice / emergency</div>
          </div>
        </Link>
      </div>
    </div>
  );
}

function Stat({ label, value, icon: Icon, c }) {
  return (
    <div className="glass rounded-2xl p-4">
      <Icon className={c} size={20} />
      <div className="font-bn-h text-3xl font-bold mt-2">{value}</div>
      <div className="text-xs text-ink-muted">{label}</div>
    </div>
  );
}
