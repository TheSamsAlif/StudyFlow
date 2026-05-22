"""StudyFlow Pro - Full Stack Backend
Author: SAMS ALIF
License: MIT (c) 2026
"""
import os
import uuid
import base64
import io
from datetime import datetime, timezone, timedelta
from typing import Optional, List

from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Form, WebSocket, WebSocketDisconnect, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import jwt
import bcrypt

load_dotenv()

MONGO_URL = os.environ.get("MONGO_URL")
DB_NAME = os.environ.get("DB_NAME", "studyflow_db")
JWT_SECRET = os.environ.get("JWT_SECRET", "fallback-secret")
JWT_ALG = os.environ.get("JWT_ALGORITHM", "HS256")
JWT_EXPIRE_DAYS = int(os.environ.get("JWT_EXPIRE_DAYS", "30"))
EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY")

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

app = FastAPI(title="StudyFlow Pro API")
app.add_middleware(
    CORSMiddleware, allow_origins=["*"], allow_credentials=True,
    allow_methods=["*"], allow_headers=["*"],
)

bearer = HTTPBearer(auto_error=False)

# ---------- WebSocket connection manager ----------
class WSManager:
    def __init__(self):
        self.connections: dict[str, list[WebSocket]] = {}

    async def connect(self, user_id: str, ws: WebSocket):
        await ws.accept()
        self.connections.setdefault(user_id, []).append(ws)

    def disconnect(self, user_id: str, ws: WebSocket):
        conns = self.connections.get(user_id, [])
        if ws in conns:
            conns.remove(ws)
        if not conns:
            self.connections.pop(user_id, None)

    async def send_to(self, user_id: str, data: dict):
        for ws in list(self.connections.get(user_id, [])):
            try:
                await ws.send_json(data)
            except Exception:
                self.disconnect(user_id, ws)

    async def broadcast_students(self, data: dict):
        cur = db.users.find({"role": "student"}, {"id": 1})
        async for u in cur:
            await self.send_to(u["id"], data)

ws_mgr = WSManager()

def now_utc(): return datetime.now(timezone.utc)
def make_id(): return str(uuid.uuid4())
def hash_password(pw): return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()
def verify_password(pw, hashed):
    try: return bcrypt.checkpw(pw.encode(), hashed.encode())
    except: return False

def make_token(user_id):
    return jwt.encode({"sub": user_id, "exp": now_utc()+timedelta(days=JWT_EXPIRE_DAYS), "iat": now_utc()}, JWT_SECRET, algorithm=JWT_ALG)

async def get_current_user(creds: HTTPAuthorizationCredentials = Depends(bearer)):
    if not creds: raise HTTPException(401, "Not authenticated")
    try:
        payload = jwt.decode(creds.credentials, JWT_SECRET, algorithms=[JWT_ALG])
        user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0, "password": 0})
        if not user: raise HTTPException(401, "User not found")
        return user
    except HTTPException: raise
    except Exception:
        raise HTTPException(401, "Invalid token")

