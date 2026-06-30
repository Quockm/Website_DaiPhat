"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Save, ShieldCheck, Database, Bell, Briefcase } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Cấu hình Hệ thống</h1>
          <p className="text-slate-600 mt-2 text-base font-medium">Tùy chỉnh tham số đào tạo, kết nối dữ liệu và quyền truy cập.</p>
        </div>
        <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg font-bold transition-colors shadow-sm">
          <Save className="w-5 h-5" />
          Lưu Cấu Hình
        </button>
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        <div className="md:col-span-1 space-y-2">
          <button className="w-full text-left px-4 py-3 bg-indigo-50 text-indigo-700 font-bold rounded-lg border border-indigo-100 flex items-center gap-3">
            <Briefcase className="w-5 h-5" /> Tham số Đào tạo
          </button>
          <button className="w-full text-left px-4 py-3 text-slate-600 font-bold hover:bg-slate-100 rounded-lg flex items-center gap-3 transition-colors">
            <Database className="w-5 h-5 text-slate-400" /> Kết nối CSDL
          </button>
          <button className="w-full text-left px-4 py-3 text-slate-600 font-bold hover:bg-slate-100 rounded-lg flex items-center gap-3 transition-colors">
            <ShieldCheck className="w-5 h-5 text-slate-400" /> Phân quyền
          </button>
          <button className="w-full text-left px-4 py-3 text-slate-600 font-bold hover:bg-slate-100 rounded-lg flex items-center gap-3 transition-colors">
            <Bell className="w-5 h-5 text-slate-400" /> Thông báo
          </button>
        </div>

        <div className="md:col-span-3 space-y-6">
          <Card className="bg-white shadow-sm border-slate-200">
            <CardHeader className="bg-slate-50/80 border-b border-slate-100">
              <CardTitle className="text-lg font-extrabold text-slate-800">Định mức Phân bổ</CardTitle>
              <CardDescription className="text-slate-500 font-medium mt-1">
                Thiết lập số lượng học viên tối đa cho một xe / một giáo viên.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Định mức học viên / Xe (Hạng B1, B2)</label>
                  <input type="number" defaultValue={5} className="w-full px-4 py-2 border border-slate-300 rounded-lg font-semibold focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Định mức học viên / Xe (Hạng C)</label>
                  <input type="number" defaultValue={8} className="w-full px-4 py-2 border border-slate-300 rounded-lg font-semibold focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm border-slate-200">
            <CardHeader className="bg-slate-50/80 border-b border-slate-100">
              <CardTitle className="text-lg font-extrabold text-slate-800">Khung thời gian Đào tạo</CardTitle>
              <CardDescription className="text-slate-500 font-medium mt-1">
                Thời gian mặc định của các giai đoạn đào tạo (tính bằng ngày).
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Thời gian Lý thuyết (Hạng B)</label>
                  <input type="number" defaultValue={15} className="w-full px-4 py-2 border border-slate-300 rounded-lg font-semibold focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Thời gian Thực hành (Hạng B)</label>
                  <input type="number" defaultValue={80} className="w-full px-4 py-2 border border-slate-300 rounded-lg font-semibold focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Số km DAT tối thiểu (B1, B2)</label>
                  <input type="number" defaultValue={810} className="w-full px-4 py-2 border border-slate-300 rounded-lg font-semibold focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
