"""واجهات لوحة الطالب: ملخص، درجات، جدول، واجبات، تحدّي التحقق بالوجه. كلها بهوية JWT فقط (لا تقبل معرّف طالب في المسار)."""
import math, os, secrets, time
from datetime import datetime, timedelta
from fastapi import Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from .models import *
from . import vault

DEPARTMENT = os.environ.get("DEPARTMENT", "كلية الحاسبات والذكاء الاصطناعي")
PROGRAM_CREDITS = int(os.environ.get("PROGRAM_CREDITS", "132"))
DAYS_AR = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"]
PY_WEEKDAY = {"الأحد": 6, "الاثنين": 0, "الثلاثاء": 1, "الأربعاء": 2, "الخميس": 3, "الجمعة": 4, "السبت": 5}
LECTURE_MIN = 90
FACE_THRESHOLD = float(os.environ.get("FACE_THRESHOLD", "0.55"))     # مسافة إقليدية (face-api/ResNet-34)
MIN_CONF = 70.0
CHALLENGES: dict[str, tuple[int, float]] = {}                        # nonce -> (user_id, expiry)؛ في الإنتاج Redis

def semester_label(now=None):
    n = now or datetime.now(); return ("الفصل الدراسي الأول (خريف " if n.month >= 9 or n.month == 1 else "الفصل الدراسي الثاني (ربيع " if n.month <= 6 else "الفصل الصيفي (") + f"{n.year})"
def standing(gpa):
    return None if gpa is None else "امتياز" if gpa >= 3.5 else "جيد جدًا" if gpa >= 3.0 else "جيد" if gpa >= 2.5 else "مقبول" if gpa >= 2.0 else "إنذار أكاديمي"
def level_of(credits): return 1 if credits < 33 else 2 if credits < 66 else 3 if credits < 99 else 4
def parse_slot(slot: str):
    day, hm = slot.split(); h, m = map(int, hm.split(":")); return day, h * 60 + m
def hhmm(mins): return f"{mins // 60:02d}:{mins % 60:02d}"
def euclid(a, b): return math.sqrt(sum((x - y) ** 2 for x, y in zip(a, b)))
def match_confidence(d: float, thr: float = FACE_THRESHOLD) -> float: return round(1000 / (1 + math.exp(12 * (d - thr)))) / 10   # نفس معادلة الواجهة

def gpa_of(db, sid):
    es = [e for e in db.scalars(select(Enrollment).where(Enrollment.student_id == sid, Enrollment.status == "COMPLETED")) if e.grade_points is not None]
    cr = {e.id: db.get(Course, e.course_id).credits for e in es}
    tot = sum(cr.values()); return (round(sum(e.grade_points * cr[e.id] for e in es) / tot, 2) if tot else None), tot, es

class FaceChallengeOut(BaseModel):
    nonce: str; expires_in: int; steps: list[str]
class FaceAtt(BaseModel):
    course_id: int
    confidence: float | None = None            # قديم: يُتجاهل عند وجود descriptor
    liveness: bool = False
    descriptor: list[float] | None = Field(default=None, min_length=128, max_length=128)
    nonce: str | None = None
    blink: bool = False
    turn: bool = False

