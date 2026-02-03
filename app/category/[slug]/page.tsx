import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { db } from '@/db';
import { categories, products, productCategories } from '@/db/schema';
import { eq, or, and, inArray, asc, desc } from 'drizzle-orm';
import { Banner } from '@/components/Banner';
import { CategoriesNav } from '@/components/CategoriesNav';
import { SubcategorySelector } from '@/components/SubcategorySelector';
import { ProductsGrid } from './ProductsGrid';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ subcategory?: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { subcategory } = await searchParams;

  const category = await db.query.categories.findFirst({
    where: eq(categories.slug, slug),
  });

  if (!category) {
    return {
      title: 'Category Not Found',
    };
  }

  let title = `${category.title} Products - Shop at Addy Art`;
  let description = `Browse our collection of ${category.title.toLowerCase()} art pieces and handmade items.`;

  if (subcategory) {
    const subcategoryId = parseInt(subcategory);
    if (!isNaN(subcategoryId)) {
      const subcat = await db.query.categories.findFirst({
        where: eq(categories.id, subcategoryId),
      });
      if (subcat) {
        title = `${subcat.title} - ${category.title} - Addy Art Shop`;
        description = `Discover our ${subcat.title} collection within ${category.title.toLowerCase()}.`;
      }
    }
  }

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
  };
}

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

  // Fetch products from the selected categories
  // Products with multiple categories will appear in all their assigned categories
  // Use raw query builder for inArray to ensure it works correctly
  const allProducts = productIds.length > 0
    ? await db
      .select()
      .from(products)
      .where(inArray(products.id, productIds))
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

  // Generate JSON-LD structured data for CollectionPage
  const baseUrlSchema = process.env.NEXT_PUBLIC_BASE_URL || 'https://addyart.eu';
  const collectionSchema = {
    '@context': 'https://schema.org/',
    '@type': 'CollectionPage',
    name: category.title,
    description: `Browse our ${category.title.toLowerCase()} collection`,
    url: `${baseUrlSchema}/category/${category.slug}`,
    numberOfItems: productsWithImages.length,
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: productsWithImages.slice(0, 10).map((product, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: product.title,
        url: `${baseUrlSchema}/products/${product.slug}`,
      })),
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />
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

