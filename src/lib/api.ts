const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export type Status = "DRAFT" | "SENT" | "PAID";
export type Customer = { id: number; name: string; email: string | null };
export type LineItem = { description: string; quantity: number; unitPrice: number };
export type Invoice = {
  id: number; customerId: number; customerName: string; dueDate: string;
  status: Status; total: number; items: LineItem[];
};
export type Summary = { count: number; outstanding: number; paid: number };

// shortcut: token in localStorage is fine for a demo; use httpOnly cookies for a real product
export const tokenStore = {
  get: () => (typeof window === "undefined" ? null : localStorage.getItem("token")),
  set: (t: string) => localStorage.setItem("token", t),
  clear: () => localStorage.removeItem("token"),
};

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = tokenStore.get();
  const res = await fetch(BASE + path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new ApiError(res.status, body?.message || body?.detail || `Request failed (${res.status})`);
  }
  return res.status === 204 ? (undefined as T) : res.json();
}

/** Free hosting sleeps when idle. Calling this on page load starts waking the API while the user is still typing. */
export function wakeApi(): Promise<void> {
  return fetch(BASE + "/actuator/health", { cache: "no-store" }).then(() => undefined, () => undefined);
}