def build_router(need, get_db, current):
    from fastapi import APIRouter
    r = APIRouter()

    @r.get("/api/students/me/dashboard")
    def dashboard(u=Depends(need("student")), db=Depends(get_db)):
        gpa, earned, done = gpa_of(db, u.id)
        es = db.scalars(select(Enrollment).where(Enrollment.student_id == u.id)).all()
        cm = {c.id: c for c in db.scalars(select(Course))}
        active = [cm[e.course_id] for e in es if e.status == "ACTIVE"]
        att = {"PRESENT": 0, "LATE": 0, "ABSENT": 0}
        for a in db.scalars(select(Attendance).where(Attendance.student_id == u.id)): att[a.status] += 1
        n = sum(att.values()); now = datetime.utcnow(); ids = [c.id for c in active] or [0]
        sub = {s.assignment_id for s in db.scalars(select(Submission).where(Submission.student_id == u.id))}
        up = [{"kind": a.kind, "title": a.title, "course": cm[a.course_id].name, "code": cm[a.course_id].code, "at": a.due_at.isoformat()} for a in db.scalars(select(Assignment).where(Assignment.course_id.in_(ids), Assignment.due_at >= now).order_by(Assignment.due_at)) if a.id not in sub]
        up += [{"kind": "exam", "title": x.title, "course": cm[x.course_id].name, "code": cm[x.course_id].code, "at": x.start_time.isoformat()} for x in db.scalars(select(Exam).where(Exam.course_id.in_(ids), Exam.end_time > now).order_by(Exam.start_time))]
        recent = [{"kind": "grade", "title": f"{cm[e.course_id].name}: {e.grade}", "at": None} for e in done[-3:]]
        recent += [{"kind": "attendance", "title": f"حضور {cm[a.course_id].name} ({a.status})", "at": a.at.isoformat()} for a in db.scalars(select(Attendance).where(Attendance.student_id == u.id).order_by(Attendance.id.desc()).limit(4))]
        unread = db.scalars(select(Notification).where(((Notification.user_id == u.id) | ((Notification.user_id.is_(None)) & (Notification.role == "student"))), Notification.read.is_(False))).all()
        return {"student": {"id": u.id, "login": u.login, "name": u.name, "department": DEPARTMENT, "level": level_of(earned), "semester": semester_label(), "gpa": gpa,
                            "standing": standing(gpa), "credits_earned": earned, "has_photo": db.get(StudentPhoto, u.id) is not None},
                "courses": {"total": len(cm), "completed": len(done), "current": len(active), "progress_pct": min(100, round(earned / PROGRAM_CREDITS * 100)), "program_credits": PROGRAM_CREDITS},
                "attendance": {"rate": None if not n else round((att["PRESENT"] + att["LATE"]) / n * 100), "present": att["PRESENT"], "late": att["LATE"], "absent": att["ABSENT"]},
                "upcoming": sorted(up, key=lambda x: x["at"])[:8], "recent": recent, "unread_notifications": len(unread)}

    @r.get("/api/students/me/grades")
    def grades(u=Depends(need("student")), db=Depends(get_db)):
        gpa, earned, done = gpa_of(db, u.id)
        rows = [{"code": db.get(Course, e.course_id).code, "name": db.get(Course, e.course_id).name, "credits": db.get(Course, e.course_id).credits, "grade": e.grade, "points": e.grade_points} for e in done]
        quizzes = [{"exam": db.get(Exam, a.exam_id).title, "score": a.score, "status": a.status, "at": a.submitted_at.isoformat() if a.submitted_at else None}
                   for a in db.scalars(select(Attempt).where(Attempt.student_id == u.id, Attempt.status != "IN_PROGRESS"))]
        return {"gpa": gpa, "standing": standing(gpa), "credits_earned": earned, "courses": rows, "quizzes": quizzes}

    @r.get("/api/students/me/schedule")
    def schedule(u=Depends(need("student")), db=Depends(get_db)):
        now = datetime.now(); nowm = now.hour * 60 + now.minute; out = []
        for e in db.scalars(select(Enrollment).where(Enrollment.student_id == u.id, Enrollment.status == "ACTIVE")):
            c = db.get(Course, e.course_id); day, st = parse_slot(c.slot); today = PY_WEEKDAY.get(day) == now.weekday()
            status = "later" if not today else "upcoming" if nowm < st else "ongoing" if nowm < st + LECTURE_MIN else "done"
            doc = db.get(User, c.doctor_id) if c.doctor_id else None
            out.append({"course_id": c.id, "code": c.code, "name": c.name, "instructor": doc.name if doc else None, "room": c.room, "day": day,
                        "start": hhmm(st), "end": hhmm(st + LECTURE_MIN), "today": today, "status": status})
        order = {d: i for i, d in enumerate(DAYS_AR)}
        return {"semester": semester_label(), "classes": sorted(out, key=lambda x: (order.get(x["day"], 9), x["start"]))}

    @r.get("/api/students/me/assignments")
    def assignments(u=Depends(need("student")), db=Depends(get_db)):
        ids = [e.course_id for e in db.scalars(select(Enrollment).where(Enrollment.student_id == u.id, Enrollment.status == "ACTIVE"))] or [0]
        sub = {s.assignment_id: s for s in db.scalars(select(Submission).where(Submission.student_id == u.id))}
        return [{"id": a.id, "title": a.title, "kind": a.kind, "course": db.get(Course, a.course_id).name, "code": db.get(Course, a.course_id).code, "due_at": a.due_at.isoformat(), "submitted": a.id in sub, "score": sub[a.id].score if a.id in sub else None}
                for a in db.scalars(select(Assignment).where(Assignment.course_id.in_(ids)).order_by(Assignment.due_at))]

    @r.post("/api/assignments/{aid}/submit", status_code=201)
    def submit(aid: int, u=Depends(need("student")), db=Depends(get_db)):
        a = db.get(Assignment, aid)
        if not a or not db.scalar(select(Enrollment).where(Enrollment.student_id == u.id, Enrollment.course_id == a.course_id, Enrollment.status == "ACTIVE")): raise HTTPException(404)
        if db.get(Submission, (aid, u.id)): raise HTTPException(409, "تم التسليم مسبقًا")
        if datetime.utcnow() > a.due_at: raise HTTPException(409, "انتهى موعد التسليم")
        db.add(Submission(assignment_id=aid, student_id=u.id)); db.add(AuditLog(user_id=u.id, action="ASSIGNMENT_SUBMITTED", entity="assignment", entity_id=aid)); db.commit()
        return {"ok": True}

    # ---- التحقق بالوجه: القرار على الخادم ----
    @r.get("/api/attendance/face/challenge", response_model=FaceChallengeOut)
    def challenge(u=Depends(need("student"))):
        for k in [k for k, (_, exp) in CHALLENGES.items() if exp < time.time()]: CHALLENGES.pop(k, None)
        n = secrets.token_urlsafe(16); CHALLENGES[n] = (u.id, time.time() + 90)
        return {"nonce": n, "expires_in": 90, "steps": ["blink", "turn_head"]}

    @r.post("/api/attendance/face/verify", status_code=201)
    def verify(b: FaceAtt, u=Depends(need("student")), db=Depends(get_db)):
        p = db.get(StudentPhoto, u.id); ref = vault.dec(p.descriptor) if p and p.descriptor else None
        if not ref: raise HTTPException(422, "لا توجد بصمة وجه مسجّلة لك؛ تواصل مع الإدارة")
        if not b.descriptor or not b.nonce: raise HTTPException(422, "بيانات التحقق ناقصة")
        who, exp = CHALLENGES.pop(b.nonce, (None, 0))                        # استخدام واحد: يمنع إعادة إرسال نفس الطلب
        if who != u.id or exp < time.time(): raise HTTPException(422, "انتهت صلاحية التحقق؛ أعد المحاولة")
        if not (b.blink and b.turn): raise HTTPException(422, "لم يكتمل تحدّي الحيوية")
        d = euclid(ref, b.descriptor); conf = match_confidence(d)
        if d > FACE_THRESHOLD or conf < MIN_CONF:
            db.add(AuditLog(user_id=u.id, action="FACE_VERIFY_FAILED", entity="course", entity_id=b.course_id)); db.commit()
            raise HTTPException(422, "تعذّر التحقق من هويتك")
        return _record(db, u, b.course_id, conf, "FACE")
    return r

def _record(db, u, course_id, conf, method):
    c = db.get(Course, course_id)
    if not c or not db.scalar(select(Enrollment).where(Enrollment.student_id == u.id, Enrollment.course_id == c.id, Enrollment.status == "ACTIVE")): raise HTTPException(403, "غير مسجّل في المادة")
    day, st = parse_slot(c.slot); now = datetime.now()
    if PY_WEEKDAY.get(day) != now.weekday(): raise HTTPException(409, "لا توجد محاضرة لهذه المادة اليوم")
    if db.scalar(select(Attendance).where(Attendance.student_id == u.id, Attendance.course_id == c.id, Attendance.at >= datetime.utcnow() - timedelta(hours=12))):
        raise HTTPException(409, "تم تسجيل حضورك لهذه المحاضرة")
    late = now.hour * 60 + now.minute - st > 15
    db.add(Attendance(student_id=u.id, course_id=c.id, status="LATE" if late else "PRESENT", method=method, confidence=conf))
    db.add(AuditLog(user_id=u.id, action="ATTENDANCE_FACE", entity="course", entity_id=c.id)); db.commit()
    return {"status": "LATE" if late else "PRESENT", "confidence": conf}
