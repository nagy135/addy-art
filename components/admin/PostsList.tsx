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

type Post = {
  id: number;
  title: string;
  slug: string;
  contentMd: string;
  imagePath: string | null;
  publishedAt: Date | null;
  createdAt: Date;
};

export function PostsList({
  posts,
  authorId,
}: {
  posts: Post[];
  authorId: string;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState<number | null>(null);

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this post?')) {
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
    } catch (error) {
      alert('Failed to delete post. Please try again.');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {posts.map((post) => (
            <TableRow key={post.id}>
              <TableCell className="font-medium">{post.title}</TableCell>
              <TableCell>
                {post.publishedAt ? (
                  <span className="text-green-600">Published</span>
                ) : (
                  <span className="text-gray-500">Draft</span>
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
                      imagePath: post.imagePath,
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
                    {deleting === post.id ? 'Deleting...' : 'Delete'}
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {posts.length === 0 && (
        <p className="mt-4 text-center text-muted-foreground">No posts yet.</p>
      )}
    </div>
  );
}

