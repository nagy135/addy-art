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
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useI18n } from '@/components/I18nProvider';
import { Star, Trash2 } from 'lucide-react';

function createPostSchema(t: (key: string) => string) {
  return z
    .object({
      title: z.string().min(1, t('forms.titleRequired')),
      contentMd: z.string().min(1, t('forms.contentRequired')),
      images: z.array(z.string().min(1, t('forms.imageRequired'))).default([]),
      thumbnailIndex: z.number().int().min(0).optional(),
      published: z.boolean(),
    })
    .superRefine((data, ctx) => {
      if (data.images.length === 0) {
        return;
      }

      if (data.thumbnailIndex === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['thumbnailIndex'],
          message: t('forms.imageRequired'),
        });
        return;
      }

      if (data.thumbnailIndex < 0 || data.thumbnailIndex >= data.images.length) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['thumbnailIndex'],
          message: t('forms.imageRequired'),
        });
      }
    });
}

type PostFormData = z.infer<ReturnType<typeof createPostSchema>>;

type PostFormProps = {
  postId?: number;
  initialData?: {
    title: string;
    contentMd: string;
    images: string[];
    thumbnailIndex: number;
    publishedAt: Date | null;
  };
  authorId: string;
};

export function PostForm({
  postId,
  initialData,
  authorId,
}: PostFormProps) {
  const { t } = useI18n();
  const postSchema = createPostSchema(t);
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
  } = useForm<PostFormData>({
    resolver: zodResolver(postSchema),
    defaultValues: initialData
      ? {
        ...initialData,
        published: !!initialData.publishedAt,
      }
      : { images: [], thumbnailIndex: 0, published: false },
  });

  const published = watch('published');
  const images = watch('images');
  const thumbnailIndex = watch('thumbnailIndex') ?? 0;

  useEffect(() => {
    if (open && initialData) {
      reset({
        ...initialData,
        published: !!initialData.publishedAt,
      });
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

      const json = (await response.json()) as { path: string };
      const nextImages = [...images, json.path];
      setValue('images', nextImages, { shouldValidate: true });
      if (nextImages.length === 1) {
        setValue('thumbnailIndex', 0, { shouldValidate: true });
      }
    } catch (_error) {
      alert(t('messages.uploadImageFailed'));
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (data: PostFormData) => {
    setSubmitting(true);
    try {
      const url = postId ? `/api/posts/${postId}` : '/api/posts';
      const method = postId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          authorId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save post');
      }

      if (postId) {
        reset(data);
      } else {
        reset({ images: [], thumbnailIndex: 0, published: false });
      }
      setOpen(false);
      router.refresh();
    } catch (_error) {
      alert(t('messages.savePostFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen && initialData) {
      reset({
        ...initialData,
        published: !!initialData.publishedAt,
      });
    } else if (!newOpen && !postId) {
      reset({ images: [], thumbnailIndex: 0, published: false });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>{postId ? t('forms.edit') : t('forms.addPost')}</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{postId ? t('forms.editPost') : t('forms.addPost')}</DialogTitle>
          <DialogDescription>
            {postId ? t('forms.editPostDesc') : t('forms.addPostDesc')}
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
            <Label htmlFor="image" className="mb-2">{t('forms.imageOptional')}</Label>
            <Input
              id="image"
              type="file"
              accept="image/*"
              multiple
              onChange={(event) => {
                const { files } = event.target;
                if (!files || files.length === 0) {
                  return;
                }
                const file = files[0];
                void handleFileUpload(file);
              }}
              disabled={uploading}
            />
            {uploading && <p className="mt-1 text-sm text-muted-foreground">{t('forms.uploading')}</p>}
            {images.length > 0 && (
              <div className="mt-3 grid grid-cols-3 gap-3">
                {images.map((path, index) => (
                  <div key={path} className="relative">
                    <div className="relative h-24 w-full overflow-hidden rounded">
                      <Image src={path} alt={`Image ${index + 1}`} fill className="object-cover" />
                    </div>
                    <div className="mt-2 flex items-center justify-center gap-1">
                      <Button
                        type="button"
                        variant={thumbnailIndex === index ? 'default' : 'outline'}
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setValue('thumbnailIndex', index, { shouldValidate: true })}
                        title={thumbnailIndex === index ? 'Thumbnail' : 'Set as thumbnail'}
                      >
                        <Star
                          className={`h-4 w-4 ${thumbnailIndex === index ? 'fill-current' : ''}`}
                        />
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          const nextImages = images.filter((_, imageIndex) => imageIndex !== index);
                          setValue('images', nextImages, { shouldValidate: true });

                          if (nextImages.length === 0) {
                            setValue('thumbnailIndex', 0, { shouldValidate: false });
                            return;
                          }

                          if (index === thumbnailIndex) {
                            setValue('thumbnailIndex', 0, { shouldValidate: true });
                          } else if (index < thumbnailIndex) {
                            setValue('thumbnailIndex', thumbnailIndex - 1, { shouldValidate: true });
                          }
                        }}
                        title="Delete image"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {(errors.images || errors.thumbnailIndex) && (
              <p className="mt-1 text-sm text-destructive">
                {errors.images?.message ?? errors.thumbnailIndex?.message}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="contentMd" className="mb-2">{t('forms.contentMarkdown')}</Label>
            <Textarea
              id="contentMd"
              rows={15}
              {...register('contentMd')}
            />
            {errors.contentMd && (
              <p className="mt-1 text-sm text-destructive">{errors.contentMd.message}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="published"
              checked={published}
              onChange={(event) => setValue('published', event.target.checked)}
              className="h-4 w-4"
            />
            <Label htmlFor="published">{t('forms.published')}</Label>
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

