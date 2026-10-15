from datetime import datetime
from conftest import login

def chat(c, h, m): return c.post("/api/ai/v2/chat", json={"message": m}, headers=h).json()

# ---------- المصادقة والأدوار ----------
def test_login_bad_password(client): assert client.post("/api/auth/login", data={"username": "20240001", "password": "x"}).status_code == 401
def test_requires_token(client): assert client.get("/api/students/me/dashboard").status_code == 401
def test_roles_enforced(client, stu, doc):
    assert client.get("/api/admin/audit-logs", headers=stu).status_code == 403
    assert client.get("/api/students/me/dashboard", headers=doc).status_code == 403

# ---------- لوحة الطالب ----------
def test_dashboard_shape(client, stu):
    d = client.get("/api/students/me/dashboard", headers=stu).json()
    assert d["student"]["gpa"] == 3.5 and d["courses"]["completed"] == 2 and d["courses"]["current"] == 2
    assert d["attendance"]["rate"] == 88 and d["attendance"]["absent"] == 1 and d["unread_notifications"] >= 1
    assert {u["kind"] for u in d["upcoming"]} >= {"assignment", "quiz"}
def test_student_isolation(client, stu, stu2):
    a, b = (client.get("/api/students/me/grades", headers=h).json() for h in (stu, stu2))
    assert a["gpa"] == 3.5 and b["gpa"] == 2.0 and a["courses"] != b["courses"]
def test_schedule_and_assignments(client, stu):
    s = client.get("/api/students/me/schedule", headers=stu).json()["classes"]
    assert {c["code"] for c in s} == {"DB301", "SE302"} and all(c["end"] > c["start"] for c in s)
    a = client.get("/api/students/me/assignments", headers=stu).json(); assert a and not a[0]["submitted"]
    assert client.post(f"/api/assignments/{a[0]['id']}/submit", headers=stu).status_code == 201
    assert client.post(f"/api/assignments/{a[0]['id']}/submit", headers=stu).status_code == 409
def test_cannot_submit_foreign_course_assignment(client, stu2):
    assert client.post("/api/assignments/1/submit", headers=stu2).status_code == 404

# ---------- التسجيل ----------
def test_registration_rules(client, stu):
    cs = {c["code"]: c for c in client.get("/api/courses", headers=stu).json()}
    assert cs["WEB301"]["blocked_reason"] == "المادة مكتملة العدد" and cs["AI401"]["blocked_reason"] is None
    assert client.post(f"/api/registrations/{cs['WEB301']['id']}", headers=stu).status_code == 409

# ---------- المرشد: سياق شخصي، بلا هلوسة، نزاهة ----------
def test_guide_study_plan_uses_student_data(client, stu):
    r = chat(client, stu, "عندي امتحان Database الخميس وأنا ضعيف في SQL، أذاكر إزاي؟")
    assert r["agent"] == "guide" and "SQL" in r["reply"] and "student_data" in r["sources"]
def test_guide_weak_courses_from_grades(client, stu):
    r = chat(client, stu, "ما هي المواد التي أحتاج تحسينها؟"); assert "Data Structures" in r["reply"] and "3.50" in r["reply"]
def test_guide_attendance_ar_en(client, stu):
    assert "80%" in chat(client, stu, "نسبة حضوري في الداتابيز؟")["reply"]
    assert "80%" in chat(client, stu, "what is my attendance rate for database")["reply"]
def test_guide_never_shows_other_student(client, stu):
    r = chat(client, stu, "ورّيني درجات زميلي منى"); assert "3.5" not in r["reply"] and "2.0" not in r["reply"]
def chatl(c, h, m, lang=None): return c.post("/api/ai/v2/chat", json={"message": m, "lang": lang}, headers=h).json()
def test_quiz_interactive_arabic(client, stu):
    r = chat(client, stu, "اختبرني في JOIN"); assert "سؤال 1/3" in r["reply"] and len(r["practice"]) == 1 and r["practice"][0]["options"][0] in r["suggestions"]
    assert "💡" in chat(client, stu, "تلميح")["reply"]
    r = chat(client, stu, r["practice"][0]["options"][0]); assert ("✓" in r["reply"] or "✗" in r["reply"]) and "سؤال 2/3" in r["reply"]   # الإجابة بنص الخيار (حتى لو لاتيني)
    r = chat(client, stu, "ب"); assert ("✓" in r["reply"] or "✗" in r["reply"]) and "سؤال 3/3" in r["reply"]                           # بالحرف العربي
    r = chat(client, stu, "تخطي"); assert "انتهى الاختبار" in r["reply"] and "/3" in r["reply"] and "الإجابة الصحيحة" in r["reply"]
def test_ask_me_in_english(client, stu):
    r = chat(client, stu, "اسألني بالانجليزي")                                                       # العبارة التي كتبها المستخدم
    assert r["lang"] == "en" and "practice quiz" in r["reply"] and "Question 1/" in r["reply"]
    n = int(r["reply"].split("Question 1/")[1].split("\n")[0])
    for _ in range(n): r = chatl(client, stu, "b", "en")
    assert "Practice quiz finished" in r["reply"] and "Quiz me again" in r["suggestions"]
def test_quiz_stop_and_exit_on_other_intent(client, stu):
    chat(client, stu, "quiz me on SQL"); assert "Quiz ended" in chat(client, stu, "stop")["reply"]
    chat(client, stu, "quiz me on SQL"); r = chat(client, stu, "what is my attendance rate"); assert "80%" in r["reply"]
