'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { CategoryForm } from './CategoryForm';

type Category = {
  id: number;
  title: string;
  slug: string;
  parentId?: number | null;
};

export function CategoriesList({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState<number | null>(null);

  const handleDelete = async (id: number) => {
    if (!confirm('Ste si istí, že chcete odstrániť túto kategóriu?')) {
      return;
    }

    setDeleting(id);
    try {
      const response = await fetch(`/api/categories/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete category');
      }

      router.refresh();
    } catch (_error) {
      alert('Nepodarilo sa odstrániť kategóriu. Skúste znova.');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Názov</TableHead>
            <TableHead>Slug</TableHead>
            <TableHead>Materská</TableHead>
            <TableHead className="text-right">Akcie</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {categories.map((category) => (
            <TableRow key={category.id}>
              <TableCell className="font-medium">{category.title}</TableCell>
              <TableCell>{category.slug}</TableCell>
              <TableCell>
                {categories.find((c) => c.id === (category.parentId ?? -1))?.title ?? '—'}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <CategoryForm
                    categoryId={category.id}
                    initialData={{ title: category.title, parentId: category.parentId ?? null }}
                    allCategories={categories.map((c) => ({ ...c, parentId: c.parentId ?? null }))}
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(category.id)}
                    disabled={deleting === category.id}
                  >
                    {deleting === category.id ? 'Odstraňuje sa...' : 'Odstrániť'}
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {categories.length === 0 && (
        <p className="mt-4 text-center text-muted-foreground">Zatiaľ žiadne kategórie.</p>
      )}
    </div>
  );
}

