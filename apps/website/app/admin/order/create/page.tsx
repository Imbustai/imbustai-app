import { createAdminClient } from '@/lib/supabase/admin';
import { AdminPageTitle } from '@/components/admin/admin-page-title';
import { FreeOrderForm } from '@/components/admin/free-order-form';
import { Box } from '@imbustai/ds';

export const dynamic = 'force-dynamic';

export default async function AdminCreateOrderPage() {
  const admin = createAdminClient();

  const { data: usersData } = await admin.auth.admin.listUsers({
    perPage: 1000,
    page: 1,
  });
  const users = (usersData?.users ?? []).map((u) => ({
    id: u.id,
    email: u.email ?? u.id,
  }));

  const { data: stories } = await admin
    .from('stories')
    .select('id, slug, title_en, title_it')
    .order('title_en');

  return (
    <div>
      <AdminPageTitle
        titleKey="admin.createFreeOrder"
        subtitleKey="admin.dashboardSubtitle"
      />
      <Box marginTop="8">
        <FreeOrderForm
          users={users}
          stories={
            (stories ?? []) as {
              id: string;
              slug: string;
              title_en: string;
              title_it: string;
            }[]
          }
        />
      </Box>
    </div>
  );
}
