import os
from datetime import datetime, timedelta
from fastapi import Depends, FastAPI, File, Form, HTTPException, Request, Response, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel
from sqlalchemy import select
from .db import get_db
from .models import *
from . import rules, assistant
from .ai.routes import build_router
from . import vault
from .security import make_token, read_token, verify_pw, allow, locked, note_fail, clear_fail
app = FastAPI(title="UniSmart API")
app.add_middleware(CORSMiddleware, allow_origins=os.environ.get("CORS_ORIGINS", "http://localhost:5173").split(","), allow_methods=["*"], allow_headers=["*"])
oauth = OAuth2PasswordBearer("/api/auth/login")
@app.middleware("http")
async def limits(req: Request, call_next):
    ip = req.client.host if req.client else "?"; path = req.url.path
    lim = 20 if path == "/api/auth/login" else 40 if path.startswith("/api/ai") else 600      # طلبات/دقيقة لكل IP
    if path.startswith("/api") and not allow(f"{ip}:{path if lim != 600 else 'all'}", lim):
        return Response('{"detail":"عدد الطلبات كبير؛ حاول بعد قليل"}', 429, media_type="application/json", headers={"Retry-After": "60"})
    resp = await call_next(req)
    resp.headers["X-Content-Type-Options"] = "nosniff"; resp.headers["Cache-Control"] = "no-store" if path.startswith("/api") else resp.headers.get("Cache-Control", "")
    return resp
def current(token=Depends(oauth), db=Depends(get_db)) -> User:
    p = read_token(token); u = db.get(User, int(p["sub"])) if p else None
    if not u: raise HTTPException(401, "Unauthorized")
    return u
def need(*roles):
    def dep(u=Depends(current)):
        if u.role not in roles: raise HTTPException(403, "Forbidden")
        return u
    return dep
@app.post("/api/auth/login")
def login(f: OAuth2PasswordRequestForm = Depends(), db=Depends(get_db)):
    key = f.username.lower()
    if locked(key): raise HTTPException(429, "تم إيقاف المحاولات مؤقتًا بعد تكرار الخطأ؛ حاول بعد 5 دقائق")
    u = db.scalar(select(User).where(User.login == key))
    if not u or not verify_pw(f.password, u.password_hash):
        note_fail(key); db.add(AuditLog(user_id=u.id if u else None, action="LOGIN_FAILED")); db.commit(); raise HTTPException(401, "بيانات الدخول غير صحيحة")
    clear_fail(key)
    db.add(AuditLog(user_id=u.id, action="USER_LOGIN")); db.commit()
    return {"access_token": make_token(u.id, u.role), "token_type": "bearer", "role": u.role, "name": u.name}
@app.get("/api/auth/me")
def me(u=Depends(current)): return {"id": u.id, "login": u.login, "name": u.name, "role": u.role}
@app.get("/api/health")
def health(): return {"ok": True}
@app.get("/api/settings/public")
def public_settings(u=Depends(current), db=Depends(get_db)): return {"registration_open": rules.reg_open(db)}
@app.get("/api/admin/students")
def admin_students(u=Depends(need("admin")), db=Depends(get_db)):
    ph = {p.user_id for p in db.scalars(select(StudentPhoto))}
    return [{"id": x.id, "login": x.login, "name": x.name, "has_photo": x.id in ph} for x in db.scalars(select(User).where(User.role == "student"))]
@app.get("/api/courses")
def courses(u=Depends(need("student")), db=Depends(get_db)):
    docs = {d.id: d.name for d in db.scalars(select(User).where(User.role == "doctor"))}
    mine = {e.course_id: e.status for e in db.scalars(select(Enrollment).where(Enrollment.student_id == u.id))}
    return [{"id": c.id, "code": c.code, "name": c.name, "slot": c.slot, "room": c.room, "seats_left": c.capacity - c.enrolled,
             "blocked_reason": rules.eligibility(db, u.id, c),
             # حقول إضافية (متوافقة رجعيًا) تغذّي الواجهة الجديدة
             "credits": c.credits, "capacity": c.capacity, "enrolled": c.enrolled, "doctor": docs.get(c.doctor_id), "prereqs": [p.requires_code for p in c.prereqs], "my_status": mine.get(c.id)}
            for c in db.scalars(select(Course))]
