import { GraduationPrintTab } from "@/components/exams/graduation/GraduationPrintTab";

export default function GraduationPrintPage() {
  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">In Ấn Chứng Chỉ Tốt Nghiệp</h1>
          <p className="text-slate-500 font-medium mt-1">Phân hệ Tốt nghiệp Đại Phát</p>
        </div>
      </div>
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <GraduationPrintTab />
      </div>
    </div>
  );
}
