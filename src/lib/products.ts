import { prisma } from "./prisma";

export type ProductListItem = {
  id: number;
  title: string;
  description: string | null;
  price: string;
  stock: number;
  status: string;
  provenanceId: string | null;
  tags: string;
  origin: string | null;
  featured: boolean;
  createdAt: Date;
  manufacturerMethod: string;
  category: string;
  categoryId: number;
  image: string;
  artisan: { id: number; name: string; portrait: string | null; bio: string; trustScore: number };
  verified: boolean;
  rating: number;
  reviewCount: number;
  materials: string[];
};

export type ProductShape = Awaited<ReturnType<typeof listProducts>>[number];

export async function listProducts(opts: {
  q?: string;
  category?: string;
  sort?: string;
  status?: string;
  take?: number;
  featured?: boolean;
}) {
  const where = {
    status: (opts.status && ["PENDING", "APPROVED", "REJECTED", "HIDDEN"].includes(opts.status)
      ? opts.status
      : "APPROVED") as never,
    ...(opts.featured && { isFeatured: true }),
    ...(opts.category && opts.category !== "All crafts" && { category: { name: opts.category } }),
    ...(opts.q && {
      OR: [
        { title: { contains: opts.q, mode: "insensitive" as const } },
        { description: { contains: opts.q, mode: "insensitive" as const } },
        { origin: { contains: opts.q, mode: "insensitive" as const } },
        { artisan: { user: { fullName: { contains: opts.q, mode: "insensitive" as const } } } },
      ],
    }),
  };

  const orderBy =
    opts.sort === "price_asc" ? { price: "asc" as const }
    : opts.sort === "price_desc" ? { price: "desc" as const }
    : opts.sort === "rating" ? { reviews: { _count: "desc" as const } }
    : { createdAt: "desc" as const };

  const products = await prisma.product.findMany({
    where,
    orderBy,
    take: opts.take,
    include: {
      artisan: { include: { user: { select: { fullName: true } } } },
      category: true,
      images: true,
      materials: { include: { material: true } },
      reviews: { select: { rating: true } },
      provenanceRecord: true,
    },
  });

  return products.map((p) => {
    const ratings = p.reviews.map((r) => r.rating);
    const rating = ratings.length ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10 : 0;
    return {
      id: p.id,
      title: p.title,
      description: p.description,
      price: String(p.price),
      stock: p.stock,
      status: p.status,
      provenanceId: p.provenanceId,
      tags: p.tags,
      origin: p.origin,
      featured: p.isFeatured,
      createdAt: p.createdAt,
      manufacturerMethod: p.productionMethod ?? "—",
      category: p.category.name,
      categoryId: p.categoryId,
      image: p.images.find((i) => i.isPrimary)?.imageUrl ?? p.images[0]?.imageUrl ?? "",
      artisan: {
        id: p.artisan.id,
        name: p.artisan.user.fullName,
        portrait: p.artisan.portraitUrl ?? null,
        bio: p.artisan.bio ?? "",
        trustScore: Number(p.artisan.trustScore),
      },
      verified: p.provenanceRecord?.verificationStatus === "APPROVED",
      rating,
      reviewCount: ratings.length,
      materials: p.materials.map((m) => m.material.name),
    };
  });
}
