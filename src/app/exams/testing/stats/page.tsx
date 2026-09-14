import { StatsTab } from "@/components/exams/testing/StatsTab";

export default function TestingStatsPage() {
  return (
    <div className="p-6 w-full space-y-6 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Thống kê Kết quả</h1>
          <p className="text-slate-500 font-medium mt-1">Phân hệ Sát hạch Đại Phát</p>
        </div>
      </div>
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <StatsTab />
      </div>
    </div>
  );
}