@app.post("/api/registrations/{course_id}")
def reg(course_id: int, u=Depends(need("student")), db=Depends(get_db)):
    ok, msg = rules.register(db, u.id, course_id)
    if not ok: raise HTTPException(409, msg)
    return {"message": msg}
@app.delete("/api/registrations/{course_id}")
def unreg(course_id: int, u=Depends(need("student")), db=Depends(get_db)):
    ok, msg = rules.drop(db, u.id, course_id)
    if not ok: raise HTTPException(409, msg)
    return {"message": msg}
# ---- الاختبارات الآمنة: الخادم هو المرجع في الوقت وعدّاد المخالفات ----
FLAG = {"TAB_HIDDEN": "tab", "FULLSCREEN_EXIT": "fs", "COPY_ATTEMPT": "copy", "PASTE_ATTEMPT": "copy", "RIGHT_CLICK": "copy", "PAGE_LEFT": "tab", "BACK_NAVIGATION_ATTEMPT": "tab"}
def finalize(db, a: Attempt, auto: bool):
    if a.status != "IN_PROGRESS": return a              # idempotent: لا تسليم مرتين
    qs = db.scalars(select(Question).where(Question.exam_id == a.exam_id)).all()
    ans = {x.question_id: x.choice for x in db.scalars(select(Answer).where(Answer.attempt_id == a.id))}
    a.score = sum(1 for q in qs if ans.get(q.id) == q.correct)
    a.status = "AUTO_SUBMITTED" if auto else "SUBMITTED"; a.auto_submitted = auto; a.submitted_at = datetime.utcnow()
    db.add(AuditLog(user_id=a.student_id, action="EXAM_AUTO_SUBMITTED" if auto else "EXAM_SUBMITTED", entity="exam", entity_id=a.exam_id)); db.commit()
    return a
@app.post("/api/exams/{eid}/start")
def start(eid: int, u=Depends(need("student")), db=Depends(get_db)):
    ex, now = db.get(Exam, eid), datetime.utcnow()
    if not ex or not ex.start_time <= now <= ex.end_time: raise HTTPException(403, "الاختبار غير متاح الآن")
    if not db.scalar(select(Enrollment).where(Enrollment.student_id == u.id, Enrollment.course_id == ex.course_id, Enrollment.status == "ACTIVE")):
        raise HTTPException(403, "غير مسجل في المادة")
    prev = db.scalars(select(Attempt).where(Attempt.exam_id == eid, Attempt.student_id == u.id)).all()
    live = next((a for a in prev if a.status == "IN_PROGRESS"), None)
    if not live and len(prev) >= ex.attempts_allowed: raise HTTPException(403, "لا توجد محاولات متبقية")
    a = live or Attempt(exam_id=eid, student_id=u.id, started_at=now, deadline=now + timedelta(minutes=ex.duration_minutes))
    db.add(a); db.add(AuditLog(user_id=u.id, action="EXAM_STARTED", entity="exam", entity_id=eid)); db.commit()
    return {"attempt_id": a.id, "deadline": a.deadline.isoformat()}   # الواجهة تعرض الوقت المتبقي فقط
class EventIn(BaseModel): type: str
@app.post("/api/attempts/{aid}/events")
def event(aid: int, body: EventIn, req: Request, u=Depends(need("student")), db=Depends(get_db)):
    a = db.get(Attempt, aid)
    if not a or a.student_id != u.id: raise HTTPException(404)
    db.add(ExamEvent(attempt_id=aid, event_type=body.type[:30], ip=req.client.host if req.client else None))
    cfg = db.get(Exam, a.exam_id).security
    if a.status == "IN_PROGRESS" and cfg.get(FLAG.get(body.type, ""), False):
        a.violation_count += 1
        if a.violation_count > cfg.get("max_violations", 1): finalize(db, a, auto=True)
    if a.status == "IN_PROGRESS" and datetime.utcnow() > a.deadline: finalize(db, a, auto=True)
    db.commit(); return {"violations": a.violation_count, "status": a.status}
class ChatIn(BaseModel):
    message: str
@app.post("/api/ai/chat")
def ai_chat(b: ChatIn, u=Depends(need("student")), db=Depends(get_db)):
    return assistant.reply(db, u, b.message[:1000])
