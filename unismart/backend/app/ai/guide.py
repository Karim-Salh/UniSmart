"""المرشد الأكاديمي الذكي (محلي بالكامل، بدون أي API خارجي).

المبادئ:
1) الخصوصية: كل بيانات الطالب الخاصة تُقرأ بـ user.id القادم من JWT فقط. لا يوجد أي مسار يقبل معرّف طالب آخر.
2) لا هلوسة: الأرقام (معدل، حضور، مواعيد) تأتي من قاعدة البيانات فقط. المحتوى التعليمي يأتي من قاعدة معرفة داخلية (knowledge.py)؛ وإن لم يوجد موضوع مطابق نقول ذلك صراحة.
3) النزاهة: لا نحل ولا نلمّح لإجابات أي اختبار رسمي؛ ولا نقدّم أي مساعدة أكاديمية أثناء محاولة اختبار جارية.
"""
import re
from collections import defaultdict
from datetime import datetime, timedelta
from sqlalchemy import select
from ..models import Assignment, Attempt, Attendance, Course, Enrollment, Exam, Submission, User
from .. import assistant
import random
from .knowledge import TOPICS, COURSE_TOPICS
from .knowledge_en import PRACTICE_EN

# ---------- أنماط النية ----------
CHEAT = re.compile(r"حل (?:لي |ل[يى] )?(?:ال)?(?:كويز|امتحان|اختبار)|جاوب (?:ال)?(?:كويز|امتحان|اختبار)|اجابات (?:ال)?(?:كويز|امتحان|اختبار)|solve (?:my |the )?(?:exam|quiz|test)|answer (?:my |the )?(?:exam|quiz|test)|cheat|غش", re.I)
STUDY = re.compile(r"اذاكر|مذاكر|ذاكر|مراجع|خط[هة] (?:مذاكر|اسبوع|يوم|مراجع)|study|revise|revision|plan my|weekly plan|daily|schedule my study|how (?:do|should|can) i (?:prepare|revise)|prepare for|i have an? (?:exam|test)", re.I)
WEAK = re.compile(r"اضعف|ضعيف|احتاج (?:ل)?تحسين|محتاج تحسين|تحسينها|المواد الضعيف|weak|improve|struggl|need improvement", re.I)
ATT = re.compile(r"حضوري|غيابي|نسب[هة] حضور|my attendance|attendance rate", re.I)
UPC = re.compile(r"عندي (?:ايه|إيه|ايش|ايه قادم)|الجاي|القادم|مواعيد(?:ي)?|deadline|upcoming|due|ميعاد التسليم|موعد التسليم|واجبات|امتحاناتي|اختباراتي|my exams|متي|امتي|امتى|إمتى", re.I)
GRADE = re.compile(r"درجاتي|درجتي|معدلي|تقديري|my grades?|my gpa", re.I)
COURSES = re.compile(r"موادي|مواد مسجل|my courses|registered courses", re.I)
PRACTICE = re.compile(r"اختبرني|[اأإ]س[أا]لني|اسئل[هة] تدريب|تمارين|mock|practice|quiz me|quiz|test me|ask me|drill me|اسئلة|أسئلة|questions", re.I)
EXPLAIN = re.compile(r"اشرح|وضح|يعني ايه|يعني إيه|ما هو|ما هي|explain|what is|what are|define", re.I)
ANSWERS = re.compile(r"^(?:الاجابات|الإجابات|الاجابه|الإجابة|answers?|show answers?|show me the answer|اشرح الاجابات|اشرح الإجابات)", re.I)
HINT = re.compile(r"تلميح|hint", re.I)
LANG_EN = re.compile(r"بالانجليز|بالإنجليز|انجليزي|إنجليزي|انجلش|in english|english please|speak english|ask me in english|answer in english|reply in english", re.I)
LANG_AR = re.compile(r"بالعربي|بالعربية|in arabic|speak arabic|answer in arabic|reply in arabic", re.I)
GREET = re.compile(r"^\s*(?:hi|hello|hey|السلام|سلام|مرحب|اهلا|أهلا|هلا|صباح|مساء)", re.I)
THANKS = re.compile(r"شكرا|شكراً|تسلم|thanks|thank you|thx", re.I)
HELP = re.compile(r"بتعمل ايه|بتعمل إيه|ماذا تستطيع|تقدر تساعدني|what can you do|how can you help|^\s*help\s*$|^\s*مساعدة\s*$", re.I)
TODAY = re.compile(r"اذاكر ايه|اذاكر إيه|ماذا اذاكر اليوم|خطة اليوم|what (?:should|do) i (?:study|do) today|today'?s plan|plan for today", re.I)
QSTOP = re.compile(r"^\s*(?:stop|quit|exit|end quiz|end|انهاء|إنهاء|وقف|كفاية|خلاص)\s*$", re.I)
QSKIP = re.compile(r"^\s*(?:skip|next|تخطي|التالي|عدي)\s*$", re.I)
DAYS = {"الاحد": 6, "الأحد": 6, "الاثنين": 0, "الإثنين": 0, "الثلاثاء": 1, "الاربعاء": 2, "الأربعاء": 2, "الخميس": 3, "الجمعه": 4, "الجمعة": 4, "السبت": 5,
        "sunday": 6, "monday": 0, "tuesday": 1, "wednesday": 2, "thursday": 3, "friday": 4, "saturday": 5}
