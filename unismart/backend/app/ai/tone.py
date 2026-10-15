"""مدير اللهجة والنبرة: يكتشف لغة/لهجة المستخدم ويرد بها بنبرة ودودة رسمية (احترام، بدون مزاح أو عامية مفرطة)."""
import re
MARK = {
    "egy": ["ازاي", "ايه", "دلوقتي", "عايز", "كده", "مش", "بتاع", "لسه", "ليه", "اهو", "ده", "دي"],
    "gulf": ["شلون", "وش", "ابغى", "زين", "حق", "شفيك", "ليش", "هالحين"],
    "levant": ["شو", "كيفك", "هلق", "بدي", "لشو", "هيك", "منيح"],
    "mag": ["واش", "بغيت", "ديال", "شحال", "كاين", "علاش", "دابا"],
}
FRANCO = re.compile(r"\b(?:\w*[2356789]\w*|ana|ezay|3ayez|ezzay|eh|ya|msh|mesh|doktor|gadwal|asagel|emta|fein)\b", re.I)
def detect_dialect(text: str) -> str:
    ar = len(re.findall(r"[\u0600-\u06ff]", text)); lat = len(re.findall(r"[A-Za-z]", text))
    if lat > ar:
        return "franco" if FRANCO.search(text) and re.search(r"\b\w*[2356789]\w*\b|ezay|3ayez|ana\b", text, re.I) else "en"
    words = set(re.findall(r"[\u0600-\u06ff]+", text))
    best = max(MARK, key=lambda d: len(words & set(MARK[d])))
    return best if len(words & set(MARK[best])) else "msa"
# نبرة واحدة (رسمية ودودة) بقوالب لكل لهجة؛ المحتوى الأكاديمي نفسه لا يتغير، فقط الصياغة.
T = {
 "no_info": {"msa": "لا أملك معلومات مؤكدة عن هذا الأمر في اللوائح المعتمدة. أنصحك بمراجعة شؤون الطلاب.",
             "egy": "مفيش عندي معلومة مؤكدة عن ده في اللوائح المعتمدة. يُفضَّل تراجع شؤون الطلاب.",
             "en": "I don't have confirmed information on this in the approved bylaws. Please check with Student Affairs."},
 "bylaw_answer": {"msa": "وفق اللائحة المعتمدة: {answer}", "egy": "حسب اللائحة المعتمدة: {answer}", "en": "According to the approved bylaws: {answer}"},
 "workload_warn": {"msa": "تنبيه قبل التسجيل: {why}. أقترح تخفيف العبء.", "egy": "تنبيه قبل التسجيل: {why}. أقترح نخفّف العبء.", "en": "Heads-up before you register: {why}. I suggest lightening the load."},
}
GROUP = {"franco": "egy", "gulf": "msa", "levant": "msa", "mag": "msa"}   # لهجات بلا قوالب مخصصة تُخدم بالفصحى المبسطة
def say(key: str, dialect: str, **slots) -> str:
    tpl = T[key].get(dialect) or T[key].get(GROUP.get(dialect, dialect)) or T[key]["msa"]
    return tpl.format(**slots)
TONE_PROMPT = ("Reply in the user's language/dialect (MSA, Egyptian, Gulf, Levantine, Maghrebi, English, or Franco-Arab written in Latin letters). "
               "Tone: warm, respectful, official university voice; no slang beyond light mirroring; never invent policy; cite sources when given.")
