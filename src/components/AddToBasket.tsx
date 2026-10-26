"use client";

import { ArrowRight } from "lucide-react";
import { useCart } from "./CartContext";

export function AddToBasketButton({ productId, disabled, compact, className = "" }: { productId: number; disabled?: boolean; compact?: boolean; className?: string }) {
  const { addItem } = useCart();
  if (compact) {
    return (
      <button className="mini-action" disabled={disabled} onClick={() => addItem(productId)}>
        {disabled ? "Unavailable" : "Add to basket"}<ArrowRight size={14} />
      </button>
    );
  }
  return (
    <button className={`brutal-button brutal-button-dark ${className}`} disabled={disabled} onClick={() => addItem(productId)}>
      Add to basket <ArrowRight size={16} />
    </button>
  );
}
