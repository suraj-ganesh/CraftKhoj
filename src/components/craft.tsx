import Link from "next/link";
import { ArrowRight, Check, ChevronDown, Star } from "lucide-react";
import { formatPrice, trustLabel } from "@/lib/format";
import type { ProductShape } from "@/lib/products";
import { AddToBasketButton } from "./AddToBasket";

export function StatusBadge({ children, tone = "blue", className = "" }: { children: React.ReactNode; tone?: "blue" | "green" | "muted" | "orange" | "red"; className?: string }) {
  const toneClass = { blue: "blue", green: "green", muted: "muted", orange: "orange", red: "red" }[tone];
  return <span className={`status-badge status-${toneClass} ${className}`}><span className="status-dot" />{children}</span>;
}

export function ArrowButton({ children, href, onClick, className = "", type }: { children: React.ReactNode; href?: string; onClick?: () => void; className?: string; type?: "submit" | "button" }) {
  const cls = `brutal-button brutal-button-blue ${className}`;
  const content = <>{children}<ArrowRight size={17} strokeWidth={2.5} /></>;
  if (href) return <Link href={href} className={cls}>{content}</Link>;
  return <button className={cls} onClick={onClick} type={type}>{content}</button>;
}

export function SectionKicker({ number, children }: { number: string; children: React.ReactNode }) {
  return <div className="section-kicker"><span>{number}</span><span>{children}</span></div>;
}

export function VerifiedMark({ label = "Verified provenance" }: { label?: string }) {
  return <span className="verified-mark"><Check size={14} strokeWidth={3} />{label}</span>;
}

export function SelectArrow() { return <ChevronDown size={16} />; }

export function ProvenanceStrip({ product }: { product: { provenanceId: string | null } }) {
  if (!product.provenanceId) return null;
  return (
    <div className="provenance-strip">
      <div className="provenance-strip-icon"><span>CK</span></div>
      <div><span className="eyebrow">Craft Provenance ID</span><strong>{product.provenanceId}</strong></div>
      <VerifiedMark />
    </div>
  );
}

export function ProductCard({ product }: { product: ProductShape }) {
  const unavailable = product.stock === 0 || product.status !== "APPROVED";
  return (
    <article className="product-card">
      <Link href={`/product/${product.id}`} className="product-image-wrap">
        <img src={product.image} alt={product.title} />
        <span className="image-index">0{(product.id % 9) + 1}</span>
      </Link>
      <div className="product-card-body">
        <div className="product-meta"><span>{product.category}</span><span>{product.origin}</span></div>
        <Link href={`/product/${product.id}`}><h3>{product.title}</h3></Link>
        <div className="product-card-bottom">
          <div>
            <strong>{formatPrice(product.price)}</strong>
            <span className="rating"><Star size={13} fill="currentColor" /> {product.rating || "New"}</span>
          </div>
          {product.verified && <VerifiedMark />}
        </div>
        <div className="product-card-actions">
          <span className={unavailable ? "stock-out" : product.stock < 4 ? "stock-low" : "stock-ok"}>
            {unavailable ? "Out of stock" : product.stock < 4 ? `${product.stock} left` : "In stock"}
          </span>
          <AddToBasketButton productId={product.id} disabled={unavailable} compact />
        </div>
      </div>
    </article>
  );
}

export function ArtisanCard({ artisan }: { artisan: { id: number; name: string; craftSpecialty: string | null; district: string | null; bio: string | null; trustScore: number | string; portraitUrl: string | null } }) {
  const score = Number(artisan.trustScore);
  const initials = artisan.name.split(" ").map((w) => w[0]).slice(0, 2).join("");
  return (
    <Link href={`/artisan/${artisan.id}`} className="artisan-card">
      <div className="artisan-card-image">
        {artisan.portraitUrl && <img src={artisan.portraitUrl} alt={artisan.name} />}
        <span className="artisan-initials">{initials}</span>
      </div>
      <div className="artisan-card-copy">
        <div className="product-meta"><span>{artisan.craftSpecialty ?? "Heritage craft"}</span><span>{artisan.district}</span></div>
        <h3>{artisan.name}</h3>
        <p>{artisan.bio}</p>
        <div className="artisan-card-foot">
          <span className="trust-pill">{score} · {trustLabel(score)}</span>
          <ArrowRight size={16} />
        </div>
      </div>
    </Link>
  );
}

export function ArtisanMini({ artisan }: { artisan: { id: number; name: string; portraitUrl: string | null; bio: string | null; district: string | null } }) {
  const initials = artisan.name.split(" ").map((w) => w[0]).slice(0, 2).join("");
  return (
    <Link href={`/artisan/${artisan.id}`} className="artisan-mini">
      {artisan.portraitUrl ? <img src={artisan.portraitUrl} alt="" /> : <span className="artisan-mini-fallback">{initials}</span>}
      <span>
        <strong>{artisan.name}</strong>
        <small>{artisan.district}</small>
        <small>{artisan.bio?.slice(0, 70)}{artisan.bio && artisan.bio.length > 70 ? "…" : ""}</small>
      </span>
      <ArrowRight size={17} />
    </Link>
  );
}
