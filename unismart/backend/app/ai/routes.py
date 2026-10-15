"""واجهات الذكاء الاصطناعي. تُركَّب من main.py عبر build_router(need, get_db) لتجنب الاستيراد الدائري."""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from sqlalchemy import text
from . import orchestrator, rag, advisor, copilot, ingest
def build_router(need, get_db) -> APIRouter:
    r = APIRouter()
    class Chat(BaseModel):
        message: str
        lang: str | None = None
    class Ask(BaseModel): query: str; doc_type: str | None = None; k: int = 5
    class Pre(BaseModel): course_ids: list[int]
    @r.post("/api/ai/v2/chat")                                   # كل الأدوار؛ الوكيل يُختار تلقائيًا
    def chat(b: Chat, u=Depends(need("student", "doctor", "admin")), db=Depends(get_db)): return orchestrator.handle(db, u, b.message[:1000], b.lang if b.lang in ("ar", "en") else None)
    @r.post("/api/ai/bylaws/ask")
    def ask(b: Ask, u=Depends(need("student", "doctor", "admin")), db=Depends(get_db)): return rag.ask(db, b.query, b.doc_type)
    @r.post("/api/ai/bylaws/search")
    def search(b: Ask, u=Depends(need("student", "doctor", "admin")), db=Depends(get_db)): return {"hits": rag.search(db, b.query, b.k, b.doc_type)}
    @r.post("/api/admin/knowledge", status_code=202)             # الإدارة فقط: نص أو ملف (docx/xlsx/csv/sql/txt) ← فهرسة فورية
    async def knowledge(title: str = Form(...), doc_type: str = Form("knowledge"), version: str = Form(""), text_body: str = Form(""), file: UploadFile | None = File(None), u=Depends(need("admin")), db=Depends(get_db)):
        try: chunks, skipped = ingest.parse(file.filename, await file.read()) if file else (ingest.text_chunks(text_body), 0)
        except ValueError as e: raise HTTPException(422, str(e))
        if not chunks: raise HTTPException(422, "لا يوجد محتوى")
        sid = db.execute(text("INSERT INTO doc_sources(title,doc_type,version,uploaded_by) VALUES(:t,:d,:v,:u) RETURNING id"), {"t": title, "d": doc_type, "v": version, "u": u.id}).scalar()
        db.execute(text("INSERT INTO audit_logs(user_id,action,entity,entity_id) VALUES(:u,'KNOWLEDGE_ADDED','doc_source',:s)"), {"u": u.id, "s": sid})
        return {"source_id": sid, "chunks": rag.ingest_chunks(db, sid, chunks), "ignored_sql_statements": skipped}
    @r.get("/api/admin/knowledge")
    def kb_list(u=Depends(need("admin")), db=Depends(get_db)):
        return [dict(x) for x in db.execute(text("SELECT s.id,s.title,s.doc_type,s.status,s.created_at,count(c.id) AS chunks FROM doc_sources s LEFT JOIN doc_chunks c ON c.source_id=s.id GROUP BY s.id ORDER BY s.id DESC")).mappings()]
    @r.patch("/api/admin/knowledge/{sid}")                       # تفعيل/إيقاف مصدر دون حذفه
    def kb_toggle(sid: int, active: bool, u=Depends(need("admin")), db=Depends(get_db)):
        db.execute(text("UPDATE doc_sources SET status=:s WHERE id=:i"), {"s": "ACTIVE" if active else "DISABLED", "i": sid}); db.commit(); return {"id": sid, "active": active}
    @r.delete("/api/admin/knowledge/{sid}")
    def kb_delete(sid: int, u=Depends(need("admin")), db=Depends(get_db)):
        db.execute(text("DELETE FROM doc_sources WHERE id=:i"), {"i": sid}); db.commit(); return {"deleted": sid}
    @r.get("/api/advisor/snapshot")
    def snap(u=Depends(need("student")), db=Depends(get_db)):
        s = advisor.snapshot(db, u.id); s["active"] = [c.code for c in s["active"]]; return s
    @r.get("/api/advisor/recommendations")
    def rec(max_credits: int | None = None, prefer_hours: str | None = None, u=Depends(need("student")), db=Depends(get_db)): return advisor.recommend(db, u.id, max_credits, prefer_hours)
    @r.post("/api/advisor/preflight")                            # يُستدعى قبل التأكيد: تعارض + عبء + متطلبات
    def pre(b: Pre, u=Depends(need("student")), db=Depends(get_db)): return advisor.preflight(db, u.id, b.course_ids)
    @r.post("/api/copilot/quizzes/generate")
    async def gen(course_id: int = Form(...), topic: str = Form(""), n: int = Form(10), file: UploadFile | None = File(None), u=Depends(need("doctor")), db=Depends(get_db)):
        src = copilot.extract_text(file.filename, await file.read()) if file else topic
        if len(src) < 200: raise HTTPException(422, "قدّم موضوعًا مفصّلًا أو ارفع شرائح")
        drafts = copilot.generate(src, n, topic=topic or None)
        for d in drafts: db.execute(text("INSERT INTO question_drafts(course_id,topic,kind,stem,options,answer,source_excerpt,created_by) VALUES(:c,:t,:k,:s,CAST(:o AS json),:a,:x,:u)"),
            {"c": course_id, "t": d["topic"], "k": d["kind"], "s": d["stem"], "o": __import__("json").dumps(d["options"], ensure_ascii=False), "a": d["answer"], "x": d["source_excerpt"], "u": u.id})
        db.commit(); return {"drafts": drafts}
    @r.get("/api/copilot/exams/{eid}/analytics")
    def ana(eid: int, u=Depends(need("doctor", "admin")), db=Depends(get_db)): return copilot.analytics(db, eid)
    return r
