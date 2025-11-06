import { db } from '@/db';
import { PostsList } from '@/components/admin/PostsList';
import { PostForm } from '@/components/admin/PostForm';
import { auth } from '@/app/api/auth/[...nextauth]/route';

export const dynamic = 'force-dynamic';

export default async function AdminPostsPage() {
  const session = await auth();
  if (!session?.user) {
    return null;
  }

  const allPosts = await db.query.posts.findMany({
    orderBy: (posts, { desc }) => [desc(posts.createdAt)],
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-4xl font-bold">Posts</h1>
        <PostForm authorId={session.user.id} />
      </div>
      <PostsList posts={allPosts} authorId={session.user.id} />
    </div>
  );
}

