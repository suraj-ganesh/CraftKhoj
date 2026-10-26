import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { DashPage } from "@/components/Panels";
import { ProductForm, emptyProductInitial } from "@/components/ProductForm";

export const dynamic = "force-dynamic";

const tabs = [
  { href: "/studio", label: "Overview" },
  { href: "/studio/products", label: "My products" },
  { href: "/studio/profile", label: "Workshop profile" },
];

export default async function NewProductPage() {
  await requireRole("ARTISAN");
  const categories = await prisma.craftCategory.findMany({ orderBy: { name: "asc" } });
  return (
    <DashPage kicker="Artisan studio" title="Open a new craft." lead="Describe the piece and attach its evidence — a verifier reviews it before it goes live." tabs={tabs}>
      <ProductForm
        mode="create"
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
        initial={emptyProductInitial()}
      />
    </DashPage>
  );
}
