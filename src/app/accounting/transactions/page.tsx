import { getTransactions, getAccountingDashboardStats } from "@/actions/accounting";
import TransactionsClient from "@/components/accounting/TransactionsClient";

export const dynamic = 'force-dynamic';

export default async function TransactionsPage(
  props: {
    searchParams?: Promise<{ month?: string, year?: string }>;
  }
) {
  const searchParams = await props.searchParams;
  const date = new Date();
  const month = searchParams?.month ? parseInt(searchParams.month) : date.getMonth() + 1;
  const year = searchParams?.year ? parseInt(searchParams.year) : date.getFullYear();

  const [transactions, stats] = await Promise.all([
    getTransactions(month, year),
    getAccountingDashboardStats(month, year)
  ]);

  return (
    <div className="h-full overflow-y-auto bg-slate-50">
      <TransactionsClient 
        initialTransactions={transactions}
        initialStats={stats}
        currentMonth={month}
        currentYear={year}
      />
    </div>
  );
}
