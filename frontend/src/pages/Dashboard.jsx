import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import { Flame, Trophy, Star, Award, Clock, BookOpen, Target, TrendingUp, Sparkles, Megaphone, AlertTriangle } from "lucide-react";
import { LineChart, Line, ResponsiveContainer, XAxis, Tooltip } from "recharts";
import { Link } from "react-router-dom";
import ColorClock from "../components/ColorClock";

const ICON_MAP = { Flame, Trophy, Star, Award, Clock };

const QUOTES = [
  "“ছোট ছোট চেষ্টা বড় বড় ফলাফল দেয়।”",
  "“আজকে যা শিখছ, কাল কাজে আসবে।”",
  "“একদিন একটু — এটাই অভ্যাস।”",
  "“সাফল্য মানে চেষ্টা চালিয়ে যাওয়া।”",
  "“তুমি যা বিশ্বাস করো, তাই হয়ে ওঠো।”",
];

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [messages, setMessages] = useState([]);
  const [quote] = useState(QUOTES[Math.floor(Math.random() * QUOTES.length)]);

  useEffect(() => {
    Promise.all([
      api.get("/stats"), api.get("/tasks"),
      api.get("/announcements"), api.get("/messages"),
    ]).then(([s, t, a, m]) => {
      setStats(s.data); setTasks(t.data);
      setAnnouncements(a.data); setMessages(m.data);
    }).catch(() => {});
  }, []);

  const todayTasks = tasks.filter((t) => !t.completed).slice(0, 5);
  const unread = messages.filter(m => !m.read);
  const urgent = unread.find(m => m.urgent);
  const greet = () => {
    const h = new Date().getHours();
    if (h < 5) return "শুভ রাত্রি";
    if (h < 12) return "শুভ সকাল";
    if (h < 17) return "শুভ দুপুর";
    if (h < 20) return "শুভ সন্ধ্যা";
    return "শুভ রাত্রি";
  };

  return (
    <div className="space-y-6 animate-fadeUp">
      <header>
        <p className="text-ink-muted text-sm">{greet()},</p>
        <h1 className="font-bn-h text-3xl md:text-4xl font-bold">
          <span className="shimmer-text">{user?.name}</span> 👋
        </h1>
      </header>

      {/* Urgent emergency banner */}
      {urgent && (
        <Link to="/inbox" className="block">
          <div className="bg-gradient-to-r from-red-500/30 to-red-600/30 border border-red-400/40 rounded-2xl p-4 flex items-center gap-3 animate-pulse">
            <AlertTriangle className="text-red-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="font-bn-h font-semibold">জরুরি বার্তা</div>
              <div className="text-sm text-ink-muted truncate">{urgent.body}</div>
            </div>
            <span className="text-xs text-red-400">দেখুন →</span>
          </div>
        </Link>
      )}

      <div className="bento">
        {/* Color Clock */}
        <div className="md:col-span-7">
          <ColorClock />
        </div>

        {/* Streak */}
        <div className="md:col-span-5 glass rounded-3xl p-6 hover:-translate-y-0.5 transition">
          <div className="flex items-center gap-2 text-ink-muted text-xs uppercase tracking-[0.2em]">
            <Flame size={14} className="text-primary" /> স্ট্রিক
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-bn-h text-5xl font-bold shimmer-text">{stats?.streak ?? 0}</span>
            <span className="text-ink-muted">দিন</span>
          </div>
          <p className="text-sm text-ink-muted mt-2">পড়াশোনার ধারাবাহিকতা চালু রাখো 🔥</p>
        </div>

        {/* Today goal */}
        <div className="md:col-span-4 glass rounded-3xl p-6">
          <div className="flex items-center gap-2 text-ink-muted text-xs uppercase tracking-[0.2em]">
            <Target size={14} className="text-secondary" /> আজকের অগ্রগতি
          </div>
          <div className="mt-3">
            <span className="font-bn-h text-5xl font-bold text-secondary">{stats?.progress_pct ?? 0}%</span>
            <div className="mt-3 h-3 rounded-full bg-white/5 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-secondary to-secondary-hover transition-all" style={{ width: `${stats?.progress_pct ?? 0}%` }} />
            </div>
            <p className="text-sm text-ink-muted mt-2">{stats?.today_minutes ?? 0} / {stats?.daily_goal ?? 120} মিনিট</p>
          </div>
        </div>

        {/* XP */}
        <div className="md:col-span-4 glass rounded-3xl p-6">
          <div className="flex items-center gap-2 text-ink-muted text-xs uppercase tracking-[0.2em]">
            <Star size={14} className="text-accent" /> XP পয়েন্ট
          </div>
          <div className="mt-3">
            <span className="font-bn-h text-5xl font-bold text-accent">{stats?.xp ?? 0}</span>
            <p className="text-sm text-ink-muted mt-2">{stats?.total_sessions ?? 0}টি সেশন সম্পূর্ণ</p>
          </div>
        </div>

        {/* Quote */}
        <div className="md:col-span-4 rounded-3xl p-6 flex flex-col justify-between bg-gradient-to-br from-primary to-primary-hover text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
          <Sparkles size={24} className="opacity-80" />
          <p className="font-bn-h text-base leading-relaxed mt-4 relative z-10">{quote}</p>
        </div>

        {/* Trend */}
        <div className="md:col-span-7 glass rounded-3xl p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-ink-muted text-xs uppercase tracking-[0.2em]">
              <TrendingUp size={14} className="text-primary" /> সপ্তাহের ট্রেন্ড
            </div>
            <span className="text-xs text-ink-muted">মিনিট/দিন</span>
          </div>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats?.week_data || []}>
                <Line type="monotone" dataKey="minutes" stroke="#E07A5F" strokeWidth={3} dot={{ r: 4, fill: "#E07A5F" }} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#9CA3B5" }} tickFormatter={(d) => d.slice(8)} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "#141928", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, color: "#F1EBE0" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Announcements */}
        <div className="md:col-span-5 glass rounded-3xl p-6">
          <div className="flex items-center gap-2 mb-3">
            <Megaphone size={18} className="text-accent" />
            <h3 className="font-bn-h text-lg font-semibold">ঘোষণা</h3>
          </div>
          {announcements.length === 0 ? (
            <p className="text-ink-muted text-sm">কোনো ঘোষণা নেই</p>
          ) : (
            <ul className="space-y-2 max-h-44 overflow-y-auto">
              {announcements.slice(0, 4).map(a => (
                <li key={a.id} className="p-3 rounded-xl bg-white/5 border border-outline">
                  <div className="flex items-start gap-2">
                    <span className={`w-2 h-2 rounded-full mt-2 shrink-0 ${a.type === "emergency" ? "bg-red-400" : a.type === "motivation" ? "bg-accent" : "bg-secondary"}`} />
                    <div className="flex-1">
                      <div className="font-bn-h font-semibold text-sm">{a.title}</div>
                      <div className="text-xs text-ink-muted line-clamp-2">{a.body}</div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Today tasks */}
        <div className="md:col-span-7 glass rounded-3xl p-6">
          <h3 className="font-bn-h text-xl font-semibold mb-4 flex items-center gap-2">
            <BookOpen size={18} /> আজকের টাস্ক
          </h3>
          {todayTasks.length === 0 ? (
            <p className="text-ink-muted text-sm">কোনো বাকি টাস্ক নেই — দারুণ!</p>
          ) : (
            <ul className="space-y-2">
              {todayTasks.map((t) => (
                <li key={t.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-outline">
                  <div className="flex items-center gap-2 min-w-0">
                    {t.assigned_by && <span title={`Assigned by ${t.assigned_by}`} className="text-[10px] bg-accent/20 text-accent px-1.5 py-0.5 rounded">📌</span>}
                    <span className="font-medium truncate">{t.title}</span>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full shrink-0 ${
                    t.priority === "high" ? "bg-primary/20 text-primary" :
                    t.priority === "low" ? "bg-secondary/20 text-secondary" :
                    "bg-accent/20 text-accent"
                  }`}>{t.priority}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Badges */}
        <div className="md:col-span-5 glass rounded-3xl p-6">
          <h3 className="font-bn-h text-xl font-semibold mb-4">🏆 অর্জন</h3>
          {(!stats?.badges || stats.badges.length === 0) ? (
            <p className="text-ink-muted text-sm">পড়াশোনা চালিয়ে গেলে badges unlock হবে!</p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {stats.badges.map((b) => {
                const Icon = ICON_MAP[b.icon] || Star;
                return (
                  <div key={b.id} className="flex items-center gap-2 p-3 rounded-2xl bg-gradient-to-br from-accent/20 to-primary/10 border border-accent/30">
                    <Icon size={18} className="text-accent" />
                    <span className="font-bn-h font-medium text-xs">{b.name}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