DAY_NAME_AR = {0: "الاثنين", 1: "الثلاثاء", 2: "الأربعاء", 3: "الخميس", 4: "الجمعة", 5: "السبت", 6: "الأحد"}

# جلسات قصيرة العمر (آخر تدريب لكل طالب) — تنتهي تلقائيًا؛ في الإنتاج يُستبدل بـ Redis
SESSIONS: dict[int, dict] = {}
TTL = timedelta(minutes=30)
def _put(uid, key, val): SESSIONS[uid] = {**(SESSIONS.get(uid) or {}), key: val, "at": datetime.utcnow()}
def _get(uid, key):
    s = SESSIONS.get(uid)
    if not s: return None
    if datetime.utcnow() - s["at"] > TTL: SESSIONS.pop(uid, None); return None
    return s.get(key)

def S(p, m): return p.search(m) or p.search(assistant._norm(m))        # يطابق النص الأصلي والمطبَّع (أ/إ/ى)
INTENTS = (CHEAT, STUDY, WEAK, ATT, PRACTICE, EXPLAIN, UPC, GRADE, COURSES, LANG_EN, LANG_AR, GREET, THANKS, HELP, TODAY)
def matches(user, message: str) -> bool:
    """هل هذه الرسالة من اختصاص المرشد الدراسي؟ (للطلاب فقط)"""
    if user.role != "student": return False
    if _get(user.id, "quiz"): return True                    # أثناء اختبار تدريبي: المرشد يستقبل كل الرسائل
    return any(S(p, message) for p in INTENTS) and not _is_registration(message)

def _is_registration(m): return bool(re.search(r"سجل(?:ني)?|ضيف|احذف|register me|enroll|drop", m, re.I)) and not STUDY.search(m)

# ---------- سياق الطالب الخاص (بهويته فقط) ----------
def student_context(db, sid: int) -> dict:
    es = db.scalars(select(Enrollment).where(Enrollment.student_id == sid)).all()
    cmap = {c.id: c for c in db.scalars(select(Course))}
    done = [e for e in es if e.status == "COMPLETED" and e.grade_points is not None]
    cr = sum(cmap[e.course_id].credits for e in done)
    gpa = round(sum(e.grade_points * cmap[e.course_id].credits for e in done) / cr, 2) if cr else None
    att = defaultdict(lambda: {"PRESENT": 0, "LATE": 0, "ABSENT": 0})
    for a in db.scalars(select(Attendance).where(Attendance.student_id == sid)): att[a.course_id][a.status] += 1
    active = [cmap[e.course_id] for e in es if e.status == "ACTIVE"]
    ids = [c.id for c in active]
    now = datetime.utcnow()
    asg = db.scalars(select(Assignment).where(Assignment.course_id.in_(ids or [0]), Assignment.due_at >= now - timedelta(hours=1)).order_by(Assignment.due_at)).all()
    sub = {s.assignment_id for s in db.scalars(select(Submission).where(Submission.student_id == sid))}
    exams = db.scalars(select(Exam).where(Exam.course_id.in_(ids or [0]), Exam.end_time > now).order_by(Exam.start_time)).all()
    live = db.scalar(select(Attempt).where(Attempt.student_id == sid, Attempt.status == "IN_PROGRESS", Attempt.deadline > now))
    return {"gpa": gpa, "credits": cr, "history": [(cmap[e.course_id], e.grade, e.grade_points) for e in done], "active": active, "att": dict(att),
            "assignments": [(a, cmap[a.course_id]) for a in asg if a.id not in sub], "exams": [(x, cmap[x.course_id]) for x in exams], "in_exam": live is not None, "cmap": cmap}

