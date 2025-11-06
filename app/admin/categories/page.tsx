import { db } from '@/db';
import { CategoriesList } from '@/components/admin/CategoriesList';
import { CategoryForm } from '@/components/admin/CategoryForm';

export const dynamic = 'force-dynamic';

export default async function AdminCategoriesPage() {
  const allCategories = await db.query.categories.findMany({
    orderBy: (categories, { asc }) => [asc(categories.title)],
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-4xl font-bold">Categories</h1>
        <CategoryForm allCategories={allCategories} />
      </div>
      <CategoriesList categories={allCategories} />
    </div>
  );
}

