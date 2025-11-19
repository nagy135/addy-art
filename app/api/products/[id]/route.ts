import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { db } from '@/db';
import { products, productImages } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { generateSlug } from '@/lib/generate-slug';

const productSchema = z
  .object({
    title: z.string().min(1),
    descriptionMd: z.string().min(1),
    priceCents: z.number().min(1),
    categoryId: z.number().min(1),
    images: z.array(z.string().min(1)).min(1),
    thumbnailIndex: z.number().int().min(0),
    sold: z.boolean().optional(),
    isRecreatable: z.boolean().optional(),
  })
  .refine((data) => data.thumbnailIndex < data.images.length, {
    message: 'thumbnailIndex out of range',
    path: ['thumbnailIndex'],
  });

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const validated = productSchema.parse(body);

    const thumbnailPath = validated.images[validated.thumbnailIndex];

    // Determine sort order behavior when category changes
    const existing = await db.query.products.findFirst({
      where: (products, { eq }) => eq(products.id, parseInt(id)),
    });

    let sortOrderToSet: number | null = existing?.sortOrder ?? null;
    if (existing && existing.categoryId !== validated.categoryId) {
      const lastInNewCategory = await db.query.products.findFirst({
        where: (products, { eq }) => eq(products.categoryId, validated.categoryId),
        orderBy: (products, { desc }) => [desc(products.sortOrder)],
      });
      sortOrderToSet = (lastInNewCategory?.sortOrder ?? 0) + 1;
    }

    await db
      .update(products)
      .set({
        title: validated.title,
        slug: generateSlug(validated.title),
        descriptionMd: validated.descriptionMd,
        priceCents: validated.priceCents,
        categoryId: validated.categoryId,
        imagePath: thumbnailPath,
        sortOrder: sortOrderToSet ?? 0,
        soldAt: validated.sold ? new Date() : null,
        isRecreatable: validated.isRecreatable ?? false,
      })
      .where(eq(products.id, parseInt(id)));

    // Replace product images
    await db.delete(productImages).where(eq(productImages.productId, parseInt(id)));
    await db.insert(productImages).values(
      validated.images.map((path, index) => ({
        productId: parseInt(id),
        imagePath: path,
        isThumbnail: index === validated.thumbnailIndex,
      }))
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.issues },
        { status: 400 }
      );
    }
    console.error('Product update error:', error);
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    await db.delete(products).where(eq(products.id, parseInt(id)));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Product deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    );
  }
}