def att_rate(rec): 
    n = sum(rec.values()); return None if not n else round((rec["PRESENT"] + rec["LATE"]) / n * 100)

def weak_courses(ctx) -> list[dict]:
    """مادة ضعيفة = درجتها أقل من متوسط درجات الطالب، أو حضورها أقل من 75% في السجلات المتاحة."""
    out, hist = [], ctx["history"]
    avg = sum(p for _, _, p in hist) / len(hist) if hist else None
    for c, g, p in hist:
        if avg is not None and p < avg - 0.05: out.append({"course": c, "why": "grade", "detail": f"{g} ({p}) أقل من متوسطك {avg:.2f}", "detail_en": f"{g} ({p}) is below your average {avg:.2f}", "sev": avg - p})
    for c in ctx["active"]:
        r = att_rate(ctx["att"].get(c.id, {"PRESENT": 0, "LATE": 0, "ABSENT": 0}))
        if r is not None and r < 75: out.append({"course": c, "why": "attendance", "detail": f"حضورك {r}% (أقل من 75%)", "detail_en": f"attendance {r}% (below 75%)", "sev": (75 - r) / 25})
    return sorted(out, key=lambda x: -x["sev"])

# ---------- فهم الرسالة ----------
def _norm(m): return assistant._norm(m)
def find_course(ctx, msg: str):
    t = _norm(msg); toks = re.findall(r"[a-z\u0600-\u06ff0-9]+", t)
    for c in sorted(ctx["cmap"].values(), key=lambda c: c.code not in {x.code for x in ctx["active"]}):
        if c.code.lower() in t or c.name.lower() in t: return c
        for a in assistant.ALIASES.get(c.code, []):
            if (a in toks) if re.fullmatch(r"[a-z]{1,3}", a) else (a in t): return c
    return None
_h = lambda s: _norm(s).replace("ة", "ه")      # توحيد ة/ه لمطابقة الكلمات المفتاحية
def find_topic(msg: str):
    t = _h(msg); toks = set(re.findall(r"[a-z0-9\u0600-\u06ff]+", t))
    ok = lambda w: (w in toks) if re.fullmatch(r"[a-z0-9]{1,4}", w) else (w in t)    # الكلمات اللاتينية القصيرة تُطابَق ككلمة كاملة
    hits = [(k, [w for w in tp["kw"] if ok(_h(w))]) for k, tp in TOPICS.items()]
    hits = [(k, ws) for k, ws in hits if ws]
    return max(hits, key=lambda h: max(len(w) for w in h[1]))[0] if hits else None
def target_days(msg: str):
    t = msg.lower()
    for k, wd in DAYS.items():
        if k.lower() in t: return (wd - datetime.now().weekday()) % 7, DAY_NAME_AR[wd]
    if re.search(r"بكره|بكرة|غدا|tomorrow", t): return 1, None
    m = re.search(r"(\d+)\s*(?:ايام|أيام|يوم|days?)", t)
    return (int(m.group(1)), None) if m else (None, None)
def fmt_when(d: datetime, window=False) -> str:
    left = (d.date() - datetime.utcnow().date()).days
    if window and d <= datetime.utcnow(): return "متاح الآن"
    return "اليوم" if left == 0 else "غدًا" if left == 1 else "بعد يومين" if left == 2 else f"بعد {left} أيام" if left > 0 else "متأخر"
def n_days(n: int) -> str: return "يوم" if n == 1 else "يومين" if n == 2 else f"{n} أيام" if n <= 10 else f"{n} يومًا"

