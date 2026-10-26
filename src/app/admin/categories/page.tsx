import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { DashPage } from "@/components/Panels";
import { CategoryForm } from "@/components/CategoryForm";

export const dynamic = "force-dynamic";

const tabs = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/reports", label: "Reports" },
];

export default async function AdminCategoriesPage() {
  await requireRole("ADMIN");

  const categories = await prisma.craftCategory.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <DashPage kicker="Administrator workspace" title="Craft categories." lead="The taxonomy of the marketplace — shop tabs and the content-similarity algorithm both read from here." tabs={tabs}>
      <CategoryForm
        existing={categories.map((c) => ({ id: c.id, name: c.name, info: `${c._count.products} craft${c._count.products === 1 ? "" : "s"}`, image: "" }))}
      />
    </DashPage>
  );
}
