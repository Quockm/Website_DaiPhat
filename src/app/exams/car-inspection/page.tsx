"use client";

import React, { useState, useEffect } from "react";
import { Wrench, Plus, Trash2, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getExamSchedules, addExamSchedule, deleteExamSchedule } from "@/actions/exam-schedules.actions";

export default function CarInspectionPage() {
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    type: "KT_XE",
    exam_date: "",
    title: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    // Fetch only KT_XE type
    const res = await getExamSchedules("KT_XE");
    if (res.success && res.data) {
      setSchedules(res.data);
    } else {
      alert("Lỗi tải dữ liệu: " + res.error);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.exam_date || !formData.title) {
      alert("Vui lòng nhập đủ Ngày kiểm tra và Tên/Ghi chú");
      return;
    }
    
    setIsSubmitting(true);
    const res = await addExamSchedule(formData.type, formData.exam_date, formData.title);
    if (res.success) {
      setFormData({ ...formData, title: "", exam_date: "" });
      loadData();
    } else {
      alert("Lỗi: " + res.error);
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (id: number) => {
    if (confirm("Bạn có chắc chắn muốn xóa lịch này?")) {
      const res = await deleteExamSchedule(id);
      if (res.success) {
        loadData();
      } else {
        alert("Lỗi xóa: " + res.error);
      }
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const parts = dateString.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateString;
  };

  return (
    <div className="p-6 w-full space-y-6 bg-slate-50 min-h-screen">
      <div className="flex items-center gap-3 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
          <Wrench className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Quản lý Lịch Kiểm Tra Xe</h1>
          <p className="text-slate-500 font-medium mt-1">Lên lịch kiểm định, bảo dưỡng phương tiện</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Form thêm mới */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-fit">
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5 text-amber-600" />
            Tạo Lịch Kiểm Tra Mới
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Loại lịch</label>
              <Input 
                type="text" 
                value="Kiểm tra xe"
                disabled
                className="bg-slate-100 text-slate-500 cursor-not-allowed font-medium"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Ngày kiểm tra</label>
              <Input 
                type="date" 
                value={formData.exam_date}
                onChange={(e) => setFormData({...formData, exam_date: e.target.value})}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tên đợt/Nội dung kiểm tra</label>
              <Input 
                type="text" 
                placeholder="VD: Kiểm tra định kỳ tháng 10"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
              />
            </div>
            
            <Button type="submit" disabled={isSubmitting} className="w-full bg-amber-600 hover:bg-amber-700 mt-2">
              {isSubmitting ? "Đang lưu..." : "Tạo Lịch Kiểm Tra"}
            </Button>
          </form>
        </div>

        {/* Danh sách */}
        <div className="md:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-amber-600" />
              Danh Sách Lịch Kiểm Tra Xe
            </h2>
            <Button onClick={loadData} variant="outline" size="sm">Làm mới</Button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-600 uppercase bg-slate-100">
                <tr>
                  <th className="px-4 py-3">Loại</th>
                  <th className="px-4 py-3">Ngày kiểm tra</th>
                  <th className="px-4 py-3">Nội dung</th>
                  <th className="px-4 py-3 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={4} className="text-center py-8 text-slate-500">Đang tải...</td></tr>
                ) : schedules.length === 0 ? (
                  <tr><td colSpan={4} className="text-center py-8 text-slate-500">Chưa có lịch kiểm tra nào</td></tr>
                ) : (
                  schedules.map((sc) => (
                    <tr key={sc.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-medium">
                        <span className="px-2 py-1 rounded-md text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200">
                          Kiểm tra xe
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-800">{formatDate(sc.exam_date)}</td>
                      <td className="px-4 py-3 text-slate-700">{sc.title}</td>
                      <td className="px-4 py-3 text-center">
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(sc.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
