import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { DashPage } from "@/components/Panels";
import { ProductForm } from "@/components/ProductForm";
import { notFound, redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const tabs = [
  { href: "/studio", label: "Overview" },
  { href: "/studio/products", label: "My products" },
  { href: "/studio/profile", label: "Workshop profile" },
];

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireRole("ARTISAN");
  const productId = Number(id);
  if (!Number.isFinite(productId)) notFound();

  const profile = await prisma.artisanProfile.findUnique({ where: { userId: user.id } });
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { images: true, provenanceRecord: true, materials: { include: { material: true } } },
  });
  if (!product || !profile || product.artisanId !== profile.id) notFound();

  return (
    <DashPage kicker="Artisan studio" title={product.title} lead={`Provenance status: ${product.provenanceRecord?.verificationStatus ?? "NONE"} — editing method, date, or notes re-queues verification.`} tabs={tabs}>
      <ProductForm
        mode="edit"
        categories={(await prisma.craftCategory.findMany({ orderBy: { name: "asc" } })).map((c) => ({ id: c.id, name: c.name }))}
        initial={{
          id: product.id,
          title: product.title,
          description: product.description ?? "",
          price: String(product.price),
          stock: String(product.stock),
          categoryId: String(product.categoryId),
          origin: product.origin ?? "",
          tags: product.tags ?? "",
          image: product.images.find((i) => i.isPrimary)?.imageUrl ?? product.images[0]?.imageUrl ?? "",
          materials: product.materials.map((m) => m.material.name).join(", "),
          productionDate: product.provenanceRecord?.productionDate ? new Date(product.provenanceRecord.productionDate).toISOString().slice(0, 10) : "",
          productionMethod: product.provenanceRecord?.productionMethod ?? "",
          processNotes: product.provenanceRecord?.processNotes ?? "",
          processImageUrl: product.provenanceRecord?.processImageUrl ?? "",
        }}
      />
    </DashPage>
  );
}
