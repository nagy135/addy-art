import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { db } from '@/db';
import { categories, products } from '@/db/schema';
import { eq, or } from 'drizzle-orm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatPrice } from '@/lib/format-price';
import { Banner } from '@/components/Banner';
import { CategoriesNav } from '@/components/CategoriesNav';
import { SubcategorySelector } from '@/components/SubcategorySelector';
import ReactMarkdown from 'react-markdown';

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
      <div className="container mx-auto px-4 py-8">
        <h2 className="mb-6 text-3xl font-bold">{category.title}</h2>
        <SubcategorySelector subcategories={subcategories} currentCategorySlug={slug} />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {allProducts.map((product) => (
            <Link key={product.id} href={`/products/${product.slug}`}>
              <Card className="h-full transition-shadow hover:shadow-lg pt-0">
                <div className="relative h-64 w-full overflow-hidden rounded-lg">
                  <Image
                    src={product.imagePath}
                    alt={product.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <CardHeader>
                  <CardTitle>{product.title}</CardTitle>
                  <CardDescription>{formatPrice(product.priceCents)}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="line-clamp-3 text-sm text-muted-foreground prose prose-sm max-w-none dark:prose-invert">
                    <ReactMarkdown
                      components={{
                        p: ({ children }) => <p className="mb-0">{children}</p>,
                        a: ({ ...props }) => (
                          <span className="text-primary underline" {...props} />
                        ),
                        h1: ({ children }) => <h1 className="text-lg font-bold mb-0">{children}</h1>,
                        h2: ({ children }) => <h2 className="text-base font-bold mb-0">{children}</h2>,
                        h3: ({ children }) => <h3 className="text-sm font-bold mb-0">{children}</h3>,
                        ul: ({ children }) => <ul className="list-disc list-inside mb-0">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal list-inside mb-0">{children}</ol>,
                        li: ({ children }) => <li className="mb-0">{children}</li>,
                        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                        em: ({ children }) => <em className="italic">{children}</em>,
                        code: ({ children }) => <code className="bg-muted px-1 py-0.5 rounded text-xs">{children}</code>,
                        blockquote: ({ children }) => <blockquote className="border-l-4 border-muted pl-2 italic mb-0">{children}</blockquote>,
                      }}
                    >
                      {product.descriptionMd}
                    </ReactMarkdown>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
        {allProducts.length === 0 && (
          <p className="text-center text-muted-foreground">No products in this category yet.</p>
        )}
      </div>
    </>
  );
}

