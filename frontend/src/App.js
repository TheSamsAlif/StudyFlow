import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { AuthProvider, useAuth } from "./lib/auth";
import { ToastProvider } from "./lib/toast";
import Login from "./pages/Login";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Tasks from "./pages/Tasks";
import Calendar from "./pages/Calendar";
import Subjects from "./pages/Subjects";
import Chat from "./pages/Chat";
import Notes from "./pages/Notes";
import Flashcards from "./pages/Flashcards";
import Timer from "./pages/Timer";
import Habits from "./pages/Habits";
import Settings from "./pages/Settings";
import Solver from "./pages/Solver";
import Inbox from "./pages/Inbox";
import AdminLayout from "./components/AdminLayout";
import AdminOverview from "./pages/admin/Overview";
import AdminStudents from "./pages/admin/Students";
import AdminStudentDetail from "./pages/admin/StudentDetail";
import AdminAnnounce from "./pages/admin/Announcements";
import AdminSettings from "./pages/admin/AdminSettings";

function Protected({ children, role }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen grid place-items-center text-ink-muted">লোড হচ্ছে...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to={user.role === "admin" ? "/admin" : "/"} replace />;
  return children;
}

function ThemeApplier() {
  const { user } = useAuth();
  useEffect(() => {
    const t = user?.theme === "light" ? "light" : "dark";
    document.documentElement.classList.toggle("light", t === "light");
  }, [user]);
  return null;
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <ThemeApplier />
        <div className="app-bg" />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route element={<Protected><Layout /></Protected>}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/tasks" element={<Tasks />} />
              <Route path="/calendar" element={<Calendar />} />
              <Route path="/subjects" element={<Subjects />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/notes" element={<Notes />} />
              <Route path="/flashcards" element={<Flashcards />} />
              <Route path="/timer" element={<Timer />} />
              <Route path="/habits" element={<Habits />} />
              <Route path="/solver" element={<Solver />} />
              <Route path="/inbox" element={<Inbox />} />
              <Route path="/settings" element={<Settings />} />
            </Route>

            <Route element={<Protected role="admin"><AdminLayout /></Protected>}>
              <Route path="/admin" element={<AdminOverview />} />
              <Route path="/admin/students" element={<AdminStudents />} />
              <Route path="/admin/students/:id" element={<AdminStudentDetail />} />
              <Route path="/admin/announce" element={<AdminAnnounce />} />
              <Route path="/admin/settings" element={<AdminSettings />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
