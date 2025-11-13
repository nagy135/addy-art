import { db } from '@/db';
import { products } from '@/db/schema';
import { isNotNull } from 'drizzle-orm';
import { Banner } from '@/components/Banner';
import { CategoriesNav } from '@/components/CategoriesNav';
import { ProductsGrid } from '@/app/category/[slug]/ProductsGrid';
import { getServerI18n } from '@/lib/i18n/server';

export const dynamic = 'force-dynamic';

export default async function SoldPage() {
  const { t } = await getServerI18n();
  
  // Get all categories for navigation
  const allCategories = await db.query.categories.findMany({
    orderBy: (categories, { asc }) => [asc(categories.title)],
  });

  // Fetch all sold products
  const soldProducts = await db.query.products.findMany({
    where: (products, { isNotNull }) => isNotNull(products.soldAt),
    with: { images: true },
    orderBy: (products, { desc }) => [desc(products.soldAt!)],
  });

  return (
    <>
      <Banner />
      <CategoriesNav categories={allCategories} activeCategorySlug="sold" />
      <div className="container mx-auto px-4 py-4">
        <h2 id="category-title" className="mb-5 text-3xl font-bold uppercase">{t('common.sold')}</h2>
        <div id="products">
          <ProductsGrid products={soldProducts} categoryKey="sold" />
        </div>
      </div>
    </>
  );
}


