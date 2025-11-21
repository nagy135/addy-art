import { notFound } from 'next/navigation';
import { db } from '@/db';
import { categories, products, productCategories } from '@/db/schema';
import { eq, or, and, isNull, inArray, asc, desc } from 'drizzle-orm';
import { Banner } from '@/components/Banner';
import { CategoriesNav } from '@/components/CategoriesNav';
import { SubcategorySelector } from '@/components/SubcategorySelector';
import { ProductsGrid } from './ProductsGrid';

export const dynamic = 'force-dynamic';

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ subcategory?: string }>;
}) {
  const { slug } = await params;
  const { subcategory } = await searchParams;

  const category = await db.query.categories.findFirst({
    where: eq(categories.slug, slug),
  });

  if (!category) {
    notFound();
  }

  // Get subcategories (direct children)
  const subcategories = await db.query.categories.findMany({
    where: eq(categories.parentId, category.id),
    orderBy: (categories, { asc }) => [asc(categories.title)],
  });

  // Get all categories for navigation
  const allCategories = await db.query.categories.findMany({
    orderBy: (categories, { asc }) => [asc(categories.title)],
  });

  // Determine which products to show
  let productCategoryIds: number[] = [category.id];

  if (subcategory) {
    // If a specific subcategory is selected, show only products from that subcategory
    const subcategoryId = parseInt(subcategory);
    if (!isNaN(subcategoryId)) {
      productCategoryIds = [subcategoryId];
    }
  } else if (subcategories.length > 0) {
    // If no subcategory selected but there are subcategories, show products from category and all subcategories
    productCategoryIds = [category.id, ...subcategories.map((sub) => sub.id)];
  }

  // Get product IDs that belong to any of the selected categories via pivot table
  // This query correctly handles products that belong to multiple categories
  const productCategoryRows = await db
    .select({ productId: productCategories.productId })
    .from(productCategories)
    .where(inArray(productCategories.categoryId, productCategoryIds));

  const productIds = [...new Set(productCategoryRows.map((row) => row.productId))];

  // Fetch products from the selected categories (excluding sold items)
  // Products with multiple categories will appear in all their assigned categories
  // Use raw query builder for inArray to ensure it works correctly
  const allProducts = productIds.length > 0
    ? await db
      .select()
      .from(products)
      .where(and(inArray(products.id, productIds), isNull(products.soldAt)))
      .orderBy(asc(products.sortOrder), desc(products.createdAt))
    : [];

  // Fetch images separately for each product
  const productsWithImages = await Promise.all(
    allProducts.map(async (product) => {
      const productImagesList = await db.query.productImages.findMany({
        where: (images, { eq }) => eq(images.productId, product.id),
      });
      return {
        ...product,
        images: productImagesList,
      };
    })
  );

  return (
    <>
      <Banner />
      <CategoriesNav categories={allCategories} />
      <div className="container mx-auto px-4 py-4">
        <h2 id="category-title" className="mb-5 text-3xl font-bold">{category.title}</h2>
        <SubcategorySelector subcategories={subcategories} currentCategorySlug={slug} />
        <div id="products">
          <ProductsGrid products={productsWithImages} categoryKey={`${slug}-${subcategory || 'all'}`} />
        </div>
      </div>
    </>
  );
}

