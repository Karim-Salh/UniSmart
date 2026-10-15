from datetime import datetime
from sqlalchemy import ForeignKey, String, JSON
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
class Base(DeclarativeBase): pass
class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(primary_key=True)
    login: Mapped[str] = mapped_column(String(50), unique=True)
    name: Mapped[str] = mapped_column(String(120))
    role: Mapped[str] = mapped_column(String(10))
    password_hash: Mapped[str] = mapped_column(String(200))
class Prereq(Base):
    __tablename__ = "course_prereqs"
    course_id: Mapped[int] = mapped_column(ForeignKey("courses.id"), primary_key=True)
    requires_code: Mapped[str] = mapped_column(String(20), primary_key=True)
class Course(Base):
    __tablename__ = "courses"
    id: Mapped[int] = mapped_column(primary_key=True)
    code: Mapped[str] = mapped_column(String(20), unique=True)
    name: Mapped[str] = mapped_column(String(120))
    credits: Mapped[int] = mapped_column(default=3)
    capacity: Mapped[int]
    enrolled: Mapped[int] = mapped_column(default=0)
    doctor_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"))
    slot: Mapped[str] = mapped_column(String(40))
    room: Mapped[str | None] = mapped_column(String(30))
    status: Mapped[str] = mapped_column(String(10), default="OPEN")
    prereqs: Mapped[list[Prereq]] = relationship()
class Enrollment(Base):
    __tablename__ = "enrollments"
    id: Mapped[int] = mapped_column(primary_key=True)
    student_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    course_id: Mapped[int] = mapped_column(ForeignKey("courses.id"))
    status: Mapped[str] = mapped_column(String(12))  # ACTIVE | COMPLETED | DROPPED
    grade: Mapped[str | None] = mapped_column(String(3))
    grade_points: Mapped[float | None]
class Exam(Base):
    __tablename__ = "exams"
    id: Mapped[int] = mapped_column(primary_key=True)
    course_id: Mapped[int] = mapped_column(ForeignKey("courses.id"))
    title: Mapped[str] = mapped_column(String(160))
    start_time: Mapped[datetime]
    end_time: Mapped[datetime]
    duration_minutes: Mapped[int]
    attempts_allowed: Mapped[int] = mapped_column(default=1)
    security: Mapped[dict] = mapped_column(JSON, default=lambda: {"tab": True, "fs": True, "copy": True, "camera": False, "max_violations": 1})
class Question(Base):
    __tablename__ = "questions"
    id: Mapped[int] = mapped_column(primary_key=True)
    exam_id: Mapped[int] = mapped_column(ForeignKey("exams.id"))
    text: Mapped[str]
    options: Mapped[list] = mapped_column(JSON)
    correct: Mapped[int]
    topic: Mapped[str | None] = mapped_column(String(80))
class Attempt(Base):
    __tablename__ = "attempts"
    id: Mapped[int] = mapped_column(primary_key=True)
    exam_id: Mapped[int] = mapped_column(ForeignKey("exams.id"))
    student_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    started_at: Mapped[datetime]
    deadline: Mapped[datetime]
    submitted_at: Mapped[datetime | None]
    status: Mapped[str] = mapped_column(String(16), default="IN_PROGRESS")
    violation_count: Mapped[int] = mapped_column(default=0)
    score: Mapped[int | None]
    auto_submitted: Mapped[bool] = mapped_column(default=False)
class Answer(Base):
    __tablename__ = "answers"
    attempt_id: Mapped[int] = mapped_column(ForeignKey("attempts.id"), primary_key=True)
    question_id: Mapped[int] = mapped_column(ForeignKey("questions.id"), primary_key=True)
    choice: Mapped[int]
class ExamEvent(Base):
    __tablename__ = "exam_events"
    id: Mapped[int] = mapped_column(primary_key=True)
    attempt_id: Mapped[int] = mapped_column(ForeignKey("attempts.id"))
    event_type: Mapped[str] = mapped_column(String(30))
    at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
    meta: Mapped[dict | None] = mapped_column(JSON)
    ip: Mapped[str | None] = mapped_column(String(45))
class AuditLog(Base):
    __tablename__ = "audit_logs"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int | None]
    action: Mapped[str] = mapped_column(String(40))
    entity: Mapped[str | None] = mapped_column(String(30))
    entity_id: Mapped[int | None]
    at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
class Setting(Base):
    __tablename__ = "settings"
    key: Mapped[str] = mapped_column(String(40), primary_key=True)
    value: Mapped[str] = mapped_column(String(200))
class StudentPhoto(Base):
    """صورة الطالب الشخصية: يضيفها الطالب مرة واحدة، ولا يغيّرها أو يحذفها إلا مسؤول الإدارة."""
    __tablename__ = "student_photos"
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), primary_key=True)
    image: Mapped[bytes]
    mime: Mapped[str] = mapped_column(String(20))
    descriptor: Mapped[str | None] = mapped_column(String)   # مشفَّر (vault.py)
    set_by: Mapped[int] = mapped_column(ForeignKey("users.id"))
    set_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
class Attendance(Base):
    __tablename__ = "attendance"
    id: Mapped[int] = mapped_column(primary_key=True)
    student_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    course_id: Mapped[int] = mapped_column(ForeignKey("courses.id"))
    at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
    status: Mapped[str] = mapped_column(String(10))      # PRESENT | LATE | ABSENT
    method: Mapped[str] = mapped_column(String(10), default="FACE")
    confidence: Mapped[float | None]
class Notification(Base):
    __tablename__ = "notifications"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"))     # NULL = لكل أصحاب الدور
    role: Mapped[str | None] = mapped_column(String(10))
    cat: Mapped[str] = mapped_column(String(12))
    title: Mapped[str]
    prio: Mapped[str] = mapped_column(String(8), default="normal")
    read: Mapped[bool] = mapped_column(default=False)
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)

class Assignment(Base):
    """واجبات وكويزات المواد (تظهر في لوحة الطالب وفي المرشد)."""
    __tablename__ = "assignments"
    id: Mapped[int] = mapped_column(primary_key=True)
    course_id: Mapped[int] = mapped_column(ForeignKey("courses.id"))
    title: Mapped[str] = mapped_column(String(160))
    kind: Mapped[str] = mapped_column(String(12), default="assignment")   # assignment | quiz | exam
    due_at: Mapped[datetime]
class Submission(Base):
    __tablename__ = "submissions"
    assignment_id: Mapped[int] = mapped_column(ForeignKey("assignments.id"), primary_key=True)
    student_id: Mapped[int] = mapped_column(ForeignKey("users.id"), primary_key=True)
    submitted_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
    score: Mapped[float | None]
