import { cookies } from 'next/headers';
import type { Locale } from '@/lib/i18n/config';
import { DEFAULT_LOCALE } from '@/lib/i18n/config';
import { en } from '@/lib/i18n/messages/en';
import { sk } from '@/lib/i18n/messages/sk';

type Messages = typeof en | typeof sk;

function resolvePath(messages: Messages, path: string): string | undefined {
  const segments = path.split('.');
  let current: unknown = messages;
  for (const segment of segments) {
    if (typeof current !== 'object' || current === null) return undefined;
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    current = (current as Record<string, unknown>)[segment];
  }
  return typeof current === 'string' ? current : undefined;
}

function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  return template.replace(/\{(.*?)\}/g, (_match, key) => {
    const value = params[key as keyof typeof params];
    return value !== undefined ? String(value) : `{${key}}`;
  });
}

export async function getServerI18n() {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get('lang')?.value as Locale | undefined;
  const locale: Locale = cookieLocale === 'en' || cookieLocale === 'sk' ? cookieLocale : DEFAULT_LOCALE;
  const messages = locale === 'sk' ? sk : en;
  const t = (key: string, params?: Record<string, string | number>) =>
    interpolate(resolvePath(messages, key) ?? key, params);
  return { locale, t };
}


