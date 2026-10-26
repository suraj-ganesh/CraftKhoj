"use client";

import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { toast } from "sonner";

export function OrderListActions({ orderId, orderStatus }: { orderId: number; orderStatus: string }) {
  const router = useRouter();
  const cancellable = orderStatus === "PLACED";

  async function cancel() {
    const res = await fetch(`/api/orders/${orderId}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderStatus: "CANCELLED" }),
    });
    const data = await res.json();
    if (!res.ok) { toast.error(data.error ?? "Could not cancel."); return; }
    toast.success("Order cancelled. Stock has been restored.");
    router.refresh();
  }

  return (
    cancellable ? (
      <button className="mini-action" style={{ color: "#c14e3d", marginTop: 10 }} onClick={cancel}>
        <X size={13} /> Cancel order (stock is restored)
      </button>
    ) : null
  );
}
