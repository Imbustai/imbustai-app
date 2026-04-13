import { GamesList } from '@/components/games/games-list';
import { loadAdminGamesListRows } from '@/lib/load-admin-games-list';

export const dynamic = 'force-dynamic';

export default async function AdminGamesPage() {
  const rows = await loadAdminGamesListRows();
  return <GamesList rows={rows} adminView />;
}
