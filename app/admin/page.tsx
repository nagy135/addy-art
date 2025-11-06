import Link from 'next/link';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default async function AdminDashboard() {
  const session = await auth();

  if (!session?.user || session.user.role !== 'admin') {
    console.log('================\n', 'redirect: ', redirect, '\n================');
    redirect('/admin/login');
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-4xl font-bold">Admin Dashboard</h1>
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Categories</CardTitle>
            <CardDescription>Manage product categories</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/categories">
              <Button>Manage Categories</Button>
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Products</CardTitle>
            <CardDescription>Manage products</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/products">
              <Button>Manage Products</Button>
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Posts</CardTitle>
            <CardDescription>Manage blog posts</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/posts">
              <Button>Manage Posts</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

