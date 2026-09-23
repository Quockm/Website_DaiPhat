"use client";
import React, { useState, useEffect } from "react";
import { getTestingStudents, updateTestingCheck, assignTestingExamDates, syncGraduationToTesting } from "@/actions/testing/students.actions";
import { getExamSchedules } from "@/actions/exam-schedules.actions";
import { Button } from "@/components/ui/button";
import { FileCheck, AlertCircle, Calendar, CheckCircle2 } from "lucide-react";

// Helper to parse "DD/MM/YYYY" or "YYYY-MM-DD" into a JS Date
function parseDate(dateStr: string) {
  if (!dateStr) return null;
  if (dateStr.includes('/')) {
    const [d, m, y] = dateStr.split('/');
    return new Date(Number(y), Number(m) - 1, Number(d));
  }
  return new Date(dateStr);
}

export function TestingEligibilityTab() {
  const [students, setStudents] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Batch selection states
  const [selectedCccds, setSelectedCccds] = useState<Set<string>>(new Set());
  const [selectedSchedule, setSelectedSchedule] = useState<string>("");
  const [assigning, setAssigning] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterHang, setFilterHang] = useState("");
  const [minDays, setMinDays] = useState(18);

  const loadData = async () => {
    setLoading(true);
    // Tự động đồng bộ các học viên đã ĐẠT Tốt nghiệp sang bảng Sát hạch
    await syncGraduationToTesting();

    const [resStudents, resSchedules] = await Promise.all([
      getTestingStudents(),
      getExamSchedules('SH')
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

  const handleToggle = async (cccd: string, field: 'is_health_check' | 'is_profile_valid', currentValue: boolean) => {
    setStudents(prev => prev.map(s => s.cccd === cccd ? { ...s, [field]: !currentValue } : s));
    const res = await updateTestingCheck(cccd, field, !currentValue);
    if (!res.success) {
      alert("Lỗi lưu dữ liệu: " + res.error);
      loadData();
    }
  };

  const handleAssign = async () => {
    if (!selectedSchedule) return alert("Vui lòng chọn ngày thi dự kiến trước!");
    if (selectedCccds.size === 0) return alert("Vui lòng chọn ít nhất 1 học viên đủ điều kiện!");
    
    setAssigning(true);
    const res = await assignTestingExamDates(Array.from(selectedCccds), selectedSchedule);
    if (res.success) {
      alert(`Đã xếp lịch thi cho ${selectedCccds.size} học viên thành công!`);
      loadData();
    } else {
      alert("Lỗi xếp lịch: " + res.error);
    }
    setAssigning(false);
  };

  // Tính toán điều kiện của từng học viên
  const checkEligibility = (st: any) => {
    if (!selectedSchedule) return false;
    if (!st.tn_kq_final || st.tn_kq_final.trim().toUpperCase() !== 'ĐẠT') return false;
    
    const scheduleDateObj = parseDate(selectedSchedule);
    const tnDateObj = parseDate(st.tn_exam_date);
    
    if (!scheduleDateObj || !tnDateObj) return false;
    
    const diffTime = scheduleDateObj.getTime() - tnDateObj.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    const isTimeValid = scheduleDateObj >= tnDateObj && diffDays >= minDays;
    return isTimeValid && st.is_health_check && st.is_profile_valid;
  };

  // Chỉ hiển thị học viên chưa có lịch thi + lọc cơ bản
  const unassignedStudents = students.filter(st => {
    if (st.exam_date && st.exam_date.trim() !== '') return false;
    if (!st.tn_kq_final || st.tn_kq_final.trim().toUpperCase() !== 'ĐẠT') return false; // Chỉ lấy người đã ĐẠT Tốt nghiệp
    if (filterHang && st.hang !== filterHang) return false;
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      if (!st.name?.toLowerCase().includes(lower) && !st.cccd?.toLowerCase().includes(lower)) return false;
    }
    return true;
  });

  const toggleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      // Chỉ cho phép chọn những người đủ điều kiện
      const eligibleCccds = unassignedStudents.filter(checkEligibility).map(s => s.cccd);
      setSelectedCccds(new Set(eligibleCccds));
    } else {
      setSelectedCccds(new Set());
    }
  };

  const toggleSelect = (cccd: string, isEligible: boolean) => {
    if (!isEligible) return alert("Học viên này chưa đủ điều kiện!");
    const next = new Set(selectedCccds);
    if (next.has(cccd)) next.delete(cccd);
    else next.add(cccd);
    setSelectedCccds(next);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col gap-4">
        
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-blue-600" />
            Phòng Chờ Xét Duyệt & Xếp Lịch Sát Hạch
          </h2>
          <Button onClick={loadData} variant="outline" size="sm" className="bg-white" disabled={loading}>
            {loading ? "Đang tải..." : "Tải lại"}
          </Button>
        </div>

        <div className="flex flex-wrap items-end gap-4 p-4 bg-white rounded-lg border border-slate-200 shadow-sm">
          <div className="space-y-1.5 flex-1 min-w-[200px]">
            <label className="text-sm font-semibold text-slate-700 flex items-center gap-1">
              <Calendar className="w-4 h-4 text-blue-600"/> Ngày dự kiến thi Sát hạch
            </label>
            <select 
              value={selectedSchedule}
              onChange={(e) => {
                setSelectedSchedule(e.target.value);
                setSelectedCccds(new Set()); // reset selection when date changes
              }}
              className="w-full h-10 border border-slate-300 rounded-md px-3 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 font-medium"
            >
              <option value="">-- Chọn ngày thi dự kiến --</option>
              {schedules.map(sch => (
                <option key={sch.id} value={sch.exam_date}>
                  {sch.exam_date} {sch.title ? `- ${sch.title}` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5 w-32">
            <label className="text-sm font-semibold text-slate-700">Tối thiểu (ngày)</label>
            <input 
              type="number" 
              value={minDays} 
              onChange={e => { setMinDays(Number(e.target.value)); setSelectedCccds(new Set()); }}
              className="w-full h-10 border border-slate-300 rounded-md px-3 text-center font-medium"
            />
          </div>
          
          <Button 
            onClick={handleAssign} 
            disabled={assigning || selectedCccds.size === 0 || !selectedSchedule}
            className="h-10 bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm px-6"
          >
            {assigning ? "Đang xử lý..." : `Xác nhận Xếp lịch (${selectedCccds.size})`}
          </Button>
        </div>

        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Tìm theo CCCD hoặc Tên..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 border border-slate-300 rounded-md px-3 py-2"
          />
          <select
            value={filterHang}
            onChange={(e) => setFilterHang(e.target.value)}
            className="border border-slate-300 rounded-md px-3 py-2 w-48"
          >
            <option value="">Tất cả các hạng</option>
            <option value="B-TD">B-TD</option>
            <option value="B-SS">B-SS</option>
            <option value="C1">C1</option>
            <option value="C">C</option>
            <option value="D2">D2</option>
            <option value="D">D</option>
          </select>
        </div>

      </div>

      <div className="overflow-x-auto max-h-[500px]">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-700 uppercase bg-slate-100 sticky top-0 z-10 shadow-sm">
            <tr>
              <th className="px-4 py-3 w-12 text-center border-r border-slate-200">
                <input 
                  type="checkbox" 
                  className="rounded border-slate-300 w-4 h-4 cursor-pointer"
                  onChange={toggleSelectAll}
                  checked={unassignedStudents.length > 0 && selectedCccds.size > 0 && selectedCccds.size === unassignedStudents.filter(checkEligibility).length}
                />
              </th>
              <th className="px-4 py-3 font-semibold border-r border-slate-200">CCCD</th>
              <th className="px-4 py-3 font-semibold border-r border-slate-200">Họ và Tên</th>
              <th className="px-4 py-3 font-semibold text-center border-r border-slate-200">Hạng</th>
              <th className="px-4 py-3 font-semibold text-center border-r border-slate-200">Ngày đậu TN</th>
              <th className="px-4 py-3 font-semibold text-center border-r border-slate-200 w-28">Sức khỏe hợp lệ</th>
              <th className="px-4 py-3 font-semibold text-center border-r border-slate-200 w-28">Hồ sơ đạt</th>
              <th className="px-4 py-3 font-semibold text-center w-32">Điều kiện</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="text-center py-8 text-slate-500">Đang tải dữ liệu...</td></tr>
            ) : unassignedStudents.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-8 text-slate-500">Không có học viên nào đang chờ xếp lịch (Đã thi đậu TN).</td></tr>
            ) : (
              unassignedStudents.map((st, i) => {
                const isEligible = checkEligibility(st);
                const isSelected = selectedCccds.has(st.cccd);

                return (
                  <tr key={st.cccd} className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${isSelected ? 'bg-blue-50/50' : ''}`}>
                    <td className="px-4 py-3 text-center border-r border-slate-100">
                      <input 
                        type="checkbox" 
                        className={`rounded w-4 h-4 ${isEligible ? 'cursor-pointer border-slate-300' : 'cursor-not-allowed border-slate-200 bg-slate-100'}`}
                        checked={isSelected}
                        onChange={() => toggleSelect(st.cccd, isEligible)}
                        disabled={!isEligible}
                      />
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-700 border-r border-slate-100">{st.cccd}</td>
                    <td className="px-4 py-3 text-slate-900 font-semibold border-r border-slate-100">{st.name}</td>
                    <td className="px-4 py-3 text-center border-r border-slate-100">
                      <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs font-bold">{st.hang}</span>
                    </td>
                    <td className="px-4 py-3 text-center text-slate-600 font-medium border-r border-slate-100">
                      {st.tn_exam_date || '-'}
                    </td>
                    <td className="px-4 py-3 text-center border-r border-slate-100">
                      <button 
                        onClick={() => handleToggle(st.cccd, 'is_health_check', st.is_health_check)}
                        className={`w-6 h-6 rounded-md inline-flex items-center justify-center transition-colors ${st.is_health_check ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                      >
                        {st.is_health_check ? "✓" : ""}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-center border-r border-slate-100">
                      <button 
                        onClick={() => handleToggle(st.cccd, 'is_profile_valid', st.is_profile_valid)}
                        className={`w-6 h-6 rounded-md inline-flex items-center justify-center transition-colors ${st.is_profile_valid ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                      >
                        {st.is_profile_valid ? "✓" : ""}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {!selectedSchedule ? (
                        <span className="text-xs text-slate-400 italic">Chưa chọn ngày thi</span>
                      ) : isEligible ? (
                        <div className="flex items-center justify-center gap-1.5 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full w-max mx-auto">
                          <CheckCircle2 className="w-4 h-4" />
                          <span className="text-xs font-bold">Đủ ĐK</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-1.5 text-red-500 bg-red-50 px-2 py-1 rounded-full w-max mx-auto">
                          <AlertCircle className="w-4 h-4" />
                          <span className="text-xs font-medium">Chưa đủ</span>
                        </div>
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
