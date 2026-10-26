import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatDate, formatPrice } from "@/lib/format";
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

export default async function StudioProvenancePage() {
  const user = await requireRole("ARTISAN");
  const profile = await prisma.artisanProfile.findUnique({ where: { userId: user.id } });

  const records = await prisma.provenanceRecord.findMany({
    where: { product: { artisanId: profile!.id } },
    include: {
      product: { include: { images: true } },
      verifier: { select: { fullName: true } },
      events: { orderBy: { eventTime: "desc" }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <DashPage kicker="Artisan studio" title="Provenance records." lead="The formal registry trail behind each of your pieces — issued once, by a verifier, on approval." tabs={tabs}>
      {records.length === 0 ? (
        <Panel title="No records yet">
          <div className="danger-note">Submit a craft from <Link href="/studio/products/new" style={{ textDecoration: "underline" }}>the new-craft form</Link> and its record appears here.</div>
        </Panel>
      ) : (
        records.map((r) => (
          <Panel key={r.id} title={r.product.title} action={
            <span style={{ display: "flex", gap: 10, alignItems: "center" }}>
              {r.product.provenanceId && <span className="record-id">{r.product.provenanceId}</span>}
              <span className={`status-badge ${r.verificationStatus === "APPROVED" ? "status-green" : r.verificationStatus === "REJECTED" ? "status-red" : "status-orange"}`}>
                <span className="status-dot" />{r.verificationStatus.toLowerCase()}
              </span>
            </span>
          }>
            <div className="detail-specs">
              <div className="detail-spec"><span>Workshop location</span><strong>{r.workshopLocation || "—"}</strong></div>
              <div className="detail-spec"><span>Production date</span><strong>{r.productionDate ? formatDate(r.productionDate) : "—"}</strong></div>
              <div className="detail-spec"><span>Method</span><strong>{r.productionMethod || "—"}</strong></div>
              <div className="detail-spec"><span>Last verifier note</span><strong>{r.verifierId ? r.verifier?.fullName : "Awaiting review"}</strong></div>
            </div>
            {r.events[0] && (
              <div className="queue-item" style={{ marginTop: 12 }}>
                <div>
                  <strong style={{ font: "700 12px 'Space Grotesk'" }}>{r.events[0].eventType}</strong>
                  <span>{r.events[0].description}</span>
                </div>
              </div>
            )}
            <div style={{ marginTop: 10 }}>
              <Link className="mini-action" href={`/studio/products/${r.productId}/edit`}>Edit evidence →</Link>
            </div>
          </Panel>
        ))
      )}
    </DashPage>
  );
}
