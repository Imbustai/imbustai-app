import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import { AdminPageTitle } from '@/components/admin/admin-page-title';
import { AdminBackLink } from '@/components/admin/admin-back-link';
import { ClientSectionTitle } from '@/components/admin/client-section-title';
import { StartGameButton } from '@/components/admin/start-game-button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { OrderRow, ShippingSnapshot, StoryRow } from '@/lib/types/db';

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
      <p className="mt-2 font-mono text-xs text-muted-foreground">{o.id}</p>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              <ClientSectionTitle titleKey="admin.payment" />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="text-muted-foreground">Status: </span>
              <Badge>{o.status}</Badge>
            </p>
            <p>
              <span className="text-muted-foreground">Source: </span>
              {o.source}
            </p>
            <p>
              <span className="text-muted-foreground">Amount: </span>
              {(o.amount_cents / 100).toFixed(2)} {o.currency.toUpperCase()}
            </p>
            <p>
              <span className="text-muted-foreground">Paid: </span>
              {formatDate(o.paid_at)}
            </p>
            <p>
              <span className="text-muted-foreground">Created: </span>
              {formatDate(o.created_at)}
            </p>
            {o.stripe_checkout_session_id ? (
              <p className="break-all font-mono text-xs">
                Stripe session: {o.stripe_checkout_session_id}
              </p>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              <ClientSectionTitle titleKey="admin.user" />
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <p>{userEmail}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              <ClientSectionTitle titleKey="admin.story" />
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            {story ? (
              <>
                <p className="font-medium">{(story as StoryRow).title_en}</p>
                <p className="text-muted-foreground">
                  slug: {(story as StoryRow).slug}
                </p>
              </>
            ) : (
              <p>—</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              <ClientSectionTitle titleKey="admin.shipping" />
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <p>{snap.line1}</p>
            {snap.line2 ? <p>{snap.line2}</p> : null}
            <p>
              {snap.postal_code} {snap.city}, {snap.country}
            </p>
          </CardContent>
        </Card>
      </div>

      <section className="mt-10">
        <h2 className="mb-3 font-heading text-lg font-semibold">
          <ClientSectionTitle titleKey="admin.gameForOrder" />
        </h2>
        {o.status === 'paid' ? (
          <StartGameButton
            orderId={orderId}
            existingGameId={game?.id ?? null}
          />
        ) : (
          <p className="text-sm text-muted-foreground">
            <ClientSectionTitle titleKey="admin.mustBePaidForGame" asSpan />
          </p>
        )}
      </section>
    </div>
  );
}