async def require_admin(user=Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(403, "Admin access required")
    return user

@app.on_event("startup")
async def seed():
    # seed admin if missing
    if not await db.users.find_one({"username": "admin"}):
        await db.users.insert_one({
            "id": make_id(), "username": "admin", "name": "অ্যাডমিন",
            "password": hash_password("admin123"), "role": "admin",
            "daily_goal_minutes": 120, "theme": "dark", "streak": 0,
            "xp": 0, "last_active": None, "created_at": now_utc().isoformat(),
        })
    if not await db.users.find_one({"username": "student"}):
        await db.users.insert_one({
            "id": make_id(), "username": "student", "name": "শিক্ষার্থী",
            "password": hash_password("student123"), "role": "student",
            "daily_goal_minutes": 120, "theme": "dark", "streak": 0,
            "xp": 0, "last_active": None, "created_at": now_utc().isoformat(),
        })

# ---------- Models ----------
class RegisterReq(BaseModel):
    name: str
    username: str = Field(min_length=3, max_length=30)
    password: str = Field(min_length=4)

class LoginReq(BaseModel):
    username: str
    password: str

class UpdateProfileReq(BaseModel):
    name: Optional[str] = None
    daily_goal_minutes: Optional[int] = None
    theme: Optional[str] = None

class ChangePasswordReq(BaseModel):
    current_password: str
    new_password: str = Field(min_length=4)

class TaskReq(BaseModel):
    title: str
    subject: Optional[str] = None
    priority: str = "medium"
    deadline: Optional[str] = None
    notes: Optional[str] = None

class TaskUpdateReq(BaseModel):
    title: Optional[str] = None
    subject: Optional[str] = None
    priority: Optional[str] = None
    deadline: Optional[str] = None
    notes: Optional[str] = None
    completed: Optional[bool] = None

class SubjectReq(BaseModel):
    name: str
    color: Optional[str] = "#E07A5F"

class NoteReq(BaseModel):
    title: str
    content: str
    subject: Optional[str] = None

class FlashcardReq(BaseModel):
    question: str
    answer: str
    subject: Optional[str] = None
    deck: Optional[str] = "Default"

class SessionReq(BaseModel):
    duration_minutes: int
    subject: Optional[str] = None
    type: str = "pomodoro"

class HabitReq(BaseModel):
    name: str
    icon: Optional[str] = "Target"

class HabitLogReq(BaseModel):
    habit_id: str
    date: str

class MoodLogReq(BaseModel):
    mood: str
    note: Optional[str] = None
    date: Optional[str] = None

class ChatReq(BaseModel):
    message: str
    session_id: Optional[str] = None

class SummarizeReq(BaseModel):
    text: str

class GenFlashcardReq(BaseModel):
    text: str
    count: int = 5
    subject: Optional[str] = None
    deck: Optional[str] = "Generated"

class AssignTaskReq(BaseModel):
    student_ids: List[str]  # if empty, broadcast to all students
    title: str
    subject: Optional[str] = None
    priority: str = "medium"
    deadline: Optional[str] = None
    notes: Optional[str] = None

class AnnounceReq(BaseModel):
    title: str
    body: str
    type: str = "motivation"  # motivation | announcement | emergency
    target_ids: Optional[List[str]] = None  # None = all students

class DirectMsgReq(BaseModel):
    student_id: str
    body: str
    urgent: bool = False

# ---------- Auth ----------
@app.post("/api/auth/register")
async def register(req: RegisterReq):
    uname = req.username.lower().strip()
    if await db.users.find_one({"username": uname}):
        raise HTTPException(400, "এই ইউজারনেম ইতিমধ্যে আছে")
    user_id = make_id()
    doc = {
        "id": user_id, "username": uname, "name": req.name,
        "password": hash_password(req.password), "role": "student",
        "daily_goal_minutes": 120, "theme": "dark", "streak": 0,
        "xp": 0, "last_active": None, "created_at": now_utc().isoformat(),
    }
    await db.users.insert_one(doc)
    token = make_token(user_id)
    return {"token": token, "user": {k: v for k, v in doc.items() if k not in ("password", "_id")}}

@app.post("/api/auth/login")
async def login(req: LoginReq):
    user = await db.users.find_one({"username": req.username.lower().strip()})
    if not user or not verify_password(req.password, user["password"]):
        raise HTTPException(401, "ইউজারনেম বা পাসওয়ার্ড ভুল")
    token = make_token(user["id"])
    out = {k: v for k, v in user.items() if k not in ("password", "_id")}
    return {"token": token, "user": out}

@app.get("/api/auth/me")
async def me(user=Depends(get_current_user)): return user

@app.patch("/api/auth/profile")
async def update_profile(req: UpdateProfileReq, user=Depends(get_current_user)):
    update = {k: v for k, v in req.model_dump().items() if v is not None}
    if update: await db.users.update_one({"id": user["id"]}, {"$set": update})
    return await db.users.find_one({"id": user["id"]}, {"_id": 0, "password": 0})

@app.post("/api/auth/change-password")
async def change_password(req: ChangePasswordReq, user=Depends(get_current_user)):
    full = await db.users.find_one({"id": user["id"]})
    if not verify_password(req.current_password, full["password"]):
        raise HTTPException(400, "বর্তমান পাসওয়ার্ড ভুল")
    await db.users.update_one({"id": user["id"]}, {"$set": {"password": hash_password(req.new_password)}})
    return {"ok": True}

# ---------- Tasks ----------
@app.get("/api/tasks")
async def list_tasks(user=Depends(get_current_user)):
    return await db.tasks.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(2000)

@app.post("/api/tasks")
async def create_task(req: TaskReq, user=Depends(get_current_user)):
    doc = {"id": make_id(), "user_id": user["id"], **req.model_dump(),
           "completed": False, "assigned_by": None,
           "created_at": now_utc().isoformat(), "completed_at": None}
    await db.tasks.insert_one(doc)
    return {k: v for k, v in doc.items() if k != "_id"}

@app.patch("/api/tasks/{tid}")
async def update_task(tid: str, req: TaskUpdateReq, user=Depends(get_current_user)):
    update = {k: v for k, v in req.model_dump().items() if v is not None}
    if update.get("completed"):
        update["completed_at"] = now_utc().isoformat()
        await db.users.update_one({"id": user["id"]}, {"$inc": {"xp": 10}})
    elif update.get("completed") is False:
        update["completed_at"] = None
    res = await db.tasks.update_one({"id": tid, "user_id": user["id"]}, {"$set": update})
    if res.matched_count == 0: raise HTTPException(404, "Not found")
    return await db.tasks.find_one({"id": tid}, {"_id": 0})

@app.delete("/api/tasks/{tid}")
async def delete_task(tid: str, user=Depends(get_current_user)):
    await db.tasks.delete_one({"id": tid, "user_id": user["id"]})
    return {"ok": True}

# ---------- Subjects ----------
@app.get("/api/subjects")
async def list_subjects(user=Depends(get_current_user)):
    return await db.subjects.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(200)

@app.post("/api/subjects")
async def create_subject(req: SubjectReq, user=Depends(get_current_user)):
    doc = {"id": make_id(), "user_id": user["id"], **req.model_dump(), "created_at": now_utc().isoformat()}
    await db.subjects.insert_one(doc)
    return {k: v for k, v in doc.items() if k != "_id"}

@app.delete("/api/subjects/{sid}")
async def delete_subject(sid: str, user=Depends(get_current_user)):
    await db.subjects.delete_one({"id": sid, "user_id": user["id"]})
    return {"ok": True}

# ---------- Notes ----------
@app.get("/api/notes")
async def list_notes(user=Depends(get_current_user)):
    return await db.notes.find({"user_id": user["id"]}, {"_id": 0}).sort("updated_at", -1).to_list(500)

@app.post("/api/notes")
async def create_note(req: NoteReq, user=Depends(get_current_user)):
    doc = {"id": make_id(), "user_id": user["id"], **req.model_dump(),
           "summary": None, "created_at": now_utc().isoformat(), "updated_at": now_utc().isoformat()}
    await db.notes.insert_one(doc)
    return {k: v for k, v in doc.items() if k != "_id"}

@app.patch("/api/notes/{nid}")
async def update_note(nid: str, req: NoteReq, user=Depends(get_current_user)):
    await db.notes.update_one({"id": nid, "user_id": user["id"]}, {"$set": {**req.model_dump(), "updated_at": now_utc().isoformat()}})
    return await db.notes.find_one({"id": nid}, {"_id": 0})

@app.delete("/api/notes/{nid}")
async def delete_note(nid: str, user=Depends(get_current_user)):
    await db.notes.delete_one({"id": nid, "user_id": user["id"]})
    return {"ok": True}

# ---------- Flashcards ----------
@app.get("/api/flashcards")
async def list_flashcards(user=Depends(get_current_user)):
    return await db.flashcards.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(2000)

@app.post("/api/flashcards")
async def create_flashcard(req: FlashcardReq, user=Depends(get_current_user)):
    doc = {"id": make_id(), "user_id": user["id"], **req.model_dump(),
           "review_count": 0, "correct_count": 0, "created_at": now_utc().isoformat()}
    await db.flashcards.insert_one(doc)
    return {k: v for k, v in doc.items() if k != "_id"}

@app.delete("/api/flashcards/{fid}")
async def delete_flashcard(fid: str, user=Depends(get_current_user)):
    await db.flashcards.delete_one({"id": fid, "user_id": user["id"]})
    return {"ok": True}

@app.post("/api/flashcards/{fid}/review")
async def review_flashcard(fid: str, correct: bool, user=Depends(get_current_user)):
    inc = {"review_count": 1}
    if correct: inc["correct_count"] = 1
    await db.flashcards.update_one({"id": fid, "user_id": user["id"]}, {"$inc": inc})
    return {"ok": True}

# ---------- Sessions ----------
@app.get("/api/sessions")
async def list_sessions(user=Depends(get_current_user)):
    return await db.sessions.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(500)

@app.post("/api/sessions")
async def create_session(req: SessionReq, user=Depends(get_current_user)):
    today = now_utc().date().isoformat()
    doc = {"id": make_id(), "user_id": user["id"], **req.model_dump(),
           "date": today, "created_at": now_utc().isoformat()}
    await db.sessions.insert_one(doc)
    if req.type == "pomodoro":
        await _update_streak(user["id"])
        await db.users.update_one({"id": user["id"]}, {"$inc": {"xp": req.duration_minutes}})
    return {k: v for k, v in doc.items() if k != "_id"}

async def _update_streak(uid):
    user = await db.users.find_one({"id": uid})
    today = now_utc().date()
    last = user.get("last_active")
    streak = user.get("streak", 0)
    if last:
        last_date = datetime.fromisoformat(last).date()
        if last_date == today: return
        streak = streak + 1 if (today - last_date).days == 1 else 1
    else: streak = 1
    await db.users.update_one({"id": uid}, {"$set": {"streak": streak, "last_active": today.isoformat()}})

# ---------- Habits & Mood ----------
@app.get("/api/habits")
async def list_habits(user=Depends(get_current_user)):
    habits = await db.habits.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(200)
    today = now_utc().date().isoformat()
    logs = await db.habit_logs.find({"user_id": user["id"]}, {"_id": 0}).to_list(5000)
    log_map = {}
    for log in logs: log_map.setdefault(log["habit_id"], []).append(log["date"])
    for h in habits:
        h["completed_dates"] = log_map.get(h["id"], [])
        h["done_today"] = today in h["completed_dates"]
    return habits

@app.post("/api/habits")
async def create_habit(req: HabitReq, user=Depends(get_current_user)):
    doc = {"id": make_id(), "user_id": user["id"], **req.model_dump(), "created_at": now_utc().isoformat()}
    await db.habits.insert_one(doc)
    return {k: v for k, v in doc.items() if k != "_id"}

@app.delete("/api/habits/{hid}")
async def delete_habit(hid: str, user=Depends(get_current_user)):
    await db.habits.delete_one({"id": hid, "user_id": user["id"]})
    await db.habit_logs.delete_many({"habit_id": hid, "user_id": user["id"]})
    return {"ok": True}

@app.post("/api/habits/log")
async def log_habit(req: HabitLogReq, user=Depends(get_current_user)):
    existing = await db.habit_logs.find_one({"user_id": user["id"], "habit_id": req.habit_id, "date": req.date})
    if existing:
        await db.habit_logs.delete_one({"_id": existing["_id"]})
        return {"toggled": "off"}
    await db.habit_logs.insert_one({"id": make_id(), "user_id": user["id"], "habit_id": req.habit_id, "date": req.date, "created_at": now_utc().isoformat()})
    return {"toggled": "on"}

@app.get("/api/mood")
async def list_moods(user=Depends(get_current_user)):
    return await db.moods.find({"user_id": user["id"]}, {"_id": 0}).sort("date", -1).to_list(365)

@app.post("/api/mood")
async def log_mood(req: MoodLogReq, user=Depends(get_current_user)):
    date = req.date or now_utc().date().isoformat()
    await db.moods.delete_many({"user_id": user["id"], "date": date})
    doc = {"id": make_id(), "user_id": user["id"], "mood": req.mood, "note": req.note, "date": date, "created_at": now_utc().isoformat()}
    await db.moods.insert_one(doc)
    return {k: v for k, v in doc.items() if k != "_id"}

# ---------- Stats ----------
async def _build_stats(user_id):
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
    today = now_utc().date()
    today_str = today.isoformat()
    all_tasks = await db.tasks.find({"user_id": user_id}, {"_id": 0}).to_list(2000)
    today_done = sum(1 for t in all_tasks if (t.get("completed_at") or "").startswith(today_str))
    today_total = sum(1 for t in all_tasks if not t.get("completed") or (t.get("completed_at") or "").startswith(today_str))
    sessions = await db.sessions.find({"user_id": user_id}, {"_id": 0}).to_list(2000)
    week_data = {(today - timedelta(days=i)).isoformat(): 0 for i in range(6, -1, -1)}
    for s in sessions:
        if s.get("type") == "pomodoro" and s["date"] in week_data:
            week_data[s["date"]] += s["duration_minutes"]
    today_minutes = week_data.get(today_str, 0)
    daily_goal = user.get("daily_goal_minutes", 120)
    progress_pct = min(100, int((today_minutes / max(daily_goal, 1)) * 100))
    badges = []
    if user.get("streak", 0) >= 3: badges.append({"id": "s3", "name": "৩ দিনের স্ট্রিক", "icon": "Flame"})
    if user.get("streak", 0) >= 7: badges.append({"id": "s7", "name": "সপ্তাহের যোদ্ধা", "icon": "Trophy"})
    if user.get("xp", 0) >= 100: badges.append({"id": "x1", "name": "১০০ XP", "icon": "Star"})
    if user.get("xp", 0) >= 500: badges.append({"id": "x5", "name": "৫০০ XP", "icon": "Award"})
    total_minutes = sum(s["duration_minutes"] for s in sessions if s.get("type") == "pomodoro")
    if total_minutes >= 60: badges.append({"id": "fh", "name": "প্রথম ঘন্টা", "icon": "Clock"})
    return {
        "streak": user.get("streak", 0), "xp": user.get("xp", 0),
        "today_minutes": today_minutes, "daily_goal": daily_goal, "progress_pct": progress_pct,
        "today_done": today_done, "today_total": today_total,
        "week_data": [{"date": k, "minutes": v} for k, v in week_data.items()],
        "total_sessions": len([s for s in sessions if s.get("type") == "pomodoro"]),
        "total_minutes": total_minutes, "badges": badges,
    }

@app.get("/api/stats")
async def get_stats(user=Depends(get_current_user)):
    return await _build_stats(user["id"])

# ---------- AI ----------
async def _get_chat(session_id, system_msg):
    from emergentintegrations.llm.chat import LlmChat
    return LlmChat(api_key=EMERGENT_LLM_KEY, session_id=session_id, system_message=system_msg).with_model("openai", "gpt-5.1")

@app.get("/api/chat/history")
async def chat_history(user=Depends(get_current_user)):
    return await db.chat_messages.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", 1).to_list(500)

@app.delete("/api/chat/history")
async def clear_chat(user=Depends(get_current_user)):
    await db.chat_messages.delete_many({"user_id": user["id"]})
    return {"ok": True}

@app.post("/api/chat")
async def chat(req: ChatReq, user=Depends(get_current_user)):
    from emergentintegrations.llm.chat import UserMessage
    sid = req.session_id or f"user-{user['id']}"
    sysm = ("তুমি StudyFlow AI - একজন বন্ধুসুলভ বাংলা শিক্ষা সহকারী। "
            "শিক্ষার্থীদের পড়াশোনা, হোমওয়ার্ক, কনসেপ্ট ও সময় ব্যবস্থাপনায় সহায়তা করো। "
            "সংক্ষিপ্ত, পরিষ্কার, এবং উৎসাহজনক উত্তর দাও। গণিত/বিজ্ঞানের সমস্যায় ধাপে ধাপে সমাধান দাও।")
    await db.chat_messages.insert_one({"id": make_id(), "user_id": user["id"], "role": "user", "content": req.message, "created_at": now_utc().isoformat()})
    try:
        c = await _get_chat(sid, sysm)
        resp = await c.send_message(UserMessage(text=req.message))
    except Exception as e:
        raise HTTPException(500, f"AI error: {e}")
    await db.chat_messages.insert_one({"id": make_id(), "user_id": user["id"], "role": "assistant", "content": resp, "created_at": now_utc().isoformat()})
    return {"reply": resp, "session_id": sid}

@app.post("/api/ai/summarize")
async def ai_summarize(req: SummarizeReq, user=Depends(get_current_user)):
    from emergentintegrations.llm.chat import UserMessage
    if len(req.text.strip()) < 30: raise HTTPException(400, "অন্তত ৩০ অক্ষর লাগবে")
    c = await _get_chat(f"sum-{user['id']}-{make_id()[:6]}",
        "তুমি একজন দক্ষ বাংলা সারাংশকারক। notes কে সংক্ষিপ্ত, পরিষ্কার bullet point আকারে summarize করো। সর্বোচ্চ ৬টি পয়েন্ট দাও।")
    try: r = await c.send_message(UserMessage(text=f"নিচের notes-এর সারাংশ দাও:\n\n{req.text}"))
    except Exception as e: raise HTTPException(500, f"AI error: {e}")
    return {"summary": r}

@app.post("/api/ai/generate-flashcards")
async def ai_gen_fc(req: GenFlashcardReq, user=Depends(get_current_user)):
    import json as _j
    from emergentintegrations.llm.chat import UserMessage
    c = await _get_chat(f"fc-{user['id']}-{make_id()[:6]}",
        'তুমি একজন বাংলা শিক্ষক। দেওয়া text থেকে study flashcards তৈরি করো। শুধুমাত্র valid JSON array return করো এই format-এ: [{"question":"...","answer":"..."}, ...]। কোনো extra text দিও না।')
    try:
        r = await c.send_message(UserMessage(text=f"নিচের text থেকে {req.count}টি flashcard তৈরি করো:\n\n{req.text}"))
        s = r.strip()
        if s.startswith("```"):
            s = s.split("```", 2)[1]
            if s.startswith("json"): s = s[4:]
            s = s.strip()
        cards = _j.loads(s)
    except Exception as e: raise HTTPException(500, f"AI parse error: {e}")
    saved = []
    for card in cards[:req.count]:
        if not isinstance(card, dict) or "question" not in card or "answer" not in card: continue
        d = {"id": make_id(), "user_id": user["id"], "question": card["question"], "answer": card["answer"],
             "subject": req.subject, "deck": req.deck or "Generated", "review_count": 0, "correct_count": 0,
             "created_at": now_utc().isoformat()}
        await db.flashcards.insert_one(d)
        saved.append({k: v for k, v in d.items() if k != "_id"})
    return {"cards": saved, "count": len(saved)}

@app.post("/api/ai/solve-image")
async def ai_solve(file: UploadFile = File(...), question: str = Form(""), user=Depends(get_current_user)):
    from emergentintegrations.llm.chat import UserMessage, ImageContent, LlmChat
    content = await file.read()
    if len(content) > 10*1024*1024: raise HTTPException(400, "File too large (max 10MB)")
    if file.content_type == "application/pdf" or (file.filename or "").lower().endswith(".pdf"):
        from pypdf import PdfReader
        try:
            reader = PdfReader(io.BytesIO(content))
            text = "".join((p.extract_text() or "") for p in reader.pages[:5])
            if not text.strip(): raise ValueError("empty")
        except Exception:
            raise HTTPException(400, "PDF পড়তে সমস্যা — image upload করুন")
        c = await _get_chat(f"pdf-{user['id']}-{make_id()[:6]}",
            "তুমি বাংলা শিক্ষা সহকারী। দেওয়া text-এর সমস্যা/প্রশ্ন বিশ্লেষণ করে ধাপে ধাপে বাংলায় সমাধান দাও।")
        prompt = (question or "এই PDF-এর প্রশ্নগুলোর সমাধান দাও") + f"\n\nPDF text:\n{text[:6000]}"
        try: r = await c.send_message(UserMessage(text=prompt))
        except Exception as e: raise HTTPException(500, f"AI error: {e}")
        return {"solution": r, "type": "pdf"}
    try:
        b64 = base64.b64encode(content).decode()
        c = LlmChat(api_key=EMERGENT_LLM_KEY, session_id=f"img-{user['id']}-{make_id()[:6]}",
                    system_message="তুমি বাংলা শিক্ষা সহকারী। ছবিতে দেখানো প্রশ্ন বা সমস্যা পড়ে ধাপে ধাপে বাংলায় সমাধান দাও।").with_model("openai", "gpt-5.1")
        r = await c.send_message(UserMessage(text=question or "এই ছবিতে দেখানো প্রশ্নের সমাধান দাও", file_contents=[ImageContent(image_base64=b64)]))
    except Exception as e: raise HTTPException(500, f"AI error: {e}")
    return {"solution": r, "type": "image"}

# ---------- Announcements (admin -> students) ----------
@app.get("/api/announcements")
async def my_announcements(user=Depends(get_current_user)):
    q = {"$or": [{"target_ids": []}, {"target_ids": user["id"]}, {"target_ids": None}]}
    items = await db.announcements.find(q, {"_id": 0}).sort("created_at", -1).to_list(100)
    return items

@app.get("/api/messages")
async def my_messages(user=Depends(get_current_user)):
    return await db.messages.find({"student_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(200)

@app.post("/api/messages/{msg_id}/read")
async def mark_msg_read(msg_id: str, user=Depends(get_current_user)):
    await db.messages.update_one({"id": msg_id, "student_id": user["id"]}, {"$set": {"read": True}})
    return {"ok": True}

# ---------- Admin ----------
@app.get("/api/admin/students")
async def list_students(user=Depends(require_admin)):
    students = await db.users.find({"role": "student"}, {"_id": 0, "password": 0}).sort("created_at", -1).to_list(1000)
    out = []
    for s in students:
        all_tasks = await db.tasks.count_documents({"user_id": s["id"]})
        done_tasks = await db.tasks.count_documents({"user_id": s["id"], "completed": True})
        s_sessions = await db.sessions.find({"user_id": s["id"], "type": "pomodoro"}, {"_id": 0}).to_list(2000)
        total_min = sum(x["duration_minutes"] for x in s_sessions)
        out.append({**s, "total_tasks": all_tasks, "done_tasks": done_tasks, "total_minutes": total_min, "session_count": len(s_sessions)})
    return out

@app.get("/api/admin/students/{sid}")
async def student_detail(sid: str, user=Depends(require_admin)):
    s = await db.users.find_one({"id": sid, "role": "student"}, {"_id": 0, "password": 0})
    if not s: raise HTTPException(404, "Student not found")
    stats = await _build_stats(sid)
    tasks = await db.tasks.find({"user_id": sid}, {"_id": 0}).sort("created_at", -1).to_list(200)
    return {"student": s, "stats": stats, "tasks": tasks}

@app.post("/api/admin/assign-task")
async def assign_task(req: AssignTaskReq, user=Depends(require_admin)):
    student_ids = req.student_ids
    if not student_ids:
        all_students = await db.users.find({"role": "student"}, {"id": 1}).to_list(1000)
        student_ids = [x["id"] for x in all_students]
    created = 0
    for sid in student_ids:
        task_doc = {
            "id": make_id(), "user_id": sid,
            "title": req.title, "subject": req.subject, "priority": req.priority,
            "deadline": req.deadline, "notes": req.notes, "completed": False,
            "assigned_by": user["name"],
            "created_at": now_utc().isoformat(), "completed_at": None,
        }
        await db.tasks.insert_one(task_doc)
        created += 1
        # push to student
        await ws_mgr.send_to(sid, {"event": "task_assigned", "data": {
            "id": task_doc["id"], "title": req.title, "priority": req.priority,
            "by": user["name"], "deadline": req.deadline,
        }})
    return {"assigned": created}

@app.post("/api/admin/announce")
async def create_announce(req: AnnounceReq, user=Depends(require_admin)):
    doc = {
        "id": make_id(), "title": req.title, "body": req.body,
        "type": req.type, "target_ids": req.target_ids or [],
        "by": user["name"], "created_at": now_utc().isoformat(),
    }
    await db.announcements.insert_one(doc)
    out = {k: v for k, v in doc.items() if k != "_id"}
    # Push real-time notification
    payload = {"event": "announcement", "data": out}
    if req.target_ids:
        for sid in req.target_ids:
            await ws_mgr.send_to(sid, payload)
    else:
        await ws_mgr.broadcast_students(payload)
    return out

@app.get("/api/admin/announcements")
async def admin_list_announce(user=Depends(require_admin)):
    return await db.announcements.find({}, {"_id": 0}).sort("created_at", -1).to_list(200)

@app.delete("/api/admin/announcements/{aid}")
async def delete_announce(aid: str, user=Depends(require_admin)):
    await db.announcements.delete_one({"id": aid})
    return {"ok": True}

@app.post("/api/admin/message")
async def send_message(req: DirectMsgReq, user=Depends(require_admin)):
    doc = {
        "id": make_id(), "student_id": req.student_id, "body": req.body,
        "urgent": req.urgent, "by": user["name"], "read": False,
        "created_at": now_utc().isoformat(),
    }
    await db.messages.insert_one(doc)
    out = {k: v for k, v in doc.items() if k != "_id"}
    # Push real-time
    await ws_mgr.send_to(req.student_id, {"event": "message", "data": out})
    return out

@app.get("/api/admin/messages/{sid}")
async def admin_messages(sid: str, user=Depends(require_admin)):
    return await db.messages.find({"student_id": sid}, {"_id": 0}).sort("created_at", -1).to_list(200)

@app.get("/api/admin/overview")
async def admin_overview(user=Depends(require_admin)):
    students = await db.users.count_documents({"role": "student"})
    total_tasks = await db.tasks.count_documents({})
    done_tasks = await db.tasks.count_documents({"completed": True})
    today = now_utc().date().isoformat()
    today_sessions = await db.sessions.count_documents({"date": today, "type": "pomodoro"})
    return {"students": students, "total_tasks": total_tasks, "done_tasks": done_tasks, "today_sessions": today_sessions}

# ---------- Health ----------
@app.get("/api/")
async def root(): return {"status": "ok", "app": "StudyFlow Pro"}

# ---------- WebSocket ----------
@app.websocket("/api/ws")
async def websocket_endpoint(ws: WebSocket, token: str = Query(...)):
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
        user_id = payload["sub"]
        u = await db.users.find_one({"id": user_id}, {"id": 1})
        if not u:
            await ws.close(code=1008); return
    except Exception:
        await ws.close(code=1008); return
    await ws_mgr.connect(user_id, ws)
    try:
        await ws.send_json({"event": "connected", "data": {"user_id": user_id}})
        while True:
            msg = await ws.receive_text()
            # heartbeat / keep-alive
            if msg == "ping":
                await ws.send_text("pong")
    except WebSocketDisconnect:
        ws_mgr.disconnect(user_id, ws)
    except Exception:
        ws_mgr.disconnect(user_id, ws)

@app.on_event("shutdown")
async def shutdown(): client.close()
