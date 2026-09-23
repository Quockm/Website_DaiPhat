"use client";
import React, { useState, useEffect } from "react";
import { getGraduationStudents, updateEligibility, assignExamDates } from "@/actions/graduation/graduation.actions";
import { getExamSchedules } from "@/actions/exam-schedules.actions";
import { Button } from "@/components/ui/button";
import { FileCheck, AlertCircle, Calendar, CheckCircle2 } from "lucide-react";

export function GraduationEligibilityTab() {
  const [students, setStudents] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Batch selection states
  const [selectedCccds, setSelectedCccds] = useState<Set<string>>(new Set());
  const [selectedSchedule, setSelectedSchedule] = useState<string>("");
  const [assigning, setAssigning] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterHang, setFilterHang] = useState("");

  const loadData = async () => {
    setLoading(true);
    const [resStudents, resSchedules] = await Promise.all([
      getGraduationStudents(),
      getExamSchedules('TN')
    ]);
    
    if (resStudents.success) {
      setStudents(resStudents.data || []);
    } else {
      alert("Lỗi tải danh sách: " + resStudents.error);
    }
    
    if (resSchedules.success && resSchedules.data) {
      setSchedules(resSchedules.data);
    }
    
    setSelectedCccds(new Set());
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggle = async (cccd: string, field: string, currentValue: boolean) => {
    setStudents(prev => prev.map(s => s.cccd === cccd ? { ...s, [field]: !currentValue } : s));
    const res = await updateEligibility(cccd, { [field]: !currentValue });
    if (!res.success) {
      alert("Lỗi lưu dữ liệu: " + res.error);
      loadData();
    }
  };

  const toggleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedCccds(new Set(unassignedStudents.map(s => s.cccd)));
    } else {
      setSelectedCccds(new Set());
    }
  };

  const toggleSelect = (cccd: string) => {
    const next = new Set(selectedCccds);
    if (next.has(cccd)) next.delete(cccd);
    else next.add(cccd);
    setSelectedCccds(next);
  };

  const handleAssign = async () => {
    if (!selectedSchedule) return alert("Vui lòng chọn ngày thi!");
    if (selectedCccds.size === 0) return alert("Vui lòng chọn ít nhất 1 học viên!");
    
    setAssigning(true);
    const res = await assignExamDates(Array.from(selectedCccds), selectedSchedule);
    if (res.success) {
      alert(`Đã xếp lịch thi cho ${selectedCccds.size} học viên thành công!`);
      loadData();
    } else {
      alert("Lỗi xếp lịch: " + res.error);
    }
    setAssigning(false);
  };

  // Chỉ hiển thị học viên chưa có lịch thi + lọc
  const unassignedStudents = students.filter(st => {
    if (st.exam_date) return false;
    if (filterHang && st.hang !== filterHang) return false;
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      if (!st.name?.toLowerCase().includes(lower) && !st.cccd?.toLowerCase().includes(lower)) return false;
    }
    return true;
  });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col gap-4">
        
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-blue-600" />
            Phòng Chờ (Xét duyệt & Xếp lịch)
          </h2>
          <Button onClick={loadData} variant="outline" size="sm">Tải lại</Button>
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
              <option value="B-TD">Hạng B-TD</option>
              <option value="B-SS">Hạng B-SS</option>
              <option value="C1">Hạng C1</option>
              <option value="C">Hạng C</option>
              <option value="D2">Hạng D2</option>
              <option value="D">Hạng D</option>
            </select>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 bg-white p-2 rounded-lg border border-slate-200 shadow-sm w-full xl:w-auto">
            <div className="flex items-center gap-2 px-2 border-r border-slate-200 whitespace-nowrap">
              <span className="text-sm font-medium text-slate-600">Đã chọn:</span>
              <span className="font-bold text-indigo-600">{selectedCccds.size}</span>
            </div>
            
            <select 
              className="h-9 px-3 text-sm rounded-md border border-slate-300 bg-slate-50 flex-1 min-w-[200px]"
              value={selectedSchedule}
              onChange={e => setSelectedSchedule(e.target.value)}
            >
              <option value="">-- Chọn ngày thi Tốt nghiệp --</option>
              {schedules.map(sc => (
                <option key={sc.id} value={sc.exam_date}>
                  {sc.title} ({sc.exam_date})
                </option>
              ))}
            </select>
            
            <Button 
              onClick={handleAssign} 
              disabled={assigning || selectedCccds.size === 0 || !selectedSchedule}
              className="bg-indigo-600 hover:bg-indigo-700 h-9 whitespace-nowrap"
            >
              <Calendar className="w-4 h-4 mr-2" />
              {assigning ? "Đang xử lý..." : "Xác nhận xếp lịch"}
            </Button>
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto max-h-[600px]">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-600 uppercase bg-slate-100 sticky top-0 z-10 shadow-sm">
            <tr>
              <th className="px-4 py-3 w-12 text-center">
                <input 
                  type="checkbox" 
                  className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
                  checked={selectedCccds.size > 0 && selectedCccds.size === unassignedStudents.length}
                  onChange={toggleSelectAll}
                />
              </th>
              <th className="px-4 py-3 w-16">STT</th>
              <th className="px-4 py-3">Học viên</th>
              <th className="px-4 py-3 text-center">5 PDF Lý Thuyết</th>
              <th className="px-4 py-3 text-center">File DAT</th>
              <th className="px-4 py-3 text-center">File Mô Phỏng</th>
              <th className="px-4 py-3 text-center">Đủ Xăng/Dầu</th>
              <th className="px-4 py-3 text-center">Trạng thái</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={8} className="text-center py-8 text-slate-500">Đang tải dữ liệu...</td></tr>
            ) : unassignedStudents.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-8 text-slate-500">Không có học viên nào đang chờ xếp lịch</td></tr>
            ) : (
              unassignedStudents.map((st, i) => {
                const isDateValid = !st.exam_date || !st.file_completion_date || st.file_completion_date <= st.exam_date;
                const isEligible = st.has_5_pdf_lt && st.has_file_dat && st.has_file_mp && isDateValid;
                const isSelected = selectedCccds.has(st.cccd);
                
                return (
                  <tr key={st.cccd} className={`transition-colors ${isSelected ? 'bg-indigo-50/50' : 'hover:bg-slate-50/50'}`}>
                    <td className="px-4 py-3 text-center">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
                        checked={isSelected}
                        onChange={() => toggleSelect(st.cccd)}
                      />
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-600">{i + 1}</td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-800">{st.name}</div>
                      <div className="text-xs text-slate-500 mt-1 flex gap-2">
                        <span>CCCD: {st.cccd}</span>
                        {st.is_retake ? <span className="text-orange-600 font-medium border border-orange-200 bg-orange-50 px-1 rounded">Thi lại</span> : null}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <input type="checkbox" className="w-4 h-4 text-blue-600 rounded" checked={st.has_5_pdf_lt} onChange={() => handleToggle(st.cccd, 'has_5_pdf_lt', st.has_5_pdf_lt)} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <input type="checkbox" className="w-4 h-4 text-blue-600 rounded" checked={st.has_file_dat} onChange={() => handleToggle(st.cccd, 'has_file_dat', st.has_file_dat)} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <input type="checkbox" className="w-4 h-4 text-blue-600 rounded" checked={st.has_file_mp} onChange={() => handleToggle(st.cccd, 'has_file_mp', st.has_file_mp)} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <input type="checkbox" className="w-4 h-4 text-blue-600 rounded" checked={st.has_xang_dau} onChange={() => handleToggle(st.cccd, 'has_xang_dau', st.has_xang_dau)} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      {isEligible ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto" />
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800">
                          <AlertCircle className="w-3 h-3" /> Chưa đủ
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
