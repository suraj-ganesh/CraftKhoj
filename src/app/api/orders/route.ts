import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser, badRequest, json, unauthorized } from "@/lib/api";

const schema = z.object({
  paymentMethod: z.enum(["CASH_ON_DELIVERY", "SIMULATED"]).default("CASH_ON_DELIVERY"),
  shippingName: z.string().min(2).max(100),
  shippingPhone: z.string().min(6).max(20),
  shippingAddress: z.string().min(5).max(500),
});

export async function GET() {
  const { user, response } = await requireUser();
  if (!user) return unauthorized();

  const orders =
    user.role === "ADMIN"
      ? await prisma.order.findMany({
          include: { buyer: true, orderItems: { include: { product: { include: { images: true } } } } },
          orderBy: { createdAt: "desc" },
        })
      : await prisma.order.findMany({
          where: user.role === "ARTISAN" ? { orderItems: { some: { product: { artisan: { userId: user.id } } } } } : { buyerId: user.id },
          include: { buyer: true, orderItems: { include: { product: { include: { images: true } } } } },
          orderBy: { createdAt: "desc" },
        });
  return json({ orders });
}

/** POST /api/orders — place an order; reduces stock inside a transaction. */
export async function POST(req: NextRequest) {
  const { user, response } = await requireUser(["BUYER"]);
  if (!user) return response!;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return badRequest("Shipping details are required to place an order.");
  const s = parsed.data;

  const cart = await prisma.cartItem.findMany({
    where: { buyerId: user.id },
    include: { product: true },
  });
  if (cart.length === 0) return badRequest("Your cart is empty.");

  const outOfStock = cart.find((item) => item.quantity > item.product.stock || item.product.status !== "APPROVED");
  if (outOfStock) return badRequest(`"${outOfStock.product.title}" is no longer available in the requested quantity. Please review your cart.`);

  const total = cart.reduce((sum, item) => sum + Number(item.product.price) * item.quantity, 0);

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        buyerId: user!.id,
        totalAmount: total,
        paymentMethod: s.paymentMethod,
        paymentStatus: s.paymentMethod === "SIMULATED" ? "PAID" : "PENDING",
        shippingName: s.shippingName,
        shippingPhone: s.shippingPhone,
        shippingAddress: s.shippingAddress,
        orderItems: {
          create: cart.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.product.price,
          })),
        },
      },
      include: { orderItems: true },
    });

    for (const item of created.orderItems) {
      const updated = await tx.product.updateMany({
        where: { id: item.productId, stock: { gte: item.quantity } },
        data: { stock: { decrement: item.quantity } },
      });
      if (updated.count !== 1) {
        throw new Error("STOCK_CONFLICT");
      }
    }

    await tx.cartItem.deleteMany({ where: { buyerId: user!.id } });
    return created;
  });

  return json({ order: { id: order.id, totalAmount: order.totalAmount, orderStatus: order.orderStatus } }, { status: 201 });
}
