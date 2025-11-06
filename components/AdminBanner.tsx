'use client';

import Image from 'next/image';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { ArrowLeft, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function AdminBanner() {
  const handleLogout = async () => {
    await signOut({ callbackUrl: '/' });
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
          Admin
        </h1>
      </div>
      <div className="absolute left-4 top-4">
        <Link href="/">
          <Button variant="outline" size="sm" className="bg-white/90 hover:bg-white dark:bg-gray-800/90 dark:hover:bg-gray-800 dark:text-white shadow-md">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Site
          </Button>
        </Link>
      </div>
      <div className="absolute right-4 top-4">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleLogout}
          className="gap-2 bg-white/90 hover:bg-white dark:bg-gray-800/90 dark:hover:bg-gray-800 dark:text-white shadow-md"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  );
}

