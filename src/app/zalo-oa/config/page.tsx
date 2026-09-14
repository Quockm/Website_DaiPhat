import ConfigClient from './ConfigClient';
import { getZaloConfig } from '@/actions/zalo';

export const dynamic = 'force-dynamic';

export default async function ZaloConfigPage() {
  const config = await getZaloConfig();

  return (
    <div className="p-6 h-full overflow-y-auto bg-slate-50">
      <div className="w-full space-y-6">
        <ConfigClient initialConfig={config} />
      </div>
    </div>
  );
}
