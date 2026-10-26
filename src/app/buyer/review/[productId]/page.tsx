import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { DashPage, Panel } from "@/components/Panels";
import { ReviewForm } from "@/components/ReviewForm";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

const tabs = [
  { href: "/buyer", label: "Overview" },
  { href: "/buyer/orders", label: "Order history" },
];

export default async function ReviewProductPage({ params }: { params: Promise<{ productId: string }> }) {
  const { productId } = await params;
  const user = await requireRole("BUYER");
  const id = Number(productId);
  if (!Number.isFinite(id)) notFound();

  const product = await prisma.product.findUnique({
    where: { id },
    include: { images: true, artisan: { include: { user: true } } },
  });
  if (!product || product.status !== "APPROVED") notFound();

  // Ownership check: buyer must have a paid order containing this product.
  const owned = await prisma.orderItem.findFirst({
    where: { productId: id, order: { buyerId: user.id, paymentStatus: { in: ["PAID", "PENDING"] } } },
  });
  if (!owned) {
    return (
      <DashPage kicker="Buyer workspace" title="Review not possible." lead="Only buyers who purchased this piece can review it." tabs={tabs}>
        <Panel title="No purchase found">
          <div className="danger-note">We could not find this piece in one of your orders. Reviews are locked to verified purchases.</div>
        </Panel>
      </DashPage>
    );
  }

  const image = product.images.find((i) => i.isPrimary)?.imageUrl ?? product.images[0]?.imageUrl ?? "";

  return (
    <DashPage kicker="Buyer workspace" title="Write your review." lead="Your words become part of the maker's public record." tabs={tabs}>
      <ReviewForm productId={product.id} productTitle={product.title} productPrice={String(product.price)} image={image} />
    </DashPage>
  );
}
