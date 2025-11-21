import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { db } from '@/db';
import { products, productCategories } from '@/db/schema';
import { eq, and, isNull, inArray } from 'drizzle-orm';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const categoryId = parseInt(id);

    if (isNaN(categoryId)) {
      return NextResponse.json({ error: 'Invalid category ID' }, { status: 400 });
    }

    // Get product IDs that belong to this category via pivot table
    const productCategoryRows = await db
      .select({ productId: productCategories.productId })
      .from(productCategories)
      .where(eq(productCategories.categoryId, categoryId));
    
    const productIds = productCategoryRows.map((row) => row.productId);
    
    if (productIds.length === 0) {
      return NextResponse.json([]);
    }

    const categoryProducts = await db.query.products.findMany({
      where: (products, { and, isNull, inArray: inArrayFn }) => 
        and(inArrayFn(products.id, productIds), isNull(products.soldAt)),
      with: { images: true },
      orderBy: (products, { asc, desc }) => [asc(products.sortOrder), desc(products.createdAt)],
    });

    return NextResponse.json(
      categoryProducts.map((p) => ({
        id: p.id,
        title: p.title,
        sortOrder: p.sortOrder,
        imagePath: p.images?.find((i) => i.isThumbnail)?.imagePath ?? p.imagePath,
      }))
    );
  } catch (error) {
    console.error('Get category products error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

const reorderSchema = z.object({
  orderedProductIds: z.array(z.number().int().positive()).min(1),
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
    const categoryId = parseInt(id);
    const body = await request.json();
    const { orderedProductIds } = reorderSchema.parse(body);

    // Get product IDs that belong to this category via pivot table
    const productCategoryRows = await db
      .select({ productId: productCategories.productId })
      .from(productCategories)
      .where(eq(productCategories.categoryId, categoryId));
    
    const productIds = productCategoryRows.map((row) => row.productId);
    
    if (productIds.length === 0) {
      return NextResponse.json({ error: 'No products in category' }, { status: 400 });
    }

    const existingProducts = await db
      .select({ id: products.id })
      .from(products)
      .where(and(inArray(products.id, productIds), isNull(products.soldAt)));
    const existingIds = new Set(existingProducts.map((p) => p.id));

    if (existingIds.size !== orderedProductIds.length) {
      return NextResponse.json({ error: 'Mismatched product set' }, { status: 400 });
    }
    for (const pid of orderedProductIds) {
      if (!existingIds.has(pid)) {
        return NextResponse.json({ error: 'Invalid product in order list' }, { status: 400 });
      }
    }

    // Update sortOrder for each product sequentially
    // SQLite updates are atomic, so no transaction wrapper needed
    let position = 1;
    for (const pid of orderedProductIds) {
      await db.update(products).set({ sortOrder: position }).where(eq(products.id, pid));
      position += 1;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.issues },
        { status: 400 }
      );
    }
    console.error('Reorder products error:', error);
    return NextResponse.json(
      { error: 'Failed to reorder products' },
      { status: 500 }
    );
  }
}


