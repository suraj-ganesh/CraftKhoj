"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { toast } from "sonner";

const transitions: string[] = ["PLACED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];

export function AdminOrderStatus({ orderId, orderStatus }: { orderId: number; orderStatus: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function set(next: string) {
    setBusy(true);
    const res = await fetch(`/api/orders/${orderId}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderStatus: next }),
    });
    const json = await res.json();
    setBusy(false);
    if (!res.ok) { toast.error(json.error ?? "Could not move the order."); return; }
    toast.success(`Order moved to ${next.toLowerCase()}.`);
    router.refresh();
  }

  return (
    <select
      className="select-arrow"
      value={orderStatus}
      disabled={busy}
      style={{ font: "500 11px 'DM Sans'", border: "1.5px solid var(--forest)", padding: "4px 8px", background: "var(--paper)" }}
      onChange={(e) => e.target.value !== orderStatus && set(e.target.value)}
    >
      {transitions.map((s) => <option key={s} value={s}>{s.toLowerCase()}</option>)}
    </select>
  );
}
