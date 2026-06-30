import { getTeachers, getTeacherStats } from "@/actions/teachers";
import TeachersClient from "./TeachersClient";

export default async function TeachersPage() {
  const initialData = await getTeachers(1, 50, "");
  const initialStats = await getTeacherStats();

  return (
    <div className="space-y-6">
      <div className="flex flex-col mb-4">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Hồ sơ Giáo viên</h1>
        <p className="text-slate-600 mt-2 text-base font-medium">Quản lý thông tin cá nhân và phân công của giáo viên.</p>
      </div>

      <TeachersClient 
        initialTeachers={initialData.data} 
        initialTotal={initialData.totalRecords}
        initialPages={initialData.totalPages}
        initialStats={initialStats}
      />
    </div>
  );
}
