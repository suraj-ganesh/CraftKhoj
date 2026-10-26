import { ArrowLeft, ArrowRight, MapPin, ShieldCheck } from "lucide-react";
import { Link, useRoute } from "wouter";
import { ArtisanMini, ProductCard } from "@/components/craft/CraftCards";
import { MarketShell, SectionKicker, StatusBadge } from "@/components/craft/MarketShell";
import { getArtisan, products, trustLabel } from "@/lib/craft-data";
import NotFound from "@/pages/NotFound";

export default function ArtisanProfile() {
  const [, params] = useRoute("/artisan/:id");
  const artisan = getArtisan(params?.id || "");
  if (!artisan) return <NotFound />;
  const artisanProducts = products.filter((product) => product.artisanId === artisan.id);
  return <MarketShell><section className="artisan-profile-header"><div className="artisan-profile-layout"><div className="profile-portrait"><img src={artisan.portrait} alt={artisan.name} /><span>{artisan.initials} / {artisan.district}</span></div><div className="artisan-profile-copy"><div className="product-meta" style={{ color: "var(--sky)" }}><span>{artisan.craft}</span><span><MapPin size={12} style={{ verticalAlign: "-2px" }} /> {artisan.location}</span></div><h1>{artisan.name}</h1><p>{artisan.bio}</p><div className="profile-meta"><span><ShieldCheck size={13} style={{ verticalAlign: "-2px" }} /> Verified since {artisan.verifiedSince}</span><span>{artisan.years} years in practice</span><span>{artisan.trustScore} / 100 · {trustLabel(artisan.trustScore)}</span></div></div></div></section><section className="profile-products"><Link href="/artisans" className="text-link" style={{ marginBottom: 25 }}><ArrowLeft size={15} /> All artisan stories</Link><div style={{ alignItems: "end", display: "flex", justifyContent: "space-between", marginBottom: 28 }}><div><SectionKicker number="01">The workshop shelf</SectionKicker><h2>Pieces by {artisan.name.split(" ")[0]}.</h2></div><StatusBadge tone="green">{artisan.trustScore} trust score</StatusBadge></div><div className="catalog-grid">{artisanProducts.map((product) => <ProductCard key={product.id} product={product} />)}</div></section><section className="lookup-section"><div className="lookup-layout"><div className="lookup-copy"><SectionKicker number="02">Keep following the thread</SectionKicker><h2>One maker. Many stories.</h2><p>Every product on this shelf connects back to a living practice, not an anonymous supply chain.</p></div><div className="lookup-box"><ArtisanMini artisan={artisan} /><Link href={`/provenance?query=${artisanProducts[0]?.provenanceId || ""}`} className="brutal-button brutal-button-dark full-width" style={{ marginTop: 19 }}>See a public record <ArrowRight size={17} /></Link></div></div></section></MarketShell>;
}
