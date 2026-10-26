import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatPrice, formatDate } from "@/lib/format";
import { DashPage, Panel } from "@/components/Panels";
import Link from "next/link";

export const dynamic = "force-dynamic";

const tabs = [
  { href: "/studio", label: "Overview" },
  { href: "/studio/products", label: "My products" },
  { href: "/studio/orders", label: "Orders" },
  { href: "/studio/provenance", label: "Provenance records" },
  { href: "/studio/profile", label: "Workshop profile" },
];

export default async function StudioProductsPage() {
  const user = await requireRole("ARTISAN");
  const profile = await prisma.artisanProfile.findUnique({ where: { userId: user.id } });

  const products = await prisma.product.findMany({
    where: { artisanId: profile!.id },
    include: { images: true, category: true, provenanceRecord: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <DashPage kicker="Artisan studio" title="My products." lead="Each piece with its verification state — edits to provenance details send a piece back for verification." tabs={tabs}>
      <Panel title={`${products.length} pieces`} tone="white" action={<Link className="brutal-button brutal-button-blue" href="/studio/products/new" style={{ fontSize: 12, padding: "10px 16px" }}>+ New craft</Link>}>
        {products.length === 0 ? (
          <div className="danger-note">Nothing in your studio yet. Start with the "+ New craft" button above.</div>
        ) : (
          <div className="queue-list">
            {products.map((p) => {
              const image = p.images.find((i) => i.isPrimary)?.imageUrl ?? p.images[0]?.imageUrl ?? "";
              const vStatus = p.provenanceRecord?.verificationStatus ?? "PENDING";
              return (
                <div className="queue-item" key={p.id}>
                  {image ? <img className="queue-thumb" src={image} alt="" /> : <span className="queue-thumb" style={{ background: "var(--sky)" }} />}
                  <div>
                    <Link href={`/studio/products/${p.id}/edit`}><strong style={{ font: "700 15px 'Space Grotesk'" }}>{p.title}</strong></Link>
                    <span>{p.category.name} · {formatPrice(p.price)} · ×{p.stock} · added {formatDate(p.createdAt)}</span>
                    <span style={{ display: "flex", gap: 6, marginTop: 4 }}>
                      <span className={`status-badge ${p.status === "APPROVED" ? "status-green" : p.status === "PENDING" ? "status-orange" : "status-muted"}`}>
                        <span className="status-dot" />{p.status.toLowerCase()}
                      </span>
                      <span className={`status-badge ${vStatus === "APPROVED" ? "status-green" : vStatus === "REJECTED" ? "status-red" : "status-orange"}`}>
                        <span className="status-dot" />provenance {vStatus.toLowerCase()}
                      </span>
                      {p.provenanceId && <span className="record-id">{p.provenanceId}</span>}
                    </span>
                  </div>
                  <Link className="mini-action" href={`/studio/products/${p.id}/edit`} style={{ marginLeft: "auto" }}>Edit</Link>
                </div>
              );
            })}
          </div>
        )}
      </Panel>
    </DashPage>
  );
}
