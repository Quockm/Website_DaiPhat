import HistoryClient from './HistoryClient';
import { getZaloHistory } from '@/actions/zalo';

export const dynamic = 'force-dynamic';

export default async function ZaloHistoryPage() {
  const history = await getZaloHistory();

  return (
    <div className="p-6 h-full overflow-y-auto bg-slate-50">
      <div className="w-full space-y-6">
        <HistoryClient initialHistory={history} />
      </div>
    </div>
  );
}
