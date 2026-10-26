import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser, badRequest, notFound, json, unauthorized } from "@/lib/api";

const addSchema = z.object({
  productId: z.coerce.number().int().positive(),
  quantity: z.coerce.number().int().min(1).max(99).optional(),
});

/** GET /api/cart — current buyer cart. */
export async function GET() {
  const { user, response } = await requireUser(["BUYER"]);
  if (!user) return unauthorized();
  const items = await prisma.cartItem.findMany({
    where: { buyerId: user.id },
    include: { product: { include: { images: true, artisan: { include: { user: { select: { id: true, fullName: true, email: true } } } } } } },
    orderBy: { createdAt: "asc" },
  });
  const total = items.reduce((sum, i) => sum + Number(i.product.price) * i.quantity, 0);
  return json({ items, total });
}

/** POST /api/cart — add product to cart. */
export async function POST(req: NextRequest) {
  const { user, response } = await requireUser(["BUYER"]);
  if (!user) return response!;
  const parsed = addSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return badRequest("productId and quantity are required.");
  const { productId, quantity = 1 } = parsed.data;

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) return notFound("Product not found");
  if (product.status !== "APPROVED") return badRequest("Product is not available.");
  if (product.stock === 0) return badRequest("Product unavailable — out of stock.");

  const existing = await prisma.cartItem.findUnique({ where: { buyerId_productId: { buyerId: user.id, productId } } });
  const desired = (existing?.quantity ?? 0) + quantity;
  if (desired > product.stock) return badRequest(`Only ${product.stock} unit(s) in stock.`);

  const item = await prisma.cartItem.upsert({
    where: { buyerId_productId: { buyerId: user.id, productId } },
    create: { buyerId: user.id, productId, quantity },
    update: { quantity: desired },
  });
  return json({ item }, { status: 201 });
}

const qtySchema = z.object({ quantity: z.coerce.number().int().min(1).max(99) });

/** PATCH /api/cart — change quantity of a line. */
export async function PATCH(req: NextRequest) {
  const { user, response } = await requireUser(["BUYER"]);
  if (!user) return response!;
  const body = await req.json().catch(() => null);
  const id = Number(body?.id);
  if (!id) return badRequest("Cart line id is required.");
  const parsed = qtySchema.safeParse(body);
  if (!parsed.success) return badRequest("Invalid quantity.");

  const item = await prisma.cartItem.findUnique({ where: { id }, include: { product: true } });
  if (!item || item.buyerId !== user.id) return notFound("Cart line not found");
  if (parsed.data.quantity > item.product.stock) {
    return badRequest(`Only ${item.product.stock} unit(s) in stock.`);
  }
  await prisma.cartItem.update({ where: { id }, data: { quantity: parsed.data.quantity } });
  return json({ success: true });
}

/** DELETE /api/cart?id=… — remove a cart line. */
export async function DELETE(req: NextRequest) {
  const { user, response } = await requireUser(["BUYER"]);
  if (!user) return response!;
  const id = Number(req.nextUrl.searchParams.get("id"));
  if (!id) return badRequest("Cart line id is required.");
  const item = await prisma.cartItem.findUnique({ where: { id } });
  if (!item || item.buyerId !== user.id) return notFound("Cart line not found");
  await prisma.cartItem.delete({ where: { id } });
  return json({ success: true });
}
