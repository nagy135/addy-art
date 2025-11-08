'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Moon, Sun, LogIn, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/components/I18nProvider';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

export function Banner() {
  const { theme, setTheme } = useTheme();
  const { data: session } = useSession();
  const [mounted, setMounted] = useState(false);
  const { t } = useI18n();

  // Avoid hydration mismatch
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  return (
    <div className="relative h-64 w-full overflow-hidden bg-black md:h-[500px]">
      <Image
        src="/logo-new.jpeg"
        alt="Addy Art"
        fill
        className="object-cover"
        priority
      />
      {/* Header buttons overlaid on top right */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        {/* Theme Toggle */}
        {mounted ? (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label={t('common.toggleTheme')}
            className="cursor-pointer bg-white/90 hover:bg-white text-gray-900 dark:bg-gray-800/90 dark:hover:bg-gray-800 dark:text-white shadow-md"
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            aria-label={t('common.toggleTheme')}
            disabled
            className="cursor-pointer bg-white/90 text-gray-900 dark:bg-gray-800/90 dark:text-white shadow-md"
          >
            <Moon className="h-4 w-4" />
          </Button>
        )}
        <LanguageSwitcher />

        {/* Admin Login Button */}
        {!session && (
          <Link href="/admin/login">
            <Button
              variant="outline"
              size="sm"
              className="cursor-pointer gap-2 bg-white/90 hover:bg-white text-gray-900 border-gray-300 dark:bg-gray-800/90 dark:hover:bg-gray-800 dark:text-white dark:border-gray-600 shadow-md"
            >
              <LogIn className="h-4 w-4" />
            </Button>
          </Link>
        )}

        {/* Admin Dashboard Link (if logged in) */}
        {session?.user?.role === 'admin' && (
          <Link href="/admin">
            <Button
              variant="outline"
              size="icon"
              className="bg-white/90 hover:bg-white text-gray-900 border-gray-300 dark:bg-gray-800/90 dark:hover:bg-gray-800 dark:text-white dark:border-gray-600 shadow-md"
              aria-label="Admin Dashboard"
            >
              <Settings className="h-5 w-5" />
            </Button>
          </Link>
        )}
      </div>

      <div className="absolute inset-0 flex items-end justify-center bg-black/30 pb-8">
        <h1 className="text-5xl font-bold text-white drop-shadow-lg md:text-7xl capitalize">
          <span>addy</span>
          <span>art</span>
        </h1>
      </div>
    </div>
  );
}

