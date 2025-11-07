import Link from 'next/link';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getServerI18n } from '@/lib/i18n/server';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const session = await auth();
  const { t } = await getServerI18n();

  if (!session?.user || session.user.role !== 'admin') {
    redirect('/admin/login');
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-4xl font-bold">{t('admin.dashboard')}</h1>
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>{t('admin.dashboardCategories')}</CardTitle>
            <CardDescription>{t('admin.dashboardCategoriesDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/categories">
              <Button>{t('admin.manageCategories')}</Button>
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t('admin.dashboardProducts')}</CardTitle>
            <CardDescription>{t('admin.dashboardProductsDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/products">
              <Button>{t('admin.manageProducts')}</Button>
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t('admin.dashboardPosts')}</CardTitle>
            <CardDescription>{t('admin.dashboardPostsDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/posts">
              <Button>{t('admin.managePosts')}</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

