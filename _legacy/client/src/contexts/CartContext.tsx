import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { Product } from "@/lib/craft-data";

type CartLine = { product: Product; quantity: number };

type CartContextValue = {
  items: CartLine[];
  count: number;
  subtotal: number;
  addItem: (product: Product) => void;
  removeItem: (id: string) => void;
  changeQuantity: (id: string, quantity: number) => void;
  clear: () => void;
  open: boolean;
  setOpen: (open: boolean) => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartLine[]>([]);
  const [open, setOpen] = useState(false);

  const value = useMemo<CartContextValue>(() => {
    const count = items.reduce((total, item) => total + item.quantity, 0);
    const subtotal = items.reduce((total, item) => total + item.product.price * item.quantity, 0);

    return {
      items,
      count,
      subtotal,
      open,
      setOpen,
      addItem: (product) => {
        setItems((current) => {
          const existing = current.find((item) => item.product.id === product.id);
          if (existing) {
            return current.map((item) => item.product.id === product.id ? { ...item, quantity: Math.min(item.quantity + 1, product.stock || 1) } : item);
          }
          return [...current, { product, quantity: 1 }];
        });
        setOpen(true);
      },
      removeItem: (id) => setItems((current) => current.filter((item) => item.product.id !== id)),
      changeQuantity: (id, quantity) => setItems((current) => current.map((item) => item.product.id === id ? { ...item, quantity: Math.max(1, Math.min(quantity, item.product.stock || 1)) } : item)),
      clear: () => setItems([]),
    };
  }, [items, open]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error("useCart must be used inside CartProvider");
  return value;
}
