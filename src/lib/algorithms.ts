import { prisma } from "./prisma";
import { districtCode } from "./format";

/* ── Design.md §12.1 — Artisan Trust Score ──────────────────────────────────
   TrustScore = 0.35·V + 0.25·R + 0.20·D + 0.15·C − 0.20·F   (normalized 0–100)
   V = verification completeness, R = normalized avg product rating,
   D = on-time delivery, C = completed orders, F = flagged/disputed listings   */
export async function computeTrustScore(artisanProfileId: number): Promise<number> {
  const profile = await prisma.artisanProfile.findUnique({
    where: { id: artisanProfileId },
    include: {
      products: { include: { reviews: true, reports: true, provenanceRecord: true } },
    },
  });
  if (!profile) return 0;

  const verifiedProducts = profile.products.filter(
    (p) => p.provenanceRecord?.verificationStatus === "APPROVED"
  ).length;
  const verificationCompleteness =
    profile.products.length === 0
      ? profile.verificationStatus === "APPROVED"
        ? 0.5
        : 0.15
      : verifiedProducts / profile.products.length;
  const V = verificationCompleteness;

  const reviewRatings = profile.products.flatMap((p) => p.reviews.map((r) => r.rating));
  const avgRating =
    reviewRatings.length > 0 ? reviewRatings.reduce((a, b) => a + b, 0) / reviewRatings.length : 0;
  const R = avgRating / 5;

  const orderItems = await prisma.orderItem.findMany({
    where: { product: { artisanId: profile.id } },
    include: { order: true },
  });
  const totalOrders = orderItems.length;
  const delivered = orderItems.filter((oi) => oi.order.orderStatus === "DELIVERED").length;
  const cancelled = orderItems.filter((oi) => oi.order.orderStatus === "CANCELLED").length;
  const completed = totalOrders - cancelled;
  const D = totalOrders > 0 ? delivered / totalOrders : 0.6;
  const C = totalOrders > 0 ? completed / totalOrders : 0.6;

  const openReports = profile.products.flatMap((p) =>
    p.reports.filter((r) => r.status === "OPEN")
  ).length;
  const rejected = profile.products.filter((p) => p.status === "REJECTED").length;
  const F = Math.min(1, (openReports * 0.3 + rejected * 0.5) / 2);

  const raw = 0.35 * V + 0.25 * R + 0.2 * D + 0.15 * C - 0.2 * F;
  return Math.round(Math.min(100, Math.max(0, raw * 100)) * 100) / 100;
}

/** Persist the latest computed trust score (called after verifier decisions, order updates, reviews). */
export async function refreshTrustScore(artisanProfileId: number) {
  const score = await computeTrustScore(artisanProfileId);
  await prisma.artisanProfile.update({ where: { id: artisanProfileId }, data: { trustScore: score } });
  return score;
}

/* ── Design.md §12.2 — Content-based product recommendation ────────────────
   Similarity(P_b, P_c) = w1·Category + w2·Origin + w3·Material + w4·Price + w5·Tags */
export type RecommenderInput = {
  category: string;
  district: string;
  materials: string[];
  price: number;
  tags: string[];
};

export function similarityScore(a: RecommenderInput, b: RecommenderInput): number {
  let score = 0;
  if (a.category === b.category) score += 0.35;
  if (districtCode(a.district) === districtCode(b.district)) score += 0.25;
  if (a.materials.length && b.materials.length) {
    const set = new Set(a.materials.map((m) => m.toLowerCase()));
    const overlap = b.materials.filter((m) => set.has(m.toLowerCase())).length;
    score += 0.2 * (overlap / Math.max(a.materials.length, b.materials.length));
  }
  const priceGap = Math.abs(a.price - b.price) / Math.max(a.price, b.price, 1);
  score += 0.1 * (1 - priceGap);
  if (a.tags.length && b.tags.length) {
    const set = new Set(a.tags.map((t) => t.toLowerCase()));
    const overlap = b.tags.filter((t) => set.has(t.toLowerCase())).length;
    score += 0.1 * (overlap / Math.max(a.tags.length, b.tags.length));
  }
  return Math.round(score * 1000) / 1000;
}

export type ProductForRec = {
  id: number;
  title: string;
  price: string | number;
  category: { name: string };
  origin: string | null;
  materials: { material: { name: string } }[];
  tags: string;
};

function recInput(p: ProductForRec): RecommenderInput {
  return {
    category: p.category.name,
    district: p.origin ?? "",
    materials: p.materials.map((m) => m.material.name),
    price: Number(p.price),
    tags: p.tags ? p.tags.split(",").filter(Boolean) : [],
  };
}

export function recommendSimilar<T extends ProductForRec>(target: ProductForRec, candidates: T[], limit = 4) {
  const t = recInput(target);
  return candidates
    .filter((c) => c.id !== target.id)
    .map((c) => ({ product: c, score: similarityScore(t, recInput(c)) }))
    .filter((r) => r.score > 0.15)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((r) => ({ ...r.product, similarity: r.score }));
}

/** Personalized feed: nearest products to a buyer's purchased/carted/searched history. */
export async function personalRecommendations(buyerId: number, limit = 4) {
  const interacted = await prisma.product.findMany({
    where: {
      OR: [
        { orderItems: { some: { order: { buyerId } } } },
        { cartItems: { some: { buyerId } } },
        { reviews: { some: { buyerId } } },
      ],
    },
    include: recInclude,
  });
  if (interacted.length === 0) {
    return prisma.product.findMany({
      where: { status: "APPROVED" },
      orderBy: { reviews: { _count: "desc" } },
      take: limit,
      include: recInclude,
    });
  }
  const candidates = await prisma.product.findMany({
    where: { status: "APPROVED", id: { notIn: interacted.map((p) => p.id) } },
    include: recInclude,
  });
  const seed = interacted[Math.floor(Math.random() * interacted.length)];
  return recommendSimilar(seed as unknown as ProductForRec, candidates as unknown as ProductForRec[], limit);
}

