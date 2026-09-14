import { getTransactions, getAccountingDashboardStats } from "@/actions/accounting";
import TransactionsClient from "@/components/accounting/TransactionsClient";

export const dynamic = 'force-dynamic';

export default async function TransactionsPage(
  props: {
    searchParams?: Promise<{ date?: string, ket?: string }>;
  }
) {
  const searchParams = await props.searchParams;
  
  // Default to today in YYYY-MM-DD in local timezone
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
  
  const dateStr = searchParams?.date || todayStr;
  const ket = searchParams?.ket || 'ALL';

  const transactions = await getTransactions(dateStr, ket);
  const stats = await getAccountingDashboardStats(dateStr, ket);

  return (
    <div className="h-full overflow-y-auto bg-slate-50">
      <TransactionsClient 
        initialTransactions={transactions}
        initialStats={stats}
        currentDate={dateStr}
        currentKet={ket}
      />
    </div>
  );
}
