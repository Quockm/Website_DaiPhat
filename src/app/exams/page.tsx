"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Plus, CalendarCheck, FileText, CheckCircle2 } from "lucide-react";

const mockExams = [
  { id: "SH-001", date: "20/12/2026", type: "OTO", course: "B2-K105, C-K44", hv: 75, status: "Đã chốt danh sách" },
  { id: "SH-002", date: "25/12/2026", type: "MOTO", course: "A1-K200", hv: 120, status: "Chờ Sở GTVT duyệt" },
  { id: "SH-003", date: "10/01/2027", type: "OTO", course: "B1-K80", hv: 40, status: "Lên kế hoạch" },
];

export default function ExamsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Quản lý Sát hạch</h1>
          <p className="text-slate-600 mt-2 text-base font-medium">Lên lịch và theo dõi các đợt thi sát hạch chứng chỉ và cấp GPLX.</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-semibold transition-colors shadow-sm">
            <Plus className="w-5 h-5" />
            Lập Kế hoạch Thi
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-white shadow-sm border-slate-200 h-full">
          <CardContent className="p-6 pt-6 flex items-center gap-4 h-full">
            <div className="p-4 bg-red-100 rounded-full shrink-0">
              <CalendarCheck className="w-8 h-8 text-red-600" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-500 uppercase truncate">Kỳ thi sắp tới</p>
              <h3 className="text-3xl font-extrabold text-slate-800">3</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-sm border-slate-200 h-full">
          <CardContent className="p-6 pt-6 flex items-center gap-4 h-full">
            <div className="p-4 bg-blue-100 rounded-full shrink-0">
              <CheckCircle2 className="w-8 h-8 text-blue-600" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-500 uppercase truncate">Đã chốt danh sách</p>
              <h3 className="text-3xl font-extrabold text-slate-800">1</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-sm border-slate-200 h-full">
          <CardContent className="p-6 pt-6 flex items-center gap-4 h-full">
            <div className="p-4 bg-amber-100 rounded-full shrink-0">
              <FileText className="w-8 h-8 text-amber-600" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-500 uppercase truncate">Chờ Sở duyệt</p>
              <h3 className="text-3xl font-extrabold text-slate-800">1</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white shadow-md border-slate-200 overflow-hidden">
        <CardHeader className="bg-slate-50/80 border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
            <div className="p-1.5 bg-rose-100 rounded-md">
              <FileText className="h-5 w-5 text-rose-700" />
            </div>
            Danh sách Kỳ thi
          </CardTitle>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Tìm kỳ thi, ngày..." 
                className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64 font-medium"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-extrabold uppercase text-xs border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Mã Đợt Thi</th>
                  <th className="px-6 py-4">Ngày Sát Hạch</th>
                  <th className="px-6 py-4 text-center">Loại Hình</th>
                  <th className="px-6 py-4">Khóa Học Ghép</th>
                  <th className="px-6 py-4 text-center">Số lượng HV</th>
                  <th className="px-6 py-4">Trạng thái</th>
                  <th className="px-6 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {mockExams.map((exam) => (
                  <tr key={exam.id} className="hover:bg-slate-50 transition-colors bg-white group">
                    <td className="px-6 py-4 font-bold text-indigo-700">{exam.id}</td>
                    <td className="px-6 py-4 font-extrabold text-red-600">{exam.date}</td>
                    <td className="px-6 py-4 text-center font-bold text-slate-800">{exam.type}</td>
                    <td className="px-6 py-4 font-medium text-slate-700">{exam.course}</td>
                    <td className="px-6 py-4 text-center font-bold text-slate-800">{exam.hv}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-md text-xs font-bold border ${
                        exam.status === 'Đã chốt danh sách' ? 'bg-green-100 text-green-700 border-green-200' :
                        exam.status === 'Chờ Sở GTVT duyệt' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                        'bg-slate-100 text-slate-700 border-slate-300'
                      }`}>
                        {exam.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-indigo-600 hover:text-indigo-800 font-bold text-xs uppercase bg-indigo-50 px-3 py-1.5 rounded border border-indigo-200">Chi tiết</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
