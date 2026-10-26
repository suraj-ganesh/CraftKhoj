import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { json, requireUser, badRequest, notFound } from "@/lib/api";
import { refreshRiskScore } from "@/lib/algorithms";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const product = await prisma.product.findUnique({
    where: { id: Number(id) },
    include: {
      artisan: {
        include: {
          user: { select: { fullName: true } },
        },
      },
      category: true,
      images: true,
      materials: { include: { material: true } },
      provenanceRecord: { include: { events: { orderBy: { eventTime: "asc" } } } },
      reviews: { include: { buyer: { select: { fullName: true } } }, orderBy: { createdAt: "desc" } },
    },
  });
  if (!product) return notFound("Product not found");
  return json({ product });
}

const updateSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  description: z.string().max(3000).optional(),
  price: z.coerce.number().positive().optional(),
  stock: z.coerce.number().int().min(0).optional(),
  categoryId: z.coerce.number().int().positive().optional(),
  origin: z.string().optional(),
  productionMethod: z.string().optional(),
  productionDate: z.string().optional(),
  processNotes: z.string().max(3000).optional(),
  processImageUrl: z.string().optional(),
  tags: z.string().optional(),
  status: z.enum(["HIDDEN", "APPROVED"]).optional(),
  image: z.string().optional(),
  materials: z.array(z.string()).optional(),
});

export async function PUT(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const productId = Number(id);
  const { user, response } = await requireUser(); // artisan owner or admin
  if (!user) return response!;

  const product = await prisma.product.findUnique({ where: { id: productId }, include: { provenanceRecord: true, artisan: true } });
  if (!product) return notFound("Product not found");

  const isAdmin = user.role === "ADMIN";
  const isOwner = user.role === "ARTISAN" && product.artisan.userId === user.id;
  if (!isAdmin && !isOwner) return badRequest("You cannot edit this product.");

  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return badRequest("Invalid product data.");
  const d = parsed.data;

  const provenanceTouched =
    (d.productionMethod !== undefined && d.productionMethod !== (product.provenanceRecord?.productionMethod ?? "")) ||
    (d.productionDate !== undefined && new Date(d.productionDate).getTime() !== (product.provenanceRecord?.productionDate?.getTime() ?? NaN)) ||
    (d.processNotes !== undefined && d.processNotes !== (product.provenanceRecord?.processNotes ?? "")) ||
    (d.processImageUrl !== undefined && d.processImageUrl !== (product.provenanceRecord?.processImageUrl ?? ""));

  await prisma.product.update({
    where: { id: productId },
    data: {
      ...(d.title !== undefined && { title: d.title }),
      ...(d.description !== undefined && { description: d.description }),
      ...(d.price !== undefined && { price: d.price }),
      ...(d.stock !== undefined && { stock: d.stock }),
      ...(d.categoryId !== undefined && { categoryId: d.categoryId }),
      ...(d.origin !== undefined && { origin: d.origin }),
      ...(d.productionMethod !== undefined && { productionMethod: d.productionMethod }),
      ...(d.productionDate !== undefined && { productionDate: new Date(d.productionDate) }),
      ...(d.processImageUrl !== undefined && { processImageUrl: d.processImageUrl }),
      ...(d.tags !== undefined && { tags: d.tags }),
      ...(d.status !== undefined && (isAdmin || product.status !== "APPROVED") && { status: d.status }),
      ...(d.image !== undefined && { images: { deleteMany: {}, create: { imageUrl: d.image, isPrimary: true } } }),
      ...(d.materials !== undefined && { materials: { deleteMany: {}, create: [] } }),
    },
  });

  if (d.materials) {
    await prisma.productMaterial.deleteMany({ where: { productId } });
    for (const name of d.materials.filter(Boolean)) {
      const material = await prisma.material.upsert({ where: { name }, create: { name }, update: {} });
      await prisma.productMaterial.create({ data: { productId, materialId: material.id } });
    }
  }

  if (provenanceTouched && product.provenanceRecord) {
    const record = await prisma.provenanceRecord.update({
      where: { id: product.provenanceRecord.id },
      data: {
        ...(d.productionMethod !== undefined && { productionMethod: d.productionMethod }),
        ...(d.productionDate !== undefined && { productionDate: new Date(d.productionDate) }),
        ...(d.processNotes !== undefined && { processNotes: d.processNotes }),
        ...(d.processImageUrl !== undefined && { processImageUrl: d.processImageUrl }),
        verificationStatus: "PENDING",
      },
    });
    await prisma.provenanceEvent.create({
      data: {
        provenanceRecordId: record.id,
        eventType: "UPDATED",
        description: "Provenance details updated by the artisan — re-verification required.",
        performedById: user.id,
      },
    });
    if (product.status === "APPROVED") {
      await prisma.product.update({ where: { id: productId }, data: { status: "PENDING" } });
    }
  }

  await refreshRiskScore(productId);
  return json({ success: true });
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const productId = Number(id);
  const { user, response } = await requireUser(["ARTISAN", "ADMIN"]);
  if (!user) return response!;

  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { artisan: true, orderItems: { take: 1 } },
  });
  if (!product) return notFound("Product not found");
  if (user.role === "ARTISAN" && product.artisan.userId !== user.id) return badRequest("Not your product.");
  if (product.orderItems.length > 0) {
    await prisma.product.update({ where: { id: productId }, data: { status: "HIDDEN" } });
    return json({ success: true, hidden: true });
  }
  await prisma.product.delete({ where: { id: productId } });
  return json({ success: true });
}
