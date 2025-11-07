'use client';

import React, { createContext, useContext, useMemo } from 'react';
import type { Locale } from '@/lib/i18n/config';
import { en } from '@/lib/i18n/messages/en';
import { sk } from '@/lib/i18n/messages/sk';

export type Messages = typeof en | typeof sk;

type I18nContextValue = {
  locale: Locale;
  t: (key: string, params?: Record<string, string | number>) => string;
};

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

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

export function I18nProvider({
  children,
  locale,
  messages,
}: {
  children: React.ReactNode;
  locale: Locale;
  messages: Messages;
}) {
  const value = useMemo<I18nContextValue>(() => ({
    locale,
    t: (key, params) => interpolate(resolvePath(messages, key) ?? key, params),
  }), [locale, messages]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return ctx;
}



