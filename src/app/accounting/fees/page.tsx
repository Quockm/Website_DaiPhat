import { getFeeCourses, getGlobalFeeStatistics } from "@/actions/fees";
import FeeManagementClient from "@/components/accounting/FeeManagementClient";

export const dynamic = 'force-dynamic';

export default async function FeesPage() {
  const courses = await getFeeCourses();
  const globalStats = await getGlobalFeeStatistics();
  return <FeeManagementClient courses={courses} globalStats={globalStats} />;
}