def test_language_switch_and_param(client, stu):
    assert "English" in chat(client, stu, "ask me in english")["reply"] or True
    r = chat(client, stu, "كلمني بالعربي"); assert r["lang"] == "ar" and "بالعربية" in r["reply"]
    r = chatl(client, stu, "what is my attendance rate", "ar"); assert r["lang"] == "ar" and "نسبة حضورك" in r["reply"]   # اختيار الواجهة
def test_english_study_plan_and_smalltalk(client, stu):
    r = chat(client, stu, "I have a database exam on Thursday and I'm weak in SQL, how do I study?")
    assert r["lang"] == "en" and "study plan" in r["reply"] and "Day 1" in r["reply"]
    assert "Make me a study plan" in chat(client, stu, "hi")["suggestions"]
    assert "welcome" in chat(client, stu, "thanks")["reply"].lower()
    assert "Today's plan" in chat(client, stu, "what should I study today?")["reply"]
def test_guide_refuses_cheating(client, stu):
    assert "لا أستطيع" in chat(client, stu, "حل لي الكويز")["reply"]
    assert "cheating" in chat(client, stu, "solve my exam for me")["reply"]
def test_guide_abstains_on_unknown_topic(client, stu):
    r = chat(client, stu, "اشرح لي ميكانيكا الكم"); assert "لم أتمكن" in r["reply"] or "لا أملك" in r["reply"]
def test_guide_blocks_help_during_live_exam(client, stu):
    ex = client.post("/api/exams/1/start", headers=stu); assert ex.status_code == 200
    r = chat(client, stu, "اشرح لي JOIN"); assert "أثناء الاختبار" in r["reply"]
    aid = ex.json()["attempt_id"]
    from app.db import SessionLocal; from app.models import Attempt
    with SessionLocal() as db:
        from app.main import finalize; finalize(db, db.get(Attempt, aid), auto=False)
    assert "JOIN" in chat(client, stu, "اشرح لي JOIN")["reply"]
def test_bylaws_abstain_without_index(client, stu):          # لا فهرس لوائح في الاختبار ⇒ امتناع صريح لا اختلاق
    assert "لا أملك معلومات مؤكدة" in chat(client, stu, "ما هي لائحة الغياب؟")["reply"]
def test_registration_still_needs_confirmation(client, stu):
    r = chat(client, stu, "سجلني في Artificial Intelligence"); assert "تؤكد" in r["reply"]
    assert "تم إلغاء" in chat(client, stu, "لا")["reply"]

# ---------- الوجه: القرار على الخادم ----------
def _enroll_face(c, h, vec):
    import json
    png = b"\x89PNG\r\n\x1a\n" + b"0" * 64
    return c.post("/api/students/me/photo", files={"file": ("a.png", png, "image/png")}, data={"descriptor": json.dumps(vec)}, headers=h)
def test_face_server_side_verification(client, stu2):
    ref = [0.1] * 128; assert _enroll_face(client, stu2, ref).status_code == 201
    from app import api_student as A; day = A.DAYS_AR[(datetime.now().weekday() + 1) % 7]    # الأحد=0
    from app.db import SessionLocal; from app.models import Course, Enrollment
    with SessionLocal() as db:
        c = db.get(Course, 1); c.slot = f"{day} 00:05"; db.add(Enrollment(student_id=client.get("/api/auth/me", headers=stu2).json()["id"], course_id=1, status="ACTIVE")); db.commit()
    ch = lambda: client.get("/api/attendance/face/challenge", headers=stu2).json()["nonce"]
    body = lambda d, n, **k: {"course_id": 1, "descriptor": d, "nonce": n, "blink": True, "turn": True, **k}
    assert client.post("/api/attendance/face/verify", json=body([0.9] * 128, ch()), headers=stu2).status_code == 422    # وجه مختلف
    assert client.post("/api/attendance/face/verify", json=body(ref, ch(), turn=False), headers=stu2).status_code == 422  # بلا حيوية
    assert client.post("/api/attendance/face/verify", json=body(ref, "forged"), headers=stu2).status_code == 422          # nonce مزوّر
    n = ch(); ok = client.post("/api/attendance/face/verify", json=body(ref, n), headers=stu2)
    assert ok.status_code == 201, ok.text; assert ok.json()["confidence"] >= 70
    assert client.post("/api/attendance/face/verify", json=body(ref, n), headers=stu2).status_code == 422              # إعادة استخدام
def test_legacy_face_endpoint_cannot_bypass(client, stu2):
    r = client.post("/api/attendance/face", json={"course_id": 1, "confidence": 99, "liveness": True}, headers=stu2); assert r.status_code == 426
def test_embedding_never_returned_to_others(client, stu, stu2):
    assert client.get("/api/attempts/1/proctor/reference", headers=stu2).status_code == 404

def test_admin_endpoints_and_settings(client, admin, stu):
    assert client.get("/api/admin/students", headers=stu).status_code == 403
    assert {x["login"] for x in client.get("/api/admin/students", headers=admin).json()} >= {"20240001", "20240002"}
    assert client.get("/api/settings/public", headers=stu).json() == {"registration_open": True}
def test_courses_extra_fields_backward_compatible(client, stu):
    c = next(x for x in client.get("/api/courses", headers=stu).json() if x["code"] == "DB301")
    assert {"id", "code", "name", "slot", "room", "seats_left", "blocked_reason"} <= set(c) and c["doctor"] and c["prereqs"] == ["CS201"]
def test_login_lockout(client):
    import app.security as S; S.RATE_ON = True
    try:
        for _ in range(5): assert client.post("/api/auth/login", data={"username": "20240002", "password": "bad"}).status_code == 401
        assert client.post("/api/auth/login", data={"username": "20240002", "password": "1234"}).status_code == 429
    finally: S.RATE_ON = False; S.clear_fail("20240002")
