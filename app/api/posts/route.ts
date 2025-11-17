import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { db } from '@/db';
import { posts } from '@/db/schema';
import { z } from 'zod';
import { generateSlug } from '@/lib/generate-slug';

const postSchema = z.object({
  title: z.string().min(1),
  contentMd: z.string().min(1),
  imagePath: z.string().optional(),
  published: z.boolean(),
});

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validated = postSchema.parse(body);

    await db.insert(posts).values({
      title: validated.title,
      slug: generateSlug(validated.title),
      contentMd: validated.contentMd,
      imagePath: validated.imagePath || null,
      authorId: session.user.id,
      publishedAt: validated.published ? new Date() : null,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.issues },
        { status: 400 }
      );
    }
    console.error('Post creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create post' },
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