# ---------- بناء الردود ----------
def study_plan(ctx, course, topic_key, days, ar=True):
    """خطة مذاكرة مبنية على مواضيع المادة (قاعدة المعرفة) وعلى عدد الأيام المتاح، مع أولوية للموضوع الأضعف المذكور."""
    keys = COURSE_TOPICS.get(course.code if course else "", []) or ([topic_key] if topic_key else [])
    if topic_key and topic_key in keys: keys = [topic_key] + [k for k in keys if k != topic_key]
    elif topic_key: keys = [topic_key] + keys
    if not keys: return None
    days = max(1, min(days or 5, 14)); tasks = []
    lead = TOPICS[keys[0]]["ar" if ar else "en"]
    for d in range(days):
        if d == days - 1 and days > 1: tasks.append((d, "مراجعة شاملة + حل نموذج تجريبي كامل" if ar else "Full review + one complete mock quiz"))
        else:
            k = keys[d % len(keys)] if d else keys[0]
            nm = TOPICS[k]["ar" if ar else "en"]
            tasks.append((d, (f"{nm}: اقرأ المفهوم ثم حل 5 أسئلة تدريب وراجع أخطاءك" if ar else f"{nm}: read the concept, solve 5 practice questions, review mistakes") if d % 2 == 0 else (f"{nm}: تطبيق عملي (أمثلة بنفسك) ثم اختبر نفسك" if ar else f"{nm}: hands-on examples, then self-test")))
    return lead, tasks

# ---------- الاختبار التدريبي التفاعلي (سؤال بسؤال) ----------
LETTERS = {"a": 0, "b": 1, "c": 2, "d": 3, "أ": 0, "ا": 0, "ب": 1, "ج": 2, "د": 3, "1": 0, "2": 1, "3": 2, "4": 3}
def _q(item, ar):
    tk, i = item; base = TOPICS[tk]["practice"][i]
    if ar: return base
    en = PRACTICE_EN[tk][i]; return {**en, "answer": base["answer"]}
def _pick(topic, course, n=5):
    keys = [topic] if topic else (COURSE_TOPICS.get(course.code) if course else None) or []
    pool = [(k, i) for k in keys for i in range(len(TOPICS[k]["practice"]))]
    random.shuffle(pool)
    if topic is None and len(keys) > 1:                      # اختبار شامل للمادة: سؤال على الأقل من كل موضوع قدر الإمكان
        first = {}; [first.setdefault(k, (k, i)) for k, i in pool]; rest = [x for x in pool if x not in first.values()]
        pool = list(first.values()) + rest
    return pool[:n]
def parse_choice(msg, options):
    t = _h(msg).strip().strip(".)،:").lower()
    if t in LETTERS and LETTERS[t] < len(options): return LETTERS[t]
    for i, o in enumerate(options):
        if _h(o).strip().lower() == t: return i
    return None
def _ask(qz, ar):
    A = lambda a, e: a if ar else e
    q = _q(qz["items"][qz["i"]], ar); n = len(qz["items"])
    body = f"{A('سؤال','Question')} {qz['i']+1}/{n}\n{q['q']}\n" + "\n".join(f"  {chr(97+j)}. {o}" for j, o in enumerate(q["options"]))
    return body, [*q["options"], A("تلميح", "Hint"), A("تخطي", "Skip")], [{"q": q["q"], "options": q["options"]}]
def _finish(uid, qz, ar):
    A = lambda a, e: a if ar else e
    n = len(qz["items"]); sc = qz["score"]; pct = round(sc / n * 100); SESSIONS.get(uid, {}).pop("quiz", None)
    weak = []; [weak.append(k) for k in qz["wrong"] if k not in weak]
    msg = A("ممتاز، مستواك قوي في هذه النقاط.", "Excellent, you're solid on these points.") if pct >= 80 else A("جيد، وبقليل من المراجعة تتحسن أكثر.", "Good, a little revision will lift it further.") if pct >= 50 else A("تحتاج مراجعة أساسيات هذا الموضوع قبل المحاولة التالية.", "You need to revisit the basics before the next try.")
    sugg = [A(f"اشرح لي {TOPICS[weak[0]]['ar']}", f"Explain {TOPICS[weak[0]]['en']}")] if weak else []
    sugg += [A("اختبرني مرة أخرى", "Quiz me again"), A("اعمل لي خطة مذاكرة", "Make me a study plan")]
    wk = (A("\\nمواضيع تحتاج مراجعة: ", "\\nTopics to review: ") + "، ".join(TOPICS[k]["ar" if ar else "en"] for k in weak)) if weak else ""
    return f"{A('انتهى الاختبار التدريبي','Practice quiz finished')}: {sc}/{n} ({pct}%)\\n{msg}{wk}", sugg

