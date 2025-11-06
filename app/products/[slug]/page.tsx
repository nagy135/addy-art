import { notFound } from 'next/navigation';
import Image from 'next/image';
import { db } from '@/db';
import { products } from '@/db/schema';
import { eq } from 'drizzle-orm';
import ReactMarkdown from 'react-markdown';
import { formatPrice } from '@/lib/format-price';
import { ProductOrderDialog } from '@/components/ProductOrderDialog';
import { Banner } from '@/components/Banner';
import { CategoriesNav } from '@/components/CategoriesNav';

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await db.query.products.findFirst({
    where: eq(products.slug, slug),
    with: {
      category: true,
    },
  });

  if (!product) {
    notFound();
  }

  const categories = await db.query.categories.findMany({
    orderBy: (categories, { asc }) => [asc(categories.title)],
  });

  return (
    <>
      <Banner />
      <CategoriesNav categories={categories} />
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <div className="grid gap-8 md:grid-cols-2">
          <div className="relative aspect-square w-full overflow-hidden rounded-lg">
            <Image
              src={product.imagePath}
              alt={product.title}
              fill
              className="object-cover"
            />
          </div>
          <div>
            <h1 className="mb-4 text-4xl font-bold">{product.title}</h1>
            <p className="mb-4 text-2xl font-semibold">{formatPrice(product.priceCents)}</p>
            <div className="prose mb-6 max-w-none">
              <ReactMarkdown>{product.descriptionMd}</ReactMarkdown>
            </div>
            <ProductOrderDialog productId={product.id} productTitle={product.title} />
          </div>
        </div>
      </div>
    </>
  );
}
