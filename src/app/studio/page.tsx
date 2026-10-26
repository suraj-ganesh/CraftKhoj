import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/format";
import { DashPage, MetricCard, Panel } from "@/components/Panels";
import { ProductCard } from "@/components/craft";
import Link from "next/link";

export const dynamic = "force-dynamic";

const tabs = [
  { href: "/studio", label: "Overview" },
  { href: "/studio/products", label: "My products" },
  { href: "/studio/orders", label: "Orders" },
  { href: "/studio/provenance", label: "Provenance records" },
  { href: "/studio/profile", label: "Workshop profile" },
];

export default async function StudioPage() {
  const user = await requireRole("ARTISAN");
  const profile = await prisma.artisanProfile.findUnique({ where: { userId: user.id }, include: { user: true } });
  if (!profile) {
    return <div style={{ padding: 40 }}>Artisan profile missing — contact an administrator.</div>;
  }

  const [products, orders, provenance] = await Promise.all([
    prisma.product.findMany({ where: { artisanId: profile.id }, include: { images: true, category: true, provenanceRecord: true }, orderBy: { createdAt: "desc" } }),
    prisma.orderItem.findMany({ where: { product: { artisanId: profile.id } }, include: { product: true, order: { include: { buyer: true } } }, orderBy: { order: { createdAt: "desc" } } }),
    prisma.provenanceRecord.findMany({ where: { product: { artisanId: profile.id } }, include: { product: true }, orderBy: { createdAt: "desc" } }),
  ]);

  const published = products.filter((p) => p.status === "APPROVED");
  const pendingVerification = provenance.filter((r) => r.verificationStatus === "PENDING");
  const revenue = orders.reduce((sum, oi) => sum + Number(oi.unitPrice) * oi.quantity, 0);
  const openOrders = orders.filter((oi) => !["CANCELLED", "DELIVERED"].includes(oi.order.orderStatus));

  return (
    <DashPage kicker="Artisan studio" title={`Workshop: ${profile.user.fullName}`} lead="Your workshop sail. Craft goes up, gets verified, then sells." tabs={tabs}>
      <div className="metric-grid">
        <MetricCard label="Published pieces" value={published.length} hint={`${products.length - published.length} awaiting/publication`} />
        <MetricCard label="Verification queue" value={pendingVerification.length} hint="Crafts pending a verifier" />
        <MetricCard label="Open order lines" value={openOrders.length} hint="To process or ship" />
        <MetricCard label="Trust score" value={Math.round(Number(profile.trustScore))} hint="Buyer·verifier weighted" />
      </div>

      <div className="workspace-grid">
        <Panel title="Recent orders for your pieces" action={<Link className="underline-link" href="/studio/orders">All orders →</Link>}>
          {orders.length === 0 ? (
            <div className="danger-note">No sales yet. Once a buyer places an order the line shows here for fulfilment.</div>
          ) : orders.slice(0, 5).map((oi) => (
            <div className="queue-item" key={oi.id}>
              <strong style={{ font: "700 13px 'Space Grotesk'" }}>{oi.product.title}</strong>
              <span style={{ color: "var(--sage)", fontSize: 11 }}>{oi.quantity} × {formatPrice(oi.unitPrice)} · {oi.order.buyer.fullName}</span>
              <span className="status-badge status-blue"><span className="status-dot" />{oi.order.orderStatus}</span>
            </div>
          ))}
        </Panel>
        <Panel title="Verification trail" tone="sky" action={<Link className="underline-link" href="/studio/provenance">All records →</Link>}>
          {provenance.length === 0 ? (
            <div className="danger-note">No provenance records yet — submit a new craft below.</div>
          ) : provenance.slice(0, 4).map((r) => (
            <div className="queue-item" key={r.id}>
              <strong style={{ font: "700 13px 'Space Grotesk'" }}>{r.product.title}</strong>
              <span className={`status-badge ${r.verificationStatus === "APPROVED" ? "status-green" : r.verificationStatus === "REJECTED" ? "status-red" : "status-orange"}`}>
                <span className="status-dot" />{r.verificationStatus.toLowerCase()}
              </span>
            </div>
          ))}
        </Panel>
      </div>

      {published.length > 0 && (
        <Panel title="Your live catalog">
          <div className="product-grid">
            {published.slice(0, 4).map((p) => (
              <ProductCard
                product={{
                  id: p.id,
                  title: p.title,
                  description: p.description,
                  price: String(p.price),
                  stock: p.stock,
                  status: p.status,
                  provenanceId: p.provenanceId,
                  tags: p.tags,
                  origin: p.origin,
                  featured: p.isFeatured,
                  createdAt: p.createdAt,
                  manufacturerMethod: p.productionMethod ?? "-",
                  category: p.category.name,
                  categoryId: p.categoryId,
                  image: p.images.find((i) => i.isPrimary)?.imageUrl ?? p.images[0]?.imageUrl ?? "",
                  artisan: { id: profile.id, name: user.fullName, portrait: profile.portraitUrl, bio: profile.bio ?? "", trustScore: Number(profile.trustScore) },
                  verified: p.provenanceRecord?.verificationStatus === "APPROVED",
                  rating: 0,
                  reviewCount: 0,
                  materials: [],
                }}
              />
            ))}
          </div>
        </Panel>
      )}

      <Panel title="Add a new craft" tone="sky">
        <Link className="brutal-button brutal-button-blue" href="/studio/products/new">Open a new craft for verification</Link>
        <p style={{ fontSize: 11, color: "var(--sage)", marginTop: 12 }}>New pieces enter the verifier queue as PENDING. On approval a non-transferable provenance ID is issued.</p>
      </Panel>
    </DashPage>
  );
}
