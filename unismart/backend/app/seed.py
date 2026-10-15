from datetime import datetime, timedelta
from .db import engine, SessionLocal
from .models import *
from .security import hash_pw
Base.metadata.create_all(engine)
with SessionLocal() as db:
    if db.query(User).count(): raise SystemExit("already seeded")
    ahmed = User(login="dr.ahmed", name="د. أحمد علي", role="doctor", password_hash=hash_pw("1234"))
    sara = User(login="dr.sara", name="د. سارة محمد", role="doctor", password_hash=hash_pw("1234"))
    stu = User(login="20240001", name="يوسف محمود", role="student", password_hash=hash_pw("1234"))
    db.add_all([ahmed, sara, stu, User(login="admin", name="إدارة الجامعة", role="admin", password_hash=hash_pw("1234"))]); db.flush()
    rows = [("CS101", "Intro to Programming", 60, 40, ahmed, "السبت 09:00", "A-001"), ("CS201", "Data Structures", 60, 45, sara, "السبت 11:00", "A-002"),
            ("DB301", "Database", 40, 38, ahmed, "الأحد 10:00", "A-101"), ("AI401", "Artificial Intelligence", 35, 20, sara, "الاثنين 12:00", "B-204"),
            ("WEB301", "Web Development", 30, 30, ahmed, "الأحد 10:00", "Lab-2"), ("SE302", "Software Engineering", 40, 22, sara, "الثلاثاء 09:00", "A-305")]
    cs = {r[0]: Course(code=r[0], name=r[1], capacity=r[2], enrolled=r[3], doctor_id=r[4].id, slot=r[5], room=r[6]) for r in rows}
    db.add_all(cs.values()); db.flush()
    db.add_all([Prereq(course_id=cs["DB301"].id, requires_code="CS201"), Prereq(course_id=cs["AI401"].id, requires_code="CS201")])
    db.add_all([Enrollment(student_id=stu.id, course_id=cs[k].id, status="COMPLETED", grade=g, grade_points=p) for k, g, p in [("CS101", "A-", 3.7), ("CS201", "B+", 3.3)]])
    now = datetime.utcnow()
    # تسجيل حالي + حضور + واجبات + إشعارات ليظهر في لوحة الطالب والمرشد بيانات حقيقية
    sara2 = User(login="20240002", name="منى خالد", role="student", password_hash=hash_pw("1234")); db.add(sara2); db.flush()
    for k in ("DB301", "SE302"):
        db.add(Enrollment(student_id=stu.id, course_id=cs[k].id, status="ACTIVE")); cs[k].enrolled += 1
    db.add(Enrollment(student_id=sara2.id, course_id=cs["CS101"].id, status="COMPLETED", grade="C", grade_points=2.0))
    for i, st in enumerate(["PRESENT", "PRESENT", "LATE", "ABSENT", "PRESENT"]):
        db.add(Attendance(student_id=stu.id, course_id=cs["DB301"].id, status=st, at=now - timedelta(days=7 * (5 - i)), confidence=88.0))
    for st in ["PRESENT", "PRESENT", "PRESENT"]: db.add(Attendance(student_id=stu.id, course_id=cs["SE302"].id, status=st, confidence=91.0))
    db.add_all([Assignment(course_id=cs["DB301"].id, title="واجب 2: استعلامات JOIN", kind="assignment", due_at=now + timedelta(days=3)),
                Assignment(course_id=cs["SE302"].id, title="مشروع: وثيقة المتطلبات", kind="assignment", due_at=now + timedelta(days=9)),
                Assignment(course_id=cs["DB301"].id, title="كويز 3: التطبيع", kind="quiz", due_at=now + timedelta(days=5))])
    db.add_all([Notification(user_id=stu.id, cat="academic", title="تم نشر واجب جديد في Database", prio="normal"),
                Notification(role="student", cat="admin", title="آخر موعد للإضافة والحذف بعد أسبوعين", prio="high")])
    ex = Exam(course_id=cs["DB301"].id, title="Database Secure Quiz", start_time=now - timedelta(days=1), end_time=now + timedelta(days=30), duration_minutes=5)
    db.add(ex); db.flush()
    db.add_all([Question(exam_id=ex.id, text="أي أمر SQL يسترجع البيانات؟", options=["INSERT", "SELECT", "DELETE", "ALTER"], correct=1),
                Question(exam_id=ex.id, text="الـ Primary Key يمكن أن يتكرر.", options=["صح", "خطأ"], correct=1)])
    db.add(Setting(key="registration_open", value="1")); db.commit(); print("seeded")
