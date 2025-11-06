'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Moon, Sun, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Header() {
  const { theme, setTheme } = useTheme();
  const { data: session } = useSession();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex-1" />
        
        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          {mounted ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              aria-label="Prepnúť tému"
            >
              {theme === 'dark' ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>
          ) : (
            <Button variant="ghost" size="icon" aria-label="Prepnúť tému" disabled>
              <Moon className="h-5 w-5" />
            </Button>
          )}

          {/* Admin Login Button */}
          {!session && (
            <Link href="/admin/login">
              <Button variant="outline" size="sm" className="gap-2">
                <LogIn className="h-4 w-4" />
                <span className="hidden sm:inline">Prihlásenie Správcu</span>
                <span className="sm:hidden">Prihlásenie</span>
              </Button>
            </Link>
          )}

          {/* Admin Dashboard Link (if logged in) */}
          {session?.user?.role === 'admin' && (
            <Link href="/admin">
              <Button variant="outline" size="sm">
                Správca
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

