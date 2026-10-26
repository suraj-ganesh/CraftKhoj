import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format";
import { DashPage, MetricCard, Panel } from "@/components/Panels";
import { VerifierDecision } from "@/components/VerifierDecision";
import Link from "next/link";

export const dynamic = "force-dynamic";

const tabs = [
  { href: "/verifier", label: "Provenance queue" },
  { href: "/verifier/artisans", label: "Artisan registrations" },
  { href: "/verifier/reports", label: "Buyer reports" },
];

export default async function VerifierPage() {
  await requireRole("VERIFIER");

  const [pending, recent] = await Promise.all([
    prisma.provenanceRecord.findMany({
      where: { verificationStatus: "PENDING" },
      include: {
        product: { include: { images: true, category: true, provenanceRecord: true, artisan: { include: { user: true } } } },
        events: { orderBy: { eventTime: "asc" } },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.provenanceRecord.findMany({
      where: { verificationStatus: { not: "PENDING" } },
      include: { product: true, verifier: { select: { fullName: true } } },
      orderBy: { verifiedAt: "desc" },
      take: 8,
    }),
  ]);

  const [artisanQueue, reportsOpen, verifiedTotal] = await Promise.all([
    prisma.artisanProfile.count({ where: { verificationStatus: "PENDING" } }),
    prisma.report.count({ where: { status: "OPEN" } }),
    prisma.verificationLog.count(),
  ]);

  return (
    <DashPage kicker="Verifier workspace" title="Provenance verification queue." lead="These crafts claim Nepali origin. Check the evidence trail before any ID goes out." tabs={tabs}>
      <div className="metric-grid">
        <MetricCard label="Awaiting review" value={pending.length} hint="Crafts claiming origin" />
        <MetricCard label="Artisan applications" value={artisanQueue} hint="New workshop registrations" />
        <MetricCard label="Open buyer reports" value={reportsOpen} hint="Fraud & provenance complaints" />
        <MetricCard label="Total decisions logged" value={verifiedTotal} hint="All time" />
      </div>

      {pending.length === 0 ? (
        <Panel title="Queue clear">
          <div className="danger-note">No pending provenance claims. When an artisan submits a new craft it appears here.</div>
        </Panel>
      ) : (
        pending.map((r) => {
          const image = r.product.images.find((i) => i.isPrimary)?.imageUrl ?? r.product.images[0]?.imageUrl ?? "";
          return (
            <Panel key={r.id} title={r.product.title} action={
              <span style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <Link className="mini-action" href={`/product/${r.product.id}`}><span className="status-badge status-muted"><span className="status-dot" />Product</span></Link>
                <span className="status-badge status-orange"><span className="status-dot" />pending</span>
              </span>
            }>
              <div style={{ display: "grid", gap: 18, gridTemplateColumns: "150px 1fr", alignItems: "start" }}>
                <div>
                  {image
                    ? <img src={image} alt="" style={{ width: "100%", border: "2px solid var(--forest)" }} />
                    : <div style={{ width: "100%", aspectRatio: "1.3/1", background: "var(--sky)", border: "2px solid var(--forest)" }} />}
                  {r.product.provenanceRecord?.processImageUrl &&
                    <img src={r.product.provenanceRecord.processImageUrl} alt="process" style={{ width: "100%", border: "2px solid var(--forest)", marginTop: 8 }} />}
                </div>
                <div>
                  <span className="eyebrow">The trail</span>
                  <div className="timeline" style={{ margin: "14px 0 0" }}>
                    {r.events.map((e) => (
                      <div className="timeline-item" key={e.id}>
                        <h3>{e.eventType.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}</h3>
                        <p>{e.description ?? ""} — {formatDate(e.eventTime)}</p>
                      </div>
                    ))}
                  </div>
                  <div className="detail-specs">
                    <div className="detail-spec"><span>Artisan</span><strong>{r.product.artisan.user.fullName}</strong></div>
                    <div className="detail-spec"><span>Artisan district</span><strong>{r.product.artisan.district ?? "—"}</strong></div>
                    <div className="detail-spec"><span>Category</span><strong>{r.product.category.name}</strong></div>
                    <div className="detail-spec"><span>Submitted</span><strong>{formatDate(r.createdAt)}</strong></div>
                    <div className="detail-spec"><span>Workshop location</span><strong>{r.workshopLocation || "—"}</strong></div>
                    <div className="detail-spec"><span>Production date</span><strong>{r.productionDate ? formatDate(r.productionDate) : "—"}</strong></div>
                    <div className="detail-spec"><span>Method</span><strong>{r.productionMethod || "—"}</strong></div>
                    <div className="detail-spec"><span>Process notes</span><strong>{r.processNotes || "—"}</strong></div>
                  </div>
                  <VerifierDecision mode="provenance" recordId={r.id} />
                </div>
              </div>
            </Panel>
          );
        })
      )}

      {recent.length > 0 && (
        <Panel title="Recently decided">
          <div className="queue-list">
            {recent.map((r) => (
              <div className="queue-item" key={r.id}>
                <strong style={{ font: "700 13px 'Space Grotesk'" }}>{r.product.title}</strong>
                <span style={{ color: "var(--sage)", fontSize: 11 }}>{r.verifiedAt ? formatDate(r.verifiedAt) : ""} · {r.verifier?.fullName ?? ""}</span>
                <span className={`status-badge ${r.verificationStatus === "APPROVED" ? "status-green" : r.verificationStatus === "REJECTED" ? "status-red" : "status-orange"}`}>
                  <span className="status-dot" />{r.verificationStatus.toLowerCase()}
                </span>
              </div>
            ))}
          </div>
        </Panel>
      )}
    </DashPage>
  );
}
