'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu } from 'lucide-react';
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
  parentId?: number | null;
};

const homeCategory: Category = {
  id: 0,
  title: 'Domov',
  slug: '',
};

export function CategoriesNav({ categories }: { categories: Category[] }) {
  const [open, setOpen] = useState(false);

  // Filter to only root categories (no parentId)
  const rootCategories = categories.filter((cat) => !cat.parentId);

  // Prepend home category to the list
  const allCategories = [homeCategory, ...rootCategories];

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-4">
        {/* Desktop Navigation */}
        <div className="hidden md:flex justify-center gap-4">
          {allCategories.map((category) => (
            <Button key={category.id} asChild
              variant={category.id === 0 ? 'default' : 'outline'}
            >
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
                <span className="ml-2">Kategórie</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              <SheetHeader>
                <SheetTitle>Kategórie</SheetTitle>
              </SheetHeader>
              <div className="mt-6 flex flex-col gap-2 px-2">
                {allCategories.map((category) => (
                  <Button
                    key={category.id}
                    asChild
                    variant={category.id === 0 ? 'default' : 'outline'}
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
