import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, MapPin, Star } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { listProducts } from "@/lib/products";
import { recommendSimilar } from "@/lib/algorithms";
import { formatDate, formatPrice } from "@/lib/format";
import { ProvenanceStrip, ProductCard, ArtisanMini, VerifiedMark } from "@/components/craft";
import { AddToBasketButton } from "@/components/AddToBasket";
import { ReportProductButton } from "@/components/PageActions";

export const dynamic = "force-dynamic";

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const productId = Number(id);
  if (!Number.isInteger(productId)) notFound();

  const raw = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      category: true,
      images: true,
      materials: { include: { material: true } },
      artisan: { include: { user: { select: { fullName: true } } } },
      provenanceRecord: {
        include: {
          verifier: { select: { fullName: true } },
          events: { orderBy: { eventTime: "asc" } },
        },
      },
      reviews: { include: { buyer: { select: { fullName: true } } }, orderBy: { createdAt: "desc" } },
    },
  });
  if (!raw) notFound();
  if (raw.status === "HIDDEN") notFound();
  if (raw.status === "PENDING" || raw.status === "REJECTED") {
    return <section className="page-intro"><h1>This piece is awaiting verification.</h1><p>Provenance evidence for this listing is under review. It will appear publicly once approved.</p></section>;
  }

  const image = raw.images.find((i) => i.isPrimary)?.imageUrl ?? raw.images[0]?.imageUrl ?? "";
  const productShape = {
    id: raw.id, title: raw.title, price: String(raw.price), category: { name: raw.category.name },
    origin: raw.origin, materials: raw.materials.map((m) => ({ material: { name: m.material.name } })), tags: raw.tags,
  };
  const candidates = await listProducts({ status: "APPROVED" });
  const similar = recommendSimilar(productShape as never, candidates as never, 4) as unknown as Awaited<ReturnType<typeof listProducts>>;
  const ratings = raw.reviews.map((r) => r.rating);
  const avgRating = ratings.length ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10 : 0;
  const events = raw.provenanceRecord?.events ?? [];

  return (
    <>
      <section className="product-detail">
        <div>
          <div className="detail-image">
            {image && <img src={image} alt={raw.title} />}
            <span className="detail-index">0{raw.id % 9 + 1}</span>
          </div>
        </div>
        <div className="detail-copy">
          <div className="product-meta"><span>{raw.category.name}</span><span>{raw.origin}</span></div>
          <h1>{raw.title}</h1>
          <p>{raw.description}</p>
          <div className="detail-price-row">
            <span className="detail-price">{formatPrice(raw.price)}</span>
            <span className={`detail-stock ${raw.stock === 0 ? "stock-out" : raw.stock < 4 ? "stock-low" : "stock-ok"}`}>
              {raw.stock === 0 ? "Out of stock" : raw.stock < 4 ? `Only ${raw.stock} left` : `${raw.stock} in stock`}
            </span>
          </div>
          <div className="detail-actions">
            <AddToBasketButton productId={raw.id} disabled={raw.stock === 0} className="detail-actions-primary" />
            {raw.provenanceRecord && <Link className="brutal-button" href={`/provenance?id=${raw.provenanceId ?? ""}`}>See the record</Link>}
          </div>
          {raw.provenanceId && raw.provenanceRecord?.verificationStatus === "APPROVED" && <div style={{ marginTop: 22 }}><ProvenanceStrip product={{ provenanceId: raw.provenanceId }} /></div>}
          <div className="detail-specs">
            <div className="detail-spec"><span>Materials</span><strong>{raw.materials.map((m) => m.material.name).join(", ") || "—"}</strong></div>
            <div className="detail-spec"><span>Production method</span><strong>{raw.productionMethod || "—"}</strong></div>
            <div className="detail-spec"><span>Finished on</span><strong>{formatDate(raw.productionDate)}</strong></div>
            <div className="detail-spec"><span>Rating</span><strong>{avgRating ? <>{avgRating} <Star size={12} fill="currentColor" style={{ display: "inline" }} /></> : "New listing"}</strong></div>
          </div>
          <div style={{ marginTop: 24 }}>
            <ArtisanMini artisan={{ id: raw.artisan.id, name: raw.artisan.user.fullName, portraitUrl: raw.artisan.portraitUrl, bio: raw.artisan.bio, district: raw.artisan.district }} />
          </div>
          <div style={{ marginTop: 18 }}>
            <ReportProductButton productId={raw.id} />
          </div>
        </div>
      </section>

      <section className="detail-lower">
        <div className="detail-lower-inner">
          <div className="detail-lower-grid">
            <div>
              <span className="eyebrow">Provenance trail</span>
              <h2 style={{ fontSize: 38, letterSpacing: "-.06em", margin: "12px 0 28px" }}>The record behind this piece.</h2>
              <div className="timeline">
                {events.map((event) => (
                  <div className="timeline-item" key={event.id}>
                    <time>{formatDate(event.eventTime)}</time>
                    <h3>{event.eventType.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}</h3>
                    <p>{event.description}</p>
                  </div>
                ))}
              </div>
              <Link className="text-link" href={`/artisan/${raw.artisan.id}`} style={{ marginTop: 30 }}>Visit the artisan profile <ArrowRight size={15} /></Link>
            </div>
            <div>
              <span className="eyebrow">Buyer field notes</span>
              <h2 style={{ fontSize: 38, letterSpacing: "-.06em", margin: "12px 0 28px" }}>What buyers noticed.</h2>
              {raw.reviews.length === 0 ? (
                <p style={{ color: "var(--sage)", fontSize: 14 }}>No reviews yet. Buyers who purchased this piece can leave the first field note.</p>
              ) : (
                <div className="queue-list" style={{ gap: 18 }}>
                  {raw.reviews.map((review) => (
                    <div className="lookup-box" key={review.id} style={{ boxShadow: "5px 5px 0 var(--forest)" }}>
                      <div style={{ alignItems: "center", display: "flex", justifyContent: "space-between" }}>
                        <strong style={{ font: "700 14px 'Space Grotesk'" }}>{review.buyer.fullName}</strong>
                        <span className="rating"><Star size={13} fill="currentColor" /> {review.rating}/5</span>
                      </div>
                      {review.comment && <p style={{ fontSize: 12, lineHeight: 1.55, marginTop: 8 }}>{review.comment}</p>}
                      <small style={{ color: "var(--sage)", display: "block", font: "700 10px 'DM Sans'", marginTop: 8 }}>{formatDate(review.createdAt)}</small>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {similar.length > 0 && (
            <div style={{ marginTop: 70 }}>
              <div className="section-heading">
                <div>
                  <span className="eyebrow">Close to this piece</span>
                  <h2 style={{ fontSize: 38, letterSpacing: "-.06em", marginTop: 12 }}>You might also value.</h2>
                </div>
                <p style={{ color: "var(--sage)", fontSize: 13 }}>Content-based suggestions matched on category, origin, materials, price, and tags.</p>
              </div>
              <div className="catalog-grid">
                {similar.map((p) => <ProductCard key={p.id} product={p} />)}
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
