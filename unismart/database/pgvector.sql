-- وحدة الذكاء الاصطناعي (PostgreSQL + pgvector). التضمين المحلي: multilingual-e5-small = 384 بُعدًا.
CREATE EXTENSION IF NOT EXISTS vector;
CREATE TABLE doc_sources(id SERIAL PRIMARY KEY, title TEXT NOT NULL,
  doc_type TEXT NOT NULL CHECK(doc_type IN('bylaw','grading','attendance','admin','faq','knowledge')),
  version TEXT, effective_date DATE, lang TEXT DEFAULT 'ar', status TEXT DEFAULT 'ACTIVE', uploaded_by INT REFERENCES users(id), created_at TIMESTAMP DEFAULT now());
CREATE TABLE doc_chunks(id BIGSERIAL PRIMARY KEY, source_id INT REFERENCES doc_sources(id) ON DELETE CASCADE,
  article TEXT, page INT, meta JSON, content TEXT NOT NULL, embedding vector(384) NOT NULL,
  tsv tsvector GENERATED ALWAYS AS (to_tsvector('simple', content)) STORED);
CREATE INDEX doc_chunks_vec ON doc_chunks USING hnsw (embedding vector_cosine_ops);
CREATE INDEX doc_chunks_tsv ON doc_chunks USING gin (tsv);
-- المساعد المشترك لأعضاء هيئة التدريس: مسودات تُراجَع قبل اعتمادها
CREATE TABLE question_drafts(id SERIAL PRIMARY KEY, course_id INT REFERENCES courses(id), topic TEXT, kind TEXT, stem TEXT, options JSON,
  answer INT, explanation TEXT, source_excerpt TEXT, status TEXT DEFAULT 'DRAFT', created_by INT REFERENCES users(id), created_at TIMESTAMP DEFAULT now());
ALTER TABLE questions ADD COLUMN IF NOT EXISTS topic TEXT;  -- موجود في schema.sql؛ يبقى للتوافق
-- الرصد البيومتري: بصمة رقمية فقط (بدون صور) وبموافقة موثّقة وسياسة احتفاظ
CREATE TABLE face_templates(user_id INT PRIMARY KEY REFERENCES users(id), descriptor JSON NOT NULL, consent_at TIMESTAMP NOT NULL, expires_at TIMESTAMP NOT NULL);
-- مراقبة جودة الوكلاء
CREATE TABLE ai_runs(id BIGSERIAL PRIMARY KEY, trace_id TEXT, user_id INT, agent TEXT, dialect TEXT, abstained BOOLEAN, latency_ms INT, created_at TIMESTAMP DEFAULT now());

-- وصول منفصل: المعرفة العامة (doc_chunks) لا تحتوي أي بيانات طالب؛ بيانات الطالب الخاصة تُقرأ فقط من جداول النظام بهوية JWT.
