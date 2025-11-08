'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useI18n } from '@/components/I18nProvider';

const orderSchema = z
  .object({
    email: z.string().email().optional(),
    phone: z.string().optional(),
  })
  .refine((data) => data.email || data.phone, {
    message: 'order.validation',
    path: ['email'],
  });

type OrderForm = z.infer<typeof orderSchema>;

export function ProductOrderDialog({
  productId,
  productTitle,
}: {
  productId: number;
  productTitle: string;
}) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { t } = useI18n();
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<OrderForm>({
    resolver: zodResolver(orderSchema),
  });

  const onSubmit = async (data: OrderForm) => {
    setSubmitting(true);
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          email: data.email || undefined,
          phone: data.phone || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('order.fail');
      }

      reset();
      setOpen(false);
      alert(t('common.orderSuccess'));
    } catch (_error) {
      alert(t('common.orderFail'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg">{t('common.orderNow')}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('common.placeOrder')}</DialogTitle>
          <DialogDescription>
            {t('common.orderDescription', { productTitle })}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="email" className="mb-2">{t('common.email')}</Label>
            <Input
              id="email"
              type="email"
              placeholder="email@email.sk"
              {...register('email')}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-destructive">{errors.email.message === 'order.validation' ? t('common.orderValidation') : errors.email.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="phone" className="mb-2">{t('common.phone')}</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+421 123 456 789"
              {...register('phone')}
            />
            {errors.phone && (
              <p className="mt-1 text-sm text-destructive">{errors.phone.message}</p>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? t('common.submitting') : t('common.submitOrder')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

