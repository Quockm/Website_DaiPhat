import { getContracts, getVehicles, getDebtDashboardStats, getAllPendingSchedules, getAllPaidSchedules } from "@/actions/debts";
import DebtManagerClient from "@/components/accounting/DebtManagerClient";

export const dynamic = 'force-dynamic';

export default async function DebtsPage() {
  const contracts = await getContracts();
  const vehicles = await getVehicles();
  const stats = await getDebtDashboardStats();
  const pendingSchedules = await getAllPendingSchedules();
  const paidSchedules = await getAllPaidSchedules();

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Quản lý Công nợ Ngân hàng</h1>
        <p className="mt-2 text-sm text-slate-600">Theo dõi hợp đồng vay, lịch trả nợ và thanh toán lãi gốc.</p>
      </div>

      <DebtManagerClient 
        initialContracts={contracts} 
        initialVehicles={vehicles} 
        stats={stats} 
        initialPendingSchedules={pendingSchedules}
        initialPaidSchedules={paidSchedules}
      />
    </div>
  );
}
