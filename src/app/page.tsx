import Link from "next/link";
import deferred from "next/dynamic";
import { ArrowRight, BadgeCheck, ShieldCheck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { listProducts } from "@/lib/products";
import { ProductCard, ArtisanCard, ArrowButton, SectionKicker } from "@/components/craft";
import { ProvenanceLookupStrip } from "@/components/ProvenanceLookup";
import { formatPrice } from "@/lib/format";

export const dynamic = "force-dynamic";

const ShaderGradientPanel = deferred(() => import("@/components/ShaderGradientPanel"));

export default async function HomePage() {
  const [featured, latest, artisanProfiles, verifiedCount, approvedProducts, buyerCount] = await Promise.all([
    listProducts({ status: "APPROVED", featured: true, take: 3 }),
    listProducts({ status: "APPROVED", take: 6, sort: "rating" }),
    prisma.artisanProfile.findMany({
      where: { verificationStatus: "APPROVED" },
      include: { user: true, products: true },
      orderBy: { trustScore: "desc" },
      take: 3,
    }),
    prisma.provenanceRecord.count({ where: { verificationStatus: "APPROVED" } }),
    prisma.product.count({ where: { status: "APPROVED" } }),
    prisma.user.count({ where: { role: "BUYER" } }),
  ]);

  const trustedArtisans = artisanProfiles.filter((a) => !!(a.user.fullName && a.bio));

  return (
    <div className="site-home">
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">Provenance · Nepali heritage crafts</span>
          <h1>Every object leaves <em>a trail.</em></h1>
          <p className="hero-lede">
            CraftKhoj is a provenance-based marketplace for Nepali heritage crafts. Browse verified handmade pieces,
            read the record of who made them and how, then buy with the story intact.
          </p>
          <div className="hero-actions">
            <ArrowButton href="/shop">Shop crafts</ArrowButton>
            <Link className="brutal-button" href="/provenance">Verify a record</Link>
            <Link className="brutal-button" href="/register">Join as an artisan</Link>
          </div>
          <div className="hero-note">
            <strong>{trustedArtisans.length}</strong>
            <span>verified artisan workshops · every approved listing is checked by a human verifier.</span>
          </div>
        </div>
        <div className="hero-visual">
          <ShaderGradientPanel />
          <div className="hero-label">
            <strong>The record matters.</strong>
            <span>Each approved piece carries a unique Craft Provenance ID you can look up any time.</span>
          </div>
          <div className="hero-stamp">SEE<br />WHO MADE<br />IT</div>
        </div>
      </section>

      <section className="proof-bar">
        <div className="proof-lead">
          <div className="proof-icon"><BadgeCheck size={19} /></div>
          <div>
            <strong>Provenance, publicly searchable</strong>
            <span>Look up a record with its ID — no account needed.</span>
          </div>
        </div>
        <div><strong>{approvedProducts}</strong><span>Approved live listings</span></div>
        <div><strong>{verifiedCount}</strong><span>Approved provenance records</span></div>
        <div><strong>{buyerCount}</strong><span>Buyers keeping it honest</span></div>
      </section>

      <section className="section">
        <SectionKicker number="01">Featured evidence</SectionKicker>
        <div className="section-heading">
          <h2>Browse pieces that carry proof.</h2>
          <p>Featured works documented with a full provenance trail — verified and issued a Craft Provenance ID.</p>
        </div>
        {featured.length > 0 ? (
          <div className="feature-grid">
            {featured.map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
        ) : (
          <div className="lookup-box"><p>The first verified pieces are being approved right now. Check back shortly.</p></div>
        )}
      </section>

      <section className="story-band">
        <div className="story-layout">
          <div className="story-copy">
            <span className="eyebrow">Why provenance</span>
            <h2>Giving the record back to the maker.</h2>
            <p>
              Handmade Nepali crafts — dhaka, pottery, woodcraft, thangka, paper craft — lose value when buyers cannot
              check authenticity. CraftKhoj ties each object to verified origin, materials, and process history through
              a three-role workflow: artisans submit, verifiers approve, admins keep the marketplace honest.
            </p>
            <ArrowButton href="/provenance">How verification works</ArrowButton>
          </div>
          <div className="story-card">
            <div className="story-card-head"><span>Field note 01</span><span className="archive-stamp">CK · RECORD</span></div>
            <h3>A more honest way to buy the handmade.</h3>
            <div className="story-stats">
              <div><strong>{approvedProducts}</strong><span>Listings</span></div>
              <div><strong>{verifiedCount}</strong><span>Records</span></div>
              <div><strong>{trustedArtisans.length}</strong><span>Workshops</span></div>
            </div>
          </div>
        </div>
      </section>

      <section className="artisan-rail">
        <div className="section">
          <SectionKicker number="02">The makers</SectionKicker>
          <div className="section-heading">
            <h2>Meet the verified artisans.</h2>
            <p>Profiles with district, workshop, trust score, and a live product shelf.</p>
          </div>
          {trustedArtisans.length > 0 ? (
            <div className="artisan-grid">
              {trustedArtisans.map((a) => (
                <ArtisanCard
                  key={a.id}
                  artisan={{
                    id: a.id,
                    name: a.user.fullName,
                    craftSpecialty: a.craftSpecialty,
                    district: a.district,
                    bio: a.bio,
                    trustScore: Number(a.trustScore),
                    portraitUrl: a.portraitUrl,
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="story-card"><strong>Artisan verifications are in the queue.</strong></div>
          )}
        </div>
      </section>

      <section className="lookup-section">
        <div className="lookup-layout">
          <div className="lookup-copy">
            <span className="eyebrow">Public lookup</span>
            <h2>Check any record before you buy.</h2>
            <p>Approved products carry a unique Craft Provenance ID. Enter it to see the maker, materials, method, and timeline — exactly as recorded.</p>
            <Link className="text-link" href="/provenance">Open the full lookup <ArrowRight size={15} /></Link>
          </div>
          <ProvenanceLookupStrip sampleId={null} />
        </div>
      </section>

      <section className="section">
        <SectionKicker number="03">Fresh from the workshops</SectionKicker>
        <div className="section-heading">
          <h2>Recently verified pieces.</h2>
          <p>The newest approved listings, highest rating first.</p>
        </div>
        <div className="feature-grid catalog-grid">
          {latest.map((product) => <ProductCard key={product.id} product={product} />)}
        </div>
      </section>
    </div>
  );
}
