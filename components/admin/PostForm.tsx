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

function createPostSchema(t: (key: string) => string) {
  return z.object({
    title: z.string().min(1, t('forms.titleRequired')),
    contentMd: z.string().min(1, t('forms.contentRequired')),
    imagePath: z.string().optional(),
    published: z.boolean(),
  });
}

type PostFormData = z.infer<ReturnType<typeof createPostSchema>>;

type PostFormProps = {
  postId?: number;
  initialData?: {
    title: string;
    contentMd: string;
    imagePath?: string | null;
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
    defaultValues: {
      ...initialData,
      imagePath: initialData?.imagePath || undefined,
      published: !!initialData?.publishedAt,
    },
  });

  const published = watch('published');
  const imagePath = watch('imagePath');

  useEffect(() => {
    if (open && initialData) {
      reset({
        ...initialData,
        imagePath: initialData.imagePath || undefined,
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

      const { path } = await response.json();
      setValue('imagePath', path);
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
        // Reset with the submitted data (what was just saved)
        reset(data);
      } else {
        reset();
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
      // Reset form when dialog opens with initial data
      reset({
        ...initialData,
        imagePath: initialData.imagePath || undefined,
        published: !!initialData.publishedAt,
      });
    } else if (!newOpen && !postId) {
      // Reset form when closing add dialog
      reset();
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
              onChange={(e) => setValue('published', e.target.checked)}
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

