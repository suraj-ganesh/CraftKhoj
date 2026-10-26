import { prisma } from "@/lib/prisma";
import { requireUser, json, unauthorized } from "@/lib/api";
import { exponentialSmoothing } from "@/lib/algorithms";

/** GET /api/admin/reports — platform analytics + moderation reports (Design.md §16). */
export async function GET() {
  const { user, response } = await requireUser(["ADMIN"]);
  if (!user) return unauthorized();

  const [orders, products, users, artisans, openReports, categories] = await Promise.all([
    prisma.order.findMany({ include: { orderItems: { include: { product: { include: { category: true, artisan: true } } } } } }),
    prisma.product.findMany({ include: { category: true } }),
    prisma.user.findMany(),
    prisma.artisanProfile.findMany({ orderBy: { trustScore: "desc" }, include: { user: { select: { id: true, fullName: true } }, products: true } }),
    prisma.report.findMany({ where: { status: "OPEN" }, include: { product: true, reporter: true } }),
    prisma.craftCategory.findMany({ include: { products: true } }),
  ]);

  const paidOrders = orders.filter((o) => o.paymentStatus === "PAID" || o.orderStatus === "DELIVERED");
  const totalRevenue = paidOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0);

  // Monthly revenue + order trend (last 8 months)
  const monthKeys: string[] = [];
  const now = new Date();
  for (let i = 7; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    monthKeys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  const revenueTrend = monthKeys.map((key) => {
    const [y, m] = key.split("-").map(Number);
    const monthOrders = orders.filter(
      (o) =>
        new Date(o.createdAt).getFullYear() === y &&
        new Date(o.createdAt).getMonth() + 1 === m &&
        o.orderStatus !== "CANCELLED"
    );
    return {
      month: key,
      revenue: Math.round(monthOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0)),
      orders: monthOrders.length,
    };
  });

  // Top-selling products
  const productSales = new Map<number, { title: string; units: number; revenue: number }>();
  for (const o of orders) {
    if (o.orderStatus === "CANCELLED") continue;
    for (const oi of o.orderItems) {
      const current = productSales.get(oi.productId) ?? { title: oi.product.title, units: 0, revenue: 0 };
      current.units += oi.quantity;
      current.revenue += Number(oi.unitPrice) * oi.quantity;
      productSales.set(oi.productId, current);
    }
  }
  const topProducts = [...productSales.entries()].map(([id, v]) => ({ id, ...v })).sort((a, b) => b.units - a.units).slice(0, 5);

  // Category distribution
  const categorySales = new Map<string, number>();
  for (const o of orders) {
    if (o.orderStatus === "CANCELLED") continue;
    for (const oi of o.orderItems) {
      const key = oi.product.category.name;
      categorySales.set(key, (categorySales.get(key) ?? 0) + oi.quantity);
    }
  }
  const categoryDistribution = categories.map((c) => ({
    category: c.name,
    products: c.products.length,
    unitsSold: categorySales.get(c.name) ?? 0,
  }));

  // Verification approval/rejection rates
  const approvedProvenance = await prisma.provenanceRecord.count({ where: { verificationStatus: "APPROVED" } });
  const rejectedProvenance = await prisma.provenanceRecord.count({ where: { verificationStatus: "REJECTED" } });
  const pendingProvenance = await prisma.provenanceRecord.count({ where: { verificationStatus: "PENDING" } });

  // Low stock alerts
  const lowStock = products
    .filter((p) => p.status === "APPROVED" && p.stock <= 3)
    .map((p) => ({ id: p.id, title: p.title, stock: p.stock }));

  // Demand forecast (exponential smoothing, α = 0.3) on monthly unit sales, per category
  const forecasts = categoryDistribution.map((c) => {
    const series = monthKeys.map((key) => {
      const [y, m] = key.split("-").map(Number);
      return orders
        .filter(
          (o) =>
            o.orderStatus !== "CANCELLED" &&
            new Date(o.createdAt).getFullYear() === y &&
            new Date(o.createdAt).getMonth() + 1 === m
        )
        .flatMap((o) => o.orderItems)
        .filter((oi) => oi.product.category.name === c.category)
        .reduce((sum, oi) => sum + oi.quantity, 0);
    });
    return { category: c.category, forecastNextMonth: exponentialSmoothing(series, 0.3) };
  });

  // Local (regional) craft distribution: artisan districts
  const regional = new Map<string, number>();
  for (const a of artisans) {
    const key = a.district ?? "Unknown";
    regional.set(key, (regional.get(key) ?? 0) + 1);
  }
  const regionalDistribution = [...regional.entries()].map(([district, artisans]) => ({ district, artisans }));

  return json({
    metrics: {
      totalRevenue,
      totalOrders: orders.length,
      activeOrders: orders.filter((o) => ["PLACED", "PROCESSING", "SHIPPED"].includes(o.orderStatus)).length,
      totalUsers: users.length,
      totalArtisans: artisans.length,
      totalProducts: products.length,
      pendingProducts: products.filter((p) => p.status === "PENDING").length,
      openReports: openReports.length,
      verification: {
        pending: pendingProvenance,
        approved: approvedProvenance,
        rejected: rejectedProvenance,
        approvalRate:
          approvedProvenance + rejectedProvenance > 0
            ? Math.round((approvedProvenance / (approvedProvenance + rejectedProvenance)) * 100)
            : 0,
      },
    },
    revenueTrend,
    topProducts,
    categoryDistribution,
    regionalDistribution,
    trustRanking: artisans.slice(0, 8).map((a) => ({
      id: a.id,
      name: a.user.fullName,
      trustScore: Number(a.trustScore),
      products: a.products.length,
      district: a.district,
    })),
    lowStock,
    forecasts,
    moderationReports: openReports.map((r) => ({
      id: r.id,
      productId: r.productId,
      reason: r.reason,
      description: r.description,
      status: r.status,
      adminRemarks: r.adminRemarks,
      createdAt: r.createdAt,
      product: r.product,
      reporter: { id: r.reporter.id, fullName: r.reporter.fullName },
    })),
  });
}
