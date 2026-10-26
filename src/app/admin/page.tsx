import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { demandForecast } from "@/lib/algorithms";
import { formatPrice } from "@/lib/format";
import { DashPage, MetricCard, Panel } from "@/components/Panels";
import { RevenueTrend, CategoryPie, DemandChart } from "@/components/AdminCharts";
import Link from "next/link";

export const dynamic = "force-dynamic";

const tabs = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/reports", label: "Reports" },
];

function monthKey(d: Date) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; }

export default async function AdminPage() {
  await requireRole("ADMIN");

  const [users, orders, products, reviews, reports, provenance] = await Promise.all([
    prisma.user.findMany({ select: { role: true, status: true, createdAt: true } }),
    prisma.order.findMany({ where: { orderStatus: { not: "CANCELLED" } }, include: { orderItems: { include: { product: true } } } }),
    prisma.product.findMany({ include: { category: true, orderItems: { include: { order: { include: { orderItems: { include: { product: true } } } } } } } }),
    prisma.review.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.report.findMany({ where: { status: "OPEN" }, include: { product: true, reporter: true }, orderBy: { createdAt: "asc" } }),
    prisma.provenanceRecord.findMany({ where: { verificationStatus: "PENDING" }, include: { product: true } }),
  ]);

  // revenue per month (last 6 months)
  const now = new Date();
  const months: string[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(monthKey(d));
  }
  const label = (key: string) => new Date(Number(key.slice(0, 4)), Number(key.slice(5)) - 1, 1).toLocaleString("en-US", { month: "short" });
  const revenueByMonth = new Map<string, number>(months.map((m) => [m, 0]));
  for (const o of orders) {
    const key = monthKey(o.createdAt);
    if (revenueByMonth.has(key)) revenueByMonth.set(key, (revenueByMonth.get(key) ?? 0) + Number(o.totalAmount));
  }
  const revenueTrend = months.map((m) => ({ label: label(m), revenue: Math.round(revenueByMonth.get(m) ?? 0) }));

  const categoryRows = new Map<string, number>();
  for (const p of products) {
    if (p.status !== "APPROVED") continue;
    const key = p.category.name;
    categoryRows.set(key, (categoryRows.get(key) ?? 0) + 1);
  }
  const categoryDistribution = [...categoryRows.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

  const totalRevenue = orders.reduce((s, o) => s + Number(o.totalAmount), 0);
  const buyers = users.filter((u) => u.role === "BUYER").length;
  const artisans = users.filter((u) => u.role === "ARTISAN").length;
  const avgRating = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  // Demand forecast: units per week across crafts
  const soldByProduct = new Map<number, number>();
  for (const o of orders) {
    for (const oi of o.orderItems) {
      soldByProduct.set(oi.productId, (soldByProduct.get(oi.productId) ?? 0) + oi.quantity);
    }
  }
  const forecast = await demandForecast([...soldByProduct.keys()], 4);

  return (
    <DashPage kicker="Administrator workspace" title="Marketplace pulse." lead="Everything that hums beneath CraftKhoj — growth, demand, and the moderation queue." tabs={tabs}>
      <div className="metric-grid">
        <MetricCard label="Platform revenue" value={formatPrice(totalRevenue)} hint={`${orders.length} paid/active orders`} />
        <MetricCard label="Buyers" value={buyers} hint={`${artisans} artisans registered`} />
        <MetricCard label="Published crafts" value={products.filter((p) => p.status === "APPROVED").length} hint={`of ${products.length} submitted`} />
        <MetricCard label="Medium rating" value={avgRating.toFixed(1)} hint={`${reviews.length} reviews total`} />
        <MetricCard label="Pending verification" value={provenance.length} hint="Crafts in verifier queue" />
        <MetricCard label="Open reports" value={reports.length} hint="Awaiting moderation" />
      </div>

      <div className="workspace-grid">
        <Panel title="Revenue trend (6 months)">
          <RevenueTrend data={revenueTrend} />
        </Panel>
        <Panel title="Crafts by category">
          <CategoryPie data={categoryDistribution} />
        </Panel>
      </div>

      <Panel title="Demand forecast — units on the horizon (exponential smoothing, α = 0.3)">
        <DemandChart data={forecast.map((f: number, i: number) => ({ label: `M${i + 1}`, forecast: f }))} />
        <p style={{ fontSize: 11, color: "var(--sage)", marginTop: 8 }}>Smoothed from per-item sales volume across orders. 5 periods forward.</p>
      </Panel>

      <div className="workspace-grid">
        <Panel title={`Open moderation reports (${reports.length})`} action={<Link className="underline-link" href="/admin/reports">Manage →</Link>}>
          {reports.length === 0 ? (
            <div className="danger-note">Nothing flagged. The marketplace is quiet.</div>
          ) : reports.slice(0, 5).map((r) => (
            <div className="queue-item" key={r.id}>
              <strong style={{ font: "700 13px 'Space Grotesk'" }}>{r.product.title}</strong>
              <span style={{ color: "var(--sage)", fontSize: 11 }}>{r.reason.replace(/_/g, " ").toLowerCase()} · {r.reporter.fullName}</span>
            </div>
          ))}
        </Panel>
        <Panel title="Trust leaderboard" tone="sky">
          <p style={{ fontSize: 11, color: "var(--sage)", marginBottom: 10 }}>Full artisan trust table lives in <Link href="/admin/users" style={{ textDecoration: "underline" }}>Users</Link>.</p>
          <p style={{ fontSize: 12, fontWeight: 700 }}>Composite formula: 0.35·verification + 0.25·reviews + 0.20·delivery + 0.15·community − 0.20·flags</p>
        </Panel>
      </div>
    </DashPage>
  );
}
