import { Link, useLocation } from "wouter";
import { ArrowRight, Check, ChevronDown, Menu, Search, ShoppingBag, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { formatPrice } from "@/lib/craft-data";
import { useCart } from "@/contexts/CartContext";

const navItems = [
  { label: "Shop crafts", href: "/shop" },
  { label: "Provenance", href: "/provenance" },
  { label: "Artisan stories", href: "/artisans" },
  { label: "Workspace", href: "/workspace" },
];

export function Logo() {
  return (
    <Link href="/" className="brand-mark" aria-label="CraftKhoj home">
      <span className="brand-symbol"><span>CK</span></span>
      <span className="brand-name">CraftKhoj</span>
    </Link>
  );
}

export function StatusBadge({ children, tone = "blue" }: { children: ReactNode; tone?: "blue" | "green" | "muted" | "orange" }) {
  return <span className={`status-badge status-${tone}`}><span className="status-dot" />{children}</span>;
}

export function ArrowButton({ children, onClick, href }: { children: ReactNode; onClick?: () => void; href?: string }) {
  const className = "brutal-button brutal-button-blue";
  const content = <>{children}<ArrowRight size={17} strokeWidth={2.5} /></>;
  return href ? <Link href={href} className={className}>{content}</Link> : <button className={className} onClick={onClick}>{content}</button>;
}

export function SectionKicker({ number, children }: { number: string; children: ReactNode }) {
  return <div className="section-kicker"><span>{number}</span><span>{children}</span></div>;
}

function CartDrawer() {
  const [, navigate] = useLocation();
  const { items, count, subtotal, open, setOpen, removeItem, changeQuantity, clear } = useCart();
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
            <div className="cart-lines">{items.map(({ product, quantity }) => <div className="cart-line" key={product.id}><img src={product.image} alt="" /><div className="cart-line-copy"><strong>{product.title}</strong><span>{formatPrice(product.price)}</span><div className="quantity-control"><button onClick={() => changeQuantity(product.id, quantity - 1)}>-</button><span>{quantity}</span><button onClick={() => changeQuantity(product.id, quantity + 1)}>+</button><button className="remove-line" onClick={() => removeItem(product.id)}>Remove</button></div></div></div>)}</div>
            <div className="cart-summary"><div><span>Subtotal</span><strong>{formatPrice(subtotal)}</strong></div><small>Shipping and taxes are calculated at checkout.</small><button className="brutal-button brutal-button-dark full-width" onClick={() => { setOpen(false); navigate("/checkout"); }}>Continue to checkout <ArrowRight size={17} /></button><button className="text-button" onClick={clear}>Clear basket</button></div>
          </>
        )}
      </aside>
    </div>
  );
}

export function MarketShell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { count, setOpen } = useCart();
  return (
    <div className="site-shell">
      <div className="announcement"><span>NEW</span> Provenance is the product. See the record behind every approved piece. <Link href="/provenance">Learn how it works <ArrowRight size={13} /></Link></div>
      <header className="site-header"><div className="header-inner"><Logo /><nav className="desktop-nav">{navItems.map((item) => <Link key={item.href} href={item.href} className={location === item.href ? "active" : ""}>{item.label}</Link>)}</nav><div className="header-actions"><button className="header-search" onClick={() => { window.location.href = "/shop"; }}><Search size={18} /><span>Search</span></button><Link className="header-search" href="/account">Sign in</Link><button className="cart-trigger" onClick={() => setOpen(true)} aria-label="Open cart"><ShoppingBag size={19} /><span>Cart</span>{count > 0 && <b>{count}</b>}</button><button className="mobile-menu" onClick={() => setMobileOpen((current) => !current)} aria-label="Toggle menu">{mobileOpen ? <X size={22} /> : <Menu size={22} />}</button></div></div>{mobileOpen && <div className="mobile-nav">{navItems.map((item) => <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}>{item.label}<ArrowRight size={15} /></Link>)}<Link href="/account" onClick={() => setMobileOpen(false)}>Sign in / register <ArrowRight size={15} /></Link></div>}</header>
      <main>{children}</main>
      <footer className="site-footer"><div className="footer-top"><div><Logo /><p className="footer-intro">The more honest way to buy the handmade. A provenance-based marketplace for Nepali heritage crafts.</p></div><div className="footer-links"><div><span className="eyebrow">Explore</span><Link href="/shop">Browse crafts</Link><Link href="/provenance">Verify a record</Link><Link href="/artisans">Meet the makers</Link><Link href="/account">Sign in / register</Link></div><div><span className="eyebrow">For the community</span><Link href="/workspace">Artisan workspace</Link><Link href="/orders">Order history</Link><Link href="/review">Write a review</Link><Link href="/report">Report a listing</Link></div></div></div><div className="footer-bottom"><span>© 2024 CraftKhoj / Made with respect for the maker.</span><span>Authenticity · Visibility · Connection</span></div></footer>
      <CartDrawer />
    </div>
  );
}

export function VerifiedMark({ label = "Verified provenance" }: { label?: string }) {
  return <span className="verified-mark"><Check size={14} strokeWidth={3} />{label}</span>;
}

export function SelectArrow() { return <ChevronDown size={16} />; }
