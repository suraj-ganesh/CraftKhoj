import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/format";
import { DashPage, MetricCard, Panel } from "@/components/Panels";
import Link from "next/link";

export const dynamic = "force-dynamic";

const tabs = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/reports", label: "Reports" },
];

const statusBadge: Record<string, string> = {
  APPROVED: "status-green",
  PENDING: "status-orange",
  REJECTED: "status-red",
  HIDDEN: "status-muted",
};

export default async function AdminProductsPage() {
  await requireRole("ADMIN");

  const products = await prisma.product.findMany({
    include: {
      category: true,
      images: true,
      artisan: { include: { user: { select: { fullName: true } } } },
      provenanceRecord: { select: { verificationStatus: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const inventoryValue = products.reduce((s, p) => s + Number(p.price) * p.stock, 0);
  const outOfStock = products.filter((p) => p.stock === 0).length;

  return (
    <DashPage kicker="Administrator workspace" title="Product catalogue." lead="Every craft submitted to the marketplace — status, provenance, and stock at a glance." tabs={tabs}>
      <div className="metric-grid">
        <MetricCard label="Total crafts" value={products.length} />
        <MetricCard label="Published" value={products.filter((p) => p.status === "APPROVED").length} hint="Live in the shop" />
        <MetricCard label="Inventory value" value={formatPrice(inventoryValue)} hint="Price x stock" />
        <MetricCard label="Out of stock" value={outOfStock} hint="Restock with the artisan" />
      </div>

      <Panel title="All products" tone="white">
        <div className="admin-table">
          <table>
            <thead>
              <tr>
                <th>Craft</th><th>Artisan</th><th>Category</th><th>Price</th><th>Stock</th><th>Provenance</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const image = p.images.find((i) => i.isPrimary)?.imageUrl ?? p.images[0]?.imageUrl ?? "";
                return (
                  <tr key={p.id}>
                    <td>
                      <div style={{ alignItems: "center", display: "flex", gap: 10 }}>
                        {image && <img src={image} alt="" style={{ border: "1.5px solid var(--forest)", height: 34, objectFit: "cover", width: 46 }} />}
                        <div>
                          <strong style={{ font: "700 13px 'Space Grotesk'" }}>
                            <Link href={`/product/${p.id}`}>{p.title}</Link>
                          </strong>
                          <span style={{ color: "var(--sage)", display: "block", fontSize: 10 }}>{p.provenanceId ?? "no record id"}</span>
                        </div>
                      </div>
                    </td>
                    <td style={{ color: "var(--sage)", fontSize: 11 }}>{p.artisan.user.fullName}<span style={{ display: "block", fontSize: 10 }}>{p.artisan.district}</span></td>
                    <td style={{ color: "var(--sage)", fontSize: 11 }}>{p.category.name}</td>
                    <td><strong style={{ font: "700 12px 'Space Grotesk'" }}>{formatPrice(p.price)}</strong></td>
                    <td style={{ color: p.stock === 0 ? "#c14e3d" : "inherit", font: "700 12px 'Space Grotesk'" }}>{p.stock}</td>
                    <td>
                      <span className={`status-badge ${p.provenanceRecord?.verificationStatus === "APPROVED" ? "status-green" : p.provenanceRecord?.verificationStatus === "REJECTED" ? "status-red" : "status-orange"}`}>
                        <span className="status-dot" />{p.provenanceRecord?.verificationStatus.toLowerCase() ?? "none"}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${statusBadge[p.status] ?? "status-blue"}`}>
                        <span className="status-dot" />{p.status.toLowerCase()}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {products.length === 0 && <div className="danger-note" style={{ marginTop: 14 }}>No products submitted yet.</div>}
      </Panel>
    </DashPage>
  );
}
