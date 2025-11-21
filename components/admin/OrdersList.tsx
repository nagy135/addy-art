'use client';

import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Order = {
  id: number;
  product: {
    title: string;
  };
  contactType: 'email' | 'phone';
  contactValue: string;
  note: string | null;
  seen: boolean;
  createdAt: Date;
};

export function OrdersList({ orders }: { orders: Order[] }) {
  const router = useRouter();
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const toggleSeen = async (order: Order) => {
    setTogglingId(order.id);
    try {
      const res = await fetch(`/api/orders/${order.id}/seen`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seen: !order.seen }),
      });

      if (!res.ok) throw new Error('Failed to update order');
      
      router.refresh();
    } catch (error) {
      console.error('Error updating order:', error);
      alert('Failed to update order status');
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Note</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="w-[100px]">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                No orders yet
              </TableCell>
            </TableRow>
          ) : (
            orders.map((order) => (
              <TableRow key={order.id} className={order.seen ? 'opacity-60' : 'font-medium bg-muted/20'}>
                <TableCell>{order.product.title}</TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground uppercase">{order.contactType}</span>
                    <span>{order.contactValue}</span>
                  </div>
                </TableCell>
                <TableCell className="max-w-[300px] break-words">
                  {order.note || <span className="text-muted-foreground italic">-</span>}
                </TableCell>
                <TableCell>{format(new Date(order.createdAt), 'PP p')}</TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => toggleSeen(order)}
                    disabled={togglingId === order.id}
                    title={order.seen ? 'Mark as unseen' : 'Mark as seen'}
                  >
                    {order.seen ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}


