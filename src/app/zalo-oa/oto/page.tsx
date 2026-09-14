import ZaloCampaignClient from '../components/ZaloCampaignClient';
import { getZaloConfig } from '@/actions/zalo';
import { getCourses } from '@/actions/courses';

export const dynamic = 'force-dynamic';

export default async function ZaloOtoPage() {
  const config = await getZaloConfig();
  const allCourses = await getCourses();
  
  // Filter for Oto courses that are not completed (or as needed)
  const otoCourses = allCourses.filter(c => c.type === 'OTO' && c.status !== 'Đã bế giảng');

  return (
    <div className="p-6 h-full overflow-y-auto bg-slate-50">
      <div className="w-full space-y-6">
        <ZaloCampaignClient 
          campaignType="OTO" 
          courses={otoCourses} 
          config={config} 
        />
      </div>
    </div>
  );
}
