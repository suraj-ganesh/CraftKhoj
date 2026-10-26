import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatDate, formatPrice } from "@/lib/format";
import { DashPage, Panel } from "@/components/Panels";
import { OrderListActions } from "@/components/OrderListActions";
import Link from "next/link";
import { Star } from "lucide-react";

export const dynamic = "force-dynamic";

const tabs = [
  { href: "/buyer", label: "Overview" },
  { href: "/buyer/orders", label: "Order history" },
  { href: "/shop", label: "Shop crafts" },
];

export default async function BuyerOrdersPage() {
  const user = await requireRole("BUYER");
  const [orders, myReviews] = await Promise.all([
    prisma.order.findMany({
      where: { buyerId: user.id },
      include: {
        orderItems: {
          include: {
            product: { include: { images: true, artisan: { include: { user: true } } } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.review.findMany({ where: { buyerId: user.id }, select: { productId: true } }),
  ]);
  const reviewedProductIds = new Set(myReviews.map((r) => r.productId));

  return (
    <DashPage kicker="Buyer workspace" title="Order history." lead="Every piece you have supported, its maker, and where each order is in the journey." tabs={tabs}>
      {orders.length === 0 ? (
        <Panel title="No orders yet">
          <div className="danger-note">Your craft trail is empty. <Link href="/shop" style={{ textDecoration: "underline" }}>Start with the collection.</Link></div>
        </Panel>
      ) : (
        orders.map((order) => (
          <Panel title={`Order #${order.id}`} key={order.id} action={
            <span style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span className="status-badge status-blue"><span className="status-dot" />{order.orderStatus}</span>
              <span className="status-badge status-muted"><span className="status-dot" />{order.paymentMethod === "CASH_ON_DELIVERY" ? "COD" : "Simulated"} · {order.paymentStatus}</span>
            </span>
          }>
            <small style={{ color: "var(--sage)", display: "block", fontSize: 10, marginBottom: 12 }}>
              Placed {formatDate(order.createdAt)} · delivered to {order.shippingName}, {order.shippingAddress}
            </small>
            <div className="queue-list">
              {order.orderItems.map((item) => {
                const image = item.product.images.find((i) => i.isPrimary)?.imageUrl ?? item.product.images[0]?.imageUrl ?? "";
                const reviewed = reviewedProductIds.has(item.productId);
                return (
                  <div className="queue-item" key={item.id}>
                    {image && <img className="queue-thumb" src={image} alt="" />}
                    <div>
                      <Link href={`/product/${item.productId}`}><strong style={{ font: "700 14px 'Space Grotesk'" }}>{item.product.title}</strong></Link>
                      <span>{item.product.artisan?.user?.fullName} · ×{item.quantity} · {formatPrice(item.unitPrice)}</span>
                    </div>
                    <div style={{ display: "flex", gap: 10, marginLeft: "auto", alignItems: "center" }}>
                      {reviewed ? (
                        <span className="status-badge status-green"><span className="status-dot" />Reviewed</span>
                      ) : ["PROCESSING", "SHIPPED", "DELIVERED"].includes(order.orderStatus) ? (
                        <Link className="mini-action" href={`/buyer/review/${item.productId}`}><Star size={13} /> Write a review</Link>
                      ) : (
                        <span style={{ color: "var(--sage)", fontSize: 10 }}>Review after shipping</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="cart-summary" style={{ maxWidth: 320, marginLeft: "auto", paddingTop: 12 }}>
              <div><span>Total {order.orderStatus !== "CANCELLED" ? "" : "(cancelled)"}</span><strong>{formatPrice(order.totalAmount)}</strong></div>
            </div>
            <OrderListActions orderId={order.id} orderStatus={order.orderStatus} />
          </Panel>
        ))
      )}
    </DashPage>
  );
}
