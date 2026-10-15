"""وكيل الإرشاد الاستباقي: يحسب تقدم الطالب، ويرشّح المواد بدرجة مركّبة، ويكشف التعارض والعبء الثقيل قبل التسجيل."""
from sqlalchemy import select, func
from .. import rules
from ..models import *
MAX_LOAD = lambda gpa: 18 if gpa >= 3 else 15 if gpa >= 2 else 12
def snapshot(db, sid: int) -> dict:
    es = db.scalars(select(Enrollment).where(Enrollment.student_id == sid)).all()
    cr = lambda e: db.get(Course, e.course_id).credits
    done = [e for e in es if e.status == "COMPLETED" and e.grade_points is not None]
    earned = sum(cr(e) for e in done)
    gpa = round(sum(e.grade_points * cr(e) for e in done) / earned, 2) if earned else None
    return {"gpa": gpa, "credits_earned": earned, "active": [db.get(Course, e.course_id) for e in es if e.status == "ACTIVE"],
            "history": {db.get(Course, e.course_id).code: e.grade_points for e in done}}
def conflicts(courses) -> list[tuple[str, str]]:
    return [(a.code, b.code) for i, a in enumerate(courses) for b in courses[i + 1:] if a.slot == b.slot]
def difficulty(db, c) -> float:           # 0 سهل .. 4 صعب، من متوسط درجات من أنهوا المادة تاريخيًا
    avg = db.scalar(select(func.avg(Enrollment.grade_points)).where(Enrollment.course_id == c.id, Enrollment.status == "COMPLETED"))
    return 4 - (avg if avg is not None else 3)
def workload(db, courses, gpa) -> dict:
    cap = MAX_LOAD(gpa or 3); credits = sum(c.credits for c in courses)
    idx = sum(difficulty(db, c) * c.credits for c in courses) / max(credits, 1); why = []
    if credits > cap: why.append(f"الساعات {credits} تتجاوز الحد المسموح لك ({cap})")
    if idx > 1.4 and credits >= 15: why.append("مواد صعبة تاريخيًا مجتمعة في فصل واحد")
    if sum(difficulty(db, c) > 1.5 for c in courses) >= 3: why.append("ثلاث مواد أو أكثر ذات صعوبة مرتفعة")
    return {"credits": credits, "difficulty_index": round(idx, 2), "level": "heavy" if why else "balanced" if credits >= 12 else "light", "reasons": why}
def recommend(db, sid: int, max_credits: int | None = None, prefer_hours: str | None = None) -> dict:
    s = snapshot(db, sid); gpa = s["gpa"] or 3.0; cap = max_credits or MAX_LOAD(gpa)
    unlocks = lambda c: db.scalar(select(func.count()).select_from(Prereq).where(Prereq.requires_code == c.code)) or 0
    scored = []
    for c in db.scalars(select(Course)):
        if rules.eligibility(db, sid, c): continue
        d = difficulty(db, c); fit = 1 - abs(d - (4 - gpa)) / 4          # توافق الصعوبة مع مستوى الطالب
        score = 0.45 * min(unlocks(c) / 3, 1) + 0.35 * fit + 0.20 * (1 if prefer_hours and prefer_hours in c.slot else 0.5)
        scored.append((score, c, d))
    chosen, load = [], sum(c.credits for c in s["active"])
    for score, c, d in sorted(scored, key=lambda x: -x[0]):
        if load + c.credits <= cap and not conflicts(s["active"] + [x[1] for x in chosen] + [c]):
            chosen.append((score, c, d)); load += c.credits
    return {"gpa": s["gpa"], "max_credits": cap, "projected_load": load,
            "recommendations": [{"code": c.code, "name": c.name, "score": round(sc, 2), "difficulty": round(d, 2), "unlocks": unlocks(c),
                                  "why": f"يفتح {unlocks(c)} مواد لاحقة، وصعوبته {'مناسبة' if abs(d-(4-gpa))<1 else 'تحتاج انتباهًا'} لمستواك"} for sc, c, d in chosen]}
def preflight(db, sid: int, course_ids: list[int]) -> dict:
    s = snapshot(db, sid); picked = [db.get(Course, i) for i in course_ids]; allc = s["active"] + picked
    issues = [{"code": c.code, "reason": r} for c in picked if (r := rules.eligibility(db, sid, c))]
    return {"conflicts": conflicts(allc), "workload": workload(db, allc, s["gpa"]), "prereq_issues": issues}
