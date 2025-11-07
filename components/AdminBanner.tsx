'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { signOut, useSession } from 'next-auth/react';
import { ArrowLeft, Globe, LogOut, LogIn, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/components/I18nProvider';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

export function AdminBanner() {
  const pathname = usePathname();
  const isSubPage = pathname !== '/admin' && pathname !== '/admin/login';
  const isLoginPage = pathname === '/admin/login';
  const { theme, setTheme } = useTheme();
  const { data: session, status } = useSession();
  const [mounted, setMounted] = useState(false);
  const { t } = useI18n();
  
  // Avoid hydration mismatch
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);
  
  const handleLogout = async () => {
    const domain = process.env.NEXT_PUBLIC_DOMAIN || process.env.NEXT_PUBLIC_NEXTAUTH_URL || window.location.origin;
    const callbackUrl = domain.endsWith('/') ? domain.slice(0, -1) : domain;
    await signOut({ callbackUrl });
  };

  return (
    <div className="relative h-48 w-full overflow-hidden border-b bg-black">
      <Image
        src="/logo.jpeg"
        alt="Admin"
        fill
        className="object-cover"
        priority
      />
      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
        <h1 className="text-4xl font-bold text-white drop-shadow-lg md:text-5xl">
          {t('common.admin')}
        </h1>
      </div>
      <div className="absolute left-4 top-4 flex gap-2">
        {isSubPage && (
          <Link href="/admin">
            <Button variant="outline" size="sm" className="bg-white/90 hover:bg-white dark:bg-gray-800/90 dark:hover:bg-gray-800 dark:text-white shadow-md">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('common.backToAdmin')}
            </Button>
          </Link>
        )}
        <Link href="/">
          <Button variant="outline" size="sm" className="bg-white/90 hover:bg-white dark:bg-gray-800/90 dark:hover:bg-gray-800 dark:text-white shadow-md">
            <Globe className="h-4 w-4" />
          </Button>
        </Link>
      </div>
      <div className="absolute right-4 top-4 flex items-center gap-2">
        {/* Theme Toggle */}
        {mounted ? (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label={t('common.toggleTheme')}
            className="bg-white/90 hover:bg-white text-gray-900 dark:bg-gray-800/90 dark:hover:bg-gray-800 dark:text-white shadow-md"
          >
            {theme === 'dark' ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            aria-label={t('common.toggleTheme')}
            disabled
            className="bg-white/90 text-gray-900 dark:bg-gray-800/90 dark:text-white shadow-md"
          >
            <Moon className="h-5 w-5" />
          </Button>
        )}
        <LanguageSwitcher />
        {/* Show logout button only when logged in, login button when not logged in */}
        {status !== 'loading' && session?.user?.role === 'admin' && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="gap-2 bg-white/90 hover:bg-white dark:bg-gray-800/90 dark:hover:bg-gray-800 dark:text-white shadow-md"
          >
            <LogOut className="h-4 w-4" />
            {t('common.logout')}
          </Button>
        )}
        {status !== 'loading' && !session && !isLoginPage && (
          <Link href="/admin/login">
            <Button
              variant="outline"
              size="sm"
              className="gap-2 bg-white/90 hover:bg-white dark:bg-gray-800/90 dark:hover:bg-gray-800 dark:text-white shadow-md"
            >
              <LogIn className="h-4 w-4" />
              {t('common.login')}
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}

