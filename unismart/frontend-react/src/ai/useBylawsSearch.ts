import { useEffect, useState } from "react";
import { post } from "./api";
import type { Citation } from "./types";
interface Ask { answer: string | null; citations: Citation[]; confidence: number; abstained: boolean }
/** بحث/سؤال اللوائح مع تأخير (debounce) وإلغاء الطلبات القديمة. abstained=true يعني لا توجد إجابة مؤكدة. */
export function useBylawsAsk(query: string, docType?: "bylaw" | "grading" | "attendance" | "admin" | "faq", delay = 500) {
  const [data, setData] = useState<Ask | null>(null);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (query.trim().length < 3) { setData(null); return }
    let alive = true; setLoading(true);
    const t = setTimeout(() => post<Ask>("/api/ai/bylaws/ask", { query, doc_type: docType })
      .then(r => alive && setData(r)).catch(() => alive && setData(null)).finally(() => alive && setLoading(false)), delay);
    return () => { alive = false; clearTimeout(t) };
  }, [query, docType, delay]);
  return { data, loading };
}
