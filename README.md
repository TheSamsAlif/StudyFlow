# StudyFlow Pro 🎓

> **A premium Bengali student study app with AI assistance, admin panel, and real-time notifications.**

**Author:** SAMS ALIF
**Version:** 1.0.0
**License:** MIT
**Year:** 2026

---

## 🌟 Features

### Student Panel
- 🎨 **Dark gorgeous UI** with animated gradient background, glassmorphism cards
- 🕐 **Colorful 12-hour digital watch** (rainbow gradient, AM/PM)
- 📊 **Dashboard** — streak, XP, daily progress, week trend chart, motivational quotes
- ✅ **Task Manager** — CRUD with priority/deadline/subject filters; admin-assigned tasks marked
- 🗓️ **Calendar** — Monthly view with task indicators
- 📚 **Subjects** management with color tags
- 📝 **Notes** with **AI Summarize** button (Bengali, GPT-5.1)
- 🃏 **Flashcards** — Manual + AI-generate from text + 3D flip study mode
- ⏱️ **Pomodoro Timer** with 7-day analytics + browser notifications
- 🤖 **AI Chat** — Bengali StudyFlow AI (multi-turn memory)
- ✨ **AI Solver** — Image/PDF upload → AI step-by-step solution
- 💗 **Habits & Mood** log
- 📬 **Inbox** — Direct messages from admin (urgent badge) + announcements feed
- ⚙️ **Settings** — Profile, daily goal, theme (dark/light), change password, JSON export

### Admin Panel
- 📊 **Overview** with student leaderboard
- 👥 **Students** searchable list (streak, XP, total minutes)
- 🔍 **Student Detail** — stats + week chart + tasks + assign task + send direct message (with 🚨 urgent option)
- 📢 **Announcements** — Send motivation/announcement/emergency to all or selected students
- ⚙️ **Settings** with change password

### Real-Time
- ⚡ **WebSocket push** — Admin → Student instant notifications (toast + browser notification + inbox badge)

---

## 🛠️ Tech Stack

### Backend
- **FastAPI** (Python 3.11+) — async REST + WebSocket
- **Motor** (async MongoDB driver)
- **PyJWT + bcrypt** — secure JWT auth
- **emergentintegrations** — Universal LLM key (GPT-5.1)
- **pypdf** — PDF text extraction

### Frontend
- **React 18** + React Router 6
- **Tailwind CSS** — Custom Organic & Earthy dark theme
- **Recharts** — analytics
- **Framer Motion** — animations
- **Lucide React** — icons
- **Axios** + WebSocket client

### Database
- **MongoDB** (collections: users, tasks, subjects, notes, flashcards, sessions, habits, habit_logs, moods, chat_messages, announcements, messages)

---

## 🚀 Quick Start

### 1. Clone & Install Dependencies

```bash
# Backend
cd backend
pip install -r requirements.txt
pip install emergentintegrations --extra-index-url https://d33sy5i8bnduwe.cloudfront.net/simple/

# Frontend
cd ../frontend
yarn install
```

### 2. Environment Variables

**`backend/.env`**
```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=studyflow_db
EMERGENT_LLM_KEY=sk-emergent-xxxxxxxx
JWT_SECRET=your-super-secret-key-change-this
JWT_ALGORITHM=HS256
JWT_EXPIRE_DAYS=30
```

**`frontend/.env`**
```env
REACT_APP_BACKEND_URL=https://your-domain.com
WDS_SOCKET_PORT=443
```

### 3. Run

```bash
# Start MongoDB locally
mongod --dbpath /path/to/data

# Backend
cd backend && uvicorn server:app --host 0.0.0.0 --port 8001 --reload

# Frontend
cd frontend && yarn start
```

Open http://localhost:3000

### 4. Demo Accounts (auto-seeded)

| Role    | Username | Password    |
|---------|----------|-------------|
| Admin   | admin    | admin123    |
| Student | student  | student123  |

