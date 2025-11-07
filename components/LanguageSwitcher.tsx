'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/components/I18nProvider';

export function LanguageSwitcher() {
  const router = useRouter();
  const { locale } = useI18n();

  const toggleLocale = useCallback(() => {
    const next = locale === 'sk' ? 'en' : 'sk';
    const oneYear = 60 * 60 * 24 * 365;
    document.cookie = `lang=${next}; Max-Age=${oneYear}; Path=/`;
    router.refresh();
  }, [locale, router]);

  return (
    <Button variant="secondary" size="icon" aria-label="Switch language" onClick={toggleLocale}>
      {locale === 'sk' ? 'SK' : 'EN'}
    </Button>
  );
}


