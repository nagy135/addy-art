'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

type Category = {
  id: number;
  title: string;
  slug: string;
};

const homeCategory: Category = {
  id: 0,
  title: 'Home',
  slug: '',
};

export function CategoriesNav({ categories }: { categories: Category[] }) {
  const [open, setOpen] = useState(false);
  
  // Prepend home category to the list
  const allCategories = [homeCategory, ...categories];

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-4">
        {/* Desktop Navigation */}
        <div className="hidden md:flex justify-center gap-4">
          {allCategories.map((category) => (
            <Button key={category.id} asChild variant="ghost">
              <Link href={category.id === 0 ? '/' : `/category/${category.slug}`}>
                <span className="capitalize">{category.title}</span>
              </Link>
            </Button>
          ))}
        </div>

        {/* Mobile Navigation */}
        <div className="flex md:hidden justify-start">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm">
                <Menu className="h-5 w-5" />
                <span className="ml-2">Categories</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              <SheetHeader>
                <SheetTitle>Categories</SheetTitle>
              </SheetHeader>
              <div className="mt-6 flex flex-col gap-2">
                {allCategories.map((category) => (
                  <Button
                    key={category.id}
                    asChild
                    variant="ghost"
                    className="justify-start"
                    onClick={() => setOpen(false)}
                  >
                    <Link href={category.id === 0 ? '/' : `/category/${category.slug}`}>
                      {category.title}
                    </Link>
                  </Button>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
