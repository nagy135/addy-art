import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { db } from '@/db';
import { products } from '@/db/schema';
import { z } from 'zod';
import { generateSlug } from '@/lib/generate-slug';

const productSchema = z.object({
  title: z.string().min(1),
  descriptionMd: z.string().min(1),
  priceCents: z.number().min(1),
  categoryId: z.number().min(1),
  imagePath: z.string().min(1),
});

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validated = productSchema.parse(body);

    await db.insert(products).values({
      title: validated.title,
      slug: generateSlug(validated.title),
      descriptionMd: validated.descriptionMd,
      priceCents: validated.priceCents,
      categoryId: validated.categoryId,
      imagePath: validated.imagePath,
    });

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

