'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';

type ProductItem = {
  id: number;
  title: string;
  imagePath: string;
};

export function CategoryProductsOrderDialog({
  categoryId,
  categoryTitle,
}: {
  categoryId: number;
  categoryTitle: string;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [items, setItems] = useState<ProductItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/categories/${categoryId}/products`);
        if (!res.ok) {
          const errorText = await res.text();
          let errorMessage = `Failed to load products: ${res.status} ${res.statusText}`;
          try {
            const errorJson = JSON.parse(errorText);
            if (errorJson.error) {
              errorMessage = errorJson.error;
            }
          } catch {
            // If error response is not JSON, use the text
            if (errorText) {
              errorMessage = errorText;
            }
          }
          throw new Error(errorMessage);
        }
        const data = (await res.json()) as Array<{
          id: number;
          title: string;
          imagePath: string;
        }>;
        setItems(data);
      } catch (error) {
        console.error('Failed to load products:', error);
        setError(error instanceof Error ? error.message : 'Failed to load products');
        setItems([]);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [open, categoryId]);

  const move = (index: number, delta: number) => {
    setItems((prev) => {
      const next = [...prev];
      const target = index + delta;
      if (target < 0 || target >= next.length) return prev;
      const [moved] = next.splice(index, 1);
      next.splice(target, 0, moved);
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/categories/${categoryId}/products`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderedProductIds: items.map((i) => i.id) }),
      });
      if (!res.ok) {
        throw new Error('Failed to save order');
      }
      setOpen(false);
    } catch (_e) {
      alert('Failed to save order');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" size="sm">Order</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Order products — {categoryTitle}</DialogTitle>
        </DialogHeader>
        <div className="space-y-2 max-h-[60vh] overflow-auto pr-1">
          {loading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : error ? (
            <div className="text-destructive">
              <p className="font-medium">Error loading products</p>
              <p className="text-sm">{error}</p>
            </div>
          ) : items.length === 0 ? (
            <p className="text-muted-foreground">No products in this category.</p>
          ) : (
            items.map((item, index) => (
              <div key={item.id} className="flex items-center gap-3 border rounded p-2">
                <div className="relative h-10 w-10 flex-shrink-0">
                  <Image src={item.imagePath} alt={item.title} fill className="object-cover rounded" />
                </div>
                <div className="flex-1 truncate">{item.title}</div>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" onClick={() => move(index, -1)} disabled={index === 0}>
                    ↑
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => move(index, 1)}
                    disabled={index === items.length - 1}
                  >
                    ↓
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
        <DialogFooter>
          <Button onClick={handleSave} disabled={saving || loading || items.length === 0}>
            {saving ? 'Saving...' : 'Save order'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


