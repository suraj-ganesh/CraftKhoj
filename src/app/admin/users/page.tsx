import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format";
import { DashPage, MetricCard, Panel } from "@/components/Panels";
import { UserActions } from "@/components/UserActions";
import Link from "next/link";

export const dynamic = "force-dynamic";

const tabs = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/reports", label: "Reports" },
];

const roleFilters = [
  { key: "all", label: "All accounts" },
  { key: "BUYER", label: "Buyers" },
  { key: "ARTISAN", label: "Artisans" },
  { key: "VERIFIER", label: "Verifiers" },
  { key: "ADMIN", label: "Admins" },
  { key: "DEACTIVATED", label: "Suspended" },
];

export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<{ role?: string; q?: string }> }) {
  const me = await requireRole("ADMIN");
  const params = await searchParams;
  const role: string = roleFilters.some((f) => f.key === params.role) ? params.role! : "all";
  const q = params.q?.trim() ?? "";
  const query = q.toLowerCase();

  const users = await prisma.user.findMany({
    include: {
      artisanProfile: { include: { _count: { select: { products: true } } } },
      _count: { select: { orders: true, reviews: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const filtered = users.filter((u) => {
    const roleOk =
      role === "all" ? true :
      role === "DEACTIVATED" ? u.status === "DEACTIVATED" :
      (u.role === role && u.status === "ACTIVE");
    const qOk = !query || u.fullName.toLowerCase().includes(query) || u.email.toLowerCase().includes(query);
    return roleOk && qOk;
  });

  const counts = (r: string) => users.filter((u) => u.role === r).length;
  const filterHref = (key: string) => {
    const sp = new URLSearchParams();
    if (key !== "all") sp.set("role", key);
    if (q) sp.set("q", q);
    const s = sp.toString();
    return `/admin/users${s ? `?${s}` : ""}`;
  };

  return (
    <DashPage kicker="Administrator workspace" title="Users & roles." lead="Promote, suspend, or demote. A suspended account loses sign-in immediately." tabs={tabs}>
      <div className="metric-grid">
        <MetricCard label="Total accounts" value={users.length} />
        <MetricCard label="Buyers" value={counts("BUYER")} />
        <MetricCard label="Artisans" value={counts("ARTISAN")} hint="incl. pending verification" />
        <MetricCard label="Verifiers + admins" value={counts("VERIFIER") + counts("ADMIN")} />
      </div>

      <div className="workspace-tabs" style={{ marginBottom: 12 }}>
        {roleFilters.map((f) => (
          <Link key={f.key} href={filterHref(f.key)} className={`workspace-tab ${role === f.key ? "active" : ""}`}>{f.label}</Link>
        ))}
      </div>

      <form method="get" action="/admin/users" style={{ display: "flex", gap: 8, marginBottom: 18 }}>
        {(role !== "all") && <input type="hidden" name="role" value={role} />}
        <input
          name="q"
          defaultValue={q}
          placeholder="Search by name or email…"
          style={{ background: "var(--paper)", border: "2px solid var(--forest)", flex: 1, maxWidth: 340, padding: "8px 12px", font: "500 12px 'DM Sans'" }}
        />
        <button className="mini-action">Search</button>
        {q && <Link className="mini-action" href={filterHref(role === "all" ? "all" : role)}>Clear</Link>}
      </form>

      <Panel title={role === "all" && !q ? "All accounts" : `${filtered.length} matching account${filtered.length === 1 ? "" : "s"}`} tone="white">
        <div className="admin-table">
          <table>
            <thead>
              <tr>
                <th>Account</th><th>Role</th><th>Status</th><th>Activity</th><th>Joined</th><th>Manage</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
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
        {filtered.length === 0 && <div className="danger-note" style={{ marginTop: 14 }}>No accounts match this filter.</div>}
      </Panel>
    </DashPage>
  );
}
