"""المرشد الأكاديمي: محرك فهم لغة داخل المشروع بالكامل (بدون أي خدمة ذكاء اصطناعي خارجية).
تطبيع النص (لهجات + فرانكو) ← اكتشاف النية بالمفردات مع تسامح مع أخطاء الكتابة ← استخراج المادة ← تنفيذ على قاعدة البيانات
بهوية الطالب القادمة من JWT. المحادثة لا تُخزَّن على الخادم؛ مسحها يتم من الواجهة."""
import re
from datetime import datetime
from difflib import SequenceMatcher
from sqlalchemy import select
from .models import *
from . import rules
FRANCO = {"3ayez": "عايز", "3ayza": "عايزه", "asagel": "سجل", "sagel": "سجل", "sajel": "سجل", "matah": "متاح", "mawad": "مواد", "materia": "مادة",
          "doktor": "دكتور", "gadwal": "جدول", "jadwal": "جدول", "daragat": "درجات", "emtehan": "امتحان", "ezay": "ازاي", "shu": "ايش", "wesh": "ايش",
          "meen": "مين", "fein": "فين", "emta": "امتي", "kif": "كيف", "ahzef": "احذف"}
LEX = {
    "other": ["تاني", "غيري", "اخر", "another", "other", "زميلي", "صديقي", "احمد", "محمد", "ahmed", "sara"],
    "drop": ["احذف", "drop", "شيل", "انسحب", "withdraw", "الغي", "remove"],
    "help": ["ازاي", "كيف", "how", "طريقه", "طريقة", "مساعده", "مساعدة", "help"],
    "register": ["سجل", "register", "enroll", "اضف", "add", "ضيف", "اشترك", "join"],
    "plan": ["خطه", "خطة", "plan", "رشح", "اقترح", "recommend", "suggest", "نصيحه", "نصيحة"],
    "doctor": ["دكتور", "دكاتره", "دكاترة", "doctor", "instructor", "professor", "استاذ", "بيدرس", "يدرس", "teach"],
    "avail": ["مفتوح", "متاح", "available", "open", "اقدر", "can", "مواد"],
    "sched": ["جدول", "schedule", "timetable", "محاضرات", "مواعيد", "بكره", "اليوم", "today", "tomorrow"],
    "gpa": ["gpa", "معدل", "درجات", "grades", "marks", "نتيجه", "نتيجة", "تقدير"],
    "exam": ["امتحان", "كويز", "exam", "quiz", "test", "اختبار"],
    "policy": ["سياسه", "سياسة", "حضور", "لائحه", "لائحة", "policy", "attendance", "غياب"],
}
ALIASES = {"DB301": ["داتا بيز", "داتابيز", "قواعد البيانات", "قاعدة البيانات", "database", "dbms"], "AI401": ["ذكاء", "الاي اي", "artificial", "ai"],
           "WEB301": ["web", "ويب"], "SE302": ["هندس", "software"], "NET301": ["network", "شبك"]}
YES = re.compile(r"^(نعم|ايوه|ايوا|اه|اكيد|تمام|ماشي|اوكي|موافق|اكد|يلا|طيب|ok|okay|yes|yeah|sure|confirm|y$)")
NO = re.compile(r"^(لا|الغ|مش|no|nope|cancel|n$)")
PENDING: dict[int, dict] = {}   # في الإنتاج: Redis بدل الذاكرة
PENDING_TTL = 300                # ثوانٍ: التأكيد المتأخر يُلغى تلقائيًا
def _norm(s):
    s = re.sub(r"[\u064b-\u0652\u0640]", "", s.lower()); return re.sub("[أإآ]", "ا", s).replace("ى", "ي")
def _score(t, toks, kws):
    return sum((any(w == k or (len(k) > 4 and SequenceMatcher(None, w, k).ratio() >= .85) for w in toks) if re.search("[a-z]", k) else k in t) for k in kws)
def _find(courses, t, toks):
    for c in courses:
        for a in ALIASES.get(c.code, []):
            if (re.search("[a-z]", a) and (a in toks if len(a) <= 3 else any(w == a or SequenceMatcher(None, w, a).ratio() >= .85 for w in toks))) or (not re.search("[a-z]", a) and a in t):
                return c
    return next((c for c in courses if c.code.lower() in t), None)
