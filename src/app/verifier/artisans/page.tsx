import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { DashPage, Panel } from "@/components/Panels";
import { VerifierDecision } from "@/components/VerifierDecision";
import { StatusBadge } from "@/components/craft";

export const dynamic = "force-dynamic";

const tabs = [
  { href: "/verifier", label: "Provenance queue" },
  { href: "/verifier/artisans", label: "Artisan registrations" },
  { href: "/verifier/reports", label: "Buyer reports" },
];

export default async function VerifierArtisansPage() {
  await requireRole("VERIFIER");

  const pending = await prisma.artisanProfile.findMany({
    where: { verificationStatus: "PENDING" },
    include: { user: true, products: { take: 3, include: { images: true } } },
    orderBy: { createdAt: "asc" },
  });

  const decided = await prisma.artisanProfile.findMany({
    where: { verificationStatus: { not: "PENDING" } },
    include: { user: true },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return (
    <DashPage kicker="Verifier workspace" title="Artisan registrations." lead="Who joins the marketplace — these workshops were opened from the public registration form." tabs={tabs}>
      {pending.length === 0 ? (
        <Panel title="No applications waiting">
          <div className="danger-note">All artisan registrations are decided. New ones appear automatically.</div>
        </Panel>
      ) : (
        pending.map((a) => (
          <Panel key={a.id} title={a.user.fullName} action={<span className="status-badge status-orange"><span className="status-dot" />pending since registration</span>}>
            <div style={{ display: "grid", gap: 18, gridTemplateColumns: "130px 1fr", alignItems: "start" }}>
              <div>
                {a.portraitUrl ? <img src={a.portraitUrl} alt="" style={{ width: "100%", border: "2px solid var(--forest)" }} /> :
                  <div style={{ width: "100%", aspectRatio: "1", border: "2px solid var(--forest)", background: "var(--mint)", display: "grid", placeItems: "center", fontWeight: 800, fontSize: 30 }}>{a.user.fullName.slice(0, 1)}</div>}
              </div>
              <div>
                <div className="detail-specs">
                  <div className="detail-spec"><span>Email</span><strong>{a.user.email}</strong></div>
                  <div className="detail-spec"><span>Specialty</span><strong>{a.craftSpecialty || "—"}</strong></div>
                  <div className="detail-spec"><span>District</span><strong>{a.district ?? "—"}</strong></div>
                  <div className="detail-spec"><span>Workshop</span><strong>{a.workshopAddress || "—"}</strong></div>
                  <div className="detail-spec"><span>Craft story</span><strong>{a.bio || "— (empty)"}</strong></div>
                </div>
                <VerifierDecision mode="artisan" artisanProfileId={a.id} />
              </div>
            </div>
          </Panel>
        ))
      )}

      {decided.length > 0 && (
        <Panel title="Recently decided registrations">
          <div className="queue-list">
            {decided.map((a) => (
              <div className="queue-item" key={a.id}>
                <strong style={{ font: "700 13px 'Space Grotesk'" }}>{a.user.fullName}</strong>
                <span style={{ color: "var(--sage)", fontSize: 11 }}>{a.craftSpecialty ?? ""} · {a.district ?? ""}</span>
                <StatusBadge tone={a.verificationStatus === "APPROVED" ? "green" : a.verificationStatus === "REJECTED" ? "red" : "orange"}>
                  {a.verificationStatus.toLowerCase()}
                </StatusBadge>
              </div>
            ))}
          </div>
        </Panel>
      )}
    </DashPage>
  );
}
