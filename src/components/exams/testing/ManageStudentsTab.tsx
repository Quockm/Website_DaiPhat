"use client";

import React from "react";
import { Users, Search, RefreshCw, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getExamSchedules } from "@/actions/exam-schedules.actions";

export function ManageStudentsTab() {
  const [students, setStudents] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [schedules, setSchedules] = React.useState<any[]>([]);
  const [selectedScheduleId, setSelectedScheduleId] = React.useState<string>("");

  React.useEffect(() => {
    getExamSchedules('SH').then(res => {
      if (res.success && res.data && res.data.length > 0) {
        setSchedules(res.data);
        setSelectedScheduleId(res.data[0].id.toString());
      } else {
        loadData("");
      }
    });
  }, []);

  React.useEffect(() => {
    if (selectedScheduleId) {
      loadData(selectedScheduleId);
    }
  }, [selectedScheduleId]);

  const loadData = async (scheduleId: string) => {
    setLoading(true);
    try {
      const { getTestingStudents } = await import("@/actions/testing/students.actions");
      const res = await getTestingStudents(scheduleId);
      if (res.success && res.data) {
        setStudents(res.data);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

    const isRequired = (ndsh: string, type: 'lt' | 'hinh' | 'duong' | 'gplx', hang: string = "") => {
  if (type === 'gplx') return true;
  if (!ndsh) return true;

  const s = ndsh.toLowerCase();
  const hangLower = hang.toLowerCase();

  let hasLt = false;
  let hasHinh = false;
  let hasDuong = false;

  const isRetake = s.includes('lại') || s.includes('lai');
  if (isRetake) {
    const sClean = s.replace('lại', '').replace('lai', '');
    const checkSubject = (sub: string, singleChar: string) => {
      if (sClean.includes(sub)) return true;
      const regex = new RegExp('(^|[^\\p{L}])' + singleChar + '([^\\p{L}]|$)', 'u');
      return regex.test(sClean);
    };
    
    hasLt = checkSubject('lý thuyết', 'l') || sClean.includes('lt');
    hasHinh = checkSubject('hình', 'h');
    hasDuong = checkSubject('đường', 'đ') || checkSubject('đường', 'd');
  } else {
    hasLt = true;
    hasHinh = true;
    hasDuong = !hangLower.includes('a');
  }

  const subjects: string[] = [];
  if (hasLt) subjects.push('lt');
  if (hasHinh) subjects.push('hinh');
  if (hasDuong) subjects.push('duong');

  if (!subjects.includes(type)) return false;
  if (subjects[0] === type) return false;
  
  return true;
};

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
              <Users className="w-5 h-5" />
            </div>
            Quản Lý Học Viên
          </h2>
          <p className="text-slate-500 text-sm font-medium mt-1">Dữ liệu kết nối trực tiếp từ DB: DP_SH_System</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-500 hidden md:block" />
            <select 
              className="bg-white border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2 outline-none font-medium min-w-[200px]"
              value={selectedScheduleId}
              onChange={(e) => setSelectedScheduleId(e.target.value)}
            >
              {schedules.map(s => (
                <option key={s.id} value={s.id}>{s.title} ({s.exam_date})</option>
              ))}
            </select>
          </div>
          
          <div className="relative flex-1 md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input className="pl-9 bg-slate-50 border-slate-200" placeholder="Tìm theo Tên, CCCD hoặc SBD..." />
          </div>
          <Button variant="outline" className="gap-2 shrink-0" onClick={() => loadData(selectedScheduleId)} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Làm mới
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
              <tr>
                <th className="p-4 text-center text-slate-600 font-semibold border-b">STT</th>
                <th className="p-4 text-center text-slate-600 font-semibold border-b w-24">Ảnh</th>
                <th className="p-4 text-left text-slate-600 font-semibold border-b">Thông tin chung</th>
                <th className="p-4 text-left text-slate-600 font-semibold border-b">Khóa học / SBD</th>
                <th className="p-4 text-left text-slate-600 font-semibold border-b">Nội dung SH</th>
                <th className="p-4 text-center text-slate-600 font-semibold border-b">Trạng thái QR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={6} className="p-10 text-center text-slate-500 font-medium">Đang kết nối Database DP_SH_System và tải dữ liệu...</td></tr>
              ) : students.length === 0 ? (
                <tr><td colSpan={5} className="p-10 text-center text-slate-400">Không tìm thấy học viên nào trong Database.</td></tr>
              ) : (
                students.map((student, idx) => (
                  <tr key={student.cccd || idx} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 text-center font-medium text-slate-500">{student.stt || idx + 1}</td>
                    <td className="p-4 text-center w-24">
                      <div className="w-12 h-16 mx-auto bg-slate-100 rounded border border-slate-200 overflow-hidden flex items-center justify-center">
                        <img 
                          src={`/api/images/portraits/${student.cccd?.trim()}.jpg`} 
                          alt={student.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            if (!e.currentTarget.src.includes('ui-avatars.com')) {
                              e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&background=e2e8f0&color=475569&size=128`;
                            }
                          }}
                        />
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-slate-800">{student.name}</div>
                      <div className="text-slate-500 text-xs mt-1">CCCD: {student.cccd}</div>
                      <div className="text-slate-500 text-xs mt-0.5">NS: {student.dob}</div>
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-slate-700">SBD: {student.sbd}</div>
                      <div className="text-slate-500 text-xs mt-1 font-mono bg-slate-100 p-1 rounded w-fit border border-slate-200">Mã ĐK: {student.ma_dk || 'N/A'}</div>
                      <div className="text-slate-500 text-xs mt-1">Hạng: {student.hang}</div>
                      <div className="text-slate-500 text-xs mt-0.5">Trường: {student.school}</div>
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-slate-700">{student.ndsh || <span className="italic text-slate-400">N/A</span>}</div>
                    </td>
                    <td className="p-4">
                      <div className="flex justify-center gap-2">
                        {!isRequired(student.ndsh, 'hinh', student.hang) ? null : student.qr_hinh ? 
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-bold">HÌNH</span> : 
                          <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-bold">HÌNH</span>}
                        {!isRequired(student.ndsh, 'duong', student.hang) ? null : student.qr_duong ? 
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-bold">ĐƯỜNG</span> : 
                          <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-bold">ĐƯỜNG</span>}
                        {!isRequired(student.ndsh, 'gplx', student.hang) ? null : student.qr_gplx ? 
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-bold">GPLX</span> : 
                          <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-bold">GPLX</span>}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
