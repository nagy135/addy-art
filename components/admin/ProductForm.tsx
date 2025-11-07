'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useI18n } from '@/components/I18nProvider';

function createProductSchema(t: (key: string) => string) {
  return z.object({
    title: z.string().min(1, t('forms.titleRequired')),
    descriptionMd: z.string().min(1, t('forms.descriptionRequired')),
    priceCents: z.number().min(1, t('forms.priceRequired')),
    categoryId: z.number().min(1, t('forms.categoryRequired')),
    imagePath: z.string().min(1, t('forms.imageRequired')),
  });
}

type ProductFormData = z.infer<ReturnType<typeof createProductSchema>>;

type Category = {
  id: number;
  title: string;
  slug: string;
  parentId?: number | null;
};

export function ProductForm({
  productId,
  initialData,
  categories,
}: {
  productId?: number;
  initialData?: {
    title: string;
    descriptionMd: string;
    priceCents: number;
    categoryId: number;
    imagePath: string;
  };
  categories: Category[];
}) {
  const { t } = useI18n();
  const productSchema = createProductSchema(t);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: initialData
      ? {
          ...initialData,
          priceCents: initialData.priceCents,
        }
      : undefined,
  });

  const imagePath = watch('imagePath');
  const categoryId = watch('categoryId');
  const priceCents = watch('priceCents');

  // Convert cents to euros for display
  const priceEuros = priceCents && priceCents > 0 ? (priceCents / 100).toString() : '';

  useEffect(() => {
    if (open && initialData) {
      reset(initialData);
    }
  }, [open, initialData, reset]);

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload image');
      }

      const { path } = await response.json();
      setValue('imagePath', path);
    } catch (_error) {
      alert(t('messages.uploadImageFailed'));
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (data: ProductFormData) => {
    setSubmitting(true);
    try {
      const url = productId ? `/api/products/${productId}` : '/api/products';
      const method = productId ? 'PUT' : 'POST';

      // Data already has priceCents, no conversion needed here since we convert on input change
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to save product');
      }

      if (productId) {
        // Reset with the submitted data (what was just saved)
        reset(data);
      } else {
        reset();
      }
      setOpen(false);
      router.refresh();
    } catch (_error) {
      alert(t('messages.saveProductFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen && initialData) {
      // Reset form when dialog opens with initial data
      reset(initialData);
    } else if (!newOpen && !productId) {
      // Reset form when closing add dialog
      reset();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>{productId ? t('forms.edit') : t('forms.addProduct')}</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{productId ? t('forms.editProduct') : t('forms.addProduct')}</DialogTitle>
          <DialogDescription>
            {productId ? t('forms.editProductDesc') : t('forms.addProductDesc')}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="title" className="mb-2">{t('forms.title')}</Label>
            <Input id="title" {...register('title')} />
            {errors.title && (
              <p className="mt-1 text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="categoryId" className="mb-2">{t('forms.category')}</Label>
            <Select
              onValueChange={(value) => setValue('categoryId', parseInt(value))}
              value={categoryId?.toString()}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('forms.category')} />
              </SelectTrigger>
              <SelectContent>
                {(() => {
                  const idToParentId = new Map<number, number | null>(
                    categories.map((c) => [c.id, c.parentId ?? null])
                  );
                  const computeDepth = (categoryIdLocal: number): number => {
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
                  const withDepth = categories
                    .map((c) => ({ ...c, depth: computeDepth(c.id) }))
                    .sort((a, b) => {
                      if (a.depth !== b.depth) return a.depth - b.depth;
                      return a.title.localeCompare(b.title);
                    });
                  return withDepth.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id.toString()}>
                      {`${'— '.repeat(cat.depth)}${cat.title}`}
                    </SelectItem>
                  ));
                })()}
              </SelectContent>
            </Select>
            {errors.categoryId && (
              <p className="mt-1 text-sm text-destructive">{errors.categoryId.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="priceEuros" className="mb-2">{t('forms.price')}</Label>
            <Input
              id="priceEuros"
              type="number"
              step="0.01"
              min="0.01"
              value={priceEuros}
              onChange={(e) => {
                const euros = parseFloat(e.target.value);
                if (!isNaN(euros) && euros > 0) {
                  setValue('priceCents', Math.round(euros * 100), { shouldValidate: true });
                } else if (e.target.value === '') {
                  setValue('priceCents', 0, { shouldValidate: false });
                }
              }}
            />
            {errors.priceCents && (
              <p className="mt-1 text-sm text-destructive">{errors.priceCents.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="image" className="mb-2">{t('forms.image')}</Label>
            <Input
              id="image"
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  handleFileUpload(file);
                }
              }}
              disabled={uploading}
            />
            {uploading && <p className="mt-1 text-sm text-muted-foreground">{t('forms.uploading')}</p>}
            {imagePath && (
              <div className="mt-2 relative h-32 w-32">
                <Image src={imagePath} alt="Preview" fill className="object-cover rounded" />
              </div>
            )}
            {errors.imagePath && (
              <p className="mt-1 text-sm text-destructive">{errors.imagePath.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="descriptionMd" className="mb-2">{t('forms.descriptionMarkdown')}</Label>
            <Textarea
              id="descriptionMd"
              rows={10}
              {...register('descriptionMd')}
            />
            {errors.descriptionMd && (
              <p className="mt-1 text-sm text-destructive">{errors.descriptionMd.message}</p>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={submitting || uploading}>
              {submitting ? t('forms.saving') : t('forms.save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

