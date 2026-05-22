"""StudyFlow Pro Backend API tests"""
import os
import time
import io
import pytest
import requests
from dotenv import load_dotenv

load_dotenv("/app/frontend/.env")
BASE_URL = os.environ.get("REACT_APP_BACKEND_URL").rstrip("/")
API = f"{BASE_URL}/api"

TS = str(int(time.time()))
NEW_USER = {"name": f"Test User {TS}", "username": f"teststudent_{TS}", "password": "test1234"}


@pytest.fixture(scope="session")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def admin_token(session):
    r = session.post(f"{API}/auth/login", json={"username": "admin", "password": "admin123"}, timeout=15)
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["user"]["role"] == "admin"
    return data["token"]


@pytest.fixture(scope="session")
def student_token(session):
    r = session.post(f"{API}/auth/login", json={"username": "student", "password": "student123"}, timeout=15)
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["user"]["role"] == "student"
    return data["token"]


@pytest.fixture(scope="session")
def new_user(session):
    r = session.post(f"{API}/auth/register", json=NEW_USER, timeout=15)
    assert r.status_code == 200, r.text
    data = r.json()
    return {"token": data["token"], "id": data["user"]["id"], "username": data["user"]["username"]}


def auth_h(t):
    return {"Authorization": f"Bearer {t}", "Content-Type": "application/json"}


# ---------- Health & Auth ----------
class TestAuth:
    def test_health(self, session):
        r = session.get(f"{API}/", timeout=10)
        assert r.status_code == 200
        assert r.json()["status"] == "ok"

    def test_register_new_user(self, new_user):
        assert new_user["token"]
        assert new_user["username"] == NEW_USER["username"].lower()

    def test_register_duplicate_fails(self, session):
        r = session.post(f"{API}/auth/register", json=NEW_USER, timeout=15)
        assert r.status_code == 400

    def test_login_admin(self, admin_token):
        assert admin_token

    def test_login_student(self, student_token):
        assert student_token

    def test_login_wrong(self, session):
        r = session.post(f"{API}/auth/login", json={"username": "admin", "password": "wrong"}, timeout=15)
        assert r.status_code == 401

    def test_me_no_password(self, session, student_token):
        r = session.get(f"{API}/auth/me", headers=auth_h(student_token), timeout=10)
        assert r.status_code == 200
        body = r.json()
        assert "password" not in body
        assert body["role"] == "student"

    def test_me_unauthorized(self, session):
        r = session.get(f"{API}/auth/me", timeout=10)
        assert r.status_code == 401

    def test_change_password_wrong_current(self, session, new_user):
        r = session.post(f"{API}/auth/change-password", headers=auth_h(new_user["token"]),
                         json={"current_password": "wrong", "new_password": "new12345"}, timeout=15)
        assert r.status_code == 400

    def test_change_password_then_revert(self, session, new_user):
        r = session.post(f"{API}/auth/change-password", headers=auth_h(new_user["token"]),
                         json={"current_password": "test1234", "new_password": "new12345"}, timeout=15)
        assert r.status_code == 200
        # revert
        r2 = session.post(f"{API}/auth/change-password", headers=auth_h(new_user["token"]),
                          json={"current_password": "new12345", "new_password": "test1234"}, timeout=15)
        assert r2.status_code == 200

    def test_update_profile(self, session, new_user):
        r = session.patch(f"{API}/auth/profile", headers=auth_h(new_user["token"]),
                          json={"name": "Updated", "daily_goal_minutes": 90, "theme": "light"}, timeout=15)
        assert r.status_code == 200
        body = r.json()
        assert body["name"] == "Updated"
        assert body["daily_goal_minutes"] == 90
        assert body["theme"] == "light"


