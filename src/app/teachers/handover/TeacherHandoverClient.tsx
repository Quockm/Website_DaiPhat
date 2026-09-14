"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, ChevronLeft, ChevronRight, FileCheck, CheckCircle2 } from "lucide-react";
import { getTeachers, updateTeacher, TeacherData } from "@/actions/teachers";

type Props = {
  initialTeachers: TeacherData[];
  initialTotal: number;
  initialPages: number;
};

export default function TeacherHandoverClient({ initialTeachers, initialTotal, initialPages }: Props) {
  const [teachers, setTeachers] = useState<TeacherData[]>(initialTeachers);
  const [total, setTotal] = useState(initialTotal);
  const [totalPages, setTotalPages] = useState(initialPages);
  
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    
    const timer = setTimeout(async () => {
      setLoading(true);
      const res = await getTeachers(page, 50, search, "all", "all", "Đại Phát", "Giáo viên");
      setTeachers(res.data);
      setTotal(res.totalRecords);
      setTotalPages(res.totalPages);
      setPage(res.currentPage);
      setLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [page, search]);

  const handleUpdate = async (id: number, updates: Partial<TeacherData>) => {
    setTeachers(prev => prev.map(t => t.Id === id ? { ...t, ...updates } : t));
    
    const res = await updateTeacher(id, updates);
    if (!res.success) {
      alert("Lỗi khi cập nhật: " + res.error);
      const freshRes = await getTeachers(page, 50, search, "all", "all", "Đại Phát", "Giáo viên");
      setTeachers(freshRes.data);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Bàn giao Hồ sơ Giáo viên</h1>
          <p className="text-slate-500 text-sm mt-1">Đánh dấu 05 loại hồ sơ và chuyển trạng thái để bàn giao sang Nhân sự</p>
        </div>
      </div>

      <Card className="bg-white shadow-md border-slate-200 overflow-hidden relative">
        <CardHeader className="bg-slate-50/80 border-b border-slate-100 pb-4 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <div className="p-1.5 bg-indigo-100 rounded-md">
                <FileCheck className="h-5 w-5 text-indigo-700" />
              </div>
              Danh sách Giáo viên ({total})
            </CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Tìm tên, CCCD, SĐT..." 
                className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full font-medium"
              />
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0 relative">
          {loading && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          )}
          
          <div className="overflow-x-auto min-h-[400px]">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-extrabold uppercase text-xs border-b border-slate-200">
                <tr>
                  <th className="px-4 py-4 w-12 text-center">STT</th>
                  <th className="px-4 py-4">Giáo viên</th>
                  <th className="px-2 py-4 text-center">CCCD</th>
                  <th className="px-2 py-4 text-center">GPLX(ĐT)</th>
                  <th className="px-2 py-4 text-center">Bằng TN</th>
                  <th className="px-2 py-4 text-center">NVSP</th>
                  <th className="px-2 py-4 text-center border-r border-slate-100">GVTH</th>
                  <th className="px-4 py-4 text-center">Trạng thái Bàn giao</th>
                  <th className="px-4 py-4 text-center">NS Xác nhận</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {teachers.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-slate-500">
                      Không tìm thấy giáo viên nào.
                    </td>
                  </tr>
                ) : (
                  teachers.map((teacher, idx) => {
                    const isCompleted = teacher.NhanSuXacNhanGV;
                    return (
                      <tr 
                        key={teacher.Id} 
                        className={`transition-colors ${isCompleted ? 'bg-green-50/80 hover:bg-green-100/80' : 'bg-white hover:bg-slate-50'}`}
                      >
                        <td className="px-4 py-3 text-center font-semibold text-slate-500">
                          {(page - 1) * 50 + idx + 1}
                        </td>
                        <td className="px-4 py-3 font-bold text-indigo-700">
                          {teacher.HoTen}
                        </td>
                        
                        <td className="px-2 py-3 text-center">
                          <input 
                            type="checkbox" 
                            checked={!!teacher.BanGiaoCCCD} 
                            onChange={(e) => handleUpdate(teacher.Id, { BanGiaoCCCD: e.target.checked })}
                            className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                          />
                        </td>
                        <td className="px-2 py-3 text-center">
                          <input 
                            type="checkbox" 
                            checked={!!teacher.BanGiaoGPLX} 
                            onChange={(e) => handleUpdate(teacher.Id, { BanGiaoGPLX: e.target.checked })}
                            className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                          />
                        </td>
                        <td className="px-2 py-3 text-center">
                          <input 
                            type="checkbox" 
                            checked={!!teacher.BanGiaoBangTN} 
                            onChange={(e) => handleUpdate(teacher.Id, { BanGiaoBangTN: e.target.checked })}
                            className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                          />
                        </td>
                        <td className="px-2 py-3 text-center">
                          <input 
                            type="checkbox" 
                            checked={!!teacher.BanGiaoNVSP} 
                            onChange={(e) => handleUpdate(teacher.Id, { BanGiaoNVSP: e.target.checked })}
                            className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                          />
                        </td>
                        <td className="px-2 py-3 text-center border-r border-slate-100">
                          <input 
                            type="checkbox" 
                            checked={!!teacher.BanGiaoGVTH} 
                            onChange={(e) => handleUpdate(teacher.Id, { BanGiaoGVTH: e.target.checked })}
                            className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                          />
                        </td>
                        
                        <td className="px-4 py-3 text-center">
                          <select
                            value={teacher.TrangThaiBanGiaoGV || "Chưa nhận"}
                            onChange={(e) => {
                              const value = e.target.value;
                              const updates: Partial<TeacherData> = { TrangThaiBanGiaoGV: value };
                              if (value === "Đã bàn giao") {
                                const now = new Date();
                                updates.NgayBanGiaoGV = now.toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });
                              } else {
                                updates.NgayBanGiaoGV = null;
                              }
                              handleUpdate(teacher.Id, updates);
                            }}
                            className={`px-2 py-1.5 text-xs font-bold rounded border-0 cursor-pointer outline-none ${
                              teacher.TrangThaiBanGiaoGV === 'Đã bàn giao' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            <option value="Chưa nhận">Chưa nhận</option>
                            <option value="Đã bàn giao">Đã bàn giao</option>
                          </select>
                          {teacher.TrangThaiBanGiaoGV === 'Đã bàn giao' && teacher.NgayBanGiaoGV && (
                            <div className="text-[10px] text-emerald-600 mt-1 font-medium">{teacher.NgayBanGiaoGV}</div>
                          )}
                        </td>
                        
                        <td className="px-4 py-3 text-center flex items-center justify-center gap-2">
                          {isCompleted ? (
                            <span className="flex items-center gap-1 text-green-600 font-bold text-xs bg-green-100 px-2 py-1 rounded border border-green-200">
                              <CheckCircle2 className="w-4 h-4" /> Đã XN
                            </span>
                          ) : (
                            <span className="text-slate-400 text-xs font-medium">Chưa XN</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50">
              <span className="text-sm text-slate-500 font-medium">
                Trang {page} / {totalPages}
              </span>
              <div className="flex gap-2">
                <button 
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1 border border-slate-300 rounded hover:bg-white disabled:opacity-50 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5 text-slate-600" />
                </button>
                <button 
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-1 border border-slate-300 rounded hover:bg-white disabled:opacity-50 transition-colors"
                >
                  <ChevronRight className="w-5 h-5 text-slate-600" />
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
