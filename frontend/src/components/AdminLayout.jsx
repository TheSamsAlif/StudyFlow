import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { LayoutDashboard, Users, Megaphone, Settings, LogOut, Shield } from "lucide-react";

const tabs = [
  { to: "/admin", icon: LayoutDashboard, label: "ওভারভিউ", end: true },
  { to: "/admin/students", icon: Users, label: "শিক্ষার্থীগণ" },
  { to: "/admin/announce", icon: Megaphone, label: "ঘোষণা" },
  { to: "/admin/settings", icon: Settings, label: "সেটিংস" },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const handleLogout = () => { logout(); nav("/login"); };
  return (
    <div className="min-h-screen flex">
      <aside className="hidden md:flex flex-col w-64 h-screen sticky top-0 glass border-r border-outline p-5 z-10">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary to-accent grid place-items-center text-white shadow-lg shadow-primary/40">
            <Shield size={22} />
          </div>
          <div>
            <div className="font-bn-h font-bold text-lg leading-none">অ্যাডমিন</div>
            <div className="text-[10px] text-accent tracking-[0.3em] uppercase mt-1">CONTROL</div>
          </div>
        </div>
        <nav className="flex flex-col gap-1 flex-1">
          {tabs.map(t => (
            <NavLink key={t.to} to={t.to} end={t.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive ? "bg-primary text-white shadow-md shadow-primary/30" : "text-ink-muted hover:bg-white/5 hover:text-ink"
                }`}>
              <t.icon size={18} />
              <span className="font-bn-h">{t.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-outline pt-4">
          <div className="text-[10px] uppercase tracking-wider text-ink-muted mb-1">লগইন</div>
          <div className="text-sm font-bn-h font-semibold">{user?.name}</div>
          <div className="text-xs text-accent">@{user?.username} · admin</div>
          <button onClick={handleLogout} className="mt-3 w-full flex items-center justify-center gap-2 text-xs text-ink-muted hover:text-primary py-2 rounded-xl glass">
            <LogOut size={14} /> লগআউট
          </button>
        </div>
      </aside>

      {/* Mobile bar */}
      <div className="md:hidden fixed top-0 inset-x-0 z-40 glass border-b border-outline">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-accent grid place-items-center text-white"><Shield size={16} /></div>
            <span className="font-bn-h font-bold">অ্যাডমিন</span>
          </div>
          <button onClick={handleLogout} className="text-xs text-ink-muted flex items-center gap-1"><LogOut size={14} /> লগআউট</button>
        </div>
      </div>

      <main className="flex-1 pt-14 md:pt-0 pb-20 md:pb-0 min-w-0">
        <div className="max-w-6xl mx-auto p-4 md:p-8">
          <Outlet />
        </div>
      </main>

      {/* Mobile bottom */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 glass border-t border-outline">
        <div className="grid grid-cols-4 h-16">
          {tabs.map(t => (
            <NavLink key={t.to} to={t.to} end={t.end}
              className={({ isActive }) => `flex flex-col items-center justify-center gap-0.5 text-[11px] ${isActive ? "text-primary" : "text-ink-muted"}`}>
              <t.icon size={20} />
              <span className="font-bn-h">{t.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
