import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser, badRequest, notFound, json } from "@/lib/api";
import { refreshTrustScore } from "@/lib/algorithms";

const schema = z.object({
  productId: z.coerce.number().int().positive(),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().max(2000).optional(),
});

/** POST /api/reviews — buyer reviews a purchased product (1–5 stars). */
export async function POST(req: NextRequest) {
  const { user, response } = await requireUser(["BUYER"]);
  if (!user) return response!;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return badRequest("A rating from 1 to 5 is required.");
  const { productId, rating, comment } = parsed.data;

  const product = await prisma.product.findUnique({ where: { id: productId }, include: { artisan: true } });
  if (!product) return notFound("Product not found");

  // A buyer may review only products they have purchased (TC-09)
  const purchased = await prisma.orderItem.findFirst({
    where: {
      productId,
      order: { buyerId: user.id, orderStatus: { in: ["PROCESSING", "SHIPPED", "DELIVERED"] } },
    },
  });
  if (!purchased) {
    return badRequest("You can review a product only after purchasing it.");
  }

  const existing = await prisma.review.findUnique({ where: { productId_buyerId: { productId, buyerId: user.id } } });
  if (existing) return badRequest("You have already reviewed this product.");

  const review = await prisma.review.create({ data: { productId, buyerId: user.id, rating, comment } });
  await refreshTrustScore(product.artisanId);

  return json({ review }, { status: 201 });
}

/** GET /api/reviews?productId= */
export async function GET(req: NextRequest) {
  const productId = Number(req.nextUrl.searchParams.get("productId"));
  if (!productId) return badRequest("productId required.");
  const reviews = await prisma.review.findMany({
    where: { productId },
    include: { buyer: { select: { fullName: true } } },
    orderBy: { createdAt: "desc" },
  });
  return json({ reviews });
}
