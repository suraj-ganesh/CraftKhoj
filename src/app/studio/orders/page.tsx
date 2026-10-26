import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatDate, formatPrice } from "@/lib/format";
import { DashPage, Panel } from "@/components/Panels";
import { StudioOrderAction } from "@/components/StudioOrderAction";

export const dynamic = "force-dynamic";

const tabs = [
  { href: "/studio", label: "Overview" },
  { href: "/studio/products", label: "My products" },
  { href: "/studio/orders", label: "Orders" },
  { href: "/studio/provenance", label: "Provenance records" },
  { href: "/studio/profile", label: "Workshop profile" },
];

export default async function StudioOrdersPage() {
  const user = await requireRole("ARTISAN");
  const profile = await prisma.artisanProfile.findUnique({ where: { userId: user.id } });

  const items = await prisma.orderItem.findMany({
    where: { product: { artisanId: profile!.id } },
    include: { product: true, order: { include: { buyer: { select: { fullName: true } } } } },
    orderBy: { order: { createdAt: "desc" } },
  });

  const active = items.filter((i) => ["PLACED", "PROCESSING", "SHIPPED"].includes(i.order.orderStatus));
  const closed = items.filter((i) => ["DELIVERED", "CANCELLED"].includes(i.order.orderStatus));

  return (
    <DashPage kicker="Artisan studio" title="Orders for your pieces." lead="Each line is one piece of one order — advance the ones you have in hand." tabs={tabs}>
      <Panel title={`In flight (${active.length})`} tone="white">
        {active.length === 0 ? (
          <div className="danger-note">No active orders right now.</div>
        ) : (
          active.map((i) => (
            <div className="queue-item" key={i.id}>
              <div>
                <strong style={{ font: "700 14px 'Space Grotesk'" }}>{i.product.title}</strong>
                <span>Order #{i.orderId} · {i.order.buyer.fullName} · {formatDate(i.order.createdAt)}</span>
                <span>{i.quantity} × {formatPrice(i.unitPrice)} · {i.order.paymentMethod === "CASH_ON_DELIVERY" ? "Cash on delivery" : "Prepaid (simulated)"}</span>
              </div>
              <span className="status-badge status-blue"><span className="status-dot" />{i.order.orderStatus}</span>
              <StudioOrderAction orderId={i.orderId} orderStatus={i.order.orderStatus} />
            </div>
          ))
        )}
      </Panel>
      <Panel title={`Closed (${closed.length})`}>
        {closed.map((i) => (
          <div className="queue-item" key={i.id}>
            <div>
              <strong style={{ font: "700 14px 'Space Grotesk'" }}>{i.product.title}</strong>
              <span>Order #{i.orderId} · {i.order.buyer.fullName} · {formatDate(i.order.createdAt)}</span>
            </div>
            <span className={`status-badge ${i.order.orderStatus === "CANCELLED" ? "status-red" : "status-green"}`}>
              <span className="status-dot" />{i.order.orderStatus.toLowerCase()}
            </span>
            <span style={{ marginLeft: "auto", color: "var(--sage)", fontSize: 10 }}>{i.order.paymentStatus.toLowerCase()}</span>
          </div>
        ))}
        {closed.length === 0 && <div className="danger-note">No closed order lines yet.</div>}
      </Panel>
    </DashPage>
  );
}
