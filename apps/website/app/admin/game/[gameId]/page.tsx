import { redirect } from 'next/navigation';

export default async function AdminGameRedirectPage({
  params,
}: {
  params: Promise<{ gameId: string }>;
}) {
  const { gameId } = await params;
  redirect(`/game/${gameId}`);
}
