'use client';

import Image from 'next/image';
import { useState } from 'react';

type ProductGalleryProps = {
  images: string[];
  initialIndex?: number;
  alt: string;
};

export function ProductGallery({ images, initialIndex = 0, alt }: ProductGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number>(initialIndex);
  const selected = images[selectedIndex] ?? images[0];

  return (
    <div>
      <div className="relative aspect-square w-full overflow-hidden rounded-lg">
        <Image src={selected} alt={alt} fill className="object-contain" />
      </div>
      {images.length > 1 && (
        <div className="mt-4 grid grid-cols-5 gap-2">
          {images.map((src, idx) => (
            <button
              key={`${src}-${idx}`}
              type="button"
              onClick={() => setSelectedIndex(idx)}
              className={`relative h-16 w-full overflow-hidden rounded border ${
                idx === selectedIndex ? 'border-black' : 'border-transparent'
              }`}
            >
              <Image src={src} alt={`${alt} ${idx + 1}`} fill className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}


