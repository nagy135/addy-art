import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { db } from '@/db';
import { posts, postImages } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { generateSlug } from '@/lib/generate-slug';

const postSchema = z
  .object({
    title: z.string().min(1),
    contentMd: z.string().min(1),
    images: z.array(z.string().min(1)).default([]),
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
        message: 'thumbnailIndex is required when images are provided',
      });
      return;
    }

    if (data.thumbnailIndex < 0 || data.thumbnailIndex >= data.images.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['thumbnailIndex'],
        message: 'thumbnailIndex out of range',
      });
    }
  });

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const validated = postSchema.parse(body);

    const hasImages = validated.images.length > 0;
    const thumbnailIndex = hasImages ? validated.thumbnailIndex ?? 0 : 0;
    const thumbnailPath = hasImages ? validated.images[Math.min(thumbnailIndex, validated.images.length - 1)] : null;

    await db
      .update(posts)
      .set({
        title: validated.title,
        slug: generateSlug(validated.title),
        contentMd: validated.contentMd,
        imagePath: thumbnailPath,
        publishedAt: validated.published ? new Date() : null,
      })
      .where(eq(posts.id, parseInt(id, 10)));

    await db.delete(postImages).where(eq(postImages.postId, parseInt(id, 10)));

    if (hasImages) {
      await db.insert(postImages).values(
        validated.images.map((path, index) => ({
          postId: parseInt(id, 10),
          imagePath: path,
          isThumbnail: index === thumbnailIndex,
        })),
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.issues },
        { status: 400 }
      );
    }
    console.error('Post update error:', error);
    return NextResponse.json(
      { error: 'Failed to update post' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    await db.delete(posts).where(eq(posts.id, parseInt(id, 10)));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Post deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete post' },
      { status: 500 }
    );
  }
}