@app.get("/api/admin/audit-logs")
def logs(u=Depends(need("admin")), db=Depends(get_db)):
    return [{"action": l.action, "user_id": l.user_id, "at": l.at} for l in db.scalars(select(AuditLog).order_by(AuditLog.id.desc()).limit(200))]
@app.post("/api/admin/registration/{state}")
def toggle(state: str, u=Depends(need("admin")), db=Depends(get_db)):
    db.merge(Setting(key="registration_open", value="1" if state == "open" else "0")); db.add(AuditLog(user_id=u.id, action="REGISTRATION_" + state.upper())); db.commit()
    return {"registration_open": state == "open"}

# ---- الصورة الشخصية: الطالب يضيفها مرة واحدة فقط، والتغيير/الحذف للإدارة فقط ----
import json as _json
MAX_PHOTO = 1_500_000
def _read_photo(file: UploadFile, data: bytes):
    if file.content_type not in ("image/jpeg", "image/png") or len(data) > MAX_PHOTO or not data[:4] in (b"\xff\xd8\xff\xe0", b"\xff\xd8\xff\xe1", b"\xff\xd8\xff\xdb", b"\x89PNG"):
        raise HTTPException(422, "الصورة يجب أن تكون JPEG أو PNG بحجم أقل من 1.5 ميجابايت")
    return file.content_type
@app.post("/api/students/me/photo", status_code=201)
async def add_photo(file: UploadFile = File(...), descriptor: str = Form(""), u=Depends(need("student")), db=Depends(get_db)):
    if db.get(StudentPhoto, u.id): raise HTTPException(403, "الصورة مسجّلة ومقفلة؛ لا يغيّرها إلا مسؤول الإدارة")
    data = await file.read(); mime = _read_photo(file, data)
    db.add(StudentPhoto(user_id=u.id, image=data, mime=mime, descriptor=vault.enc(_json.loads(descriptor)) if descriptor else None, set_by=u.id))
    db.add(AuditLog(user_id=u.id, action="PROFILE_PHOTO_SET", entity="user", entity_id=u.id)); db.commit(); return {"locked": True}
@app.get("/api/students/me/photo")
def my_photo(u=Depends(need("student")), db=Depends(get_db)):
    p = db.get(StudentPhoto, u.id)
    if not p: raise HTTPException(404)
    return Response(p.image, media_type=p.mime)
@app.get("/api/attempts/{aid}/proctor/reference")        # بصمة الوجه المرجعية لصاحب المحاولة فقط
def proctor_ref(aid: int, u=Depends(need("student")), db=Depends(get_db)):
    a = db.get(Attempt, aid); p = db.get(StudentPhoto, u.id)
    if not a or a.student_id != u.id or not p: raise HTTPException(404)
    return {"descriptor": vault.dec(p.descriptor)}
@app.put("/api/admin/students/{sid}/photo")
async def admin_set_photo(sid: int, file: UploadFile = File(...), descriptor: str = Form(""), u=Depends(need("admin")), db=Depends(get_db)):
    if not db.get(User, sid): raise HTTPException(404)
    data = await file.read(); mime = _read_photo(file, data); p = db.get(StudentPhoto, sid)
    desc = vault.enc(_json.loads(descriptor)) if descriptor else None
    if p: p.image, p.mime, p.descriptor, p.set_by, p.set_at = data, mime, desc, u.id, datetime.utcnow()
    else: db.add(StudentPhoto(user_id=sid, image=data, mime=mime, descriptor=desc, set_by=u.id))
    db.add(AuditLog(user_id=u.id, action="PROFILE_PHOTO_CHANGED_BY_ADMIN", entity="user", entity_id=sid)); db.commit(); return {"ok": True}
@app.delete("/api/admin/students/{sid}/photo")
def admin_del_photo(sid: int, u=Depends(need("admin")), db=Depends(get_db)):
    p = db.get(StudentPhoto, sid)
    if p: db.delete(p); db.add(AuditLog(user_id=u.id, action="PROFILE_PHOTO_REMOVED_BY_ADMIN", entity="user", entity_id=sid)); db.commit()
    return {"deleted": bool(p)}

# ---- الحضور بالوجه + الإشعارات ----
class FaceAtt(BaseModel):
    course_id: int
    confidence: float
    liveness: bool
