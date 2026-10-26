import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/format";
import { DashPage, Panel } from "@/components/Panels";
import { CartLines } from "@/components/CartLines";
import Link from "next/link";

export const dynamic = "force-dynamic";

const tabs = [
  { href: "/buyer", label: "Overview" },
  { href: "/buyer/cart", label: "Basket" },
  { href: "/buyer/orders", label: "Order history" },
];

export default async function CartPage() {
  const user = await requireRole("BUYER");
  const items = await prisma.cartItem.findMany({
    where: { buyerId: user.id },
    include: { product: { include: { images: true, artisan: { include: { user: true } } } } },
    orderBy: { createdAt: "asc" },
  });
  const subtotal = items.reduce((sum, i) => sum + Number(i.product.price) * i.quantity, 0);

  return (
    <DashPage kicker="Buying basket" title="Your basket." lead="Everything you have tucked away, waiting for checkout." tabs={tabs}>
      <Panel title={items.length === 1 ? "1 line" : `${items.length} lines`} tone="white">
        {items.length === 0 ? (
          <div className="danger-note">Your basket is empty. <Link href="/shop" style={{ textDecoration: "underline" }}>Find a piece with a story.</Link></div>
        ) : (
          <CartLines
            lines={items.map((i) => ({
              id: i.id,
              quantity: i.quantity,
              product: {
                id: i.product.id,
                title: i.product.title,
                price: Number(i.product.price),
                stock: i.product.stock,
                image: i.product.images.find((im) => im.isPrimary)?.imageUrl ?? i.product.images[0]?.imageUrl ?? "",
                maker: i.product.artisan?.user?.fullName ?? "",
              },
            }))}
            subtotal={subtotal}
          />
        )}
      </Panel>
    </DashPage>
  );
}
