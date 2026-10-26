"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { formatPrice } from "@/lib/format";

type Line = { id: number; quantity: number; product: { id: number; title: string; price: number; image: string; maker: string } };

export function CheckoutForm({ lines, subtotal, defaultName }: { lines: Line[]; subtotal: number; defaultName: string }) {
  const router = useRouter();
  const [method, setMethod] = useState<"CASH_ON_DELIVERY" | "SIMULATED">("CASH_ON_DELIVERY");
  const [form, setForm] = useState({ shippingName: defaultName, shippingPhone: "", shippingAddress: "" });
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, paymentMethod: method }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) { toast.error(data.error ?? "Could not place the order."); return; }
    toast.success(`Order #${data.order.id} placed — the maker has been notified.`);
    router.push("/buyer/orders");
  }

  return (
    <div style={{ display: "grid", gap: 20, gridTemplateColumns: "1.1fr .9fr", alignItems: "start" }}>
      <div className="dashboard-panel">
        <div className="panel-head"><h2>Shipping details</h2><span className="status-badge status-blue"><span className="status-dot" />Demo checkout</span></div>
        <form onSubmit={submit}>
          <div className="form-grid" style={{ marginTop: 0 }}>
            <div className="form-field full">
              <label>Recipient name</label>
              <input required value={form.shippingName} onChange={(e) => setForm({ ...form, shippingName: e.target.value })} />
            </div>
            <div className="form-field full">
              <label>Phone</label>
              <input required value={form.shippingPhone} onChange={(e) => setForm({ ...form, shippingPhone: e.target.value })} placeholder="98XXXXXXXX" />
            </div>
            <div className="form-field full">
              <label>Delivery address</label>
              <textarea required rows={3} style={{ background: "var(--paper)", border: "2px solid var(--forest)", padding: "11px 12px", font: "500 13px 'DM Sans'" }} value={form.shippingAddress} onChange={(e) => setForm({ ...form, shippingAddress: e.target.value })} />
            </div>
          </div>

          <div style={{ margin: "20px 0 12px" }}>
            <span className="eyebrow" style={{ display: "block" }}>Payment method</span>
            <div className="category-tabs" style={{ margin: "10px 0 0" }}>
              <button type="button" className={`category-tab ${method === "CASH_ON_DELIVERY" ? "active" : ""}`} onClick={() => setMethod("CASH_ON_DELIVERY")}>Cash on delivery</button>
              <button type="button" className={`category-tab ${method === "SIMULATED" ? "active" : ""}`} onClick={() => setMethod("SIMULATED")}>Simulated payment (demo)</button>
            </div>
            <p style={{ fontSize: 11, color: "var(--sage)", marginTop: 8 }}>
              No real gateway is integrated — a simulated payment marks the order as paid instantly for the demo.
            </p>
          </div>

          <button className="brutal-button brutal-button-dark full-width" disabled={busy} type="submit">
            {method === "SIMULATED" ? "Place order (simulated payment)" : "Place order (pay on delivery)"} <Check size={16} />
          </button>
        </form>
      </div>

      <div className="dashboard-panel" style={{ background: "var(--sky)" }}>
        <div className="panel-head"><h2>Order summary</h2></div>
        <p style={{ fontSize: 18, fontWeight: 700, marginBottom: 14 }}>{lines.length} {lines.length === 1 ? "piece" : "pieces"}</p>
        <div>
          {lines.map((l) => (
            <div className="queue-item" key={l.id}>
              {l.product.image && <img className="queue-thumb" src={l.product.image} alt="" />}
              <div>
                <strong style={{ font: "700 13px 'Space Grotesk'" }}>{l.product.title}</strong>
                <span>{l.product.maker} · ×{l.quantity}</span>
              </div>
              <strong style={{ marginLeft: "auto" }}>{formatPrice(l.product.price * l.quantity)}</strong>
            </div>
          ))}
        </div>
        <div style={{ borderTop: "3px solid var(--forest)", display: "flex", justifyContent: "space-between", marginTop: 20, paddingTop: 16 }}>
          <span style={{ fontSize: 15, fontWeight: 700 }}>Estimated total</span>
          <strong style={{ font: "700 27px 'Space Grotesk'"}}>{formatPrice(subtotal)}</strong>
        </div>
        <small style={{ color: "var(--sage)", display: "block", fontSize: 10, marginTop: 8 }}>Paid in USD for the demo. Stock is reduced the moment your order is placed.</small>
      </div>
    </div>
  );
}
