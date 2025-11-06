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

const categorySchema = z.object({
  title: z.string().min(1, 'Title is required'),
});

type CategoryFormData = z.infer<typeof categorySchema>;

export function CategoryForm({ categoryId, initialData }: {
  categoryId?: number;
  initialData?: { title: string };
}) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: initialData,
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
    } catch (error) {
      alert('Failed to save category. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>{categoryId ? 'Edit' : 'Add Category'}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{categoryId ? 'Edit Category' : 'Add Category'}</DialogTitle>
          <DialogDescription>
            {categoryId ? 'Update category details' : 'Create a new product category'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="title" className="mb-2">Title</Label>
            <Input id="title" {...register('title')} />
            {errors.title && (
              <p className="mt-1 text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

