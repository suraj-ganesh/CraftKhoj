import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format";
import { DashPage, MetricCard, Panel } from "@/components/Panels";
import { ModerationActions } from "@/components/ModerationActions";
import Link from "next/link";

export const dynamic = "force-dynamic";

const tabs = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/reports", label: "Reports" },
];

export default async function AdminReportsPage() {
  await requireRole("ADMIN");

  const [open, closed] = await Promise.all([
    prisma.report.findMany({
      where: { status: "OPEN" },
      include: {
        product: { include: { images: true, artisan: { include: { user: true } }, provenanceRecord: true } },
        reporter: true,
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.report.findMany({
      where: { status: { not: "OPEN" } },
      include: { product: true, reporter: true, resolvedBy: { select: { fullName: true } } },
      orderBy: { createdAt: "desc" },
      take: 12,
    }),
  ]);

  return (
    <DashPage kicker="Moderation" title="Provenance reports." lead="Buyer complaints flow here. A product can be hidden from the shop outright, for example when evidence is disputed." tabs={tabs}>
      <div className="metric-grid">
        <MetricCard label="Open" value={open.length} hint="Needs a decision" />
        <MetricCard label="Resolved / dismissed" value={closed.length} hint="Audit trail below" />
      </div>

      {open.length === 0 ? (
        <Panel title="Nothing to moderate">
          <div className="danger-note">No open provenance complaints. All quiet on the marketplace.</div>
        </Panel>
      ) : (
        open.map((r) => {
          const image = r.product.images.find((i) => i.isPrimary)?.imageUrl ?? r.product.images[0]?.imageUrl ?? "";
          return (
            <Panel key={r.id} title={r.product.title} tone={r.product.provenanceRecord?.verificationStatus === "APPROVED" ? "white" : "sky"} action={
              <Link href={`/product/${r.productId}`}><span className="status-badge status-muted"><span className="status-dot" />Open the piece</span></Link>
            }>
              <div style={{ display: "grid", gap: 18, gridTemplateColumns: "140px 1fr", alignItems: "start" }}>
                <div>
                  {image ? <img src={image} alt="" style={{ width: "100%", border: "2px solid var(--forest)" }} /> :
                    <div style={{ width: "100%", aspectRatio: "1.3", background: "var(--sky)", border: "2px solid var(--forest)" }} />}
                </div>
                <div>
                  <div className="detail-specs">
                    <div className="detail-spec"><span>Reporter</span><strong>{r.reporter.fullName}</strong></div>
                    <div className="detail-spec"><span>Filed</span><strong>{formatDate(r.createdAt)}</strong></div>
                    <div className="detail-spec"><span>Reason</span><strong>{r.reason.replace(/_/g, " ").toLowerCase()}</strong></div>
                    <div className="detail-spec"><span>Artisan</span><strong>{r.product.artisan.user.fullName} · trust {Math.round(Number(r.product.artisan.trustScore))}</strong></div>
                    <div className="detail-spec"><span>Provenance</span><strong>{r.product.provenanceRecord?.verificationStatus.toLowerCase() ?? "none"}</strong></div>
                    <div className="detail-spec"><span>Claim ID</span><strong>{r.product.provenanceId ?? "—"}</strong></div>
                  </div>
                  <p style={{ fontSize: 12, marginTop: 12, lineHeight: 1.7, color: "var(--forest)" }}>{r.description}</p>
                  <ModerationActions reportId={r.id} productTitle={r.product.title} />
                </div>
              </div>
            </Panel>
          );
        })
      )}

      <Panel title="Audit trail (last 12)">
        {closed.map((r) => (
          <div className="queue-item" key={r.id}>
            <div>
              <strong style={{ font: "700 13px 'Space Grotesk'" }}>{r.product.title}</strong>
              <span>{r.reason.replace(/_/g, " ").toLowerCase()} · filed by {r.reporter.fullName}</span>
              <span style={{ display: "block", color: "var(--sage)", fontSize: 10 }}>
                {r.status.toLowerCase()} by {r.resolvedBy?.fullName ?? "—"} · {r.adminRemarks ? `"${r.adminRemarks}"` : "no note"}
              </span>
            </div>
          </div>
        ))}
        {closed.length === 0 && <div className="danger-note">No resolved reports yet.</div>}
      </Panel>
    </DashPage>
  );
}
