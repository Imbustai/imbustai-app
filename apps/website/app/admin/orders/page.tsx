import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/admin';
import { AdminPageTitle } from '@/components/admin/admin-page-title';
import { OrderStatusBadge } from '@/components/admin/order-status-badge';
import { OrdersFilter } from '@/components/admin/orders-filter';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@imbustai/ds';
import type { OrderRow, OrderStatus } from '@/lib/types/db';
import s from '@/components/admin/admin-styles.module.css';

export const dynamic = 'force-dynamic';

function formatDate(dateStr: string | null) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString();
}

const statuses: OrderStatus[] = ['pending_payment', 'paid', 'cancelled'];

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status: statusFilter } = await searchParams;
  const admin = createAdminClient();

  const base = admin.from('orders').select('*');
  const filtered =
    statusFilter && statuses.includes(statusFilter as OrderStatus)
      ? base.eq('status', statusFilter as OrderStatus)
      : base;
  const { data: orders } = await filtered.order('created_at', {
    ascending: false,
  });

  const { data: usersData } = await admin.auth.admin.listUsers({
    perPage: 1000,
    page: 1,
  });
  const emailById = new Map(
    (usersData?.users ?? []).map((u) => [u.id, u.email ?? ''])
  );

  return (
    <div>
      <AdminPageTitle
        titleKey="admin.ordersNav"
        subtitleKey="admin.dashboardSubtitle"
      />
      <Box marginTop="6">
        <OrdersFilter current={statusFilter} />
      </Box>
      <Box marginTop="6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Created</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {((orders ?? []) as OrderRow[]).map((o) => (
              <TableRow key={o.id}>
                <TableCell>
                  <span className={s.monoXs}>{o.id.slice(0, 8)}…</span>
                </TableCell>
                <TableCell>{emailById.get(o.user_id) ?? o.user_id}</TableCell>
                <TableCell>
                  <OrderStatusBadge status={o.status} source={o.source} />
                </TableCell>
                <TableCell>{o.source}</TableCell>
                <TableCell>{formatDate(o.created_at)}</TableCell>
                <TableCell>
                  <Link href={`/admin/order/${o.id}`} className={s.primaryLink}>
                    Open
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
    </div>
  );
}
