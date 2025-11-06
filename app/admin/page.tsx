import Link from 'next/link';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const session = await auth();

  if (!session?.user || session.user.role !== 'admin') {
    redirect('/admin/login');
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-4xl font-bold">Panel Správcu</h1>
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Kategórie</CardTitle>
            <CardDescription>Spravovať kategórie produktov</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/categories">
              <Button>Spravovať Kategórie</Button>
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Produkty</CardTitle>
            <CardDescription>Spravovať produkty</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/products">
              <Button>Spravovať Produkty</Button>
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Príspevky</CardTitle>
            <CardDescription>Spravovať blogové príspevky</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/posts">
              <Button>Spravovať Príspevky</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

