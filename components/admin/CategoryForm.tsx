'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const categorySchema = z.object({
  title: z.string().min(1, 'Názov je povinný'),
  parentId: z.number().int().positive().optional().nullable(),
});

type CategoryFormData = z.infer<typeof categorySchema>;

type CategoryOption = {
  id: number;
  title: string;
  parentId: number | null | undefined;
};

export function CategoryForm({
  categoryId,
  initialData,
  allCategories = [],
}: {
  categoryId?: number;
  initialData?: { title: string; parentId?: number | null };
  allCategories?: CategoryOption[];
}) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: initialData,
  });

  const parentId = watch('parentId');

  const computeDepth = (categoryIdLocal: number, idToParentId: Map<number, number | null>): number => {
    let depth = 0;
    let current: number | null | undefined = idToParentId.get(categoryIdLocal);
    const seen = new Set<number>();
    while (current && !seen.has(current)) {
      depth += 1;
      seen.add(current);
      current = idToParentId.get(current) ?? null;
      if (depth > 10) break;
    }
    return depth;
  };

  const idToParentId = new Map<number, number | null>(allCategories.map((c) => [c.id, c.parentId ?? null]));
  const selectableParents = allCategories
    .filter((c) => c.id !== categoryId)
    .map((c) => ({
      ...c,
      depth: computeDepth(c.id, idToParentId),
    }))
    .sort((a, b) => {
      if (a.depth !== b.depth) return a.depth - b.depth;
      return a.title.localeCompare(b.title);
    });

  const onSubmit = async (data: CategoryFormData) => {
    setSubmitting(true);
    try {
      const url = categoryId ? `/api/categories/${categoryId}` : '/api/categories';
      const method = categoryId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to save category');
      }

      reset();
      setOpen(false);
      router.refresh();
    } catch (_error) {
      alert('Nepodarilo sa uložiť kategóriu. Skúste znova.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>{categoryId ? 'Upraviť' : 'Pridať Kategóriu'}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{categoryId ? 'Upraviť Kategóriu' : 'Pridať Kategóriu'}</DialogTitle>
          <DialogDescription>
            {categoryId ? 'Aktualizovať detaily kategórie' : 'Vytvorať novú kategóriu produktu'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="title" className="mb-2">Názov</Label>
            <Input id="title" {...register('title')} />
            {errors.title && (
              <p className="mt-1 text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="parentId" className="mb-2">Materská Kategória (voliteľne)</Label>
            <Select
              onValueChange={(value) => {
                if (value === 'none') {
                  setValue('parentId', null, { shouldValidate: true });
                } else {
                  setValue('parentId', parseInt(value), { shouldValidate: true });
                }
              }}
              value={parentId === null || parentId === undefined ? '' : parentId.toString()}
            >
              <SelectTrigger>
                <SelectValue placeholder="Bez materskej (koreňová kategória)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Bez materskej (koreň)</SelectItem>
                {selectableParents.map((c) => (
                  <SelectItem key={c.id} value={c.id.toString()}>
                    {`${'— '.repeat(c.depth)}${c.title}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.parentId && (
              <p className="mt-1 text-sm text-destructive">Neplatný výber materskej kategórie</p>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Zrušiť
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Ukladá sa...' : 'Uložiť'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

