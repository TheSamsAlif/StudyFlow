import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { useToast } from "../lib/toast";
import { Eye, EyeOff, GraduationCap, Sparkles } from "lucide-react";

export default function Login() {
  const { login, register } = useAuth();
  const { toast } = useToast();
  const nav = useNavigate();
  const [mode, setMode] = useState("login");
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ name: "", username: "", password: "" });
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      let u;
      if (mode === "login") u = await login(form.username, form.password);
      else u = await register(form.name, form.username, form.password);
      toast(`স্বাগতম, ${u.name}!`, "success");
      nav(u.role === "admin" ? "/admin" : "/");
    } catch (err) {
      toast(err?.response?.data?.detail || "ত্রুটি ঘটেছে", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 -z-0">
        <div className="blob w-[500px] h-[500px] -top-40 -left-32" style={{ background: "#E07A5F" }} />
        <div className="blob w-[420px] h-[420px] top-1/2 -right-32" style={{ background: "#81B29A", animationDelay: "-7s" }} />
        <div className="blob w-[360px] h-[360px] bottom-0 left-1/3" style={{ background: "#F2CC8F", animationDelay: "-3s" }} />
      </div>

      <div className="relative z-10 min-h-screen grid lg:grid-cols-2">
        {/* Hero */}
        <div className="hidden lg:flex flex-col justify-between p-12 relative">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary grid place-items-center text-white shadow-lg shadow-primary/40">
              <GraduationCap size={26} />
            </div>
            <div>
              <div className="font-bn-h font-bold text-2xl">StudyFlow Pro</div>
              <div className="text-xs text-ink-muted tracking-[0.3em] uppercase">Premium Edition</div>
            </div>
          </div>

          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass text-xs text-accent mb-6">
              <Sparkles size={12} /> AI পরিচালিত পড়াশোনার অ্যাপ
            </div>
            <h1 className="font-bn-h text-5xl xl:text-6xl font-bold leading-[1.1] mb-6">
              <span className="shimmer-text">পড়াশোনাকে</span>
              <br/>
              পরিকল্পিত করো
            </h1>
            <p className="text-lg text-ink-muted max-w-md leading-relaxed">
              টাস্ক, ক্যালেন্ডার, AI সহকারী, ফ্ল্যাশকার্ড, পোমোডোরো — সব এক জায়গায়।
              অ্যাডমিন থেকে অ্যাসাইনমেন্ট ও মোটিভেশন সরাসরি পেও।
            </p>

            <div className="grid grid-cols-3 gap-4 mt-10 max-w-md">
              {[
                { v: "AI", l: "বাংলা সহকারী" },
                { v: "🔥", l: "স্ট্রিক ট্র্যাক" },
                { v: "📊", l: "অ্যানালিটিক্স" },
              ].map((s, i) => (
                <div key={i} className="glass rounded-2xl p-4 text-center">
                  <div className="text-2xl mb-1">{s.v}</div>
                  <div className="text-xs text-ink-muted">{s.l}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="text-xs text-ink-muted">© 2026 StudyFlow Pro · বাংলায় শিক্ষা</div>
        </div>

        {/* Form */}
        <div className="flex items-center justify-center p-6 lg:p-12">
          <div className="w-full max-w-md">
            <div className="lg:hidden flex items-center gap-3 mb-10">
              <div className="w-12 h-12 rounded-2xl bg-primary grid place-items-center text-white"><GraduationCap size={22} /></div>
              <div>
                <div className="font-bn-h font-bold text-xl">StudyFlow Pro</div>
                <div className="text-xs text-ink-muted">Premium Edition</div>
              </div>
            </div>

            <div className="glass rounded-3xl p-8 shadow-2xl">
              <h2 className="font-bn-h text-3xl font-bold mb-2">
                {mode === "login" ? "স্বাগতম! 👋" : "নতুন অ্যাকাউন্ট"}
              </h2>
              <p className="text-ink-muted mb-7 text-sm">
                {mode === "login" ? "তোমার ইউজারনেম ও পাসওয়ার্ড দাও" : "একটু তথ্য দিয়ে শুরু করো"}
              </p>

              <form onSubmit={submit} className="space-y-4">
                {mode === "register" && (
                  <Field label="পূর্ণ নাম">
                    <input data-testid="reg-name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="তোমার নাম" className={inp} />
                  </Field>
                )}
                <Field label="ইউজারনেম">
                  <input data-testid="auth-username" required minLength={3} value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="username" className={inp} />
                </Field>
                <Field label="পাসওয়ার্ড">
                  <div className="relative">
                    <input data-testid="auth-password" required minLength={4} type={show ? "text" : "password"} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••" className={`${inp} pr-12`} />
                    <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink">
                      {show ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </Field>

                <button data-testid="auth-submit" disabled={busy} type="submit" className="w-full bg-primary hover:bg-primary-hover text-white font-bn-h font-semibold py-3.5 rounded-2xl transition active:scale-[.98] disabled:opacity-60 shadow-lg shadow-primary/30">
                  {busy ? "অপেক্ষা করুন..." : mode === "login" ? "লগইন করো" : "নিবন্ধন করো"}
                </button>
              </form>

              <p className="text-center mt-6 text-sm text-ink-muted">
                {mode === "login" ? "নতুন এখানে?" : "অলরেডি অ্যাকাউন্ট আছে?"}{" "}
                <button data-testid="toggle-mode" onClick={() => setMode(mode === "login" ? "register" : "login")} className="text-primary font-semibold hover:underline">
                  {mode === "login" ? "নিবন্ধন করো" : "লগইন করো"}
                </button>
              </p>
            </div>

            {mode === "login" && (
              <div className="mt-6 grid grid-cols-2 gap-3 text-xs">
                <Hint label="স্টুডেন্ট ডেমো" u="student" p="student123" />
                <Hint label="অ্যাডমিন ডেমো" u="admin" p="admin123" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const inp = "w-full glass rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition border-0";
function Field({ label, children }) {
  return (
    <div>
      <label className="text-xs font-medium mb-1.5 block text-ink-muted uppercase tracking-wider">{label}</label>
      {children}
    </div>
  );
}
function Hint({ label, u, p }) {
  return (
    <div className="glass rounded-xl p-3">
      <div className="text-[10px] uppercase tracking-wider text-ink-muted mb-1">{label}</div>
      <div className="font-mono text-ink">{u} / {p}</div>
    </div>
  );
}
