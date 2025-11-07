'use client';

import Link from 'next/link';
import { LayoutGrid } from '@/components/ui/layout-grid';
import { formatPrice } from '@/lib/format-price';
import { useState, useEffect } from 'react';
import { ProductOrderDialog } from '@/components/ProductOrderDialog';

type Product = {
  id: number;
  title: string;
  slug: string;
  descriptionMd: string;
  priceCents: number;
  imagePath: string;
  images?: { imagePath: string; isThumbnail: boolean }[];
};

const ProductCard = ({ product }: { product: Product }) => {
  return (
    <div>
      <p className="font-bold md:text-4xl text-xl text-white capitalize">{product.title}</p>
      <p className="font-normal text-base text-white mt-2">{formatPrice(product.priceCents)}</p>
      <div className="flex gap-3 items-center mt-4">
        <Link
          href={`/products/${product.slug}`}
          className="inline-block px-4 py-2 bg-white text-black rounded-md hover:bg-gray-200 transition-colors"
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          Detail produktu
        </Link>

        <ProductOrderDialog productId={product.id} productTitle={product.title} />
      </div>
    </div>
  );
};

export function ProductsGrid({ products }: { products: Product[] }) {
  const [imageAspectRatios, setImageAspectRatios] = useState<Record<number, boolean>>({});

  useEffect(() => {
    const loadImageDimensions = async () => {
      const ratios: Record<number, boolean> = {};

      await Promise.all(
        products.map((product) => {
          return new Promise<void>((resolve) => {
            const img = new Image();
            img.onload = () => {
              // Check if image is wider than it is tall (landscape)
              ratios[product.id] = img.width > img.height;
              resolve();
            };
            img.onerror = () => {
              // Default to false (not wide) if image fails to load
              ratios[product.id] = false;
              resolve();
            };
            const thumb = product.images?.find((i) => i.isThumbnail)?.imagePath || product.imagePath;
            img.src = thumb;
          });
        })
      );

      setImageAspectRatios(ratios);
    };

    if (products.length > 0) {
      loadImageDimensions();
    }
  }, [products]);

  if (products.length === 0) {
    return (
      <p className="text-center text-muted-foreground">Zatiaľ žiadne produkty v tejto kategórii.</p>
    );
  }

  const cards = products.map((product) => ({
    id: product.id,
    content: <ProductCard product={product} />,
    className: imageAspectRatios[product.id] ? 'md:col-span-2' : 'col-span-1',
    thumbnail: product.images?.find((i) => i.isThumbnail)?.imagePath || product.imagePath,
  }));


  return (
    <div className="w-full py-0">
      <LayoutGrid cards={cards} />
    </div>
  );
}
