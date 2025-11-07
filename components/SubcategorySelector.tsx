'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/components/I18nProvider';

type Category = {
  id: number;
  title: string;
  slug: string;
};

export function SubcategorySelector({
  subcategories,
  currentCategorySlug,
}: {
  subcategories: Category[];
  currentCategorySlug: string;
}) {
  const router = useRouter();
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const selectedId = searchParams.get('subcategory');

  if (subcategories.length === 0) {
    return null;
  }

  const handleSelect = (categoryId: number | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (categoryId === null) {
      params.delete('subcategory');
    } else {
      params.set('subcategory', categoryId.toString());
    }
    const queryString = params.toString();
    router.push(`/category/${currentCategorySlug}${queryString ? `?${queryString}` : ''}`);
  };

  return (
    <div className="mb-6 flex flex-wrap gap-2">
      <Button
        variant={selectedId === null ? 'default' : 'outline'}
        size="sm"
        onClick={() => handleSelect(null)}
      >
        {t('common.all')}
      </Button>
      {subcategories.map((subcategory) => (
        <Button
          key={subcategory.id}
          variant={selectedId === subcategory.id.toString() ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleSelect(subcategory.id)}
        >
          {subcategory.title}
        </Button>
      ))}
    </div>
  );
}

