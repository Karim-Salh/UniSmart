"""RAG للوائح الجامعة: تقطيع حسب المادة ← تضمين محلي ← بحث هجين (دلالي + كلمات) ← إجابة اقتباسية مع توثيق، أو امتناع."""
import re
from sqlalchemy import text
from .embeddings import embed
ARTICLE = re.compile(r"(?m)^\s*(?:المادة|مادة|Article)\s*\(?(\d+)\)?[\s:.\-–]*")
MIN_SIM = 0.80   # عتبة الامتناع؛ تُضبط بمجموعة اختبار من أسئلة الطلاب
def chunk(doc: str, max_chars: int = 900) -> list[tuple[str, str]]:
    marks = list(ARTICLE.finditer(doc)); segs = []
    if marks:
        for i, m in enumerate(marks):
            segs.append((f"مادة {m.group(1)}", doc[m.end(): marks[i + 1].start() if i + 1 < len(marks) else len(doc)].strip()))
    else: segs = [("", p.strip()) for p in re.split(r"\n{2,}", doc) if p.strip()]
    out = []
    for art, body in segs:
        sents, cur = re.split(r"(?<=[.!؟?])\s+", body), ""
        for s in sents:
            if len(cur) + len(s) > max_chars and cur: out.append((art, cur.strip())); cur = cur[-150:]   # تداخل بسيط
            cur += " " + s
        if cur.strip(): out.append((art, cur.strip()))
    return out
def ingest(db, source_id: int, doc: str) -> int:
    parts = chunk(doc); vecs = embed([p[1] for p in parts])
    for (art, body), v in zip(parts, vecs):
        db.execute(text("INSERT INTO doc_chunks(source_id,article,content,embedding) VALUES(:s,:a,:c,CAST(:v AS vector))"), {"s": source_id, "a": art, "c": body, "v": str(v)})
    db.commit(); return len(parts)
def ingest_chunks(db, source_id: int, chunks: list[dict]) -> int:
    import json
    vecs = embed([c["content"] for c in chunks])
    for c, v in zip(chunks, vecs):
        db.execute(text("INSERT INTO doc_chunks(source_id,article,content,meta,embedding) VALUES(:s,:a,:c,CAST(:m AS json),CAST(:v AS vector))"),
                   {"s": source_id, "a": c["article"], "c": c["content"], "m": json.dumps(c["meta"], ensure_ascii=False) if c["meta"] else None, "v": str(v)})
    db.commit(); return len(chunks)
SEARCH = text("""SELECT c.id, s.title, s.version, c.article, c.page, c.content,
  1-(c.embedding <=> CAST(:q AS vector)) AS sim, ts_rank(c.tsv, plainto_tsquery('simple', :kw)) AS kw
  FROM doc_chunks c JOIN doc_sources s ON s.id=c.source_id
  WHERE s.status='ACTIVE' AND (CAST(:dt AS text) IS NULL OR s.doc_type=:dt)
  ORDER BY 0.8*(1-(c.embedding <=> CAST(:q AS vector))) + 0.2*ts_rank(c.tsv, plainto_tsquery('simple', :kw)) DESC LIMIT :k""")
def search(db, query: str, k: int = 5, doc_type: str | None = None) -> list[dict]:
    rows = db.execute(SEARCH, {"q": str(embed([query], "query")[0]), "kw": query, "dt": doc_type, "k": k}).mappings().all()
    return [{"id": i + 1, "doc": r["title"], "version": r["version"], "article": r["article"], "page": r["page"], "excerpt": r["content"][:400], "score": round(float(r["sim"]), 3)} for i, r in enumerate(rows)]
def ask(db, query: str, doc_type: str | None = None) -> dict:
    hits = search(db, query, 4, doc_type)
    if not hits or hits[0]["score"] < MIN_SIM:
        return {"answer": None, "citations": [], "confidence": hits[0]["score"] if hits else 0, "abstained": True}
    top = [h for h in hits if h["score"] >= MIN_SIM][:2]
    ans = " ".join(f"{h['excerpt']} [{h['id']}]" for h in top)    # إجابة اقتباسية: لا توليد حر، فلا هلوسة
    return {"answer": ans, "citations": top, "confidence": top[0]["score"], "abstained": False}
