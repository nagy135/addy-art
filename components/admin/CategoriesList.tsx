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
import { useI18n } from '@/components/I18nProvider';

type Category = {
  id: number;
  title: string;
  slug: string;
  parentId?: number | null;
};

export function CategoriesList({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const { t } = useI18n();
  const [deleting, setDeleting] = useState<number | null>(null);

  const handleDelete = async (id: number) => {
    if (!confirm(t('messages.deleteCategoryConfirm'))) {
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
      alert(t('messages.deleteCategoryFailed'));
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('tables.name')}</TableHead>
            <TableHead>{t('tables.slug')}</TableHead>
            <TableHead>{t('tables.parent')}</TableHead>
            <TableHead className="text-right">{t('tables.actions')}</TableHead>
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
                    {deleting === category.id ? t('tables.deleting') : t('tables.delete')}
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {categories.length === 0 && (
        <p className="mt-4 text-center text-muted-foreground">{t('messages.noCategories')}</p>
      )}
    </div>
  );
}