def _caps(user, ar):
    A = lambda a, e: a if ar else e; nm = user.name.split()[0]
    return (A(f"أهلًا {nm}! أنا مرشدك الأكاديمي. أقدر:\\n• أبني لك خطة مذاكرة لأي امتحان\\n• أحدد المواد التي تحتاج تحسينًا من درجاتك وحضورك\\n• أختبرك بأسئلة تدريب سؤالًا بسؤال مع تلميحات وشرح\\n• أشرح لك مفاهيم المواد\\n• أخبرك بمواعيدك القادمة ونسبة حضورك\\nويمكنك أن تطلب مني الكلام بالإنجليزية في أي وقت.",
              f"Hi {nm}! I'm your academic guide. I can:\\n• Build a study plan for any exam\\n• Find which courses need work from your grades and attendance\\n• Quiz you question by question with hints and explanations\\n• Explain course concepts\\n• Tell you what's coming up and your attendance rate\\nYou can switch between Arabic and English at any time."),
            [A("اعمل لي خطة مذاكرة", "Make me a study plan"), A("اختبرني", "Quiz me"), A("المواد التي أحتاج تحسينها", "Which courses need work?"), A("ما القادم عليّ؟", "What's coming up?")])

def respond(db, user, message: str, dialect: str = "msa", lang: str | None = None) -> dict | None:
    uid = user.id; m = message.strip()
    # ---- اللغة: أمر في الرسالة > اختيار الواجهة > لغة النص ----
    if S(LANG_EN, m): ar, switched = False, "en"
    elif S(LANG_AR, m): ar, switched = True, "ar"
    elif lang in ("ar", "en"): ar, switched = lang == "ar", None
    else:
        q0 = _get(uid, "quiz"); ar, switched = (q0["ar"] if q0 else bool(re.search("[\u0600-\u06ff]", m))), None      # أثناء الاختبار تبقى لغته
    A = lambda a, e: a if ar else e
    def out(text, *s, **kw): return {"reply": text, "suggestions": [x for x in s if x], "citations": [], "sources": kw.get("sources", []), "practice": kw.get("practice"), "lang": "ar" if ar else "en"}
    ctx = student_context(db, uid)
    # 1) النزاهة الأكاديمية
    if ctx["in_exam"]: SESSIONS.get(uid, {}).pop("quiz", None); return out(A("لديك محاولة اختبار جارية الآن؛ لا أقدّم أي مساعدة أكاديمية أثناء الاختبار. بعد التسليم أساعدك في المراجعة.", "You have an exam attempt in progress; I can't give academic help during an exam. After you submit I'll help you review."), sources=["policy"])
    if S(CHEAT, m): return out(A("لا أستطيع حل اختبار رسمي أو مساعدتك على الغش. أقدر أشرح المفهوم، وأعمل لك أسئلة تدريب وتلميحات وأشرح أخطاءك.", "I can't solve an official exam or help with cheating. I can explain concepts, make practice questions, give hints and explain your mistakes."), A("اختبرني في SQL", "Quiz me on SQL"), A("اشرح لي JOIN", "Explain JOIN"), sources=["policy"])
    # 2) اختبار تدريبي جارٍ
    qz = _get(uid, "quiz")
    if qz:
        q = _q(qz["items"][qz["i"]], ar); idx = parse_choice(m, q["options"])
        if S(QSTOP, m): SESSIONS[uid].pop("quiz", None); return out(A(f"تم إنهاء الاختبار عند {qz['score']} من {qz['i']}.", f"Quiz ended at {qz['score']} of {qz['i']}."), A("اختبرني مرة أخرى", "Quiz me again"), A("اعمل لي خطة مذاكرة", "Make me a study plan"), sources=["knowledge_base"])
        if S(HINT, m): return out("💡 " + q["hint"], *q["options"], A("تخطي", "Skip"), sources=["knowledge_base"], practice=[{"q": q["q"], "options": q["options"]}])
        if idx is None and not (S(QSKIP, m) or S(ANSWERS, m)):
            SESSIONS[uid].pop("quiz", None); qz = None                      # رسالة خارج الاختبار: نخرج منه ونعالجها طبيعيًا
        else:
            right = q["options"][q["answer"]]; tk = qz["items"][qz["i"]][0]
            if idx is None: fb = A(f"الإجابة الصحيحة: {right}. {q['why']}", f"The correct answer is: {right}. {q['why']}"); qz["wrong"].append(tk)
            elif idx == q["answer"]: qz["score"] += 1; fb = "✓ " + A("صحيح! ", "Correct! ") + q["why"]
            else: qz["wrong"].append(tk); fb = "✗ " + A(f"ليست الإجابة الصحيحة. الصحيح: {right}. ", f"Not quite. The correct answer is: {right}. ") + q["why"]
            qz["i"] += 1; _put(uid, "quiz", qz)
            if qz["i"] >= len(qz["items"]):
                end, sg = _finish(uid, qz, ar); return out(fb + "\n\n" + end, *sg, sources=["knowledge_base"])
            body, sg, pr = _ask(qz, ar); return out(fb + "\n\n" + body, *sg, sources=["knowledge_base"], practice=pr)
    course, topic = find_course(ctx, m), find_topic(m)
    active_codes = {c.code for c in ctx["active"]}
    # 3) تحية / مساعدة / شكر / تبديل لغة فقط
    only_lang = switched and not any(S(p, m) for p in (PRACTICE, EXPLAIN, STUDY, WEAK, ATT, UPC, GRADE, COURSES, TODAY)) and not topic
    if only_lang: return out(A("حاضر، سأتحدث معك بالعربية من الآن. اطلب مني أي شيء!", "Sure, I'll answer in English from now on. Ask me anything, or try “quiz me on SQL”."), A("اختبرني", "Quiz me"), A("اعمل لي خطة مذاكرة", "Make me a study plan"))
    if (S(GREET, m) or S(HELP, m)) and not (topic or course or any(S(p, m) for p in (STUDY, WEAK, ATT, UPC, PRACTICE))):
        t, sg = _caps(user, ar); return out(t, *sg)
    if S(THANKS, m) and not (topic or course): return out(A("العفو! بالتوفيق في مذاكرتك. أي وقت تحتاجني أنا هنا.", "You're welcome! Good luck studying. I'm here whenever you need me."), A("اختبرني", "Quiz me"), A("القادم عليّ", "What's coming up?"))
    # 4) تدريب تفاعلي
    if S(PRACTICE, m) or (topic and re.search(r"اختبر|quiz|test me", m, re.I)):
        if not topic and course and not COURSE_TOPICS.get(course.code): course = None
        if not topic and not course:
            w = weak_courses(ctx); course = next((x["course"] for x in w if COURSE_TOPICS.get(x["course"].code)), None) or next((c for c in ctx["active"] if COURSE_TOPICS.get(c.code)), None)
        nreq = re.search(r"(\d+)\s*(?:اسئل|أسئل|questions?|q\b)", m, re.I); n = max(1, min(int(nreq.group(1)), 8)) if nreq else 5
        items = _pick(topic, course, n)
        if not items: return out(A("لا أملك أسئلة تدريب مؤكدة لهذا الموضوع في قاعدتي الحالية. جرّب موضوعًا مثل SQL أو JOIN أو Normalization.", "I don't have confirmed practice questions for that topic. Try SQL, JOIN or Normalization."), A("اختبرني في SQL", "Quiz me on SQL"))
        qz = {"items": items, "i": 0, "score": 0, "wrong": [], "ar": ar}; _put(uid, "quiz", qz)
        title = TOPICS[topic]["ar" if ar else "en"] if topic else (course.name if course else "")
        body, sg, pr = _ask(qz, ar)
        return out(A(f"نبدأ اختبارًا تدريبيًا في «{title}» ({len(items)} أسئلة، للتعلّم فقط وغير محسوب). اضغط الإجابة أو اكتب حرفها، ويمكنك طلب «تلميح».\n\n", f"Let's start a practice quiz on “{title}” ({len(items)} questions, for learning only, not graded). Tap an answer or type its letter; ask for a “hint” any time.\n\n") + body, *sg, sources=["knowledge_base"], practice=pr)
    # 5) شرح
    if S(EXPLAIN, m) and topic:
        tp = TOPICS[topic]; return out(f"{tp['ar'] if ar else tp['en']}:\n{tp['explain_ar'] if ar else tp['explain_en']}", A(f"اختبرني في {tp['ar']}", f"Quiz me on {tp['en']}"), A("اعمل لي خطة مذاكرة", "Make me a study plan"), sources=["knowledge_base"])
    # 6) خطة اليوم
    if S(TODAY, m):
        cand = []
        for x, c in ctx["exams"]: cand.append((x.start_time, c))
        for a, c in ctx["assignments"]: cand.append((a.due_at, c))
        cand.sort(key=lambda z: max(z[0], datetime.utcnow())); w = weak_courses(ctx)
        c0 = cand[0][1] if cand else (w[0]["course"] if w else (ctx["active"][0] if ctx["active"] else None))
        keys = COURSE_TOPICS.get(c0.code, []) if c0 else []
        if not c0 or not keys: return out(A("لا توجد مواعيد قريبة مسجلة. استغل اليوم لمراجعة أضعف مادة عندك.", "No near deadlines are recorded. Use today to revise your weakest course."), A("المواد التي أحتاج تحسينها", "Which courses need work?"))
        tn = TOPICS[keys[0]]["ar" if ar else "en"]
        return out(A(f"خطة اليوم ({c0.name}):\n1) 45 دقيقة: راجع «{tn}»\n2) راحة 10 دقائق\n3) 5 أسئلة تدريب على نفس الموضوع\n4) 15 دقيقة لمراجعة أخطائك", f"Today's plan ({c0.name}):\n1) 45 min: review “{tn}”\n2) 10 min break\n3) 5 practice questions on the same topic\n4) 15 min to review your mistakes"),
                   A(f"اختبرني في {TOPICS[keys[0]]['ar']}", f"Quiz me on {TOPICS[keys[0]]['en']}"), sources=["student_data", "knowledge_base"])
    # 7) خطة مذاكرة وتوصية شخصية
    if S(STUDY, m) or (topic and re.search(r"امتحان|exam|اختبار|test", m, re.I)):
        days, dayname = target_days(m)
        exam = None
        if course and ctx["exams"]: exam = next(((x, c) for x, c in ctx["exams"] if c.id == course.id), None)
        if exam and days is None: days = max(1, (exam[0].start_time.date() - datetime.utcnow().date()).days)
        if not course and not topic:
            w = weak_courses(ctx)
            if w: course = w[0]["course"]
        if course and course.code not in active_codes and not any(c.code == course.code for c, _, _ in ctx["history"]):
            return out(A(f"{course.name} ليست ضمن موادك المسجلة أو المنتهية، فلن أبني لك خطة عليها. أخبرني بمادة من موادك.", f"{course.name} isn't among your registered or completed courses, so I won't build a plan for it. Tell me one of your courses."), *[c.name for c in ctx["active"][:3]])
        plan = study_plan(ctx, course, topic, days, ar)
        if not plan: return out(A("لا أملك موضوعات مؤكدة لهذه المادة في قاعدة المعرفة الحالية، فلا أريد اختلاق خطة. اذكر موضوعًا محددًا (مثل SQL أو الأشجار) وسأبني عليه.", "I don't have confirmed topics for this course, so I won't invent a plan. Name a specific topic (e.g. SQL, trees) and I'll build on it."))
        lead, tasks = plan; wk = (dayname and A(f"موعدك: {dayname}", f"Your date: {dayname}")) or ""
        hist = next(((g, p) for c, g, p in ctx["history"] if course and c.id == course.id), None); why = ""
        if hist and ctx["gpa"] and hist[1] < ctx["gpa"]: why = A(f"\nتحليل: درجتك السابقة في المادة ({hist[0]}) أقل من معدلك ({ctx['gpa']}) فنركّز على الأساسيات أولًا.", f"\nAnalysis: your earlier grade in this course ({hist[0]}) is below your GPA ({ctx['gpa']}), so we start with fundamentals.")
        extra = ""; due = [(a, c) for a, c in ctx["assignments"] if (a.due_at - datetime.utcnow()).days <= (days or 7)]
        if due: extra = A("\nانتبه: عندك تسليمات في نفس الفترة: ", "\nNote: you also have deadlines in this period: ") + "، ".join(f"{a.title} ({fmt_when(a.due_at)})" for a, _ in due)
        head = (A(f"خطة مذاكرة لمدة {n_days(len(tasks))}", f"{len(tasks)}-day study plan")) + (f" — {course.name}" if course else "") + (f" {wk}" if wk else "")
        lines = [f"{A('اليوم','Day')} {d+1}: {t}" for d, t in tasks]; nm = TOPICS[topic]["ar" if ar else "en"] if topic else lead
        tip = A(f"\nنصيحة: ابدأ بـ «{nm}» ثم ثبّت بحل أسئلة قبل الانتقال لما بعده؛ مدة الجلسة المناسبة 45 دقيقة تتخللها راحة 10 دقائق.", "\nTip: start with the weakest topic, then lock it in with practice questions; 45-minute sessions with 10-minute breaks work well.")
        return out(head + "\n" + "\n".join(lines) + why + extra + tip, A(f"اختبرني في {nm}", f"Quiz me on {nm}"), A("اشرح لي أهم نقطة", "Explain the key point"), A("ماذا أذاكر اليوم؟", "What should I study today?"), sources=["student_data", "knowledge_base"])
    # 8) نقاط الضعف
    if S(WEAK, m):
        w = weak_courses(ctx)
        if not ctx["history"] and not ctx["att"]: return out(A("لا أملك درجات أو حضورًا كافيًا لتحليل نقاط الضعف بدقة بعد.", "I don't have enough grades or attendance data yet to analyse weak points."))
        if not w: return out(A("لا توجد مادة أقل بوضوح من مستواك العام حسب بياناتك الحالية. استمر على نفس الوتيرة.", "No course is clearly below your general level in your current data. Keep it up."))
        lines = [f"• {x['course'].name}: {x['detail'] if ar else x['detail_en']}" for x in w[:4]]; top = w[0]["course"]
        return out(A("المواد التي تحتاج تحسينًا (من درجاتك وحضورك الفعليين):\n", "Courses that need improvement (from your actual grades and attendance):\n") + "\n".join(lines), A(f"اعمل لي خطة مذاكرة {top.name}", f"Make a study plan for {top.name}"), A(f"اختبرني في {top.name}", f"Quiz me on {top.name}"), sources=["student_data"])
    # 9) الحضور
    if S(ATT, m):
        rows = [(c, att_rate(ctx["att"].get(c.id, {"PRESENT": 0, "LATE": 0, "ABSENT": 0})), ctx["att"].get(c.id)) for c in ctx["active"]]
        rows = [r for r in rows if r[2]] if not course else [r for r in rows if r[0].id == course.id]
        if not rows: return out(A("لا توجد سجلات حضور لك حتى الآن.", "There are no attendance records for you yet."))
        L = [f"• {c.name}: {r}% ({A('حاضر','present')} {a['PRESENT']}، {A('متأخر','late')} {a['LATE']}، {A('غائب','absent')} {a['ABSENT']})" for c, r, a in rows]
        return out(A("نسبة حضورك حسب السجلات المسجّلة:\n", "Your attendance per recorded sessions:\n") + "\n".join(L) + A("\nملاحظة: النسبة تخص الجلسات المسجَّلة في النظام فقط.", "\nNote: the rate covers only sessions recorded in the system."), sources=["student_data"])
    # 10) القادم
    if S(UPC, m) and not S(GRADE, m):
        ev = [(x.start_time, A("اختبار", "Exam"), f"{x.title} — {c.name}", True) for x, c in ctx["exams"]] + [(a.due_at, A("واجب" if a.kind == "assignment" else "كويز", "Assignment" if a.kind == "assignment" else "Quiz"), f"{a.title} — {c.name}", False) for a, c in ctx["assignments"]]
        if course: ev = [e for e in ev if course.name in e[2]]
        ev.sort(key=lambda e: max(e[0], datetime.utcnow()))
        if not ev: return out(A("لا توجد اختبارات أو تسليمات قادمة مسجلة لك.", "You have no upcoming exams or deadlines recorded."))
        return out(A("القادم عليك:\n", "Coming up:\n") + "\n".join(f"• {k}: {t} ({fmt_when(d, w)})" for d, k, t, w in ev[:6]), A("اعمل لي خطة مذاكرة", "Make me a study plan"), A("ماذا أذاكر اليوم؟", "What should I study today?"), sources=["student_data"])
    # 11) الدرجات/المواد
    if S(GRADE, m):
        h = ctx["history"]
        if course: h = [x for x in h if x[0].id == course.id]
        if not h: return out(A("لا توجد درجة مسجلة لك في هذه المادة بعد.", "No grade is recorded for you in that course yet."))
        return out((A("معدلك التراكمي: ", "Your GPA: ") + f"{ctx['gpa']}\n" if not course else "") + "\n".join(f"• {c.name}: {g}" for c, g, _ in h), A("المواد التي أحتاج تحسينها", "Which courses need work?"), sources=["student_data"])
    if S(COURSES, m):
        a = ctx["active"]
        return out((A("موادك الحالية:\n", "Your current courses:\n") + "\n".join(f"• {c.name} ({c.slot} – {c.room})" for c in a)) if a else A("لا توجد مواد مسجلة حاليًا.", "No courses registered right now."), sources=["student_data"])
    return None
