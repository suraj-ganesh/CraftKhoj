import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { personalRecommendations } from "@/lib/algorithms";
import { formatPrice } from "@/lib/format";
import { DashPage, MetricCard, Panel } from "@/components/Panels";
import { ProductCard, ArrowButton } from "@/components/craft";
import { RecommendedGrid } from "@/components/RecommendedGrid";
import Link from "next/link";

export const dynamic = "force-dynamic";

const tabs = [
  { href: "/buyer", label: "Overview" },
  { href: "/buyer/cart", label: "Basket" },
  { href: "/buyer/orders", label: "Order history" },
  { href: "/shop", label: "Shop crafts" },
];

export default async function BuyerDashboardPage() {
  const user = await requireRole("BUYER");

  const [orders, recommendations] = await Promise.all([
    prisma.order.findMany({
      where: { buyerId: user.id },
      include: { orderItems: { include: { product: true } } },
      orderBy: { createdAt: "desc" },
    }),
    personalRecommendations(user.id, 4),
  ]);

  const totalSpent = orders.filter((o) => o.orderStatus !== "CANCELLED").reduce((sum, o) => sum + Number(o.totalAmount), 0);
  const activeOrders = orders.filter((o) => ["PLACED", "PROCESSING", "SHIPPED"].includes(o.orderStatus));
  const purchasedProducts = new Set(orders.flatMap((o) => o.orderItems.map((oi) => oi.productId))).size;

  return (
    <DashPage kicker="Buyer workspace" title={`Your craft trail, ${user.fullName.split(" ")[0]}.`} lead="Every piece you have supported, kept together with its maker and its record." tabs={tabs}>
      <div className="metric-grid">
        <MetricCard label="Orders placed" value={orders.length} hint={`${activeOrders.length} in flight`} />
        <MetricCard label="Pieces supported" value={purchasedProducts} hint="Across all orders" />
        <MetricCard label="Total spent" value={formatPrice(totalSpent)} hint="Simulated payments included" />
        <MetricCard label="Last order" value={orders[0] ? orders[0].orderStatus.toLowerCase() : "—"} hint={orders[0] ? undefined : "Place your first order"} />
      </div>

      <div className="workspace-grid">
        <Panel title="Recent orders" action={<Link className="underline-link" href="/buyer/orders">All orders →</Link>}>
          {orders.length === 0 ? (
            <div className="danger-note">No orders yet — <Link href="/shop" style={{ textDecoration: "underline" }}>browse the collection</Link> and start your trail.</div>
          ) : orders.slice(0, 5).map((o) => (
            <div className="queue-item" key={o.id}>
              <strong style={{ font: "700 15px 'Space Grotesk'" }}>#{o.id}</strong>
              <span style={{ color: "var(--sage)", fontSize: 11 }}>{o.orderItems.length} item{o.orderItems.length === 1 ? "" : "s"} · {formatPrice(o.totalAmount)}</span>
              <span className="status-badge status-blue"><span className="status-dot" />{o.orderStatus}</span>
            </div>
          ))}
        </Panel>
        <Panel title="Recommended for you" tone="sky">
          <p style={{ fontSize: 11, color: "var(--sage)", lineHeight: 1.5 }}>
            Suggested by content-based matching on your viewed, carted, and purchased pieces.
          </p>
          <RecommendedGrid products={recommendations.map((p) => ({ id: p.id, title: p.title, image: "", category: p.category.name, price: String(p.price), similarity: undefined }))} />
          <ArrowButton href="/shop">Shop the collection</ArrowButton>
        </Panel>
      </div>
    </DashPage>
  );
}
