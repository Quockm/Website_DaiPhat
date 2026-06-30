"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Car, FileText, Upload, Printer, Download, Search } from "lucide-react";

export default function LessonPlansPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Tự động hóa: Giáo án & Sổ theo dõi</h1>
          <p className="text-slate-600 mt-2 text-base font-medium">Xuất biểu mẫu Báo cáo, Giáo án Word và Sổ thực hành Excel tự động.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="bg-white shadow-sm border-slate-200">
          <CardHeader className="bg-slate-50/80 border-b border-slate-100">
            <CardTitle className="text-sm font-bold text-slate-700 uppercase">1. Cấu hình Khóa học Ô tô</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Chọn Hạng Xe:</label>
              <select className="w-full px-4 py-2 border border-slate-300 rounded-lg font-semibold focus:ring-2 focus:ring-indigo-500">
                <option value="ALL">-- Tất cả --</option>
                <option value="B">Hạng B (B1, B2)</option>
                <option value="C">Hạng C</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Chọn Khóa Học:</label>
              <select className="w-full px-4 py-2 border-2 border-indigo-500 rounded-lg font-bold text-indigo-700 focus:ring-2 focus:ring-indigo-500">
                <option value="">-- Vui lòng chọn khóa học --</option>
                <option value="B2-K105">Khóa B2 - K105</option>
                <option value="C-K44">Khóa C - K44</option>
              </select>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm border-slate-200">
          <CardHeader className="bg-slate-50/80 border-b border-slate-100">
            <CardTitle className="text-sm font-bold text-slate-700 uppercase">2. File mẫu & Xuất File</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Giáo án Lý thuyết & Thực hành (.DOCX):</label>
              <div className="flex gap-2">
                <select className="flex-1 px-4 py-2 bg-amber-50 border border-amber-300 text-amber-900 rounded-lg font-semibold">
                  <option>Giáo án B (Số sàn).docx</option>
                  <option>Giáo án C.docx</option>
                </select>
                <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 shadow-sm transition-colors">
                  <FileText className="w-4 h-4" /> Xuất Word
                </button>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Sổ Theo Dõi Thực Hành (.XLSX):</label>
              <div className="flex gap-2">
                <select className="flex-1 px-4 py-2 bg-slate-50 border border-slate-300 text-slate-700 rounded-lg font-semibold">
                  <option>SỔ THEO DÕI B (SỐ SÀN).xlsx</option>
                  <option>SỔ THEO DÕI C.xlsx</option>
                </select>
                <button className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 shadow-sm transition-colors">
                  <Printer className="w-4 h-4" /> Xuất Excel
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white shadow-md border-slate-200 overflow-hidden flex flex-col h-[400px]">
        <CardHeader className="bg-slate-50/80 border-b border-slate-100 py-3 flex flex-row justify-between items-center shrink-0">
          <div>
            <CardTitle className="text-sm font-bold text-slate-700 uppercase">3. Dữ liệu DAT & Danh sách Học viên</CardTitle>
            <p className="text-xs text-slate-500 mt-1">Tải lên file báo cáo DAT (PDF/CSV) để hệ thống tự nội suy giờ học.</p>
          </div>
          <button className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 text-sm shadow-sm transition-colors">
            <Upload className="w-4 h-4" /> Tải lên File DAT
          </button>
        </CardHeader>
        <CardContent className="p-0 flex-1 overflow-auto custom-scrollbar">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-extrabold uppercase text-xs border-b border-slate-200 sticky top-0">
              <tr>
                <th className="px-6 py-3 w-16 text-center">STT</th>
                <th className="px-6 py-3">Họ Tên Học Viên</th>
                <th className="px-6 py-3">CCCD</th>
                <th className="px-6 py-3">Trạng thái DAT</th>
                <th className="px-6 py-3">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              <tr><td colSpan={5} className="text-center py-12 text-slate-400 font-medium italic">Vui lòng chọn khóa học ở phần cấu hình bên trên để hiển thị.</td></tr>
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
