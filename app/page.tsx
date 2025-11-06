import Link from 'next/link';
import Image from 'next/image';
import { db } from '@/db';
import { posts } from '@/db/schema';
import { format } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Banner } from '@/components/Banner';
import { CategoriesNav } from '@/components/CategoriesNav';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const publishedPosts = await db.query.posts.findMany({
    where: (posts, { isNotNull }) => isNotNull(posts.publishedAt),
    orderBy: (posts, { desc }) => [desc(posts.publishedAt!)],
    limit: 10,
  });

  const categories = await db.query.categories.findMany({
    orderBy: (categories, { asc }) => [asc(categories.title)],
  });

  return (
    <>
      <Banner />
      <CategoriesNav categories={categories} />
      <div className="container mx-auto px-4 py-8">
        <h2 className="mb-6 text-3xl font-bold">Blog</h2>
        <div className="space-y-6">
          {publishedPosts.map((post) => (
            <Link key={post.id} href={`/blog/${post.slug}`}>
              <Card className="transition-shadow hover:shadow-lg overflow-hidden">
                <div className="flex flex-col md:flex-row gap-0">
                  {post.imagePath && (
                    <div className="relative w-full md:w-64 h-48 md:h-auto flex-shrink-0">
                      <Image
                        src={post.imagePath}
                        alt={post.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1 p-6">
                    <CardHeader className="p-0 pb-2">
                      <CardTitle>{post.title}</CardTitle>
                      {post.publishedAt && (
                        <CardDescription>
                          {format(new Date(post.publishedAt), 'MMMM d, yyyy')}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="p-0">
                      <p className="line-clamp-3 text-sm text-muted-foreground">
                        {post.contentMd.substring(0, 200)}...
                      </p>
                    </CardContent>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
        {publishedPosts.length === 0 && (
          <p className="text-center text-muted-foreground">No blog posts yet.</p>
        )}
      </div>
    </>
  );
}
