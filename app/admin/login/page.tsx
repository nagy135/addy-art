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
import { useI18n } from '@/components/I18nProvider';

function createLoginSchema(t: (key: string) => string) {
  return z.object({
    email: z.string().email(t('admin.invalidEmail')),
    password: z.string().min(1, t('admin.passwordRequired')),
  });
}

type LoginForm = z.infer<ReturnType<typeof createLoginSchema>>;

export default function AdminLoginPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { t } = useI18n();
  const [error, setError] = useState<string | null>(null);
  const loginSchema = createLoginSchema(t);
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
        setError(t('admin.invalidCredentials'));
      } else if (result?.ok === false) {
        console.error('Sign in failed with status:', result);
        setError(t('admin.loginFailed'));
      } else {
        // Redirect with a small delay to ensure cookie is set
        console.log('Sign in successful, redirecting to /admin');
        setTimeout(() => {
          window.location.href = '/admin';
        }, 200);
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(t('admin.errorOccurred'));
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center ">
      <div className="w-full max-w-md space-y-8 rounded-lg  p-8 shadow-md">
        <div>
          <h2 className="text-center text-3xl font-bold">{t('admin.loginTitle')}</h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {t('admin.loginSubtitle')}
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
                  <FormLabel>{t('common.email')}</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="admin@example.com" {...field} />
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
                  <FormLabel>{t('admin.password')}</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full">
              {t('admin.loginButton')}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}

