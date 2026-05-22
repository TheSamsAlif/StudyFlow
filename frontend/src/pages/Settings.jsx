import { useState } from "react";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import { useToast } from "../lib/toast";
import { Bell, Download, User, Target, KeyRound, Sun, Moon } from "lucide-react";

export default function Settings() {
  const { user, updateUser, logout } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState(user?.name || "");
  const [goal, setGoal] = useState(user?.daily_goal_minutes || 120);
  const [theme, setTheme] = useState(user?.theme || "dark");
  const [pw, setPw] = useState({ cur: "", n: "", c: "" });

  const save = async () => {
    const { data } = await api.patch("/auth/profile", { name, daily_goal_minutes: +goal, theme });
    updateUser(data);
    document.documentElement.classList.toggle("light", theme === "light");
    toast("সংরক্ষিত", "success");
  };

  const changePw = async () => {
    if (pw.n.length < 4) return toast("নতুন পাসওয়ার্ড অন্তত ৪ অক্ষর", "error");
    if (pw.n !== pw.c) return toast("পাসওয়ার্ড মিলছে না", "error");
    try {
      await api.post("/auth/change-password", { current_password: pw.cur, new_password: pw.n });
      toast("পাসওয়ার্ড পরিবর্তন হয়েছে", "success");
      setPw({ cur: "", n: "", c: "" });
    } catch (e) {
      toast(e?.response?.data?.detail || "ত্রুটি", "error");
    }
  };

  const enableNotif = async () => {
    if (!("Notification" in window)) return toast("সাপোর্টেড নয়", "error");
    const p = await Notification.requestPermission();
    toast(p === "granted" ? "নোটিফিকেশন চালু!" : "অনুমতি নেই", p === "granted" ? "success" : "error");
  };

  const exportData = async () => {
    const [tasks, notes, cards, sessions, habits, moods] = await Promise.all([
      api.get("/tasks"), api.get("/notes"), api.get("/flashcards"),
      api.get("/sessions"), api.get("/habits"), api.get("/mood"),
    ]);
    const data = { tasks: tasks.data, notes: notes.data, flashcards: cards.data, sessions: sessions.data, habits: habits.data, moods: moods.data, exported_at: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `studyflow-${Date.now()}.json`; a.click();
    URL.revokeObjectURL(url);
    toast("ডাটা ডাউনলোড হয়েছে", "success");
  };

  const inp = "w-full glass border border-outline rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary";

  return (
    <div className="space-y-6 animate-fadeUp max-w-2xl">
      <h1 className="font-bn-h text-3xl font-bold">⚙️ সেটিংস</h1>

      <Card title="প্রোফাইল" icon={User}>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="নাম" className={inp} />
        <div className="text-xs text-ink-muted">@{user?.username}</div>
      </Card>

      <Card title="দৈনিক লক্ষ্য" icon={Target}>
        <div className="flex items-center gap-2">
          <input type="number" min={15} max={720} value={goal} onChange={e => setGoal(e.target.value)} className="w-32 glass rounded-xl px-4 py-2.5 outline-none border-0" />
          <span className="text-ink-muted">মিনিট/দিন</span>
        </div>
      </Card>

      <Card title="থিম" icon={theme === "light" ? Sun : Moon}>
        <div className="flex gap-2">
          <button onClick={() => setTheme("dark")} className={`flex-1 py-3 rounded-2xl flex items-center justify-center gap-2 ${theme === "dark" ? "bg-primary text-white" : "glass"}`}>
            <Moon size={16} /> ডার্ক
          </button>
          <button onClick={() => setTheme("light")} className={`flex-1 py-3 rounded-2xl flex items-center justify-center gap-2 ${theme === "light" ? "bg-primary text-white" : "glass"}`}>
            <Sun size={16} /> লাইট
          </button>
        </div>
      </Card>

      <button onClick={save} data-testid="save-settings" className="bg-primary hover:bg-primary-hover text-white px-6 py-3 rounded-full font-bn-h font-semibold shadow-lg shadow-primary/30">সংরক্ষণ করুন</button>

      <Card title="পাসওয়ার্ড পরিবর্তন" icon={KeyRound}>
        <input type="password" placeholder="বর্তমান পাসওয়ার্ড" value={pw.cur} onChange={e => setPw({ ...pw, cur: e.target.value })} className={inp} />
        <input type="password" placeholder="নতুন পাসওয়ার্ড" value={pw.n} onChange={e => setPw({ ...pw, n: e.target.value })} className={inp} />
        <input type="password" placeholder="নতুন পাসওয়ার্ড আবার লিখুন" value={pw.c} onChange={e => setPw({ ...pw, c: e.target.value })} className={inp} />
        <button onClick={changePw} data-testid="change-pw" className="bg-secondary hover:bg-secondary-hover text-white px-5 py-2.5 rounded-full font-bn-h">পরিবর্তন করুন</button>
      </Card>

      <Card title="নোটিফিকেশন" icon={Bell}>
        <p className="text-sm text-ink-muted">টাইমার শেষ হলে browser notification পেতে অনুমতি দিন।</p>
        <button onClick={enableNotif} className="bg-accent hover:opacity-90 text-accent-fg px-5 py-2.5 rounded-full font-bn-h font-semibold">অনুমতি দিন</button>
      </Card>

      <Card title="ডাটা এক্সপোর্ট" icon={Download}>
        <p className="text-sm text-ink-muted">আপনার সব ডাটা JSON ফাইল হিসেবে ডাউনলোড করুন।</p>
        <button onClick={exportData} className="glass hover:border-primary px-5 py-2.5 rounded-full font-bn-h">JSON ডাউনলোড</button>
      </Card>
    </div>
  );
}

function Card({ title, icon: Icon, children }) {
  return (
    <div className="glass rounded-3xl p-5 space-y-3">
      <h3 className="font-bn-h font-semibold flex items-center gap-2"><Icon size={18} /> {title}</h3>
      {children}
    </div>
  );
}
