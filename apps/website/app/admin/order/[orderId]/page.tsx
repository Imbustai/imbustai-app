import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import { AdminPageTitle } from '@/components/admin/admin-page-title';
import { AdminBackLink } from '@/components/admin/admin-back-link';
import { ClientSectionTitle } from '@/components/admin/client-section-title';
import { StartGameButton } from '@/components/admin/start-game-button';
import {
  Badge,
  Box,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Grid,
  Stack,
  Typography,
} from '@imbustai/ds';
import type { OrderRow, ShippingSnapshot, StoryRow } from '@/lib/types/db';
import s from '@/components/admin/admin-styles.module.css';

export const dynamic = 'force-dynamic';

function formatDate(dateStr: string | null) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString();
}

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  const admin = createAdminClient();

  const { data: order, error: oErr } = await admin
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single();

  if (oErr || !order) notFound();

  const o = order as OrderRow;

  const { data: story } = await admin
    .from('stories')
    .select('*')
    .eq('id', o.story_id)
    .single();

  const { data: game } = await admin
    .from('games')
    .select('id')
    .eq('order_id', orderId)
    .maybeSingle();

  const { data: userRes, error: userErr } =
    await admin.auth.admin.getUserById(o.user_id);
  const userEmail =
    !userErr && userRes?.user?.email ? userRes.user.email : o.user_id;

  const snap = o.shipping_snapshot as ShippingSnapshot;

  return (
    <div>
      <AdminBackLink href="/admin/orders" labelKey="admin.backToOrders" />
      <AdminPageTitle
        titleKey="admin.orderDetail"
        subtitleKey="admin.dashboardSubtitle"
      />
      <Box marginTop="2">
        <Typography variant="caption" tone="muted" as="p">
          <span className={s.monoXs}>{o.id}</span>
        </Typography>
      </Box>

      <Box marginTop="8">
        <Grid columns={2} gap="4">
          <Card>
            <CardHeader>
              <CardTitle>
                <ClientSectionTitle titleKey="admin.payment" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Stack gap="2">
                <Typography variant="caption" as="p">
                  <Typography variant="caption" tone="muted" as="span">Status: </Typography>
                  <Badge>{o.status}</Badge>
                </Typography>
                <Typography variant="caption" as="p">
                  <Typography variant="caption" tone="muted" as="span">Source: </Typography>
                  {o.source}
                </Typography>
                <Typography variant="caption" as="p">
                  <Typography variant="caption" tone="muted" as="span">Amount: </Typography>
                  {(o.amount_cents / 100).toFixed(2)} {o.currency.toUpperCase()}
                </Typography>
                <Typography variant="caption" as="p">
                  <Typography variant="caption" tone="muted" as="span">Paid: </Typography>
                  {formatDate(o.paid_at)}
                </Typography>
                <Typography variant="caption" as="p">
                  <Typography variant="caption" tone="muted" as="span">Created: </Typography>
                  {formatDate(o.created_at)}
                </Typography>
                {o.stripe_checkout_session_id ? (
                  <Typography variant="caption" as="p">
                    <span className={s.monoXs}>Stripe session: {o.stripe_checkout_session_id}</span>
                  </Typography>
                ) : null}
              </Stack>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                <ClientSectionTitle titleKey="admin.user" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Typography variant="caption">{userEmail}</Typography>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                <ClientSectionTitle titleKey="admin.story" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              {story ? (
                <Stack gap="1">
                  <Typography variant="body">{(story as StoryRow).title_en}</Typography>
                  <Typography variant="caption" tone="muted">
                    slug: {(story as StoryRow).slug}
                  </Typography>
                </Stack>
              ) : (
                <Typography variant="caption">—</Typography>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                <ClientSectionTitle titleKey="admin.shipping" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Stack gap="0">
                <Typography variant="caption">{snap.line1}</Typography>
                {snap.line2 ? <Typography variant="caption">{snap.line2}</Typography> : null}
                <Typography variant="caption">
                  {snap.postal_code} {snap.city}, {snap.country}
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Box>

      <Box as="section" marginTop="10">
        <Typography variant="h4" as="h2">
          <ClientSectionTitle titleKey="admin.gameForOrder" />
        </Typography>
        <Box marginTop="3">
          {o.status === 'paid' ? (
            <StartGameButton
              orderId={orderId}
              existingGameId={game?.id ?? null}
            />
          ) : (
            <Typography variant="caption" tone="muted">
              <ClientSectionTitle titleKey="admin.mustBePaidForGame" asSpan />
            </Typography>
          )}
        </Box>
      </Box>
    </div>
  );
}
