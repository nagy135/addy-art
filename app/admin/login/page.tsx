'use client';

import { useState, useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

const loginSchema = z.object({
  email: z.string().email('Neplatná e-mailová adresa'),
  password: z.string().min(1, 'Heslo je povinné'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function AdminLoginPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // Redirect if already logged in
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'admin') {
      router.push('/admin');
    }
  }, [session, status, router]);

  const onSubmit = async (data: LoginForm) => {
    setError(null);
    try {
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
        callbackUrl: '/admin',
      });


      if (result?.error) {
        console.error('Sign in error:', result.error);
        setError('Neplatný e-mail alebo heslo');
      } else if (result?.ok === false) {
        console.error('Sign in failed with status:', result);
        setError('Prihlásenie zlyhalo. Skúste znova.');
      } else {
        // Redirect with a small delay to ensure cookie is set
        console.log('Sign in successful, redirecting to /admin');
        setTimeout(() => {
          window.location.href = '/admin';
        }, 200);
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Vyskytla sa chyba. Skúste znova.');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center ">
      <div className="w-full max-w-md space-y-8 rounded-lg  p-8 shadow-md">
        <div>
          <h2 className="text-center text-3xl font-bold">Prihlásenie Správcu</h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Prihláste sa na správu svojho obchodu a blogu
          </p>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="rounded-md  p-3 text-sm text-red-800">
                {error}
              </div>
            )}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-mail</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="admin@priklad.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Heslo</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full">
              Prihlásiť sa
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}