---

## 📁 Project Structure

```
studyflow-pro/
├── backend/
│   ├── server.py              # All FastAPI routes + WebSocket
│   ├── requirements.txt
│   └── .env
├── frontend/
│   ├── public/index.html
│   ├── src/
│   │   ├── App.js
│   │   ├── index.js
│   │   ├── index.css
│   │   ├── lib/
│   │   │   ├── api.js         # Axios instance
│   │   │   ├── auth.jsx       # AuthProvider
│   │   │   ├── toast.jsx      # ToastProvider
│   │   │   └── ws.js          # WebSocket helper
│   │   ├── components/
│   │   │   ├── Layout.jsx     # Student layout (sidebar + bottom nav)
│   │   │   ├── AdminLayout.jsx
│   │   │   └── ColorClock.jsx
│   │   └── pages/
│   │       ├── Login.jsx
│   │       ├── Dashboard.jsx
│   │       ├── Tasks.jsx
│   │       ├── Calendar.jsx
│   │       ├── Subjects.jsx
│   │       ├── Notes.jsx
│   │       ├── Flashcards.jsx
│   │       ├── Timer.jsx
│   │       ├── Chat.jsx
│   │       ├── Solver.jsx
│   │       ├── Habits.jsx
│   │       ├── Inbox.jsx
│   │       ├── Settings.jsx
│   │       └── admin/
│   │           ├── Overview.jsx
│   │           ├── Students.jsx
│   │           ├── StudentDetail.jsx
│   │           ├── Announcements.jsx
│   │           └── AdminSettings.jsx
│   ├── package.json
│   └── tailwind.config.js
├── README.md
└── memory/
    ├── PRD.md
    └── test_credentials.md
```

---

## 🔐 API Reference (key endpoints)

### Auth
- `POST /api/auth/register` — `{name, username, password}`
- `POST /api/auth/login` — `{username, password}` → `{token, user}`
- `GET /api/auth/me` — current user
- `PATCH /api/auth/profile` — update profile
- `POST /api/auth/change-password` — `{current_password, new_password}`

### Student
- `GET/POST/PATCH/DELETE /api/tasks`
- `GET/POST/DELETE /api/subjects`
- `GET/POST/PATCH/DELETE /api/notes`
- `GET/POST/DELETE /api/flashcards` + `POST /api/flashcards/{id}/review?correct=true`
- `GET/POST /api/sessions` (Pomodoro)
- `GET/POST/DELETE /api/habits` + `POST /api/habits/log`
- `GET/POST /api/mood`
- `GET /api/stats` — streak/xp/progress/week_data/badges
- `POST /api/chat` — Bengali AI chat
- `POST /api/ai/summarize` — note summarize
- `POST /api/ai/generate-flashcards` — auto-generate cards
- `POST /api/ai/solve-image` — image/PDF question solver
- `GET /api/announcements`, `GET /api/messages`, `POST /api/messages/{id}/read`

### Admin (require role=admin)
- `GET /api/admin/overview`
- `GET /api/admin/students`, `/api/admin/students/{id}`
- `POST /api/admin/assign-task` — `{student_ids[], title, ...}`
- `POST /api/admin/announce` — `{title, body, type, target_ids?}`
- `POST /api/admin/message` — `{student_id, body, urgent}`
- `GET /api/admin/announcements`, `DELETE /api/admin/announcements/{id}`
- `GET /api/admin/messages/{sid}`

### Real-time
- `WS /api/ws?token={JWT}` — receives `{event:"message"|"announcement"|"task_assigned"|"connected", data:{...}}`

---

## 🤝 Credits

**Created by:** SAMS ALIF
**Built with:** ❤️ on Emergent platform
**AI:** Emergent Universal LLM Key (GPT-5.1, Claude, Gemini)

---

## 📜 License

MIT License © 2026 SAMS ALIF
