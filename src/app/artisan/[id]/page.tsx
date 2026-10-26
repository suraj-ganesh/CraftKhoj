import Link from "next/link";
import { notFound } from "next/navigation";
import { Star } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { listProducts } from "@/lib/products";
import { computeTrustScore } from "@/lib/algorithms";
import { formatDate, formatPrice, trustLabel } from "@/lib/format";
import { ProductCard, VerifiedMark } from "@/components/craft";

export const dynamic = "force-dynamic";

export default async function ArtisanProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const artisanId = Number(id);
  if (!Number.isInteger(artisanId)) notFound();

  const artisan = await prisma.artisanProfile.findUnique({
    where: { id: artisanId },
    include: {
      user: { select: { fullName: true, createdAt: true } },
      products: { where: { status: "APPROVED" }, include: { category: true, images: true, reviews: true, materials: { include: { material: true } } } },
    },
  });
  if (!artisan || artisan.verificationStatus !== "APPROVED") notFound();

  const shelf = artisan.products.map((p) => {
    const ratings = p.reviews.map((r) => r.rating);
    return {
      id: p.id, title: p.title, description: p.description, price: String(p.price), stock: p.stock, status: p.status,
      provenanceId: p.provenanceId, tags: p.tags, origin: p.origin, featured: p.isFeatured,
      createdAt: p.createdAt, manufacturerMethod: p.productionMethod ?? "", category: p.category.name, categoryId: p.categoryId,
      image: p.images.find((i) => i.isPrimary)?.imageUrl ?? p.images[0]?.imageUrl ?? "",
      artisan: { id: artisan.id, name: artisan.user.fullName, portrait: artisan.portraitUrl, bio: artisan.bio ?? "", trustScore: Number(artisan.trustScore) },
      verified: true, rating: ratings.length ? Math.round(ratings.reduce((a, b) => a + b, 0) / ratings.length * 10) / 10 : 0,
      reviewCount: ratings.length, materials: p.materials.map((m) => m.material.name),
    };
  });

  const score = Number(artisan.trustScore) || (await computeTrustScore(artisan.id));
  const initials = artisan.user.fullName.split(" ").map((w) => w[0]).slice(0, 2).join("");

  return (
    <>
      <section className="artisan-profile-header">
        <div className="artisan-profile-layout">
          <div className="profile-portrait">
            {artisan.portraitUrl && <img src={artisan.portraitUrl} alt={artisan.user.fullName} />}
            <span>{initials}</span>
          </div>
          <div className="artisan-profile-copy">
            <span className="eyebrow" style={{ color: "var(--sky)" }}>Verified artisan</span>
            <h1>{artisan.user.fullName}</h1>
            <p>{artisan.bio}</p>
            <div className="profile-meta">
              <span>{artisan.craftSpecialty ?? "Heritage crafts"}</span>
              <span>District · {artisan.district}</span>
              <span>Workshop · {artisan.workshopAddress}</span>
              <span>{artisan.yearsExperience} years at the bench</span>
              <span>With CraftKhoj since {formatDate(artisan.user.createdAt)}</span>
              <span className="trust-pill">{score} · {trustLabel(score)}</span>
            </div>
          </div>
        </div>
      </section>
      <section className="profile-products">
        <h2>From the workshop.</h2>
        {shelf.length === 0 ? (
          <p style={{ color: "var(--sage)", fontSize: 14 }}>No verified pieces listed yet — check back soon.</p>
        ) : (
          <div className="feature-grid catalog-grid">
            {shelf.map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
        )}
      </section>
    </>
  );
}
