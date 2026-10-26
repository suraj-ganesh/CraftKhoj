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
      value={orderStatus}
      disabled={busy}
      onChange={(e) => e.target.value !== orderStatus && set(e.target.value)}
      style={{ minHeight: 30, padding: "0 30px 0 10px" }}
    >
      {transitions.map((s) => <option key={s} value={s}>{s.toLowerCase()}</option>)}
    </select>
  );
}
