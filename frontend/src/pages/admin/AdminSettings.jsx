import { useState } from "react";
import { api } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { useToast } from "../../lib/toast";
import { User, KeyRound, Sun, Moon } from "lucide-react";

export default function AdminSettings() {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState(user?.name || "");
  const [theme, setTheme] = useState(user?.theme || "dark");
  const [pw, setPw] = useState({ cur: "", n: "", c: "" });

  const save = async () => {
    const { data } = await api.patch("/auth/profile", { name, theme });
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

  const inp = "w-full glass rounded-xl px-4 py-2.5 outline-none border-0";

  return (
    <div className="space-y-6 animate-fadeUp max-w-2xl">
      <h1 className="font-bn-h text-3xl font-bold">⚙️ অ্যাডমিন সেটিংস</h1>

      <div className="glass rounded-3xl p-5 space-y-3">
        <h3 className="font-bn-h font-semibold flex items-center gap-2"><User size={18} /> প্রোফাইল</h3>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="নাম" className={inp} />
        <div className="text-xs text-ink-muted">@{user?.username} · admin</div>
      </div>

      <div className="glass rounded-3xl p-5 space-y-3">
        <h3 className="font-bn-h font-semibold flex items-center gap-2">{theme === "light" ? <Sun size={18}/> : <Moon size={18}/>} থিম</h3>
        <div className="flex gap-2">
          <button onClick={() => setTheme("dark")} className={`flex-1 py-3 rounded-2xl flex items-center justify-center gap-2 ${theme === "dark" ? "bg-primary text-white" : "glass"}`}><Moon size={16} /> ডার্ক</button>
          <button onClick={() => setTheme("light")} className={`flex-1 py-3 rounded-2xl flex items-center justify-center gap-2 ${theme === "light" ? "bg-primary text-white" : "glass"}`}><Sun size={16} /> লাইট</button>
        </div>
      </div>

      <button onClick={save} className="bg-primary hover:bg-primary-hover text-white px-6 py-3 rounded-full font-bn-h font-semibold shadow-lg shadow-primary/30">সংরক্ষণ করুন</button>

      <div className="glass rounded-3xl p-5 space-y-3">
        <h3 className="font-bn-h font-semibold flex items-center gap-2"><KeyRound size={18} /> পাসওয়ার্ড পরিবর্তন</h3>
        <input type="password" placeholder="বর্তমান পাসওয়ার্ড" value={pw.cur} onChange={e => setPw({ ...pw, cur: e.target.value })} className={inp} />
        <input type="password" placeholder="নতুন পাসওয়ার্ড" value={pw.n} onChange={e => setPw({ ...pw, n: e.target.value })} className={inp} />
        <input type="password" placeholder="নতুন পাসওয়ার্ড আবার" value={pw.c} onChange={e => setPw({ ...pw, c: e.target.value })} className={inp} />
        <button onClick={changePw} className="bg-secondary hover:bg-secondary-hover text-white px-5 py-2.5 rounded-full font-bn-h">পরিবর্তন করুন</button>
      </div>
    </div>
  );
}
