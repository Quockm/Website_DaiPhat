import StudentListClient from "@/components/admissions/StudentListClient";

export default function StudentListPage() {
  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Danh Sách Tuyển Sinh</h1>
          <p className="text-slate-500 mt-1 text-sm">Quản lý và tra cứu toàn bộ hồ sơ học viên đã nhập</p>
        </div>
        <StudentListClient />
      </div>
    </div>
  );
}
