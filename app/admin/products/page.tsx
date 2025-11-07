import { db } from '@/db';
import { ProductsList } from '@/components/admin/ProductsList';
import { ProductForm } from '@/components/admin/ProductForm';
import { getServerI18n } from '@/lib/i18n/server';

export const dynamic = 'force-dynamic';

export default async function AdminProductsPage() {
  const { t } = await getServerI18n();
  const allProducts = await db.query.products.findMany({
    with: {
      category: true,
      images: true,
    },
    orderBy: (products, { desc }) => [desc(products.createdAt)],
  });

  const categories = await db.query.categories.findMany({
    orderBy: (categories, { asc }) => [asc(categories.title)],
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-4xl font-bold">{t('admin.dashboardProducts')}</h1>
        <ProductForm categories={categories} />
      </div>
      <ProductsList products={allProducts} categories={categories} />
    </div>
  );
}

