# StudyFlow Pro - PRD

## Original Problem Statement
User had an existing single-HTML student app called **StudyFlow Pro** (Bengali, localStorage-based). Asked to:
- Read existing files and add better features
- Convert to **full-stack React + FastAPI + MongoDB** (cloud sync, multi-device)
- Add ALL suggested features (best mix decided by agent)
- Upgrade AI to **Emergent Universal LLM Key**
- Add **Admin panel** (monitor students, assign tasks, send motivation/announcements/emergency direct messages)
- **Username + password login** (no email — easy login)
- **Dark gorgeous UI** with animated background, glassmorphism on both sides
- **Colorful 12-hour digital watch** on student dashboard
- **Change password** option in both panels; registration must work

## Architecture
- **Backend**: FastAPI + Motor (async MongoDB), JWT auth (PyJWT + bcrypt), Emergent LLM via `emergentintegrations` library (GPT-5.1)
- **Frontend**: React 18 + React Router + Tailwind + Framer Motion + Recharts + Lucide
- **Theme**: "Organic & Earthy Premium Dark" — Terracotta (#E07A5F), Sage (#81B29A), Sand (#F2CC8F) on deep navy (#0B0F1A) background; Bengali fonts (Hind Siliguri + Noto Sans Bengali)
- **Roles**: `student` (default), `admin` (seeded)
- **Routes**: `/login`, `/` (student), `/admin/*` (admin)

## User Personas
- **Student** — Bengali-speaking learner who needs personalized study planning, AI tutor, focus tracking, gamification
- **Admin** — Teacher/parent who monitors students, assigns work, sends motivation/emergency messages

## Core Requirements (Static)
1. Username/password auth (admin: `admin/admin123`, student: `student/student123` seeded)
2. Role-based routing
3. Dark + Light theme toggle
4. Bengali UI throughout
5. Mobile-first responsive (bottom nav on mobile, sidebar on desktop)

## What's Been Implemented (May 2026)
### Authentication
- Username + password login/register (JWT)
- Auto seed of admin & student demo accounts on backend startup
- Change password endpoint + UI in both Settings pages
- Profile update (name, daily goal, theme)

### Student Panel
- **Dashboard** — Colorful animated 12-hour digital clock, streak, XP, daily progress %, week trend chart, motivational quote, today tasks, achievements badges, urgent message banner, announcements feed
- **Tasks** — CRUD with priority/deadline/subject filter; admin-assigned tasks marked with pin icon
- **Calendar** — Month view with task indicators
- **Subjects** — CRUD with color tags
- **Notes** — CRUD + AI summarize button (Bengali)
- **Flashcards** — Manual create + AI-generate from text + 3D flip study mode + review tracking
- **Pomodoro Timer** — Focus/short/long modes + 7-day BarChart analytics + browser notifications
- **AI Chat** — Bengali StudyFlow AI (GPT-5.1) with multi-turn memory + history
- **AI Solver** — Image/PDF upload → AI step-by-step solution
- **Habits & Mood** — Daily habits with toggle + emoji mood log
- **Inbox** — Direct messages from admin (urgent badge) + announcements
- **Settings** — Profile, daily goal, theme, change password, notifications, JSON export

### Admin Panel
- **Overview** — Stats (students/tasks/sessions), top students leaderboard
- **Students** — Searchable list with streak/XP/total minutes
- **Student Detail** — Stats + week chart + tasks + assign new task + send direct message (urgent option)
- **Announcements** — Send motivation/announcement/emergency to all or selected students
- **Settings** — Profile, theme, change password

### Backend Endpoints
Auth: register, login, me, profile, change-password
CRUD: tasks, subjects, notes, flashcards, sessions, habits, habits/log, mood
AI: chat, chat/history, ai/summarize, ai/generate-flashcards, ai/solve-image
Stats: stats (streak/xp/progress/week/badges)
Inbox: announcements, messages, messages/{id}/read
Admin: overview, students, students/{id}, assign-task, announce, announcements (CRUD), message, messages/{sid}
**Real-time**: `WS /api/ws?token=` — pushes `{event:"message"|"announcement"|"task_assigned", data:{...}}` instantly when admin acts

## Test Status
**Backend: 100% (32/32 tests passed)** — auth, all CRUD, AI integration, admin endpoints
**Frontend: ColorClock fix verified visually** — login + dashboard + admin panels rendering correctly
**WebSocket Real-time: Verified** — student receives announcement/message/task push instantly; toast + browser notification + inbox badge auto-update; auto-reconnect on disconnect

## Backlog / Future
### P1
- Real-time notifications via WebSocket (admin → student instant push)
- Student-to-student leaderboard & friends
- Calendar drag-and-drop task scheduling
- Push notifications (PWA)
### P2
- Voice-to-text note taking + AI explain
- Subject-wise analytics deep dive
- Bulk import questions for AI quiz
- Multi-language support (English toggle)

## Next Action Items
- Optional: Fine-tune mobile layouts, add onboarding tour for first-time users
- Optional: Add export to CSV for admin reports
