import { useCallback, useRef, useState } from "react";
import { post } from "./api";
import type { ChatMessage, ChatReply } from "./types";
/** محادثة المرشد متعدد الوكلاء. المحادثة تُمسح عند الخروج أو بـ clear() ولا تُخزَّن على الخادم. */
export function useAssistant() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lock = useRef(false);
  const send = useCallback(async (text: string) => {
    if (!text.trim() || lock.current) return;
    lock.current = true; setBusy(true); setError(null);
    setMessages(m => [...m, { role: "user", text }]);
    try {
      const reply = await post<ChatReply>("/api/ai/v2/chat", { message: text });
      setMessages(m => [...m, { role: "assistant", text: reply.reply, reply }]);
    } catch (e) { setError("حدث خطأ أثناء تنفيذ العملية. حاول مرة أخرى.") }
    finally { lock.current = false; setBusy(false) }
  }, []);
  const clear = useCallback(() => { setMessages([]); setError(null) }, []);
  const last = messages[messages.length - 1]?.reply;
  return { messages, send, clear, busy, error, suggestions: last?.suggestions ?? [], dialect: last?.dialect };
}
