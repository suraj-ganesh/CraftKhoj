"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { formatPrice } from "@/lib/format";
import { useState } from "react";

type Line = { id: number; quantity: number; product: { id: number; title: string; price: number; stock: number; image: string; maker: string } };

export function CartLines({ lines, subtotal }: { lines: Line[]; subtotal: number }) {
  const router = useRouter();

  async function changeQuantity(id: number, quantity: number) {
    if (quantity < 1) return remove(id);
    const res = await fetch("/api/cart", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, quantity }) });
    const data = await res.json();
    if (!res.ok) toast.error(data.error ?? "Quantity not available.");
    router.refresh();
  }

  async function remove(id: number) {
    await fetch(`/api/cart?id=${id}`, { method: "DELETE" });
    toast.success("Removed from basket.");
    router.refresh();
  }

  return (
    <>
      <div className="cart-lines">
        {lines.map((line) => (
          <div className="cart-line" key={line.id}>
            <img src={line.product.image} alt="" />
            <div className="cart-line-copy">
              <Link href={`/product/${line.product.id}`}><strong>{line.product.title}</strong></Link>
              <span>{line.product.maker} · {formatPrice(line.product.price)}</span>
              <div className="quantity-control">
                <button onClick={() => changeQuantity(line.id, line.quantity - 1)} disabled={line.quantity <= 1}>-</button>
                <span>{line.quantity}</span>
                <button onClick={() => changeQuantity(line.id, line.quantity + 1)} disabled={line.quantity >= line.product.stock}>+</button>
                <button className="remove-line" onClick={() => remove(line.id)}>Remove</button>
              </div>
            </div>
            <strong style={{ marginLeft: "auto" }}>{formatPrice(line.product.price * line.quantity)}</strong>
          </div>
        ))}
      </div>
      <div className="cart-summary">
        <div><span>Subtotal</span><strong>{formatPrice(subtotal)}</strong></div>
        <small>Shipping and taxes calculated at checkout. Cash on delivery or a simulated payment.</small>
        <Link href="/buyer/checkout" className="brutal-button brutal-button-dark full-width">Continue to checkout <ArrowRight size={17} /></Link>
      </div>
    </>
  );
}
