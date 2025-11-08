import { AdminBanner } from '@/components/AdminBanner';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AdminBanner />
      {children}
    </>
  );
}