DAYS_AR = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس"]
@app.post("/api/attendance/face", status_code=201)
def face_attendance(b: FaceAtt, u=Depends(need("student")), db=Depends(get_db)):
    # توافق رجعي فقط: إن كانت للطالب بصمة مسجّلة فالمسار الآمن هو /api/attendance/face/verify (القرار على الخادم)
    p = db.get(StudentPhoto, u.id)
    if p and p.descriptor: raise HTTPException(426, "استخدم مسار التحقق الآمن /api/attendance/face/verify")
    if not b.liveness or b.confidence < 70: raise HTTPException(422, "تعذّر التحقق من هويتك")
    c = db.get(Course, b.course_id)
    if not c or not db.scalar(select(Enrollment).where(Enrollment.student_id == u.id, Enrollment.course_id == c.id, Enrollment.status == "ACTIVE")):
        raise HTTPException(403, "غير مسجّل في المادة")
    day, hm = c.slot.split(); now = datetime.now()
    if now.weekday() != (DAYS_AR.index(day) + 6) % 7: raise HTTPException(409, "لا توجد محاضرة لهذه المادة اليوم")
    h, m = map(int, hm.split(":")); late = now.hour * 60 + now.minute - (h * 60 + m) > 15
    db.add(Attendance(student_id=u.id, course_id=c.id, status="LATE" if late else "PRESENT", confidence=b.confidence))
    db.add(AuditLog(user_id=u.id, action="ATTENDANCE_FACE", entity="course", entity_id=c.id)); db.commit()
    return {"status": "LATE" if late else "PRESENT"}
@app.get("/api/students/me/attendance/log")
def my_attendance_log(u=Depends(need("student")), db=Depends(get_db)):
    codes = {c.id: c.code for c in db.scalars(select(Course))}
    return [{"course": codes[a.course_id], "at": a.at.isoformat(), "status": a.status, "confidence": a.confidence}
            for a in db.scalars(select(Attendance).where(Attendance.student_id == u.id).order_by(Attendance.id.desc()).limit(200))]
@app.get("/api/students/me/attendance")
def my_attendance(u=Depends(need("student")), db=Depends(get_db)):
    out = {}
    for a in db.scalars(select(Attendance).where(Attendance.student_id == u.id)):
        out.setdefault(a.course_id, {"PRESENT": 0, "LATE": 0, "ABSENT": 0})[a.status] += 1
    return out
@app.get("/api/notifications")
def notifications(u=Depends(current), db=Depends(get_db)):
    q = select(Notification).where((Notification.user_id == u.id) | ((Notification.user_id.is_(None)) & (Notification.role == u.role))).order_by(Notification.id.desc()).limit(100)
    return [{"id": n.id, "cat": n.cat, "title": n.title, "prio": n.prio, "read": n.read and n.user_id is not None, "broadcast": n.user_id is None, "at": n.created_at} for n in db.scalars(q)]
@app.post("/api/notifications/{nid}/read")
def read_one(nid: int, u=Depends(current), db=Depends(get_db)):
    n = db.get(Notification, nid)
    if not n or (n.user_id not in (None, u.id)): raise HTTPException(404)
    if n.user_id is None: return {"ok": True, "local": True}      # إشعار عام لكل الدور: حالة القراءة محلية لكل مستخدم ولا تُغيَّر للجميع
    n.read = True; db.commit(); return {"ok": True}
@app.post("/api/notifications/read-all")
def read_all(u=Depends(current), db=Depends(get_db)):
    for n in db.scalars(select(Notification).where(Notification.user_id == u.id, Notification.read.is_(False))): n.read = True
    db.commit(); return {"ok": True}
@app.post("/api/students/me/photo-change-request", status_code=201)   # الطالب لا يغيّر صورته؛ يطلب من الإدارة
def photo_request(u=Depends(need("student")), db=Depends(get_db)):
    db.add(Notification(role="admin", cat="admin", title=f"طلب تغيير صورة الطالب {u.name} ({u.login})", prio="high"))
    db.add(AuditLog(user_id=u.id, action="PHOTO_CHANGE_REQUESTED", entity="user", entity_id=u.id)); db.commit(); return {"ok": True}

app.include_router(build_router(need, get_db))
from .api_student import build_router as student_router
app.include_router(student_router(need, get_db, current))