# ---------- Tasks/Subjects/Notes/Flashcards/Sessions/Habits/Mood ----------
class TestCRUD:
    def test_task_lifecycle(self, session, new_user):
        h = auth_h(new_user["token"])
        r = session.post(f"{API}/tasks", headers=h, json={"title": "TEST_task1", "priority": "high"}, timeout=15)
        assert r.status_code == 200
        tid = r.json()["id"]

        # complete adds xp
        me_before = session.get(f"{API}/auth/me", headers=h, timeout=10).json()
        r2 = session.patch(f"{API}/tasks/{tid}", headers=h, json={"completed": True}, timeout=15)
        assert r2.status_code == 200
        assert r2.json()["completed"] is True
        me_after = session.get(f"{API}/auth/me", headers=h, timeout=10).json()
        assert me_after["xp"] >= me_before["xp"] + 10

        r3 = session.get(f"{API}/tasks", headers=h, timeout=10)
        assert any(t["id"] == tid for t in r3.json())

        r4 = session.delete(f"{API}/tasks/{tid}", headers=h, timeout=10)
        assert r4.status_code == 200

    def test_subjects(self, session, new_user):
        h = auth_h(new_user["token"])
        r = session.post(f"{API}/subjects", headers=h, json={"name": "TEST_Math", "color": "#fff"}, timeout=15)
        assert r.status_code == 200
        sid = r.json()["id"]
        r2 = session.get(f"{API}/subjects", headers=h, timeout=10)
        assert any(x["id"] == sid for x in r2.json())
        session.delete(f"{API}/subjects/{sid}", headers=h, timeout=10)

    def test_notes(self, session, new_user):
        h = auth_h(new_user["token"])
        r = session.post(f"{API}/notes", headers=h, json={"title": "TEST_n", "content": "hi"}, timeout=15)
        assert r.status_code == 200
        nid = r.json()["id"]
        r2 = session.patch(f"{API}/notes/{nid}", headers=h, json={"title": "TEST_n2", "content": "bye"}, timeout=15)
        assert r2.status_code == 200
        assert r2.json()["title"] == "TEST_n2"
        session.delete(f"{API}/notes/{nid}", headers=h, timeout=10)

    def test_flashcards_review(self, session, new_user):
        h = auth_h(new_user["token"])
        r = session.post(f"{API}/flashcards", headers=h, json={"question": "Q", "answer": "A"}, timeout=15)
        assert r.status_code == 200
        fid = r.json()["id"]
        r2 = session.post(f"{API}/flashcards/{fid}/review?correct=true", headers=h, timeout=15)
        assert r2.status_code == 200
        cards = session.get(f"{API}/flashcards", headers=h, timeout=10).json()
        c = [x for x in cards if x["id"] == fid][0]
        assert c["review_count"] == 1 and c["correct_count"] == 1
        session.delete(f"{API}/flashcards/{fid}", headers=h, timeout=10)

    def test_sessions_pomodoro(self, session, new_user):
        h = auth_h(new_user["token"])
        before = session.get(f"{API}/auth/me", headers=h, timeout=10).json()
        r = session.post(f"{API}/sessions", headers=h, json={"duration_minutes": 25, "type": "pomodoro"}, timeout=15)
        assert r.status_code == 200
        after = session.get(f"{API}/auth/me", headers=h, timeout=10).json()
        assert after["xp"] >= before["xp"] + 25
        assert after["streak"] >= 1

    def test_habits(self, session, new_user):
        h = auth_h(new_user["token"])
        r = session.post(f"{API}/habits", headers=h, json={"name": "TEST_habit"}, timeout=15)
        assert r.status_code == 200
        hid = r.json()["id"]
        today = "2026-01-15"
        r1 = session.post(f"{API}/habits/log", headers=h, json={"habit_id": hid, "date": today}, timeout=15)
        assert r1.json()["toggled"] == "on"
        r2 = session.post(f"{API}/habits/log", headers=h, json={"habit_id": hid, "date": today}, timeout=15)
        assert r2.json()["toggled"] == "off"
        session.delete(f"{API}/habits/{hid}", headers=h, timeout=10)

    def test_mood(self, session, new_user):
        h = auth_h(new_user["token"])
        r = session.post(f"{API}/mood", headers=h, json={"mood": "happy", "note": "ok"}, timeout=15)
        assert r.status_code == 200
        # Replace same date
        r2 = session.post(f"{API}/mood", headers=h, json={"mood": "sad"}, timeout=15)
        assert r2.status_code == 200
        moods = session.get(f"{API}/mood", headers=h, timeout=10).json()
        today_moods = [m for m in moods if m["date"] == r2.json()["date"]]
        assert len(today_moods) == 1
        assert today_moods[0]["mood"] == "sad"

    def test_stats(self, session, new_user):
        h = auth_h(new_user["token"])
        r = session.get(f"{API}/stats", headers=h, timeout=10)
        assert r.status_code == 200
        body = r.json()
        for k in ["streak", "xp", "today_minutes", "daily_goal", "progress_pct", "week_data", "badges"]:
            assert k in body
        assert len(body["week_data"]) == 7


