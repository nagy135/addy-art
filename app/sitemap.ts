import type { MetadataRoute } from 'next';
import { db } from '@/db';
import { products, posts, categories } from '@/db/schema';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://addyart.eu';

  // Fetch all products, posts, and categories
  const allProducts = await db.query.products.findMany();
  const allPosts = await db.query.posts.findMany();
  const allCategories = await db.query.categories.findMany();

  // Build sitemap entries
  const sitemap: MetadataRoute.Sitemap = [
    // Home page
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    // Blog list page
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    // Product pages
    ...allProducts.map((product) => ({
      url: `${baseUrl}/products/${product.slug}`,
      lastModified: product.createdAt,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),
    // Blog post pages
    ...allPosts
      .filter((post) => post.publishedAt) // Only include published posts
      .map((post) => ({
        url: `${baseUrl}/blog/${post.slug}`,
        lastModified: post.publishedAt || post.createdAt,
        changeFrequency: 'monthly' as const,
        priority: 0.7,
      })),
    // Category pages
    ...allCategories.map((category) => ({
      url: `${baseUrl}/category/${category.slug}`,
      lastModified: category.createdAt,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
  ];

  return sitemap;
}
