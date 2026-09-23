"use client";

import React, { useState, useEffect } from "react";
import { Users, FileSpreadsheet, Trash2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getTestingStudents, unassignTestingExamDate } from "@/actions/testing/students.actions";
import { getExamSchedules } from "@/actions/exam-schedules.actions";

export function TestingStudentsTab() {
  const [students, setStudents] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState<string>("");
  const [examMode, setExamMode] = useState<'OTO' | 'MOTO'>('OTO');

  const [searchTerm, setSearchTerm] = useState("");
  const [filterHang, setFilterHang] = useState("");

  const loadData = async () => {
    setLoading(true);
    const [resStudents, resSchedules] = await Promise.all([
      getTestingStudents(),
      getExamSchedules('SH')
    ]);
    if (resStudents.success) {
      setStudents(resStudents.data || []);
    } else {
      alert("Lỗi tải sinh viên: " + resStudents.error);
    }
    if (resSchedules.success) {
      setSchedules(resSchedules.data || []);
    }
    setLoading(false);
  };

  const handleUnassign = async (cccd: string) => {
    if (!confirm("Bạn có chắc muốn hủy lịch thi của học viên này? Học viên sẽ được đưa về Phòng chờ Xét duyệt.")) return;
    
    const res = await unassignTestingExamDate(cccd);
    if (res.success) {
      alert("Đã hủy lịch thi thành công!");
      loadData();
    } else {
      alert("Lỗi khi hủy lịch: " + res.error);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Only consider students that have an exam_date
  const assignedStudents = students.filter(st => st.exam_date);
  
  // Extract unique exam dates for filter
  const examDates = Array.from(new Set(assignedStudents.map(s => s.exam_date)));
  
  // Default to first exam date if not set and dates exist
  useEffect(() => {
    if (!filterDate && examDates.length > 0) {
      setFilterDate(examDates[0]);
    }
  }, [examDates, filterDate]);

  const filteredStudents = assignedStudents.filter(s => {
    // Lọc theo chế độ
    const h = (s.hang || '').trim().toUpperCase();
    const isMoto = h.startsWith('A');
    if (examMode === 'MOTO' && !isMoto) return false;
    if (examMode === 'OTO' && isMoto) return false;
    if (filterDate && s.exam_date !== filterDate) return false;
    if (filterHang && s.hang !== filterHang) return false;
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      if (!s.name?.toLowerCase().includes(lower) && !s.cccd?.toLowerCase().includes(lower)) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-4">
        
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
              <Users className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-800">Danh sách Học viên Dự thi Sát hạch</h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
              <button
                onClick={() => setExamMode('OTO')}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  examMode === 'OTO' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Ô tô
              </button>
              <button
                onClick={() => setExamMode('MOTO')}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  examMode === 'MOTO' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Mô tô (A1, A)
              </button>
            </div>
            <Button onClick={loadData} variant="outline" size="sm">Tải lại</Button>
          </div>
        </div>
        
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <input 
              type="text" 
              placeholder="Tìm tên, CCCD..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="h-10 px-3 py-2 rounded-md border border-slate-300 bg-white w-full sm:w-64"
            />
            <select 
              className="h-10 px-3 py-2 rounded-md border border-slate-300 bg-white min-w-[120px]"
              value={filterHang}
              onChange={e => setFilterHang(e.target.value)}
            >
              <option value="">Tất cả hạng</option>
              {examMode === 'MOTO' ? (
                <>
                  <option value="A1">Hạng A1</option>
                  <option value="A">Hạng A</option>
                </>
              ) : (
                <>
                  <option value="B-TD">Hạng B-TD</option>
                  <option value="B-SS">Hạng B-SS</option>
                  <option value="C1">Hạng C1</option>
                  <option value="C">Hạng C</option>
                  <option value="D2">Hạng D2</option>
                  <option value="D">Hạng D</option>
                </>
              )}
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select 
              className="h-10 px-3 py-2 rounded-md border border-slate-300 bg-white min-w-[200px]"
              value={filterDate}
              onChange={e => setFilterDate(e.target.value)}
            >
              <option value="">Tất cả ngày thi</option>
              {examDates.map(date => {
                const scheduleInfo = schedules.find(s => s.exam_date === date);
                return (
                  <option key={date as string} value={date as string}>
                    {date as string} {scheduleInfo?.title ? `- ${scheduleInfo.title}` : ''}
                  </option>
                );
              })}
            </select>
            <Button className="bg-emerald-600 hover:bg-emerald-700 flex items-center gap-2 h-10">
              <FileSpreadsheet className="w-4 h-4" /> Xuất Excel
            </Button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto max-h-[600px]">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-600 uppercase bg-slate-100 sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="px-4 py-3 w-16 text-center">STT</th>
                <th className="px-4 py-3">CCCD</th>
                <th className="px-4 py-3">Khóa</th>
                <th className="px-4 py-3">Họ và tên</th>
                <th className="px-4 py-3">Ngày sinh</th>
                <th className="px-4 py-3">Hạng</th>
                <th className="px-4 py-3 text-center">Loại</th>
                <th className="px-4 py-3 text-center">Điều kiện</th>
                <th className="px-4 py-3 text-center">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={9} className="text-center py-8 text-slate-500">Đang tải dữ liệu...</td></tr>
              ) : filteredStudents.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-8 text-slate-500">Chưa có dữ liệu học viên</td></tr>
              ) : (
                filteredStudents.map((st, i) => {
                  const isEligible = true;
                  return (
                    <tr key={st.cccd} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-600 text-center">{st.stt || (i + 1)}</td>
                      <td className="px-4 py-3 font-mono text-xs">{st.cccd}</td>
                      <td className="px-4 py-3 font-semibold text-slate-700">{st.khoa || '-'}</td>
                      <td className="px-4 py-3 font-bold text-slate-800">{st.name}</td>
                      <td className="px-4 py-3">{st.dob}</td>
                      <td className="px-4 py-3 font-bold text-indigo-600">{st.hang}</td>
                      <td className="px-4 py-3 text-center">
                        {st.is_retake ? (
                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-700">Thi lại</span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">Mới</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {isEligible ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto" />
                        ) : (
                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-rose-100 text-rose-800">Chưa đủ</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleUnassign(st.cccd)}
                          className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 h-8 px-2"
                          title="Hủy lịch thi"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
