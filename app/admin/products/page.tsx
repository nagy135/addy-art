import { db } from '@/db';
import { ProductsList } from '@/components/admin/ProductsList';
import { ProductForm } from '@/components/admin/ProductForm';

export const dynamic = 'force-dynamic';

export default async function AdminProductsPage() {
  const allProducts = await db.query.products.findMany({
    with: {
      category: true,
    },
    orderBy: (products, { desc }) => [desc(products.createdAt)],
  });

  const categories = await db.query.categories.findMany({
    orderBy: (categories, { asc }) => [asc(categories.title)],
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-4xl font-bold">Products</h1>
        <ProductForm categories={categories} />
      </div>
      <ProductsList products={allProducts} categories={categories} />
    </div>
  );
}

