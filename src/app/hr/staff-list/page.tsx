import { getStaffs } from "@/actions/hr";
import StaffListClient from "./StaffListClient";

export default async function StaffListPage() {
  const initialData = await getStaffs(1, 50, "", "all");

  return (
    <div className="space-y-6">
      <div className="flex flex-col mb-4">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Danh sách Nhân sự</h1>
        <p className="text-slate-600 mt-2 text-base font-medium">Quản lý thông tin Giáo viên và Nhân viên, hợp đồng và BHXH.</p>
      </div>

      <StaffListClient 
        initialStaffs={initialData.data} 
        initialTotal={initialData.totalRecords}
        initialPages={initialData.totalPages}
      />
    </div>
  );
}
