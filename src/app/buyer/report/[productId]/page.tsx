import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { DashPage, Panel } from "@/components/Panels";
import { ReportForm } from "@/components/ReportForm";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

const tabs = [
  { href: "/buyer", label: "Overview" },
  { href: "/buyer/orders", label: "Order history" },
];

export default async function ReportProductPage({ params }: { params: Promise<{ productId: string }> }) {
  const { productId } = await params;
  await requireRole("BUYER");
  const id = Number(productId);
  if (!Number.isFinite(id)) notFound();

  const product = await prisma.product.findUnique({ where: { id } });
  if (!product || product.status !== "APPROVED") notFound();

  return (
    <DashPage kicker="Buyer workspace" title="File a provenance report." lead="A structured complaint flows from you to the verification team with the artifact attached." tabs={tabs}>
      <ReportForm productId={product.id} productTitle={product.title} />
    </DashPage>
  );
}
