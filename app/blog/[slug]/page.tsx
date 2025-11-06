import { notFound } from 'next/navigation';
import { db } from '@/db';
import { posts } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { format } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import { Banner } from '@/components/Banner';
import { CategoriesNav } from '@/components/CategoriesNav';

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await db.query.posts.findFirst({
    where: eq(posts.slug, slug),
  });

  if (!post || !post.publishedAt) {
    notFound();
  }

  const categories = await db.query.categories.findMany({
    orderBy: (categories, { asc }) => [asc(categories.title)],
  });

  return (
    <>
      <Banner />
      <CategoriesNav categories={categories} />
      <article className="container mx-auto max-w-3xl px-4 py-8">
        <h1 className="mb-4 text-4xl font-bold">{post.title}</h1>
        <p className="mb-8 text-muted-foreground">
          {format(new Date(post.publishedAt), 'MMMM d, yyyy')}
        </p>
        <div className="prose prose-lg max-w-none">
          <ReactMarkdown>{post.contentMd}</ReactMarkdown>
        </div>
      </article>
    </>
  );
}

