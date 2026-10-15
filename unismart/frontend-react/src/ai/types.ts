export type Dialect = "msa" | "egy" | "gulf" | "levant" | "mag" | "en" | "franco";
export type Agent = "bylaws" | "advisor" | "copilot" | "general";
export interface Citation { id: number; doc: string; version?: string; article?: string; page?: number; excerpt: string; score: number }
export interface ChatReply { reply: string; agent: Agent; dialect: Dialect; citations: Citation[]; suggestions: string[]; pending: { action_id: string; summary: string } | null; trace_id: string; latency_ms: number }
export interface ChatMessage { role: "user" | "assistant"; text: string; reply?: ChatReply }
export interface Recommendation { code: string; name: string; score: number; difficulty: number; unlocks: number; why: string }
export interface RecommendationSet { gpa: number | null; max_credits: number; projected_load: number; recommendations: Recommendation[] }
export interface Preflight { conflicts: [string, string][]; workload: { credits: number; difficulty_index: number; level: "light" | "balanced" | "heavy"; reasons: string[] }; prereq_issues: { code: string; reason: string }[] }
export interface QuizDraft { kind: "mcq" | "tf"; stem: string; options: string[]; answer: number; topic: string | null; source_excerpt: string; status: "DRAFT" | "APPROVED" }
export interface ExamAnalytics { students: number; avg_score: number; weak_topics: { topic: string; mastery: number }[]; mastery: { topic: string; mastery: number }[];
  questions: { question_id: number; stem: string; topic: string | null; p_correct: number | null; discrimination: number; common_mistake: { option: string; share: number } | null; flag: string | null }[] }
