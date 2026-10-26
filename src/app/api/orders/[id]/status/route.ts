import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser, badRequest, notFound, json } from "@/lib/api";

const schema = z.object({ orderStatus: z.enum(["PLACED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"]) });

type Ctx = { params: Promise<{ id: string }> };

/** PUT /api/orders/:id/status — buyer cancels; artisan/admin advance status. */
export async function PUT(req: NextRequest, ctx: Ctx) {
  const { user, response } = await requireUser();
  if (!user) return notFound();
  const { id } = await ctx.params;
  const orderId = Number(id);

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return badRequest("Invalid order status.");

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      orderItems: { include: { product: { include: { artisan: { include: { user: { select: { id: true, fullName: true } } } } } } } },
    },
  });
  if (!order) return notFound("Order not found");

  const isBuyerOwner = order.buyerId === user.id;
  const isArtisanOnOrder = user.role === "ARTISAN" && order.orderItems.some((oi) => oi.product.artisan.userId === user.id);
  const isAdmin = user.role === "ADMIN";

  if (isBuyerOwner && !isArtisanOnOrder && !isAdmin) {
    // buyers may only cancel while order is still PLACED
    if (parsed.data.orderStatus !== "CANCELLED") return badRequest("As a buyer you can only cancel an order.");
    if (order.orderStatus !== "PLACED") return badRequest("An order can only be cancelled before processing begins.");
  } else if (!isArtisanOnOrder && !isAdmin) {
    return badRequest("You cannot update this order.");
  }

  if (parsed.data.orderStatus === "CANCELLED" && order.orderStatus !== "PLACED" && !isAdmin) {
    return badRequest("This order has already started processing.");
  }

  const updated = await prisma.$transaction(async (tx) => {
    // restore stock when a pending order is cancelled
    if (parsed.data.orderStatus === "CANCELLED" && order.orderStatus !== "CANCELLED") {
      for (const item of order.orderItems) {
        await tx.product.update({ where: { id: item.productId }, data: { stock: { increment: item.quantity } } });
      }
    }
    const paymentStatus =
      parsed.data.orderStatus === "DELIVERED" && order.paymentMethod === "CASH_ON_DELIVERY"
        ? "PAID"
        : undefined;
    return tx.order.update({
      where: { id: orderId },
      data: { orderStatus: parsed.data.orderStatus, ...(paymentStatus && { paymentStatus }) },
    });
  });

  return json({ order: { id: updated.id, orderStatus: updated.orderStatus, paymentStatus: updated.paymentStatus } });
}
