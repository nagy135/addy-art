import Link from 'next/link';
import Image from 'next/image';
import { db } from '@/db';
import { format } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Banner } from '@/components/Banner';
import { CategoriesNav } from '@/components/CategoriesNav';
import ReactMarkdown from 'react-markdown';

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
        <div className="flex flex-col gap-6">
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
                      <div className="line-clamp-3 text-sm text-muted-foreground">
                        <ReactMarkdown
                          components={{
                            p: ({ children }) => <p className="mb-0">{children}</p>,
                            a: ({ ...props }) => (
                              <span className="text-primary underline" {...props} />
                            ),
                            h1: ({ children }) => <h1 className="text-lg font-bold mb-0">{children}</h1>,
                            h2: ({ children }) => <h2 className="text-base font-bold mb-0">{children}</h2>,
                            h3: ({ children }) => <h3 className="text-sm font-bold mb-0">{children}</h3>,
                            ul: ({ children }) => <ul className="list-disc list-inside mb-0">{children}</ul>,
                            ol: ({ children }) => <ol className="list-decimal list-inside mb-0">{children}</ol>,
                            li: ({ children }) => <li className="mb-0">{children}</li>,
                            strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                            em: ({ children }) => <em className="italic">{children}</em>,
                            code: ({ children }) => <code className="bg-muted px-1 py-0.5 rounded text-xs">{children}</code>,
                            blockquote: ({ children }) => <blockquote className="border-l-4 border-muted pl-2 italic mb-0">{children}</blockquote>,
                          }}
                        >
                          {post.contentMd}
                        </ReactMarkdown>
                      </div>
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
