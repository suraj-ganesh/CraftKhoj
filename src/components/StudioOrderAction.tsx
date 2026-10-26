"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

const nextFor: Record<string, { next: string; label: string }> = {
  PLACED: { next: "PROCESSING", label: "Start processing" },
  PROCESSING: { next: "SHIPPED", label: "Mark shipped" },
  SHIPPED: { next: "DELIVERED", label: "Mark delivered" },
};

export function StudioOrderAction({ orderId, orderStatus }: { orderId: number; orderStatus: string }) {
  const router = useRouter();
  const step = nextFor[orderStatus];
  if (!step) return null;

  async function advance() {
    const res = await fetch(`/api/orders/${orderId}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderStatus: step.next }),
    });
    const data = await res.json();
    if (!res.ok) { toast.error(data.error ?? "Could not update the order."); return; }
    toast.success(`Order moved to ${step.next.toLowerCase()}.`);
    router.refresh();
  }

  return <button className="mini-action" onClick={advance}>{step.label} →</button>;
}
