"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError, tokenStore, type Customer, type Invoice, type Status, type Summary } from "@/lib/api";

const money = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD" });

export default function Dashboard() {
  const router = useRouter();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filter, setFilter] = useState<Status | "">("");
  const [error, setError] = useState("");

  const handle = useCallback((err: unknown) => {
    if (err instanceof ApiError && err.status === 401) {
      tokenStore.clear();
      router.replace("/");
    } else setError(err instanceof Error ? err.message : "Something went wrong");
  }, [router]);

  const load = useCallback(async () => {
    try {
      const [s, c, i] = await Promise.all([
        api<Summary>("/api/invoices/summary"),
        api<Customer[]>("/api/customers"),
        api<Invoice[]>(`/api/invoices${filter ? `?status=${filter}` : ""}`),
      ]);
      setSummary(s); setCustomers(c); setInvoices(i); setError("");
    } catch (e) { handle(e); }
  }, [filter, handle]);

  useEffect(() => {
    if (!tokenStore.get()) router.replace("/");
    else load();
  }, [load, router]);

  async function run(fn: () => Promise<unknown>) {
    try { await fn(); await load(); } catch (e) { handle(e); }
  }

  return (
    <main className="shell">
      <header className="bar">
        <span className="wordmark">Invoices</span>
        <button onClick={() => { tokenStore.clear(); router.replace("/"); }} className="link link--quiet">
          Sign out
        </button>
      </header>

      {error && <p role="alert" className="alert mb-6">{error}</p>}

      <section className="figures" aria-label="Summary">
        <Stat label="Invoices" value={summary ? String(summary.count) : "–"} />
        <Stat label="Outstanding" value={summary ? money(summary.outstanding) : "–"} />
        <Stat label="Paid" value={summary ? money(summary.paid) : "–"} />
      </section>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] items-start">
        <section className="stock" aria-labelledby="ledger-h">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 id="ledger-h">All invoices</h2>
            <select aria-label="Filter by status" value={filter} onChange={(e) => setFilter(e.target.value as Status | "")} className="field field--inline">
              <option value="">All statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="SENT">Sent</option>
              <option value="PAID">Paid</option>
            </select>
          </div>
          {invoices.length === 0 ? (
            <p className="muted py-6">No invoices yet. Add a customer, then create an invoice.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="ledger">
                <thead>
                  <tr><th>#</th><th>Customer</th><th>Due</th><th className="num">Total</th><th>Status</th><th><span className="visually-hidden">Actions</span></th></tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => (
                    <tr key={inv.id}>
                      <td className="fig muted">{inv.id}</td>
                      <td>{inv.customerName}</td>
                      <td className="fig">{inv.dueDate}</td>
                      <td className="fig num">{money(inv.total)}</td>
                      <td>
                        {inv.status === "PAID"
                          ? <span className="paid">Paid</span>
                          : <span className={`status${inv.status === "DRAFT" ? " status--draft" : ""}`}>{inv.status === "DRAFT" ? "Draft" : "Sent"}</span>}
                      </td>
                      <td>
                        <div className="row-actions">
                          {inv.status === "DRAFT" && (
                            <button onClick={() => run(() => api(`/api/invoices/${inv.id}/status`, { method: "PATCH", body: JSON.stringify({ status: "SENT" }) }))}
                              className="link">Mark sent</button>
                          )}
                          {inv.status !== "PAID" && (
                            <button onClick={() => run(() => api(`/api/invoices/${inv.id}/status`, { method: "PATCH", body: JSON.stringify({ status: "PAID" }) }))}
                              className="link">Mark paid</button>
                          )}
                          <button onClick={() => confirm("Delete this invoice?") && run(() => api(`/api/invoices/${inv.id}`, { method: "DELETE" }))}
                            className="link danger">Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <div className="grid gap-8">
          <NewInvoice customers={customers} onCreate={(body) => run(() =>
            api("/api/invoices", { method: "POST", body: JSON.stringify(body) }))} />
          <NewCustomer onCreate={(name, email) => run(() =>
            api("/api/customers", { method: "POST", body: JSON.stringify({ name, email: email || null }) }))} />
        </div>
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="label">{label}</p>
      <span className="fig">{value}</span>
    </div>
  );
}

function NewCustomer({ onCreate }: { onCreate: (name: string, email: string) => Promise<void> }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  return (
    <form className="stock grid gap-3" onSubmit={async (e) => { e.preventDefault(); await onCreate(name, email); setName(""); setEmail(""); }}>
      <h2>New customer</h2>
      <input required placeholder="Name" aria-label="Customer name" value={name} onChange={(e) => setName(e.target.value)} className="field" />
      <input type="email" placeholder="Email (optional)" aria-label="Customer email" value={email} onChange={(e) => setEmail(e.target.value)} className="field" />
      <button className="btn btn--card">Add customer</button>
    </form>
  );
}

type Item = { description: string; quantity: number; unitPrice: number };

function NewInvoice({ customers, onCreate }: {
  customers: Customer[];
  onCreate: (body: { customerId: number; dueDate: string; items: Item[] }) => Promise<void>;
}) {
  const [customerId, setCustomerId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [items, setItems] = useState<Item[]>([{ description: "", quantity: 1, unitPrice: 0 }]);
  const update = (i: number, patch: Partial<Item>) => setItems(items.map((it, j) => (j === i ? { ...it, ...patch } : it)));
  const total = items.reduce((s, it) => s + it.quantity * it.unitPrice, 0);

  return (
    <form className="stock grid gap-3" onSubmit={async (e) => {
      e.preventDefault();
      await onCreate({ customerId: Number(customerId), dueDate, items });
      setItems([{ description: "", quantity: 1, unitPrice: 0 }]);
    }}>
      <h2>New invoice</h2>
      <div className="grid grid-cols-2 gap-2">
        <select required aria-label="Customer" value={customerId} onChange={(e) => setCustomerId(e.target.value)} className="field">
          <option value="">Customer…</option>
          {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <input required type="date" aria-label="Due date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="field" />
      </div>
      {items.map((it, i) => (
        <div key={i} className="grid grid-cols-[minmax(0,1fr)_4rem_6rem] gap-2">
          <input required placeholder="Description" aria-label="Item description" value={it.description} onChange={(e) => update(i, { description: e.target.value })} className="field" />
          <input required type="number" min={1} aria-label="Quantity" value={it.quantity} onChange={(e) => update(i, { quantity: Number(e.target.value) })} className="field" />
          <input required type="number" min={0} step="0.01" aria-label="Unit price" value={it.unitPrice} onChange={(e) => update(i, { unitPrice: Number(e.target.value) })} className="field" />
        </div>
      ))}
      <div className="flex items-center justify-between">
        <button type="button" onClick={() => setItems([...items, { description: "", quantity: 1, unitPrice: 0 }])} className="link">+ Add line</button>
        <span className="label">Total <span className="fig">{money(total)}</span></span>
      </div>
      <button disabled={customers.length === 0} className="btn btn--ink">Create invoice</button>
    </form>
  );
}
