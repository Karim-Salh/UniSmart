import { useState } from "react";
import { api } from "./api";
import type { ExamAnalytics, QuizDraft } from "./types";
/** مسودات أسئلة من موضوع أو شرائح (PDF/PPTX). لا تُنشر قبل مراجعة الدكتور واعتماده. */
export function useQuizCopilot(courseId: number) {
  const [drafts, setDrafts] = useState<QuizDraft[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const generate = async (opts: { topic?: string; file?: File; n?: number }) => {
    const f = new FormData(); f.set("course_id", String(courseId)); f.set("topic", opts.topic ?? ""); f.set("n", String(opts.n ?? 10)); if (opts.file) f.set("file", opts.file);
    setLoading(true); setError(null);
    try { setDrafts((await api<{ drafts: QuizDraft[] }>("/api/copilot/quizzes/generate", { method: "POST", body: f })).drafts) }
    catch (e: any) { setError(e.message) } finally { setLoading(false) }
  };
  const edit = (i: number, patch: Partial<QuizDraft>) => setDrafts(d => d.map((x, k) => k === i ? { ...x, ...patch } : x));
  const approve = (i: number) => edit(i, { status: "APPROVED" });
  const remove = (i: number) => setDrafts(d => d.filter((_, k) => k !== i));
  return { drafts, loading, error, generate, edit, approve, remove, approved: drafts.filter(d => d.status === "APPROVED") };
}
export function useClassAnalytics(examId: number) {
  const [data, setData] = useState<ExamAnalytics | null>(null);
  const load = () => api<ExamAnalytics>(`/api/copilot/exams/${examId}/analytics`).then(setData);
  return { data, load, flagged: data?.questions.filter(q => q.flag) ?? [] };
}