export const recInclude = {
  category: true,
  materials: { include: { material: true } },
  images: true,
} as const;

/* ── Design.md §12.3 — Authenticity risk score ─────────────────────────────
   Missing evidence / unusual patterns push a listing up the verifier queue.  */
export type RiskInput = {
  processImageUrl?: string | null;
  processNotes?: string | null;
  artisanYears?: number;
  price: number;
  categoryAvgPrice: number;
  duplicateRate?: number;
  openReports: number;
  rejectedBefore: number;
  provenanceStatus: "PENDING" | "APPROVED" | "REJECTED" | "CHANGES_REQUESTED";
};

export function riskScore(r: RiskInput): number {
  let score = 0;
  if (!r.processImageUrl && !r.processNotes) score += 30;
  if (r.artisanYears !== undefined && r.artisanYears <= 1) score += 15;
  if (r.categoryAvgPrice > 0 && r.price < r.categoryAvgPrice * 0.4) score += 25;
  if ((r.duplicateRate ?? 0) > 0.8) score += 10;
  if (r.price > r.categoryAvgPrice * 8 && r.provenanceStatus !== "APPROVED") score += 10;
  score += r.openReports * 10;
  score += r.rejectedBefore * 12;
  return Math.min(100, score);
}

export async function refreshRiskScore(productId: number): Promise<number> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      artisan: true,
      provenanceRecord: true,
      category: true,
      reports: { where: { status: "OPEN" } },
    },
  });
  if (!product) return 0;
  const catStats = await prisma.product.aggregate({
    where: { categoryId: product.categoryId, status: "APPROVED" },
    _avg: { price: true },
  });
  const rejectedBefore = await prisma.verificationLog.count({
    where: { decision: "REJECTED", provenanceRecord: { productId } },
  });
  const score = riskScore({
    processImageUrl: product.provenanceRecord?.processImageUrl,
    processNotes: product.provenanceRecord?.processNotes,
    artisanYears: product.artisan.yearsExperience,
    price: Number(product.price),
    categoryAvgPrice: catStats._avg.price ? Number(catStats._avg.price) : 0,
    openReports: product.reports.length,
    rejectedBefore,
    provenanceStatus: product.provenanceRecord?.verificationStatus ?? "PENDING",
  });
  await prisma.product.update({ where: { id: productId }, data: { riskScore: score } });
  return score;
}

/* ── Design.md §12.4 — Demand forecasting ─────────────────────────────────
   F_t = α·S_{t-1} + (1 − α)·F_{t-1}   (exponential smoothing, α = 0.3)        */
export function exponentialSmoothing(series: number[], alpha = 0.3): number {
  if (series.length === 0) return 0;
  if (series.length === 1) return series[0];
  let forecast = series[0];
  for (let i = 1; i < series.length; i++) forecast = alpha * series[i] + (1 - alpha) * forecast;
  return Math.round(forecast * 10) / 10;
}

export async function monthlySales(productIds: number[], months = 6) {
  const since = new Date();
  since.setMonth(since.getMonth() - months);
  since.setDate(1);
  const items = await prisma.orderItem.findMany({
    where: { productId: { in: productIds }, order: { createdAt: { gte: since }, orderStatus: { not: "CANCELLED" } } },
    select: { productId: true, quantity: true, order: true },
  });
  const labels: string[] = [];
  const now = new Date();
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    labels.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  const byMonth = new Map<string, number>(labels.map((l) => [l, 0]));
  for (const item of items) {
    const key = `${new Date(item.order.createdAt).getFullYear()}-${String(new Date(item.order.createdAt).getMonth() + 1).padStart(2, "0")}`;
    if (byMonth.has(key)) byMonth.set(key, (byMonth.get(key) ?? 0) + item.quantity);
  }
  return { labels, series: labels.map((l) => byMonth.get(l) ?? 0) };
}

/** Unique Craft Provenance ID programming (§3 objective: CK-{DISTRICT}-{YEAR}-{5-digit}). */
export async function generateProvenanceId(district: string) {
  const year = new Date().getFullYear();
  const code = districtCode(district);
  const random = Math.floor(10000 + Math.random() * 90000);
  let id = `CK-${code}-${year}-${random}`;
  let exists = await prisma.product.findUnique({ where: { provenanceId: id } });
  for (let i = 0; exists && i < 50; i++) {
    id = `CK-${code}-${year}-${Math.floor(10000 + Math.random() * 90000)}`;
    exists = await prisma.product.findUnique({ where: { provenanceId: id } });
  }
  return id;
}

/** Design.md 12.4 — Demand forecasting: monthly sales series + exponential smoothing (alpha = 0.3).
    Returns `horizon` forward forecasts; each step folds its own prediction back into the level. */
export async function demandForecast(productIds: number[], horizon = 3) {
  const { series } = await monthlySales(productIds, 6);
  let level = series.length ? series.reduce((a, b) => a + b, 0) / series.length : 0;
  const history = [...series];
  for (const v of history) level = 0.3 * v + 0.7 * level;
  const out: number[] = [];
  for (let i = 0; i < horizon; i++) {
    level = 0.7 * level; // decay continuation of the smoothing update with the predicted value
    out.push(Math.round(level));
  }
  return out;
}