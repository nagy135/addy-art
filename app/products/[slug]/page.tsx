import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { db } from '@/db';
import { products } from '@/db/schema';
import { eq } from 'drizzle-orm';
import ReactMarkdown from 'react-markdown';
import { ArrowLeft } from 'lucide-react';
import { formatPrice } from '@/lib/format-price';
import { ProductOrderDialog } from '@/components/ProductOrderDialog';
import { Banner } from '@/components/Banner';
import { CategoriesNav } from '@/components/CategoriesNav';
import { Button } from '@/components/ui/button';
import { getServerI18n } from '@/lib/i18n/server';

export const dynamic = 'force-dynamic';

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { t } = await getServerI18n();
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
      <CategoriesNav categories={categories} activeCategorySlug={product.category?.slug} />
      <div className="container mx-auto max-w-4xl px-4 py-8">
        {product.category && (
          <Link href={`/category/${product.category.slug}`} className="mb-6 inline-block">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('common.back')}
            </Button>
          </Link>
        )}
        <div className="grid gap-8 md:grid-cols-2">
          <div className="relative aspect-square w-full overflow-hidden rounded-lg">
            <Image
              src={product.imagePath}
              alt={product.title}
              fill
              className="object-contain"
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
