'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { PostForm } from './PostForm';
import { useI18n } from '@/components/I18nProvider';

type PostImage = {
  id: number;
  postId: number;
  imagePath: string;
  isThumbnail: boolean;
  createdAt: Date;
};

type Post = {
  id: number;
  title: string;
  slug: string;
  contentMd: string;
  imagePath: string | null;
  publishedAt: Date | null;
  createdAt: Date;
  images?: PostImage[];
};

export function PostsList({
  posts,
  authorId,
}: {
  posts: Post[];
  authorId: string;
}) {
  const router = useRouter();
  const { t } = useI18n();
  const [deleting, setDeleting] = useState<number | null>(null);

  const handleDelete = async (id: number) => {
    if (!confirm(t('messages.deletePostConfirm'))) {
      return;
    }

    setDeleting(id);
    try {
      const response = await fetch(`/api/posts/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete post');
      }

      router.refresh();
    } catch (_error) {
      alert(t('messages.deletePostFailed'));
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('tables.name')}</TableHead>
            <TableHead>{t('tables.status')}</TableHead>
            <TableHead>{t('tables.created')}</TableHead>
            <TableHead className="text-right">{t('tables.actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {posts.map((post) => (
            <TableRow key={post.id}>
              <TableCell className="font-medium">{post.title}</TableCell>
              <TableCell>
                {post.publishedAt ? (
                  <span className="text-green-600">{t('tables.published')}</span>
                ) : (
                  <span className="text-gray-500">{t('tables.draft')}</span>
                )}
              </TableCell>
              <TableCell>
                {format(new Date(post.createdAt), 'MMM d, yyyy')}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <PostForm
                    postId={post.id}
                    initialData={{
                      title: post.title,
                      contentMd: post.contentMd,
                      images: (post.images ?? [])
                        .slice()
                        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
                        .map((image) => image.imagePath),
                      thumbnailIndex: (() => {
                        const images = post.images ?? [];
                        if (images.length === 0) {
                          return 0;
                        }
                        const sorted = images
                          .slice()
                          .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
                        const thumbnailIdx = sorted.findIndex((image) => image.isThumbnail);
                        return thumbnailIdx === -1 ? 0 : thumbnailIdx;
                      })(),
                      publishedAt: post.publishedAt,
                    }}
                    authorId={authorId}
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(post.id)}
                    disabled={deleting === post.id}
                  >
                    {deleting === post.id ? t('tables.deleting') : t('tables.delete')}
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {posts.length === 0 && (
        <p className="mt-4 text-center text-muted-foreground">{t('messages.noPosts')}</p>
      )}
    </div>
  );
}

