import { Outlet, NavLink, useLocation, useNavigate } from "react-router-dom";
import { Home, ListChecks, Calendar as CalIcon, BookOpen, MessageCircle, FileText, Layers, Timer as TimerIcon, Heart, Settings as SetIcon, Sparkles, LogOut, Menu, X, Inbox as InboxIcon, GraduationCap } from "lucide-react";
import { useAuth } from "../lib/auth";
import { useToast } from "../lib/toast";
import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { connectWS, disconnectWS, onWSEvent } from "../lib/ws";

const tabs = [
  { to: "/", icon: Home, label: "হোম" },
  { to: "/tasks", icon: ListChecks, label: "টাস্ক" },
  { to: "/timer", icon: TimerIcon, label: "টাইমার" },
  { to: "/chat", icon: MessageCircle, label: "AI" },
  { to: "/inbox", icon: InboxIcon, label: "ইনবক্স" },
];

const sideTabs = [
  { to: "/", icon: Home, label: "ড্যাশবোর্ড" },
  { to: "/tasks", icon: ListChecks, label: "টাস্ক ম্যানেজার" },
  { to: "/calendar", icon: CalIcon, label: "ক্যালেন্ডার" },
  { to: "/subjects", icon: BookOpen, label: "বিষয়সমূহ" },
  { to: "/notes", icon: FileText, label: "নোটস" },
  { to: "/flashcards", icon: Layers, label: "ফ্ল্যাশকার্ড" },
  { to: "/timer", icon: TimerIcon, label: "ফোকাস টাইমার" },
  { to: "/habits", icon: Heart, label: "অভ্যাস ও মুড" },
  { to: "/solver", icon: Sparkles, label: "AI সমাধান" },
  { to: "/chat", icon: MessageCircle, label: "AI চ্যাট" },
  { to: "/inbox", icon: InboxIcon, label: "ইনবক্স" },
  { to: "/settings", icon: SetIcon, label: "সেটিংস" },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const nav = useNavigate();
  const loc = useLocation();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  const handleLogout = () => { disconnectWS(); logout(); nav("/login"); };

  useEffect(() => {
    const refresh = () => api.get("/messages").then(r => setUnread(r.data.filter(m => !m.read).length)).catch(() => {});
    refresh();
    const t = setInterval(refresh, 30000);
    return () => clearInterval(t);
  }, [loc.pathname]);

  // Real-time WebSocket
  useEffect(() => {
    const token = localStorage.getItem("sf_token");
    if (!token) return;
    connectWS(token);
    const off = onWSEvent((payload) => {
      const { event, data } = payload || {};
      if (event === "message") {
        const tType = data?.urgent ? "error" : "info";
        toast(data?.urgent ? `🚨 ${data.body}` : `💬 ${data.by}: ${data.body}`, tType);
        setUnread(u => u + 1);
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification(data?.urgent ? "🚨 জরুরি বার্তা" : "নতুন বার্তা", { body: data.body, tag: "msg-" + data.id });
        }
      } else if (event === "announcement") {
        const ic = data?.type === "emergency" ? "🚨" : data?.type === "motivation" ? "✨" : "📢";
        toast(`${ic} ${data.title}`, data?.type === "emergency" ? "error" : "info");
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification(`${ic} ${data.title}`, { body: data.body, tag: "ann-" + data.id });
        }
      } else if (event === "task_assigned") {
        toast(`📌 নতুন টাস্ক: ${data.title}`, "info");
      }
    });
    return () => { off(); };
  }, [toast]);

  return (
    <div className="min-h-screen flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 h-screen sticky top-0 glass border-r border-outline p-5 z-10">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-11 h-11 rounded-2xl bg-primary grid place-items-center text-white shadow-lg shadow-primary/30">
            <GraduationCap size={22} />
          </div>
          <div>
            <div className="font-bn-h font-bold text-lg leading-none">StudyFlow</div>
            <div className="text-[10px] text-ink-muted tracking-[0.3em] uppercase mt-1">PRO</div>
          </div>
        </div>
        <nav className="flex flex-col gap-1 flex-1 overflow-y-auto hide-scroll">
          {sideTabs.map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              end={t.to === "/"}
              data-testid={`nav-${t.label}`}
              className={({ isActive }) =>
                `relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? "bg-primary text-white shadow-md shadow-primary/30"
                    : "text-ink-muted hover:bg-white/5 hover:text-ink"
                }`
              }
            >
              <t.icon size={18} />
              <span className="font-bn-h">{t.label}</span>
              {t.to === "/inbox" && unread > 0 && <span className="ml-auto bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full min-w-[18px] text-center">{unread}</span>}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-outline pt-4 mt-2">
          <div className="text-[10px] uppercase tracking-wider text-ink-muted mb-1">লগইন</div>
          <div className="text-sm font-bn-h font-semibold truncate">{user?.name}</div>
          <div className="text-xs text-ink-muted">@{user?.username}</div>
          <button onClick={handleLogout} data-testid="logout-btn" className="mt-3 w-full flex items-center justify-center gap-2 text-xs text-ink-muted hover:text-primary py-2 rounded-xl glass hover:border-primary transition">
            <LogOut size={14} /> লগআউট
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 inset-x-0 z-40 glass border-b border-outline">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary grid place-items-center text-white"><GraduationCap size={16} /></div>
            <span className="font-bn-h font-bold">StudyFlow</span>
          </div>
          <button data-testid="mobile-menu-btn" onClick={() => setOpen(true)} className="p-2 rounded-lg hover:bg-white/5 relative">
            <Menu size={20} />
            {unread > 0 && <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-72 glass p-5 flex flex-col animate-fadeUp">
            <div className="flex items-center justify-between mb-6">
              <span className="font-bn-h font-bold text-lg">মেনু</span>
              <button onClick={() => setOpen(false)} className="p-2"><X size={20} /></button>
            </div>
            <nav className="flex flex-col gap-1 overflow-y-auto">
              {sideTabs.map((t) => (
                <NavLink
                  key={t.to}
                  to={t.to}
                  end={t.to === "/"}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `relative flex items-center gap-3 px-3 py-3 rounded-xl ${
                      isActive ? "bg-primary text-white" : "text-ink hover:bg-white/5"
                    }`
                  }
                >
                  <t.icon size={18} />
                  <span className="font-bn-h">{t.label}</span>
                  {t.to === "/inbox" && unread > 0 && <span className="ml-auto bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{unread}</span>}
                </NavLink>
              ))}
              <button onClick={handleLogout} className="mt-4 flex items-center gap-3 px-3 py-3 rounded-xl text-ink hover:bg-white/5">
                <LogOut size={18} /><span className="font-bn-h">লগআউট</span>
              </button>
            </nav>
          </div>
        </div>
      )}

      <main className="flex-1 pt-14 md:pt-0 pb-20 md:pb-0 min-w-0">
        <div className="max-w-6xl mx-auto p-4 md:p-8">
          <Outlet />
        </div>
      </main>

      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 glass border-t border-outline">
        <div className="grid grid-cols-5 h-16">
          {tabs.map((t) => {
            const active = loc.pathname === t.to;
            return (
              <NavLink
                key={t.to}
                to={t.to}
                data-testid={`bottom-nav-${t.label}`}
                className={`relative flex flex-col items-center justify-center gap-0.5 text-[11px] transition ${
                  active ? "text-primary" : "text-ink-muted"
                }`}
              >
                <t.icon size={20} />
                <span className="font-bn-h">{t.label}</span>
                {t.to === "/inbox" && unread > 0 && <span className="absolute top-2 right-1/4 w-2 h-2 rounded-full bg-red-500" />}
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
