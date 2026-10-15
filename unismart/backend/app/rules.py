"""قواعد التسجيل: المصدر الوحيد للحقيقة. الـ API والمساعد الذكي يستخدمان نفس الدوال."""
from sqlalchemy import select
from .models import *
def reg_open(db): s = db.get(Setting, "registration_open"); return s is None or s.value == "1"
def eligibility(db, sid: int, c: Course) -> str | None:
    if not reg_open(db): return "باب التسجيل مغلق"
    if c.status != "OPEN": return "المادة غير مفتوحة"
    mine = db.scalars(select(Enrollment).where(Enrollment.student_id == sid)).all()
    if any(e.course_id == c.id and e.status in ("ACTIVE", "COMPLETED") for e in mine): return "مسجل في المادة بالفعل"
    if c.enrolled >= c.capacity: return "المادة مكتملة العدد"
    done = {db.get(Course, e.course_id).code for e in mine if e.status == "COMPLETED"}
    miss = [p.requires_code for p in c.prereqs if p.requires_code not in done]
    if miss: return "المتطلبات السابقة غير مستوفاة: " + ", ".join(miss)
    if any(db.get(Course, e.course_id).slot == c.slot for e in mine if e.status == "ACTIVE"): return "تعارض في الجدول"
    return None
def register(db, sid: int, course_id: int):
    c = db.scalar(select(Course).where(Course.id == course_id).with_for_update())  # قفل الصف يمنع تجاوز السعة
    if not c: return False, "المادة غير موجودة"
    why = eligibility(db, sid, c)
    if why: return False, why
    db.add(Enrollment(student_id=sid, course_id=c.id, status="ACTIVE")); c.enrolled += 1
    db.add(AuditLog(user_id=sid, action="COURSE_REGISTERED", entity="course", entity_id=c.id)); db.commit()
    return True, "تم التسجيل في " + c.name
def drop(db, sid: int, course_id: int):
    e = db.scalar(select(Enrollment).where(Enrollment.student_id == sid, Enrollment.course_id == course_id, Enrollment.status == "ACTIVE"))
    if not e: return False, "غير مسجل في المادة"
    e.status = "DROPPED"; db.get(Course, course_id).enrolled -= 1
    db.add(AuditLog(user_id=sid, action="COURSE_DROPPED", entity="course", entity_id=course_id)); db.commit()
    return True, "تم حذف المادة"
