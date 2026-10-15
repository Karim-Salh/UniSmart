"""المنسّق متعدد الوكلاء: يكتشف اللهجة، يوجّه إلى الوكيل المناسب حسب الدور والنية، ويُرجع ردًا موحّدًا مع المصادر والإجراءات."""
import re, time, uuid
from . import rag, advisor, tone, guide
from .. import assistant
POLICY = re.compile(r"لائح|سياس|حضور|غياب|غش|تظلم|انسحاب|اعاد|إعاد|رأفة|bylaw|policy|attendance|regulation|grading|appeal", re.I)
ADVISE = re.compile(r"خط[هة]|رشح|اقترح|تعارض|عبء|ثقيل|plan|recommend|conflict|workload|risk", re.I)
COPILOT = re.compile(r"كويز|اختبار|واجب|تحليل|ضعف|quiz|assignment|analytics|weak", re.I)
def route(user, message: str) -> str:
    if guide.matches(user, message): return "guide"          # أسئلة الطالب الشخصية والمذاكرة قبل اللوائح (حضوري ≠ سياسة الحضور)
    if POLICY.search(message): return "bylaws"
    if user.role == "doctor" and COPILOT.search(message): return "copilot"
    if user.role == "student" and ADVISE.search(message): return "advisor"
    return "general"
def handle(db, user, message: str, lang: str | None = None) -> dict:
    t0, dialect, agent, trace = time.time(), tone.detect_dialect(message), None, uuid.uuid4().hex
    if lang == "en": dialect = "en"
    elif lang == "ar" and dialect in ("en", "franco"): dialect = "msa"
    agent = route(user, message); out = {"citations": [], "suggestions": [], "pending": None}
    if agent == "guide":
        g = guide.respond(db, user, message, dialect, lang)
        if g is None: agent = "bylaws" if POLICY.search(message) else "advisor" if ADVISE.search(message) else "general"   # المرشد تنحّى: أكمل التوجيه الطبيعي
        else: out["reply"], out["suggestions"] = g["reply"], g["suggestions"]; out["sources"] = g.get("sources", []); out["practice"] = g.get("practice"); out["lang"] = g.get("lang")
    if agent == "bylaws":
        try: r = rag.ask(db, message); out["citations"] = r["citations"]
        except Exception: db.rollback(); r = {"abstained": True, "answer": None}      # فهرس اللوائح غير متاح ⇒ امتناع صريح لا اختلاق
        out["reply"] = tone.say("no_info", dialect) if r["abstained"] else tone.say("bylaw_answer", dialect, answer=r["answer"])
    elif agent == "advisor":
        r = advisor.recommend(db, user.id)
        out["reply"] = "؛ ".join(f"{x['name']}: {x['why']}" for x in r["recommendations"]) or tone.say("no_info", dialect)
        out["suggestions"] = [f"سجلني في {x['name']}" for x in r["recommendations"][:2]]
    elif agent == "copilot":
        out["reply"] = "افتح مساعد الاختبارات: ارفع الشرائح أو اذكر الموضوع، وسأجهّز مسودة تراجعها قبل الاعتماد."
    if agent == "general" and "reply" not in out:
        g = assistant.reply(db, user, message); out["reply"], out["suggestions"] = g["reply"], g["suggestions"]
    out.update(agent=agent, dialect=dialect, trace_id=trace, latency_ms=int((time.time() - t0) * 1000))
    return out
