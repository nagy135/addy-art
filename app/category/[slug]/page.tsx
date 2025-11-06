import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { db } from '@/db';
import { categories, products } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { formatPrice } from '@/lib/format-price';
import { Banner } from '@/components/Banner';
import { CategoriesNav } from '@/components/CategoriesNav';

export const dynamic = 'force-dynamic';

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = await db.query.categories.findFirst({
    where: eq(categories.slug, slug),
    with: {
      products: {
        orderBy: (products, { desc }) => [desc(products.createdAt)],
      },
    },
  });

  if (!category) {
    notFound();
  }

  const allCategories = await db.query.categories.findMany({
    orderBy: (categories, { asc }) => [asc(categories.title)],
  });

  return (
    <>
      <Banner />
      <CategoriesNav categories={allCategories} />
      <div className="container mx-auto px-4 py-8">
        <h2 className="mb-6 text-3xl font-bold">{category.title}</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {category.products.map((product) => (
            <Link key={product.id} href={`/products/${product.slug}`}>
              <Card className="h-full transition-shadow hover:shadow-lg">
                <div className="relative h-64 w-full overflow-hidden">
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
                  <p className="line-clamp-2 text-sm text-muted-foreground">
                    {product.descriptionMd.substring(0, 100)}...
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
        {category.products.length === 0 && (
          <p className="text-center text-muted-foreground">No products in this category yet.</p>
        )}
      </div>
    </>
  );
}

