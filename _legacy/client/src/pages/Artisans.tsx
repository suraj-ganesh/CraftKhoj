import { ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { ArtisanCard } from "@/components/craft/CraftCards";
import { MarketShell, SectionKicker } from "@/components/craft/MarketShell";
import { artisans } from "@/lib/craft-data";

export default function Artisans() {
  return <MarketShell>
    <section className="page-intro"><div className="page-intro-inner"><SectionKicker number="01">The people behind the pieces</SectionKicker><h1>Meet the makers.</h1><p>Real practices, real workshops, and the people who keep Nepal’s craft traditions in motion.</p></div></section>
    <section className="section"><div className="section-heading"><div><SectionKicker number="02">Artisan stories</SectionKicker><h2>Start with the hand behind the handmade.</h2></div><div><p>Each profile is a place to learn the craft context before you choose an object.</p><Link className="text-link" href="/shop" style={{ marginTop: 16 }}>Browse their work <ArrowRight size={15} /></Link></div></div><div className="artisan-grid">{artisans.map((artisan) => <ArtisanCard artisan={artisan} key={artisan.id} />)}</div></section>
  </MarketShell>;
}
