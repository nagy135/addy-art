import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { db } from '@/db';
import { posts, postImages } from '@/db/schema';
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

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validated = postSchema.parse(body);

    const hasImages = validated.images.length > 0;
    const thumbnailIndex = hasImages ? validated.thumbnailIndex ?? 0 : 0;
    const thumbnailPath = hasImages ? validated.images[Math.min(thumbnailIndex, validated.images.length - 1)] : null;

    const [inserted] = await db
      .insert(posts)
      .values({
        title: validated.title,
        slug: generateSlug(validated.title),
        contentMd: validated.contentMd,
        imagePath: thumbnailPath,
        authorId: session.user.id,
        publishedAt: validated.published ? new Date() : null,
      })
      .returning({ id: posts.id });

    if (hasImages) {
      await db.insert(postImages).values(
        validated.images.map((path, index) => ({
          postId: inserted.id,
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
    console.error('Post creation error:', error);
    if (error instanceof Error && 'code' in error && error.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
      return NextResponse.json(
        { error: 'User not found or invalid author ID', details: 'The authenticated user does not exist in the database' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create post', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  const allPosts = await db.query.posts.findMany({
    orderBy: (posts, { desc }) => [desc(posts.createdAt)],
  });
  return NextResponse.json(allPosts);
}

