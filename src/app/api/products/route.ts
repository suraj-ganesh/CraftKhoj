import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma, ProductStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { json, requireUser, badRequest } from "@/lib/api";
import { refreshRiskScore } from "@/lib/algorithms";

/** GET /api/products — public list with search/filter/sort. */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const q = sp.get("q") ?? "";
  const category = sp.get("category") ?? "";
  const sort = sp.get("sort") ?? "newest";
  const status = sp.get("status"); // public default: APPROVED only

  const where: Prisma.ProductWhereInput = {
    status: status && ["PENDING", "APPROVED", "REJECTED", "HIDDEN"].includes(status) ? (status as ProductStatus) : "APPROVED",
    ...(q && {
      OR: [
        { title: { contains: q, mode: "insensitive" as const } },
        { description: { contains: q, mode: "insensitive" as const } },
        { origin: { contains: q, mode: "insensitive" as const } },
      ],
    }),
    ...(category && { category: { name: category } }),
  };

  const orderBy =
    sort === "price_asc" ? { price: "asc" as const }
    : sort === "price_desc" ? { price: "desc" as const }
    : sort === "rating" ? { reviews: { _count: "desc" as const } }
    : { createdAt: "desc" as const };

  const products = await prisma.product.findMany({
    where,
    orderBy,
    include: {
      artisan: { include: { user: { select: { fullName: true } } } },
      category: true,
      images: true,
      materials: { include: { material: true } },
      reviews: { select: { rating: true } },
      provenanceRecord: { select: { verificationStatus: true } },
    },
  });

  const shaped = products.map((p) => {
    const ratings = p.reviews.map((r) => r.rating);
    return {
      id: p.id,
      title: p.title,
      price: p.price,
      stock: p.stock,
      status: p.status,
      provenanceId: p.provenanceId,
      tags: p.tags,
      origin: p.origin,
      featured: p.isFeatured,
      createdAt: p.createdAt,
      category: p.category.name,
      image: p.images.find((i) => i.isPrimary)?.imageUrl ?? p.images[0]?.imageUrl ?? "",
      artisan: { id: p.artisan.id, name: p.artisan.user.fullName, district: p.artisan.district },
      verified: p.provenanceRecord?.verificationStatus === "APPROVED",
      rating: ratings.length ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10 : 0,
      reviewCount: ratings.length,
    };
  });

  return json({ products: shaped });
}

const productSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().max(3000),
  price: z.coerce.number().positive(),
  stock: z.coerce.number().int().min(0),
  categoryId: z.coerce.number().int().positive(),
  origin: z.string().optional(),
  productionMethod: z.string().optional(),
  productionDate: z.string().optional(),
  processNotes: z.string().max(3000).optional(),
  processImageUrl: z.string().optional(),
  tags: z.string().optional(),
  image: z.string().optional(),
  materials: z.array(z.string()).optional(),
});

/** POST /api/products — artisan creates a product (hidden until approved). */
export async function POST(req: NextRequest) {
  const { user, response } = await requireUser(["ARTISAN"]);
  if (!user) return response!;
  const profile = await prisma.artisanProfile.findUnique({ where: { userId: user.id } });
  if (!profile) return badRequest("Artisan profile missing. Please complete your profile first.");

  const body = await req.json().catch(() => null);
  const parsed = productSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.issues[0]?.message ?? "Invalid product data.");
  const d = parsed.data;

  if (d.stock === 0 && d.price <= 0) return badRequest("A price is required.");

  const product = await prisma.product.create({
    data: {
      artisanId: profile.id,
      categoryId: d.categoryId,
      title: d.title,
      description: d.description,
      price: d.price,
      stock: d.stock,
      origin: d.origin ?? "",
      productionMethod: d.productionMethod ?? "",
      productionDate: d.productionDate ? new Date(d.productionDate) : null,
      processImageUrl: d.processImageUrl ?? null,
      tags: d.tags ?? "",
      status: "PENDING",
    },
  });

  // Provenance record (submit for verification with the product)
  const record = await prisma.provenanceRecord.create({
    data: {
      productId: product.id,
      workshopLocation: profile.workshopAddress ?? "",
      productionDate: d.productionDate ? new Date(d.productionDate) : null,
      productionMethod: d.productionMethod ?? "",
      processNotes: d.processNotes ?? "",
      processImageUrl: d.processImageUrl ?? null,
      verificationStatus: "PENDING",
    },
  });

  await prisma.provenanceEvent.create({
    data: {
      provenanceRecordId: record.id,
      eventType: "SUBMITTED",
      description: "An artisan submitted new craft evidence for verification.",
      performedById: user.id,
    },
  });

  if (d.image) {
    await prisma.productImage.create({ data: { productId: product.id, imageUrl: d.image, isPrimary: true } });
  }
  for (const name of d.materials ?? []) {
    const material = await prisma.material.upsert({ where: { name }, create: { name }, update: {} });
    await prisma.productMaterial.create({ data: { productId: product.id, materialId: material.id } });
  }

  await refreshRiskScore(product.id);

  return NextResponse.json({ product: { id: product.id, status: product.status } }, { status: 201 });
}
