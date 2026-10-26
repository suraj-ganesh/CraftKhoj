"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, Menu, ShoppingBag, X } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "./CartContext";
import { formatPrice } from "@/lib/format";

export function Logo() {
  return (
    <Link href="/" className="brand-mark" aria-label="CraftKhoj home">
      <span className="brand-symbol"><span>CK</span></span>
      <span className="brand-name">CraftKhoj</span>
    </Link>
  );
}

const navItems = [
  { label: "Shop crafts", href: "/shop" },
  { label: "Provenance", href: "/provenance" },
  { label: "Artisan stories", href: "/artisans" },
];

function areaHome(role: string | null | undefined) {
  switch (role) {
    case "BUYER": return "/buyer";
    case "ARTISAN": return "/studio";
    case "VERIFIER": return "/verifier";
    case "ADMIN": return "/admin";
    default: return null;
  }
}

const roleAreas: Record<string, { label: string; href: string }[]> = {
  BUYER: [
    { label: "My space", href: "/buyer" },
    { label: "Orders", href: "/buyer/orders" },
    { label: "Basket", href: "/buyer/cart" },
  ],
  ARTISAN: [
    { label: "Studio", href: "/studio" },
    { label: "Products", href: "/studio/products" },
    { label: "Provenance", href: "/studio/provenance" },
    { label: "Orders", href: "/studio/orders" },
  ],
  VERIFIER: [
    { label: "Queue", href: "/verifier" },
    { label: "Artisans", href: "/verifier/artisans" },
    { label: "Reports", href: "/verifier/reports" },
  ],
  ADMIN: [
    { label: "Dashboard", href: "/admin" },
    { label: "Users", href: "/admin/users" },
    { label: "Orders", href: "/admin/orders" },
    { label: "Categories", href: "/admin/categories" },
    { label: "Products", href: "/admin/products" },
    { label: "Reports", href: "/admin/reports" },
  ],
};

export function SiteHeader({ user }: { user: { role: string; fullName: string } | null }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { count, setOpen } = useCart();
  const area = user ? areaHome(user.role) : null;
  const links = user ? roleAreas[user.role] ?? [] : navItems;
  const isDashboard = area && (pathname === area || pathname.startsWith(area + "/"));

  return (
    <>
      <header className="site-header">
        <div className="header-inner">
          <Logo />
          <nav className="desktop-nav">
            {(navItems.some((i) => i.href === pathname) || !user || !isDashboard ? navItems : links).map((item) => (
              <Link key={item.href} href={item.href} className={pathname === item.href ? "active" : ""}>{item.label}</Link>
            ))}
            {user && navItems.every((i) => i.href !== pathname) && !isDashboard && (
              <Link href={area!} className="active">My CraftKhoj</Link>
            )}
          </nav>
          <div className="header-actions">
            {user ? (
              <Link className="header-search" href="/api" onClick={async (e) => { e.preventDefault(); await fetch("/api/auth/logout", { method: "POST" }); window.location.href = "/"; }}>
                Sign out
              </Link>
            ) : (
              <>
                <Link className="header-search" href="/login">Sign in</Link>
                <Link className="header-search" href="/register">Register</Link>
              </>
            )}
            {(!user || user.role === "BUYER") && (
              <button className="cart-trigger" onClick={() => setOpen(true)} aria-label="Open cart">
                <ShoppingBag size={19} /><span>Cart</span>{count > 0 && <b>{count}</b>}
              </button>
            )}
            {user && (
              <span className="header-search" title={user.fullName}>{user.fullName}</span>
            )}
            <button className="mobile-menu" onClick={() => setMobileOpen((c) => !c)} aria-label="Toggle menu">
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
        {mobileOpen && (
          <div className="mobile-nav">
            {links.map((item) => (
              <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}>{item.label}<ArrowRight size={15} /></Link>
            ))}
            {user ? (
              <button onClick={async () => { await fetch("/api/auth/logout", { method: "POST" }); window.location.href = "/"; }}>Sign out<ArrowRight size={15} /></button>
            ) : (
              <Link href="/login" onClick={() => setMobileOpen(false)}>Sign in / register<ArrowRight size={15} /></Link>
            )}
          </div>
        )}
      </header>
    </>
  );
}

export function CartDrawer() {
  const { items, count, subtotal, open, setOpen, removeItem, changeQuantity } = useCart();
  if (!open) return null;
  return (
    <div className="cart-layer" role="dialog" aria-label="Shopping cart">
      <button className="cart-scrim" aria-label="Close cart" onClick={() => setOpen(false)} />
      <aside className="cart-drawer">
        <div className="cart-drawer-top"><div><span className="eyebrow">Your basket</span><h2>{count} {count === 1 ? "piece" : "pieces"}</h2></div><button className="icon-button" onClick={() => setOpen(false)} aria-label="Close"><X size={20} /></button></div>
        {items.length === 0 ? (
          <div className="empty-cart"><div className="empty-cart-icon"><ShoppingBag size={28} /></div><h3>Nothing tucked away yet.</h3><p>Find a piece with a story and bring it home.</p><Link href="/shop" className="text-link" onClick={() => setOpen(false)}>Browse the collection <ArrowRight size={15} /></Link></div>
        ) : (
          <>
            <div className="cart-lines">
              {items.map((line) => (
                <div className="cart-line" key={line.id}>
                  <img src={line.product.image} alt="" />
                  <div className="cart-line-copy">
                    <strong>{line.product.title}</strong>
                    <span>{formatPrice(line.product.price)}</span>
                    <div className="quantity-control">
                      <button onClick={() => changeQuantity(line.id, line.quantity - 1)}>-</button>
                      <span>{line.quantity}</span>
                      <button onClick={() => changeQuantity(line.id, line.quantity + 1)}>+</button>
                      <button className="remove-line" onClick={() => removeItem(line.id)}>Remove</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="cart-summary">
              <div><span>Subtotal</span><strong>{formatPrice(subtotal)}</strong></div>
              <small>Shipping and taxes are calculated at checkout.</small>
              <Link href="/buyer/checkout" className="brutal-button brutal-button-dark full-width" onClick={() => setOpen(false)}>Continue to checkout <ArrowRight size={17} /></Link>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
