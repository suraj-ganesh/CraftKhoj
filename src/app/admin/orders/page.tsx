import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatDate, formatPrice } from "@/lib/format";
import { DashPage, MetricCard, Panel } from "@/components/Panels";
import { AdminOrderStatus } from "@/components/AdminOrderStatus";
import Link from "next/link";

export const dynamic = "force-dynamic";

const tabs = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/reports", label: "Reports" },
];

export default async function AdminOrdersPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await requireRole("ADMIN");
  const { status: rawStatus } = await searchParams;
  const statusFilter: string = ["PLACED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"].includes(rawStatus ?? "") ? rawStatus! : "all";

  const [ordersRaw, sums] = await Promise.all([
    prisma.order.findMany({
      include: {
        buyer: true,
        orderItems: { include: { product: { include: { artisan: { include: { user: true } } } } } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.order.aggregate({ where: { orderStatus: { not: "CANCELLED" } }, _sum: { totalAmount: true }, _count: true }),
  ]);
  const orders = statusFilter === "all" ? ordersRaw : ordersRaw.filter((o) => o.orderStatus === statusFilter);

  const cancelled = ordersRaw.filter((o) => o.orderStatus === "CANCELLED").length;
  const shipped = ordersRaw.filter((o) => ["SHIPPED", "DELIVERED"].includes(o.orderStatus)).length;

  const statusFilters = [
    { key: "all", label: "All ()" },
    { key: "PLACED", label: "Placed" },
    { key: "PROCESSING", label: "Processing" },
    { key: "SHIPPED", label: "Shipped" },
    { key: "DELIVERED", label: "Delivered" },
    { key: "CANCELLED", label: "Cancelled" },
  ].map((f) => ({
    ...f,
    label: f.key === "all" ? `All (${ordersRaw.length})` : `${f.label} (${ordersRaw.filter((o) => o.orderStatus === f.key).length})`,
  }));

  return (
    <DashPage kicker="Administrator workspace" title="Order ledger." lead="Every order on the marketplace, readable and steerable — move any of them manually." tabs={tabs}>
      <div className="workspace-tabs" style={{ marginBottom: 18 }}>
        {statusFilters.map((f) => (
          <Link key={f.key} href={f.key === "all" ? "/admin/orders" : `/admin/orders?status=${f.key}`} className={`workspace-tab ${statusFilter === f.key ? "active" : ""}`}>{f.label}</Link>
        ))}
      </div>
      <div className="metric-grid">
        <MetricCard label="Total orders" value={orders.length} hint={`${cancelled} cancelled`} />
        <MetricCard label="Net revenue" value={formatPrice(Number(sums._sum.totalAmount ?? 0))} hint="Cancel-neutral totals" />
        <MetricCard label="In transit+" value={shipped} hint="Shipped or delivered" />
        <MetricCard label="COD orders" value={orders.filter((o) => o.paymentMethod === "CASH_ON_DELIVERY").length} hint={`${orders.filter((o) => o.paymentMethod === "SIMULATED").length} simulated`} />
      </div>

      <Panel title={statusFilter === "all" ? "All orders" : `${orders.length} ${statusFilter.toLowerCase()} order${orders.length === 1 ? "" : "s"}`} tone="white">
        <div className="admin-table">
          <table>
            <thead>
              <tr>
                <th>Order</th><th>Buyer</th><th>Pieces</th><th>Total</th><th>Payment</th><th>Placed</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td><strong style={{ font: "700 12px 'Space Grotesk'" }}>#{o.id}</strong></td>
                  <td>
                    <strong style={{ font: "700 12px 'Space Grotesk'" }}>{o.buyer.fullName}</strong>
                    <span style={{ display: "block", color: "var(--sage)", fontSize: 10 }}>{o.shippingName} · {o.shippingPhone}</span>
                    <span style={{ display: "block", color: "var(--sage)", fontSize: 10, maxWidth: 220 }}>{o.shippingAddress}</span>
                  </td>
                  <td style={{ fontSize: 10, color: "var(--sage)" }}>
                    {o.orderItems.map((oi) => (
                      <span key={oi.id} style={{ display: "block" }}>{oi.quantity} × {oi.product.title.slice(0, 24)}{oi.product.title.length > 24 ? "…" : ""} <em style={{ color: "var(--lavender)" }}>@ {oi.product.artisan.user.fullName}</em></span>
                    ))}
                  </td>
                  <td><strong>{formatPrice(o.totalAmount)}</strong></td>
                  <td style={{ fontSize: 10 }}>
                    {o.paymentMethod === "CASH_ON_DELIVERY" ? "COD" : "simulated"}
                    <span style={{ display: "block", color: "var(--sage)" }}>{o.paymentStatus.toLowerCase()}</span>
                  </td>
                  <td style={{ fontSize: 10, color: "var(--sage)" }}>{formatDate(o.createdAt)}</td>
                  <td><AdminOrderStatus orderId={o.id} orderStatus={o.orderStatus} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </DashPage>
  );
}