# ---------- AI ----------
class TestAI:
    def test_chat(self, session, student_token):
        h = auth_h(student_token)
        r = session.post(f"{API}/chat", headers=h, json={"message": "Hello in Bengali"}, timeout=60)
        assert r.status_code == 200, r.text
        assert "reply" in r.json() and len(r.json()["reply"]) > 0

    def test_chat_history(self, session, student_token):
        h = auth_h(student_token)
        r = session.get(f"{API}/chat/history", headers=h, timeout=15)
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_summarize_short_text(self, session, student_token):
        h = auth_h(student_token)
        r = session.post(f"{API}/ai/summarize", headers=h, json={"text": "short"}, timeout=15)
        assert r.status_code == 400

    def test_summarize_ok(self, session, student_token):
        h = auth_h(student_token)
        text = "বাংলাদেশ একটি দক্ষিণ এশীয় দেশ। এর রাজধানী ঢাকা। এখানে অনেক নদী রয়েছে এবং কৃষি প্রধান অর্থনীতি।"
        r = session.post(f"{API}/ai/summarize", headers=h, json={"text": text}, timeout=60)
        assert r.status_code == 200, r.text
        assert "summary" in r.json()

    def test_generate_flashcards(self, session, student_token):
        h = auth_h(student_token)
        text = "Photosynthesis is the process by which plants convert light energy into chemical energy. Chlorophyll absorbs light. Water and CO2 are inputs."
        r = session.post(f"{API}/ai/generate-flashcards", headers=h, json={"text": text, "count": 3}, timeout=90)
        assert r.status_code == 200, r.text
        assert r.json()["count"] >= 1

    def test_solve_image(self, session, student_token):
        from PIL import Image, ImageDraw
        img = Image.new("RGB", (200, 100), "white")
        ImageDraw.Draw(img).text((10, 40), "What is 2+2?", fill="black")
        buf = io.BytesIO(); img.save(buf, "PNG"); buf.seek(0)
        files = {"file": ("test.png", buf, "image/png")}
        data = {"question": "What is 2+2?"}
        r = requests.post(f"{API}/ai/solve-image",
                          headers={"Authorization": f"Bearer {student_token}"},
                          files=files, data=data, timeout=90)
        assert r.status_code == 200, r.text
        assert "solution" in r.json()


# ---------- Admin & Messages ----------
class TestAdmin:
    def test_non_admin_forbidden(self, session, student_token):
        r = session.get(f"{API}/admin/students", headers=auth_h(student_token), timeout=10)
        assert r.status_code == 403

    def test_overview(self, session, admin_token):
        r = session.get(f"{API}/admin/overview", headers=auth_h(admin_token), timeout=10)
        assert r.status_code == 200
        for k in ["students", "total_tasks", "done_tasks", "today_sessions"]:
            assert k in r.json()

    def test_students_list(self, session, admin_token, new_user):
        r = session.get(f"{API}/admin/students", headers=auth_h(admin_token), timeout=15)
        assert r.status_code == 200
        ids = [s["id"] for s in r.json()]
        assert new_user["id"] in ids

    def test_student_detail(self, session, admin_token, new_user):
        r = session.get(f"{API}/admin/students/{new_user['id']}", headers=auth_h(admin_token), timeout=15)
        assert r.status_code == 200
        body = r.json()
        assert body["student"]["id"] == new_user["id"]
        assert "stats" in body and "tasks" in body

    def test_assign_task(self, session, admin_token, new_user):
        r = session.post(f"{API}/admin/assign-task", headers=auth_h(admin_token),
                         json={"student_ids": [new_user["id"]], "title": "TEST_assigned", "priority": "high"}, timeout=15)
        assert r.status_code == 200
        assert r.json()["assigned"] == 1
        # Student sees the assigned task with assigned_by populated
        tasks = session.get(f"{API}/tasks", headers=auth_h(new_user["token"]), timeout=10).json()
        assigned = [t for t in tasks if t["title"] == "TEST_assigned"]
        assert assigned and assigned[0]["assigned_by"] is not None

    def test_announce_and_student_view(self, session, admin_token, new_user):
        r = session.post(f"{API}/admin/announce", headers=auth_h(admin_token),
                         json={"title": "TEST_motiv", "body": "Keep going!", "type": "motivation"}, timeout=15)
        assert r.status_code == 200
        # student sees in /api/announcements
        anns = session.get(f"{API}/announcements", headers=auth_h(new_user["token"]), timeout=10).json()
        assert any(a["title"] == "TEST_motiv" for a in anns)

    def test_direct_message_and_read(self, session, admin_token, new_user):
        r = session.post(f"{API}/admin/message", headers=auth_h(admin_token),
                         json={"student_id": new_user["id"], "body": "TEST_msg", "urgent": True}, timeout=15)
        assert r.status_code == 200
        mid = r.json()["id"]
        msgs = session.get(f"{API}/messages", headers=auth_h(new_user["token"]), timeout=10).json()
        target = [m for m in msgs if m["id"] == mid]
        assert target and target[0]["urgent"] is True and target[0]["read"] is False
        rr = session.post(f"{API}/messages/{mid}/read", headers=auth_h(new_user["token"]), timeout=10)
        assert rr.status_code == 200
        msgs2 = session.get(f"{API}/messages", headers=auth_h(new_user["token"]), timeout=10).json()
        assert [m for m in msgs2 if m["id"] == mid][0]["read"] is True
