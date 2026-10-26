import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format";
import { DashPage, MetricCard, Panel } from "@/components/Panels";
import { UserActions } from "@/components/UserActions";

export const dynamic = "force-dynamic";

const tabs = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/reports", label: "Reports" },
];

export default async function AdminUsersPage() {
  const me = await requireRole("ADMIN");

  const users = await prisma.user.findMany({
    include: {
      artisanProfile: { include: { _count: { select: { products: true } } } },
      _count: { select: { orders: true, reviews: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const counts = (role: string) => users.filter((u) => u.role === role).length;

  return (
    <DashPage kicker="Administrator workspace" title="Users & roles." lead="Promote, suspend, or demote. A suspended account loses sign-in immediately." tabs={tabs}>
      <div className="metric-grid">
        <MetricCard label="Total accounts" value={users.length} />
        <MetricCard label="Buyers" value={counts("BUYER")} />
        <MetricCard label="Artisans" value={counts("ARTISAN")} hint="incl. pending verification" />
        <MetricCard label="Verifiers + admins" value={counts("VERIFIER") + counts("ADMIN")} />
      </div>

      <Panel title="All accounts" tone="white">
        <div className="admin-table">
          <table>
            <thead>
              <tr>
                <th>Account</th><th>Role</th><th>Status</th><th>Activity</th><th>Joined</th><th>Manage</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>
                    <strong style={{ font: "700 13px 'Space Grotesk'" }}>{u.fullName}</strong>
                    <span style={{ display: "block", color: "var(--sage)", fontSize: 10 }}>{u.email}</span>
                    {u.artisanProfile && (
                      <span style={{ display: "block", color: "var(--sage)", fontSize: 10 }}>
                        workshop · {u.artisanProfile.craftSpecialty ?? "—"} · {u.artisanProfile._count.products} crafts · trust {Math.round(Number(u.artisanProfile.trustScore))}
                      </span>
                    )}
                  </td>
                  <td><span className="status-badge status-blue"><span className="status-dot" />{u.role.toLowerCase()}</span></td>
                  <td>
                    <span className={`status-badge ${u.status === "ACTIVE" ? "status-green" : "status-red"}`}>
                      <span className="status-dot" />{u.status.toLowerCase()}
                    </span>
                  </td>
                  <td style={{ color: "var(--sage)", fontSize: 10 }}>
                    {u._count.orders} orders · {u._count.reviews} reviews
                  </td>
                  <td style={{ color: "var(--sage)", fontSize: 10 }}>{formatDate(u.createdAt)}</td>
                  <td><UserActions userId={u.id} userStatus={u.status} isSelf={u.id === me.id} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </DashPage>
  );
}
