'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ProductForm } from './ProductForm';
import { formatPrice } from '@/lib/format-price';
import { useI18n } from '@/components/I18nProvider';

type Product = {
  id: number;
  title: string;
  slug: string;
  descriptionMd: string;
  priceCents: number;
  imagePath: string;
  soldAt?: Date | null;
  images?: { id: number; imagePath: string; isThumbnail: boolean }[];
  category: {
    id: number;
    title: string;
    slug: string;
  };
};

type Category = {
  id: number;
  title: string;
  slug: string;
};

export function ProductsList({
  products,
  categories,
}: {
  products: Product[];
  categories: Category[];
}) {
  const router = useRouter();
  const { t } = useI18n();
  const [deleting, setDeleting] = useState<number | null>(null);

  const handleDelete = async (id: number) => {
    if (!confirm(t('messages.deleteProductConfirm'))) {
      return;
    }

    setDeleting(id);
    try {
      const response = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete product');
      }

      router.refresh();
    } catch (_error) {
      alert(t('messages.deleteProductFailed'));
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('tables.image')}</TableHead>
            <TableHead>{t('tables.name')}</TableHead>
            <TableHead>{t('forms.category')}</TableHead>
            <TableHead>{t('tables.price')}</TableHead>
            <TableHead>{t('forms.sold')}</TableHead>
            <TableHead className="text-right">{t('tables.actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <TableRow key={product.id}>
              <TableCell>
                <div className="relative h-16 w-16">
                  <Image
                    src={
                      (product.images && product.images.find((i) => i.isThumbnail)?.imagePath) ||
                      product.imagePath
                    }
                    alt={product.title}
                    fill
                    className="object-cover rounded"
                  />
                </div>
              </TableCell>
              <TableCell className="font-medium capitalize">{product.title}</TableCell>
              <TableCell>{product.category.title}</TableCell>
              <TableCell>{formatPrice(product.priceCents)}</TableCell>
              <TableCell>{product.soldAt ? '✓' : ''}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <ProductForm
                    productId={product.id}
                    initialData={{
                      title: product.title,
                      descriptionMd: product.descriptionMd,
                      priceCents: product.priceCents,
                      categoryId: product.category.id,
                      images: product.images?.map((i) => i.imagePath) || [product.imagePath],
                      thumbnailIndex:
                        product.images?.findIndex((i) => i.isThumbnail) ?? 0,
                      sold: !!product.soldAt,
                    }}
                    categories={categories}
                  />
                  <Button
                    variant="destructive"
                    onClick={() => handleDelete(product.id)}
                    disabled={deleting === product.id}
                  >
                    {deleting === product.id ? t('tables.deleting') : t('tables.delete')}
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {products.length === 0 && (
        <p className="mt-4 text-center text-muted-foreground">{t('messages.noProducts')}</p>
      )}
    </div>
  );
}

