import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
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
import { ProductGallery } from '@/components/ProductGallery';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await db.query.products.findFirst({
    where: eq(products.slug, slug),
    with: {
      images: true,
    },
  });

  if (!product) {
    return {
      title: 'Product Not Found',
    };
  }

  // Extract first 160 characters from markdown for description
  const plainText = product.descriptionMd
    .replace(/[#*_`\[\]()]/g, '') // Remove markdown syntax
    .replace(/\n/g, ' ') // Replace newlines with spaces
    .trim();
  const description = plainText.substring(0, 160);

  // Get the main image
  const mainImage =
    product.images && product.images.length > 0
      ? product.images.find((img) => img.isThumbnail)?.imagePath || product.images[0].imagePath
      : product.imagePath;

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://addyart.eu';
  const imageUrl = mainImage.startsWith('http') ? mainImage : `${baseUrl}${mainImage}`;

  return {
    title: `${product.title} - Buy at Addy Art`,
    description,
    openGraph: {
      title: product.title,
      description,
      type: 'website',
      images: [
        {
          url: imageUrl,
          width: 800,
          height: 600,
          alt: product.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: product.title,
      description,
      images: [imageUrl],
    },
  };
}

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
      categories: {
        with: {
          category: true,
        },
      },
      images: true,
    },
  });

  if (!product) {
    notFound();
  }

  const categories = await db.query.categories.findMany({
    orderBy: (categories, { asc }) => [asc(categories.title)],
  });

  // Generate JSON-LD structured data for Product
  const baseUrlSchema = process.env.NEXT_PUBLIC_BASE_URL || 'https://addyart.eu';
  const productImage =
    product.images && product.images.length > 0
      ? product.images.find((img) => img.isThumbnail)?.imagePath || product.images[0].imagePath
      : product.imagePath;

  const imageUrlSchema = productImage.startsWith('http') ? productImage : `${baseUrlSchema}${productImage}`;

  const productSchema = {
    '@context': 'https://schema.org/',
    '@type': 'Product',
    name: product.title,
    image: imageUrlSchema,
    description: product.descriptionMd.replace(/[#*_`\[\]()]/g, '').trim().substring(0, 160),
    offers: {
      '@type': 'Offer',
      price: (product.priceCents / 100).toFixed(2),
      priceCurrency: 'EUR',
      url: `${baseUrlSchema}/products/${product.slug}`,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <Banner />
      <CategoriesNav
        categories={categories}
        activeCategorySlug={
          product.categories && product.categories.length > 0
            ? product.categories[0].category.slug
            : product.category?.slug
        }
      />
      <div className="container mx-auto max-w-4xl px-4 py-8">
        {(product.categories && product.categories.length > 0) || product.category ? (
          <Link
            href={`/category/${
              product.categories && product.categories.length > 0
                ? product.categories[0].category.slug
                : product.category?.slug
            }`}
            className="mb-6 inline-block"
          >
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('common.back')}
            </Button>
          </Link>
        ) : null}
        <div className="grid gap-8 md:grid-cols-2">
          <ProductGallery
            images={
              product.images && product.images.length > 0
                ? product.images.map((i) => i.imagePath)
                : [product.imagePath]
            }
            initialIndex={
              product.images && product.images.length > 0
                ? Math.max(0, product.images.findIndex((i) => i.isThumbnail))
                : 0
            }
            alt={product.title}
          />
          <div>
            <h1 className="mb-4 text-4xl font-bold">{product.title}</h1>
            <p className="mb-4 text-2xl font-semibold">
              {formatPrice(product.priceCents)}
            </p>
            <div className="prose mb-6 max-w-none">
              <ReactMarkdown>{product.descriptionMd}</ReactMarkdown>
            </div>
            {product.isRecreatable && (
              <p className="mb-4 text-sm text-muted-foreground">
                {t('common.recreatableMessage')}
              </p>
            )}
            <ProductOrderDialog productId={product.id} productTitle={product.title} />
          </div>
        </div>
      </div>
    </>
  );
}
