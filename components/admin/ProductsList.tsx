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

type Product = {
  id: number;
  title: string;
  slug: string;
  descriptionMd: string;
  priceCents: number;
  imagePath: string;
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
  const [deleting, setDeleting] = useState<number | null>(null);

  const handleDelete = async (id: number) => {
    if (!confirm('Ste si istí, že chcete odstrániť tento produkt?')) {
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
      alert('Nepodarilo sa odstrániť produkt. Skúste znova.');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Obrázok</TableHead>
            <TableHead>Názov</TableHead>
            <TableHead>Kategória</TableHead>
            <TableHead>Cena</TableHead>
            <TableHead className="text-right">Akcie</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <TableRow key={product.id}>
              <TableCell>
                <div className="relative h-16 w-16">
                  <Image
                    src={product.imagePath}
                    alt={product.title}
                    fill
                    className="object-cover rounded"
                  />
                </div>
              </TableCell>
              <TableCell className="font-medium capitalize">{product.title}</TableCell>
              <TableCell>{product.category.title}</TableCell>
              <TableCell>{formatPrice(product.priceCents)}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <ProductForm
                    productId={product.id}
                    initialData={{
                      title: product.title,
                      descriptionMd: product.descriptionMd,
                      priceCents: product.priceCents,
                      categoryId: product.category.id,
                      imagePath: product.imagePath,
                    }}
                    categories={categories}
                  />
                  <Button
                    variant="destructive"
                    onClick={() => handleDelete(product.id)}
                    disabled={deleting === product.id}
                  >
                    {deleting === product.id ? 'Odstraňuje sa...' : 'Odstrániť'}
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {products.length === 0 && (
        <p className="mt-4 text-center text-muted-foreground">Zatiaľ žiadne produkty.</p>
      )}
    </div>
  );
}

