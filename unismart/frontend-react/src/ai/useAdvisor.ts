import { useCallback, useEffect, useState } from "react";
import { api, post } from "./api";
import type { Preflight, RecommendationSet } from "./types";
export function useRecommendations(maxCredits?: number, preferHours?: string) {
  const [data, setData] = useState<RecommendationSet | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const q = new URLSearchParams(); if (maxCredits) q.set("max_credits", String(maxCredits)); if (preferHours) q.set("prefer_hours", preferHours);
    setLoading(true); api<RecommendationSet>(`/api/advisor/recommendations?${q}`).then(setData).finally(() => setLoading(false));
  }, [maxCredits, preferHours]);
  return { data, loading };
}
/** فحص استباقي قبل التسجيل: تعارض + عبء ثقيل + متطلبات. استدعِه كلما تغيّر اختيار الطالب (قبل زر التأكيد). */
export function usePreflight() {
  const [result, setResult] = useState<Preflight | null>(null);
  const check = useCallback(async (courseIds: number[]) => {
    if (!courseIds.length) return setResult(null);
    setResult(await post<Preflight>("/api/advisor/preflight", { course_ids: courseIds }));
  }, []);
  const blocked = !!result && (result.conflicts.length > 0 || result.prereq_issues.length > 0);
  return { result, check, blocked, heavy: result?.workload.level === "heavy" };
}
