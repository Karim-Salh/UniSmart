const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000";
export class ApiError extends Error { constructor(public status: number, msg: string) { super(msg) } }
export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = sessionStorage.getItem("token");
  const isForm = init.body instanceof FormData;
  const res = await fetch(BASE + path, { ...init, headers: { ...(isForm ? {} : { "Content-Type": "application/json" }), ...(token ? { Authorization: `Bearer ${token}` } : {}), ...init.headers } });
  if (!res.ok) throw new ApiError(res.status, (await res.json().catch(() => ({}))).detail ?? res.statusText);
  return res.json();
}
export const post = <T,>(p: string, body: unknown) => api<T>(p, { method: "POST", body: JSON.stringify(body) });
