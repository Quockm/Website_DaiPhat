"use client";

import React, { useState, useEffect } from "react";
import { CalendarDays, Plus, Trash2, CalendarCheck2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getExamSchedules, addExamSchedule, deleteExamSchedule } from "@/actions/exam-schedules.actions";

export default function ExamSchedulePage() {
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    type: "TN",
    exam_date: "",
    title: "",
    location: "",
    student_count: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    const res = await getExamSchedules();
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
      alert("Vui lòng nhập đủ Ngày thi và Tên kỳ thi");
      return;
    }
    
    setIsSubmitting(true);
    const res = await addExamSchedule(
      formData.type, 
      formData.exam_date, 
      formData.title, 
      formData.location, 
      formData.student_count ? parseInt(formData.student_count) : undefined
    );
    if (res.success) {
      setFormData({ ...formData, title: "", exam_date: "", location: "", student_count: "" });
      loadData();
    } else {
      alert("Lỗi: " + res.error);
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (id: number) => {
    if (confirm("Bạn có chắc chắn muốn xóa kỳ thi này?")) {
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
        <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
          <CalendarCheck2 className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Quản lý Lịch Thi</h1>
          <p className="text-slate-500 font-medium mt-1">Tạo lịch thi Tốt nghiệp và Sát hạch</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form thêm mới */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-fit">
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5 text-indigo-600" />
            Tạo Lịch Thi Mới
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Loại kỳ thi</label>
              <select 
                className="w-full h-10 px-3 py-2 rounded-md border border-slate-300 bg-white"
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value})}
              >
                <option value="TN">Thi Tốt Nghiệp</option>
                <option value="SH">Thi Sát Hạch</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Ngày thi <span className="text-red-500">*</span></label>
              <Input 
                type="date" 
                value={formData.exam_date}
                onChange={(e) => setFormData({...formData, exam_date: e.target.value})}
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tên/Ghi chú kỳ thi <span className="text-red-500">*</span></label>
              <Input 
                type="text" 
                placeholder="VD: Kỳ thi Sát hạch Oto Khóa 120"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Sân Thi</label>
              <Input 
                type="text" 
                placeholder="VD: Sân Đại Phát"
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Số lượng học viên dự kiến</label>
              <Input 
                type="number" 
                placeholder="VD: 150"
                value={formData.student_count}
                onChange={(e) => setFormData({...formData, student_count: e.target.value})}
              />
            </div>
            
            <Button type="submit" disabled={isSubmitting} className="w-full bg-indigo-600 hover:bg-indigo-700 mt-2">
              {isSubmitting ? "Đang lưu..." : "Tạo Lịch Thi"}
            </Button>
          </form>
        </div>

        {/* Danh sách */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-blue-600" />
              Danh Sách Lịch Thi
            </h2>
            <Button onClick={loadData} variant="outline" size="sm">Làm mới</Button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-600 uppercase bg-slate-100">
                <tr>
                  <th className="px-4 py-3">Loại</th>
                  <th className="px-4 py-3">Ngày thi</th>
                  <th className="px-4 py-3">Tên kỳ thi</th>
                  <th className="px-4 py-3">Sân thi / SL</th>
                  <th className="px-4 py-3 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={5} className="text-center py-8 text-slate-500">Đang tải...</td></tr>
                ) : schedules.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-8 text-slate-500">Chưa có lịch thi nào</td></tr>
                ) : (
                  schedules.map((sc) => (
                    <tr key={sc.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-medium">
                        {sc.type === 'TN' ? (
                          <span className="px-2 py-1 rounded-md text-xs font-bold bg-indigo-100 text-indigo-700 border border-indigo-200">Tốt Nghiệp</span>
                        ) : (
                          <span className="px-2 py-1 rounded-md text-xs font-bold bg-rose-100 text-rose-700 border border-rose-200">Sát Hạch</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-800">{formatDate(sc.exam_date)}</td>
                      <td className="px-4 py-3 text-slate-700 font-medium">{sc.title}</td>
                      <td className="px-4 py-3 text-slate-600">
                        {sc.location && <div className="text-xs font-semibold text-indigo-700">{sc.location}</div>}
                        {sc.student_count > 0 && <div className="text-xs">{sc.student_count} HV</div>}
                        {!sc.location && !sc.student_count && <span className="text-slate-400">-</span>}
                      </td>
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
