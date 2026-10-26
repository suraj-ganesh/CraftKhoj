import { ArrowRight, Heart, MapPin, Star } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import { formatPrice, type Artisan, type Product, trustLabel } from "@/lib/craft-data";
import { useCart } from "@/contexts/CartContext";
import { StatusBadge, VerifiedMark } from "@/components/craft/MarketShell";

export function ProductCard({ product, featured = false }: { product: Product; featured?: boolean }) {
  const { addItem } = useCart();
  const unavailable = product.stock === 0;
  return <article className={`product-card ${featured ? "product-card-featured" : ""}`}><Link href={`/product/${product.id}`} className="product-image-wrap"><img src={product.image} alt={product.title} /><span className="image-index">0{product.id.length % 7 + 1}</span><button className="heart-button" aria-label={`Save ${product.title}`} onClick={(event) => { event.preventDefault(); toast.success("Saved to your field notes."); }}><Heart size={17} /></button></Link><div className="product-card-body"><div className="product-meta"><span>{product.category}</span><span>{product.origin}</span></div><Link href={`/product/${product.id}`}><h3>{product.title}</h3></Link><div className="product-card-bottom"><div><strong>{formatPrice(product.price)}</strong><span className="rating"><Star size={13} fill="currentColor" /> {product.rating}</span></div>{product.verified && <VerifiedMark />}</div><div className="product-card-actions"><span className={unavailable ? "stock-out" : product.stock < 4 ? "stock-low" : "stock-ok"}>{unavailable ? "Out of stock" : product.stock < 4 ? `${product.stock} left` : "In stock"}</span><button className="mini-action" disabled={unavailable} onClick={() => { addItem(product); toast.success(`${product.title} added to your basket.`); }}>{unavailable ? "Unavailable" : "Add to basket"}<ArrowRight size={14} /></button></div></div></article>;
}

export function ArtisanCard({ artisan }: { artisan: Artisan }) {
  return <Link href={`/artisan/${artisan.id}`} className="artisan-card"><div className="artisan-card-image"><img src={artisan.portrait} alt={artisan.name} /><span className="artisan-initials">{artisan.initials}</span></div><div className="artisan-card-copy"><div className="product-meta"><span>{artisan.craft}</span><span>{artisan.district}</span></div><h3>{artisan.name}</h3><p>{artisan.bio}</p><div className="artisan-card-foot"><span className="trust-pill">{artisan.trustScore} · {trustLabel(artisan.trustScore)}</span><ArrowRight size={16} /></div></div></Link>;
}

export function ProvenanceStrip({ product }: { product: Product }) {
  return <div className="provenance-strip"><div className="provenance-strip-icon"><span>CK</span></div><div><span className="eyebrow">Craft Provenance ID</span><strong>{product.provenanceId}</strong></div><VerifiedMark /></div>;
}

export function ArtisanMini({ artisan }: { artisan: Artisan }) {
  return <Link href={`/artisan/${artisan.id}`} className="artisan-mini"><img src={artisan.portrait} alt="" /><span><strong>{artisan.name}</strong><small><MapPin size={11} /> {artisan.location}</small></span><ArrowRight size={17} /></Link>;
}
