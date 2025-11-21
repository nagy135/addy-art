import { db } from '@/db';
import { OrdersList } from '@/components/admin/OrdersList';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { getServerI18n } from '@/lib/i18n/server';

export const dynamic = 'force-dynamic';

export default async function AdminOrdersPage() {
  const session = await auth();
  const { t } = await getServerI18n();
  if (!session?.user) {
    return null;
  }

  const allOrders = await db.query.orders.findMany({
    with: {
      product: true,
    },
    orderBy: (orders, { desc }) => [desc(orders.createdAt)],
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-4xl font-bold">{t('admin.orders')}</h1>
      </div>
      <OrdersList orders={allOrders} />
    </div>
  );
}