def reply(db, user, message: str) -> dict:
    hit = []
    t = re.sub(r"[a-z0-9]+", lambda m: (hit.append(1), FRANCO[m.group()])[1] if m.group() in FRANCO else m.group(), _norm(message))
    ar = bool(re.search("[\u0600-\u06ff]", message)) or bool(hit)
    A = lambda a, e: a if ar else e
    out = lambda text, *s: {"reply": text, "suggestions": list(s)}
    if user.role != "student": return out(A("هذا المرشد مخصص للطلاب.", "This assistant is for students."))
    toks = re.findall(r"[a-z\u0600-\u06ff0-9]+", t)
    p = PENDING.pop(user.id, None)
    if p and datetime.utcnow().timestamp() - p.get("at", 0) > PENDING_TTL: p = None
    if p:
        if YES.match(t):
            ok, msg = (rules.register if p["kind"] == "register" else rules.drop)(db, user.id, p["cid"]); return out(msg)
        if NO.match(t): return out(A("تم إلغاء العملية.", "The operation was cancelled."))
    courses = db.scalars(select(Course)).all(); c = _find(courses, t, toks)
    S = {k: _score(t, toks, v) for k, v in LEX.items()}
    avail = [x for x in courses if not rules.eligibility(db, user.id, x)]
    def stage(kind, cc):
        PENDING[user.id] = {"kind": kind, "cid": cc.id, "at": datetime.utcnow().timestamp()}
        return out(A(f"هل تؤكد {'التسجيل في' if kind == 'register' else 'حذف'} مادة {cc.name}؟", f"Do you confirm {kind} for {cc.name}?"), A("نعم، أكّد", "Yes, confirm"), A("لا، إلغاء", "No, cancel"))
    es = db.scalars(select(Enrollment).where(Enrollment.student_id == user.id)).all()
    if S["other"] and S["gpa"]: return out(A("لا يمكنني عرض درجات طالب آخر؛ يقتصر الوصول على بياناتك الشخصية.", "I cannot show another student's grades."))
    if S["drop"]:
        mine = c and any(e.course_id == c.id and e.status == "ACTIVE" for e in es)
        return stage("drop", c) if mine else out(A("لا أجد هذه المادة ضمن موادك المسجلة.", "I can't find that course among your registered courses."))
    if S["help"] and not c: return out(A("اكتب اسم المادة مع كلمة تسجيل، مثل «سجلني في Database»، وسأتحقق من الشروط وأطلب تأكيدك.", "Write the course name with a verb such as “register me in Database”; I will check requirements and ask for confirmation."))
    if S["register"] and (c or not S["avail"]):
        if not c: return out(A("أي مادة تود التسجيل فيها؟", "Which course would you like to register for?"), *[x.name for x in avail[:3]])
        why = rules.eligibility(db, user.id, c)
        return out(A(f"لا يمكن تسجيلك في {c.name}: {why}.", f"You cannot register for {c.name}: {why}.")) if why else stage("register", c)
    lst = lambda a: "\n".join(f"{i+1}. {x.name} ({x.slot})" for i, x in enumerate(a))
    if S["plan"]:
        cr = sum(db.get(Course, e.course_id).credits for e in es if e.status == "ACTIVE")
        return out(A(f"ساعاتك المسجلة {cr} (المعتاد 12 إلى 18).\nأرشّح لك:\n{lst(avail[:3])}", f"Registered credits: {cr} (usual 12–18).\nSuggested:\n{lst(avail[:3])}"), *[A("سجلني في ", "Register me in ") + x.name for x in avail[:2]])
    if S["doctor"] and c:
        d = db.get(User, c.doctor_id); return out(A(f"مادة {c.name} يدرّسها {d.name} ({c.slot}، قاعة {c.room}).", f"{c.name} is taught by {d.name} ({c.slot}, room {c.room})."))
    if S["avail"] or S["register"]: return out(A("المواد المتاحة لك:\n", "Courses available to you:\n") + lst(avail) if avail else A("لا توجد مواد متاحة حاليًا.", "No courses are currently available."))
    if S["sched"]:
        act = [db.get(Course, e.course_id) for e in es if e.status == "ACTIVE"]
        return out(("\n".join(f"• {x.name}: {x.slot} – {x.room}" for x in act)) or A("جدولك فارغ.", "Your schedule is empty."))
    if S["gpa"]:
        g = [(e.grade_points, db.get(Course, e.course_id).credits, e.grade, db.get(Course, e.course_id).code) for e in es if e.grade_points is not None]
        gpa = round(sum(p * k for p, k, _, _ in g) / sum(k for _, k, _, _ in g), 2) if g else None
        return out(A("معدلك التراكمي: ", "Your GPA: ") + str(gpa) + "\n" + "\n".join(f"• {code}: {gr}" for _, _, gr, code in g))
    if S["exam"]:
        ex = db.scalars(select(Exam).where(Exam.end_time > datetime.utcnow())).first()
        return out(A(f"المتاح: «{ex.title}» ومدته {ex.duration_minutes} دقائق.", f"Available: “{ex.title}” ({ex.duration_minutes} min).") if ex else A("لا توجد اختبارات متاحة.", "No exams available."))
    if S["policy"]: return out(A("لا أملك معلومات مؤكدة عن هذا الأمر حاليًا. يُرجى الرجوع إلى اللائحة الأكاديمية.", "I do not have confirmed information on this; please refer to the academic regulations."))
    return out(A("لم أتمكن من فهم الطلب بدقة. يمكنني مساعدتك في المواد والجدول والدرجات والتسجيل.", "I could not understand precisely. I can help with courses, schedule, grades and registration."))
