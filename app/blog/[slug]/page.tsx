import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { db } from '@/db';
import { posts } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { format } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import { Banner } from '@/components/Banner';
import { CategoriesNav } from '@/components/CategoriesNav';
import { ProductGallery } from '@/components/ProductGallery';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await db.query.posts.findFirst({
    where: eq(posts.slug, slug),
    with: {
      images: true,
      author: true,
    },
  });

  if (!post || !post.publishedAt) {
    return {
      title: 'Post Not Found',
    };
  }

  // Extract first 160 characters from markdown for description
  const plainText = post.contentMd
    .replace(/[#*_`\[\]()]/g, '') // Remove markdown syntax
    .replace(/\n/g, ' ') // Replace newlines with spaces
    .trim();
  const description = plainText.substring(0, 160);

  // Get the main image
  const mainImage =
    post.images && post.images.length > 0
      ? post.images.find((img) => img.isThumbnail)?.imagePath || post.images[0].imagePath
      : post.imagePath;

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://addyart.eu';
  const imageUrl = mainImage
    ? mainImage.startsWith('http')
      ? mainImage
      : `${baseUrl}${mainImage}`
    : undefined;

  return {
    title: `${post.title} - Addy Art Blog`,
    description,
    openGraph: {
      title: post.title,
      description,
      type: 'article',
      publishedTime: post.publishedAt.toISOString(),
      authors: post.author ? [post.author.name] : [],
      ...(imageUrl && {
        images: [
          {
            url: imageUrl,
            width: 800,
            height: 600,
            alt: post.title,
          },
        ],
      }),
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description,
      ...(imageUrl && {
        images: [imageUrl],
      }),
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await db.query.posts.findFirst({
    where: eq(posts.slug, slug),
    with: {
      images: true,
      author: true,
    },
  });

  if (!post || !post.publishedAt) {
    notFound();
  }

  const categories = await db.query.categories.findMany({
    orderBy: (categories, { asc }) => [asc(categories.title)],
  });

  // Generate JSON-LD structured data for BlogPosting
  const baseUrlSchema = process.env.NEXT_PUBLIC_BASE_URL || 'https://addyart.eu';
  const postImage =
    post.images && post.images.length > 0
      ? post.images.find((img) => img.isThumbnail)?.imagePath || post.images[0].imagePath
      : post.imagePath;

  const imageUrlSchema = postImage
    ? postImage.startsWith('http')
      ? postImage
      : `${baseUrlSchema}${postImage}`
    : undefined;

  const articleSchema = {
    '@context': 'https://schema.org/',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.contentMd.replace(/[#*_`\[\]()]/g, '').trim().substring(0, 160),
    datePublished: post.publishedAt.toISOString(),
    author: {
      '@type': 'Person',
      name: post.author?.name || 'Addy Art',
    },
    ...(imageUrlSchema && {
      image: imageUrlSchema,
    }),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <Banner />
      <CategoriesNav categories={categories} />
      <article className="container mx-auto max-w-3xl px-4 py-8">
        <h1 className="mb-4 text-4xl font-bold">{post.title}</h1>
        <p className="mb-8 text-muted-foreground">
          {format(new Date(post.publishedAt), 'MMMM d, yyyy')}
        </p>
        {post.images && post.images.length > 0 && (
          <div className="mb-8">
            <ProductGallery
              images={post.images
                .slice()
                .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
                .map((image) => image.imagePath)}
              initialIndex={(() => {
                const images = post.images ?? [];
                if (images.length === 0) {
                  return 0;
                }
                const sorted = images
                  .slice()
                  .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
                const thumbnailIdx = sorted.findIndex((image) => image.isThumbnail);
                return thumbnailIdx === -1 ? 0 : thumbnailIdx;
              })()}
              alt={post.title}
            />
          </div>
        )}
        <div className="prose prose-lg max-w-none">
          <ReactMarkdown>{post.contentMd}</ReactMarkdown>
        </div>
      </article>
    </>
  );
}
