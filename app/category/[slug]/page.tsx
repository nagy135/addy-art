import { notFound } from 'next/navigation';
import { db } from '@/db';
import { categories, products } from '@/db/schema';
import { eq, or } from 'drizzle-orm';
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

  // Fetch products from the selected categories
  const allProducts = await db.query.products.findMany({
    where: productCategoryIds.length === 1
      ? eq(products.categoryId, productCategoryIds[0])
      : or(...productCategoryIds.map((id) => eq(products.categoryId, id))),
    orderBy: (products, { desc }) => [desc(products.createdAt)],
  });

  return (
    <>
      <Banner />
      <CategoriesNav categories={allCategories} />
      <div className="container mx-auto px-4 py-4">
        <h2 className="mb-0 text-3xl font-bold">{category.title}</h2>
        <SubcategorySelector subcategories={subcategories} currentCategorySlug={slug} />
        <ProductsGrid products={allProducts} />
      </div>
    </>
  );
}

