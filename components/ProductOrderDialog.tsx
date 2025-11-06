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

const orderSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().optional(),
}).refine((data) => data.email || data.phone, {
  message: 'Je potrebné e-mail alebo telefón',
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
        throw new Error('Failed to submit order');
      }

      reset();
      setOpen(false);
      alert('Objednávka bola úspešne odoslaná!');
    } catch (_error) {
      alert('Nepodarilo sa odoslať objednávku. Skúste znova.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg">Objednať Teraz</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Zložiť Objednávku</DialogTitle>
          <DialogDescription>
            Zadajte svoju e-mailovú adresu alebo telefónne číslo pre objednávku {productTitle}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="email" className="mb-2">E-mail</Label>
            <Input
              id="email"
              type="email"
              placeholder="vasa@email.com"
              {...register('email')}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="phone" className="mb-2">Telefón</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+421 (910) 000-000"
              {...register('phone')}
            />
            {errors.phone && (
              <p className="mt-1 text-sm text-destructive">{errors.phone.message}</p>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Zrušiť
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Odosielá sa...' : 'Odoslať Objednávku'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

