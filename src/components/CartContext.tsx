"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { formatPrice } from "@/lib/format";

export type CartLine = {
  id: number;
  quantity: number;
  product: { id: number; title: string; price: string; stock: number; image: string };
};

type CartContextValue = {
  items: CartLine[];
  count: number;
  subtotal: number;
  open: boolean;
  setOpen: (open: boolean) => void;
  addItem: (productId: number) => Promise<void>;
  removeItem: (id: number) => Promise<void>;
  changeQuantity: (id: number, quantity: number) => Promise<void>;
  refresh: () => Promise<void>;
  role: string | null;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ role, children }: { role: string | null; children: ReactNode }) {
  const [items, setItems] = useState<CartLine[]>([]);
  const [open, setOpen] = useState(false);

  const refresh = useCallback(async () => {
    if (role !== "BUYER") return;
    try {
      const res = await fetch("/api/cart");
      if (res.ok) {
        const data = await res.json();
        setItems(
          (data.items as { id: number; quantity: number; product: { id: number; title: string; price: string | number; stock: number; images: { imageUrl: string; isPrimary: boolean }[] } }[]).map((i) => ({
            id: i.id,
            quantity: i.quantity,
            product: {
              id: i.product.id,
              title: i.product.title,
              price: String(i.product.price),
              stock: i.product.stock,
              image: i.product.images.find((img) => img.isPrimary)?.imageUrl ?? i.product.images[0]?.imageUrl ?? "",
            },
          }))
        );
      }
    } catch {
      /* offline — keep local state */
    }
  }, [role]);

  useEffect(() => { refresh(); }, [refresh]);

  const addItem = useCallback(
    async (productId: number) => {
      if (role !== "BUYER") {
        toast("Sign in as a buyer to collect pieces.", {
          action: { label: "Sign in", onClick: () => (window.location.href = "/login") },
        });
        return;
      }
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, quantity: 1 }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Could not add to basket.");
        return;
      }
      toast.success("Added to your basket.");
      await refresh();
      setOpen(true);
    },
    [role, refresh]
  );

  const removeItem = useCallback(
    async (id: number) => {
      await fetch(`/api/cart?id=${id}`, { method: "DELETE" });
      await refresh();
    },
    [refresh]
  );

  const changeQuantity = useCallback(
    async (id: number, quantity: number) => {
      const line = items.find((i) => i.id === id);
      if (!line) return;
      if (quantity < 1) return removeItem(id);
      const res = await fetch("/api/cart", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, quantity }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error ?? "Quantity not available.");
      }
      await refresh();
    },
    [items, refresh, removeItem]
  );

  const count = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce((sum, i) => sum + Number(i.product.price) * i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, count, subtotal, open, setOpen, addItem, removeItem, changeQuantity, refresh, role }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}

export { formatPrice };
