import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { db } from '@/db';
import { products, productImages } from '@/db/schema';
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
  })
  .refine((data) => data.thumbnailIndex < data.images.length, {
    message: 'thumbnailIndex out of range',
    path: ['thumbnailIndex'],
  });

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validated = productSchema.parse(body);

    const thumbnailPath = validated.images[validated.thumbnailIndex];

    // Compute default sortOrder: place at end of its category
    const lastInCategory = await db.query.products.findFirst({
      where: (products, { eq }) => eq(products.categoryId, validated.categoryId),
      orderBy: (products, { desc }) => [desc(products.sortOrder)],
    });
    const nextOrder = (lastInCategory?.sortOrder ?? 0) + 1;

    const [inserted] = await db
      .insert(products)
      .values({
        title: validated.title,
        slug: generateSlug(validated.title),
        descriptionMd: validated.descriptionMd,
        priceCents: validated.priceCents,
        categoryId: validated.categoryId,
        imagePath: thumbnailPath, // keep for backward compatibility
        sortOrder: nextOrder,
        soldAt: validated.sold ? new Date() : null,
      })
      .returning({ id: products.id });

    const productId = inserted.id;

    await db.insert(productImages).values(
      validated.images.map((path, index) => ({
        productId,
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
    console.error('Product creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
}

export async function GET() {
  const allProducts = await db.query.products.findMany({
    with: {
      category: true,
    },
    orderBy: (products, { desc }) => [desc(products.createdAt)],
  });
  return NextResponse.json(allProducts);
}

