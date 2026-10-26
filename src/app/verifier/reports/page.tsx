import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format";
import { DashPage, Panel } from "@/components/Panels";
import Link from "next/link";

export const dynamic = "force-dynamic";

const tabs = [
  { href: "/verifier", label: "Provenance queue" },
  { href: "/verifier/artisans", label: "Artisan registrations" },
  { href: "/verifier/reports", label: "Buyer reports" },
];

export default async function VerifierReportsPage() {
  await requireRole("VERIFIER");

  const [open, resolved] = await Promise.all([
    prisma.report.findMany({
      where: { status: { in: ["OPEN"] } },
      include: { product: { include: { images: true, artisan: { include: { user: true } } } }, reporter: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.report.findMany({
      where: { status: { not: "OPEN" } },
      include: { product: true, reporter: true, resolvedBy: { select: { fullName: true } } },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  return (
    <DashPage kicker="Verifier workspace" title="Buyer reports." lead="Provenance complaints from buyers. Resolution & hiding of pieces happens in the admin workspace — verifiers can use this context while deciding crafts." tabs={tabs}>
      <Panel title={`Open (${open.length})`} tone="white">
        {open.length === 0 ? (
          <div className="danger-note">No open reports. The registry looks healthy.</div>
        ) : (
          open.map((r) => {
            const image = r.product.images.find((i) => i.isPrimary)?.imageUrl ?? r.product.images[0]?.imageUrl ?? "";
            return (
              <div className="queue-item" key={r.id} style={{ alignItems: "flex-start" }}>
                {image ? <img className="queue-thumb" src={image} alt="" style={{ height: 52, width: 62, objectFit: "cover" }} /> : <span className="queue-thumb" style={{ height: 52, width: 62, background: "var(--sky)" }} />}
                <div>
                  <Link href={`/product/${r.productId}`} style={{ textDecoration: "underline" }}>
                    <strong style={{ font: "700 14px 'Space Grotesk'" }}>{r.product.title}</strong>
                  </Link>
                  <span>reported by {r.reporter.fullName} · {formatDate(r.createdAt)}</span>
                  <strong style={{ fontSize: 12, marginTop: 6, display: "block" }}>{r.reason.replace(/_/g, " ").toLowerCase()}</strong>
                  <p style={{ fontSize: 11, color: "var(--sage)", marginTop: 4 }}>{r.description}</p>
                </div>
                <span className="status-badge status-orange" style={{ marginLeft: "auto" }}><span className="status-dot" />open</span>
              </div>
            );
          })
        )}
      </Panel>
      <Panel title="Recently resolved">
        {resolved.map((r) => (
          <div className="queue-item" key={r.id}>
            <div>
              <strong style={{ font: "700 13px 'Space Grotesk'" }}>{r.product.title}</strong>
              <span>{r.reason.replace(/_/g, " ").toLowerCase()} · by {r.resolvedBy?.fullName ?? "—"}</span>
            </div>
            <span className={`status-badge ${r.status === "RESOLVED" ? "status-green" : "status-muted"}`}><span className="status-dot" />{r.status.toLowerCase()}</span>
          </div>
        ))}
        {resolved.length === 0 && <div className="danger-note">No resolved reports yet.</div>}
      </Panel>
    </DashPage>
  );
}
