import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/format";
import { DashPage, Panel } from "@/components/Panels";
import { CheckoutForm } from "@/components/CheckoutForm";
import Link from "next/link";

export const dynamic = "force-dynamic";

const tabs = [
  { href: "/buyer", label: "Overview" },
  { href: "/buyer/cart", label: "Basket" },
  { href: "/buyer/checkout", label: "Checkout" },
  { href: "/buyer/orders", label: "Order history" },
];

export default async function CheckoutPage() {
  const user = await requireRole("BUYER");
  const items = await prisma.cartItem.findMany({
    where: { buyerId: user.id },
    include: { product: { include: { images: true, artisan: { include: { user: true } } } } },
    orderBy: { createdAt: "asc" },
  });
  const subtotal = items.reduce((sum, i) => sum + Number(i.product.price) * i.quantity, 0);

  return (
    <DashPage kicker="Simulated checkout" title="Place your order." lead="This checkout stops before real payment integration — by design for the initial version." tabs={tabs}>
      {items.length === 0 ? (
        <Panel title="Nothing to check out">
          <div className="danger-note">Your basket is empty. <Link href="/shop" style={{ textDecoration: "underline" }}>Browse crafts first.</Link></div>
        </Panel>
      ) : (
        <CheckoutForm
          defaultName={user.fullName}
          subtotal={subtotal}
          lines={items.map((i) => ({
            id: i.id,
            quantity: i.quantity,
            product: {
              id: i.product.id,
              title: i.product.title,
              price: Number(i.product.price),
              image: i.product.images.find((im) => im.isPrimary)?.imageUrl ?? i.product.images[0]?.imageUrl ?? "",
              maker: i.product.artisan?.user?.fullName ?? "",
            },
          }))}
        />
      )}
    </DashPage>
  );
}
