import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { cookies } from 'next/headers';
import { DEFAULT_LOCALE, type Locale } from '@/lib/i18n/config';
import { sk } from '@/lib/i18n/messages/sk';
import { en } from '@/lib/i18n/messages/en';
import { I18nProvider } from '@/components/I18nProvider';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Addy Art - Shop & Blog",
  description: "Art shop and blog",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get('lang')?.value as Locale | undefined;
  const locale: Locale = cookieLocale === 'en' || cookieLocale === 'sk' ? cookieLocale : DEFAULT_LOCALE;
  const messages = locale === 'sk' ? sk : en;
  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <I18nProvider locale={locale} messages={messages}>
            {children}
          </I18nProvider>
        </Providers>
      </body>
    </html>
  );
}
