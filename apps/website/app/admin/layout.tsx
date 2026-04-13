import { redirect } from 'next/navigation';
import { getSessionUser, isCurrentUserAdmin } from '@/lib/auth';
import { AdminDashboardShell } from '@/components/admin/admin-dashboard-shell';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user) redirect('/login?next=/admin');

  if (!(await isCurrentUserAdmin())) {
    redirect('/');
  }

  return (
    <AdminDashboardShell userEmail={user.email ?? null}>
      {children}
    </AdminDashboardShell>
  );
}
