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

const postSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  contentMd: z.string().min(1, 'Content is required'),
  imagePath: z.string().optional(),
  published: z.boolean(),
});

type PostFormData = z.infer<typeof postSchema>;

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
    } catch (error) {
      alert('Failed to upload image. Please try again.');
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
    } catch (error) {
      alert('Failed to save post. Please try again.');
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
        <Button>{postId ? 'Edit' : 'Add Post'}</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{postId ? 'Edit Post' : 'Add Post'}</DialogTitle>
          <DialogDescription>
            {postId ? 'Update post details' : 'Create a new blog post'}
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
          <div>
            <Label htmlFor="image" className="mb-2">Image (optional)</Label>
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
            {uploading && <p className="mt-1 text-sm text-muted-foreground">Uploading...</p>}
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
            <Label htmlFor="contentMd" className="mb-2">Content (Markdown)</Label>
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
            <Label htmlFor="published">Published</Label>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting || uploading}>
              {submitting ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

