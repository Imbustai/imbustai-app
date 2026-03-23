import { generateMockParticipants } from '@/lib/analytics/mock-data';
import { ResearchDashboard } from '@/components/admin/dashboard/research-dashboard';

export default function MockedDashboardPage() {
  const participants = generateMockParticipants(80);
  return <ResearchDashboard participants={participants} />;
}
