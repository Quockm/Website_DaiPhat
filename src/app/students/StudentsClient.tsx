"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import { StudentData, getStudents, updateStudentField } from "@/actions/students";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, User, Filter, Check, X } from "lucide-react";

type Props = {
  initialStudents: StudentData[];
  initialTotal: number;
  initialCompleted: number;
  initialIncomplete: number;
  initialPages: number;
  courseList: string[];
};

export default function StudentsClient({ initialStudents, initialTotal, initialCompleted, initialIncomplete, initialPages, courseList }: Props) {
  const [students, setStudents] = useState<StudentData[]>(initialStudents);
  const [total, setTotal] = useState(initialTotal);
  const [completed, setCompleted] = useState(initialCompleted);
  const [incomplete, setIncomplete] = useState(initialIncomplete);
  const [totalPages, setTotalPages] = useState(initialPages);
  
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState("B");
  const [course, setCourse] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  
  const isFirstRender = useRef(true);

  // Derive course list for selected category
  const filteredCourses = courseList.filter(c => {
    if (category === 'B01') return c.includes('B01');
    if (category === 'B') return c.includes('B') && !c.includes('B01');
    if (category === 'C1') return c.includes('C1') || c.includes('C');
    if (category === 'A1') return c.includes('A1');
    if (category === 'A') return c.includes('A') && !c.includes('A1') && !c.includes('A2');
    return true;
  });

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    
    const timer = setTimeout(async () => {
      setLoading(true);
      const res = await getStudents(page, 50, course, search, category);
      setStudents(res.data);
      setTotal(res.totalRecords);
      setCompleted(res.completedRecords || 0);
      setIncomplete(res.incompleteRecords || 0);
      setTotalPages(res.totalPages);
      setPage(res.currentPage);
      setLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [page, course, search, category]);

  const [isPending, startTransition] = useTransition();

  const handleUpdate = async (maDK: string, field: string, value: any) => {
    // Optimistic UI update
    setStudents(prev => prev.map(s => s.MaDK === maDK ? { ...s, [field]: value } : s));
    
    startTransition(async () => {
      await updateStudentField(maDK, field, value);
    });
  };

  const isAuto = ['B01', 'B', 'C1'].includes(category);
  const isMoto = ['A1', 'A'].includes(category);

  return (
    <Card className="bg-white shadow-md border-slate-200 overflow-hidden">
      <CardHeader className="bg-slate-50/80 border-b border-slate-100 pb-4 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
            <div className="p-1.5 bg-blue-100 rounded-md">
              <User className="h-5 w-5 text-blue-700" />
            </div>
            Danh sách Học viên ({total})
            <span className="ml-4 px-2 py-1 bg-green-100 text-green-700 text-xs rounded font-semibold">Hoàn thiện: {completed}</span>
            <span className="ml-2 px-2 py-1 bg-slate-200 text-slate-600 text-xs rounded font-semibold">Chưa HT: {incomplete}</span>
          </CardTitle>
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            {/* Filter Hạng */}
            <div className="relative w-full sm:w-auto">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select
                value={category}
                onChange={(e) => { 
                  setCategory(e.target.value); 
                  setCourse(""); // reset course when changing category
                  setPage(1); 
                }}
                className="pl-9 pr-8 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white w-full font-medium"
              >
                <option value="B">Hạng B</option>
                <option value="B01">Hạng B01</option>
                <option value="C1">Hạng C1</option>
                <option value="A1">Hạng A1</option>
                <option value="A">Hạng A</option>
              </select>
            </div>

          {/* Filter Khóa */}
          <div className="relative w-full sm:w-auto">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select
              value={course}
              onChange={(e) => { setCourse(e.target.value); setPage(1); }}
              className="pl-9 pr-8 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white w-full font-medium max-w-[200px]"
            >
              <option value="">Tất cả Khóa</option>
              {filteredCourses.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Tìm Tên, CCCD, Mã ĐK..." 
              className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-64 font-medium"
            />
          </div>
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
          <table className="w-full text-left text-sm text-slate-600 whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-700 font-extrabold uppercase text-xs border-b border-slate-200">
              <tr>
                <th className="px-4 py-4 min-w-[200px]">Thông tin học viên</th>
                <th className="px-4 py-4">Khóa</th>
                
                {isAuto && (
                  <>
                    <th className="px-4 py-4 text-center" title="Xăng dầu">Xăng</th>
                    <th className="px-4 py-4 text-center" title="Lý thuyết">LT</th>
                    <th className="px-4 py-4 text-center" title="Sa hình">SH</th>
                    <th className="px-4 py-4 text-center" title="Cabin">Cabin</th>
                    <th className="px-4 py-4 text-center" title="DAT">DAT</th>
                    <th className="px-4 py-4 text-center bg-indigo-50">Điểm KT</th>
                    <th className="px-4 py-4 text-center bg-indigo-50">Tốt nghiệp</th>
                    <th className="px-4 py-4 text-center bg-slate-100">Sát hạch</th>
                  </>
                )}

                {isMoto && (
                  <>
                    <th className="px-4 py-4 text-center">Hợp đồng</th>
                    <th className="px-4 py-4 text-center">Quyết định</th>
                    <th className="px-4 py-4 text-center">Giáo án</th>
                    <th className="px-4 py-4 text-center bg-indigo-50">Trạng thái</th>
                    <th className="px-4 py-4 text-center bg-slate-100">Sát hạch</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {students.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-slate-500">
                    Không tìm thấy dữ liệu phù hợp.
                  </td>
                </tr>
              ) : (
                students.map((student, idx) => {
                  
                  // Auto Logic
                  const autoCheckAll = (student.KT_XangDau == '1' && student.DT_LT === 1 && student.TN_SH == '1' && student.DT_Cabin === 1 && student.DT_DAT === 1);
                  const canGraduate = autoCheckAll && student.DT_KT5M !== null && student.DT_KT5M >= 5;
                  const canSatHach = canGraduate && student.TN_DT === 'Đậu';
                  
                  // Moto Logic
                  const motoCheckAll = (student.HS_HopDong === 1 && student.HS_KyTen === 1 && student.HS_DiemDanhLT === 1);
                  
                  // Completed (Hoàn thiện) for both
                  const isCompleted = student.SH_KetQua === 'Đậu';

                  return (
                    <tr key={student.MaDK || idx} className="hover:bg-indigo-50/50 transition-colors bg-white">
                      <td className="px-4 py-3">
                        <div className={`font-bold ${isCompleted ? 'text-green-600' : 'text-slate-900'}`}>{student.HoTen}</div>
                        <div className="text-slate-500 text-xs mt-0.5">{student.NgaySinh} | {student.CCCD}</div>
                        <div className="text-slate-400 text-[10px] mt-0.5">{student.MaDK}</div>
                      </td>
                      <td className="px-4 py-3 font-semibold text-indigo-700 text-xs">
                        {student.MaKhoa || '-'}
                      </td>
                      
                      {isAuto && (
                        <>
                          <td className="px-4 py-3 text-center">
                            <input type="checkbox" checked={student.KT_XangDau == '1'} onChange={(e) => handleUpdate(student.MaDK, 'KT_XangDau', e.target.checked ? '1' : null)} className="w-4 h-4 text-indigo-600 rounded cursor-pointer transition-transform hover:scale-110" />
                          </td>
                          <td className="px-4 py-3 text-center">
                            <input type="checkbox" checked={student.DT_LT === 1} onChange={(e) => handleUpdate(student.MaDK, 'DT_LT', e.target.checked ? 1 : null)} className="w-4 h-4 text-indigo-600 rounded cursor-pointer transition-transform hover:scale-110" />
                          </td>
                          <td className="px-4 py-3 text-center">
                            <input type="checkbox" checked={student.TN_SH == '1'} onChange={(e) => handleUpdate(student.MaDK, 'TN_SH', e.target.checked ? '1' : null)} className="w-4 h-4 text-indigo-600 rounded cursor-pointer transition-transform hover:scale-110" />
                          </td>
                          <td className="px-4 py-3 text-center">
                            <input type="checkbox" checked={student.DT_Cabin === 1} onChange={(e) => handleUpdate(student.MaDK, 'DT_Cabin', e.target.checked ? 1 : null)} className="w-4 h-4 text-indigo-600 rounded cursor-pointer transition-transform hover:scale-110" />
                          </td>
                          <td className="px-4 py-3 text-center">
                            <input type="checkbox" checked={student.DT_DAT === 1} onChange={(e) => handleUpdate(student.MaDK, 'DT_DAT', e.target.checked ? 1 : null)} className="w-4 h-4 text-indigo-600 rounded cursor-pointer transition-transform hover:scale-110" />
                          </td>
                          <td className="px-4 py-3 text-center bg-indigo-50/50">
                            <div className={`transition-all duration-500 ${autoCheckAll ? 'scale-100 opacity-100' : 'opacity-80'}`}>
                              <input 
                                type="number"
                                step="0.1"
                                disabled={!autoCheckAll}
                                value={student.DT_KT5M ?? ''}
                                onChange={(e) => handleUpdate(student.MaDK, 'DT_KT5M', e.target.value ? parseFloat(e.target.value) : null)}
                                className={`w-16 px-2 py-1 text-xs border rounded text-center transition-colors ${autoCheckAll ? 'border-indigo-400 bg-white shadow-[0_0_8px_rgba(99,102,241,0.4)]' : 'border-slate-300 bg-slate-100 cursor-not-allowed text-slate-400'}`} 
                                placeholder="Điểm"
                              />
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center bg-indigo-50/50">
                            <div className={`transition-all duration-500 ${canGraduate ? 'scale-100 opacity-100' : 'opacity-80'}`}>
                              <select 
                                disabled={!canGraduate}
                                value={student.TN_DT || ''}
                                onChange={(e) => handleUpdate(student.MaDK, 'TN_DT', e.target.value)}
                                className={`w-20 px-2 py-1 text-xs border rounded font-medium transition-colors ${canGraduate ? 'border-green-400 bg-white text-green-700 shadow-[0_0_8px_rgba(74,222,128,0.4)]' : 'border-slate-300 bg-slate-100 cursor-not-allowed text-slate-400'}`}
                              >
                                <option value="">- Chọn -</option>
                                <option value="Đậu">Đậu</option>
                                <option value="Rớt">Rớt</option>
                                <option value="Vắng">Vắng</option>
                              </select>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center bg-slate-50">
                            <div className={`transition-all duration-500 ${canSatHach ? 'scale-100 opacity-100' : 'opacity-80'}`}>
                              <select 
                                disabled={!canSatHach}
                                value={student.SH_KetQua || ''}
                                onChange={(e) => handleUpdate(student.MaDK, 'SH_KetQua', e.target.value)}
                                className={`w-20 px-2 py-1 text-xs border rounded font-medium transition-colors ${canSatHach ? 'border-amber-400 bg-white text-amber-700 shadow-[0_0_8px_rgba(251,191,36,0.4)]' : 'border-slate-300 bg-slate-100 cursor-not-allowed text-slate-400'}`}
                              >
                                <option value="">- Chọn -</option>
                                <option value="Đậu">Đậu</option>
                                <option value="Rớt">Rớt</option>
                                <option value="Vắng">Vắng</option>
                              </select>
                            </div>
                          </td>
                        </>
                      )}

                      {isMoto && (
                        <>
                          <td className="px-4 py-3 text-center">
                            <input type="checkbox" checked={student.HS_HopDong === 1} onChange={(e) => handleUpdate(student.MaDK, 'HS_HopDong', e.target.checked ? 1 : null)} className="w-4 h-4 text-indigo-600 rounded cursor-pointer transition-transform hover:scale-110" />
                          </td>
                          <td className="px-4 py-3 text-center">
                            <input type="checkbox" checked={student.HS_KyTen === 1} onChange={(e) => handleUpdate(student.MaDK, 'HS_KyTen', e.target.checked ? 1 : null)} className="w-4 h-4 text-indigo-600 rounded cursor-pointer transition-transform hover:scale-110" />
                          </td>
                          <td className="px-4 py-3 text-center">
                            <input type="checkbox" checked={student.HS_DiemDanhLT === 1} onChange={(e) => handleUpdate(student.MaDK, 'HS_DiemDanhLT', e.target.checked ? 1 : null)} className="w-4 h-4 text-indigo-600 rounded cursor-pointer transition-transform hover:scale-110" />
                          </td>
                          <td className="px-4 py-3 text-center bg-indigo-50/50">
                            <div className="transition-all duration-300">
                              {motoCheckAll ? (
                                <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold whitespace-nowrap animate-pulse">Hoàn thiện</span>
                              ) : (
                                <span className="text-slate-400 text-xs">-</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center bg-slate-50">
                            <div className={`transition-all duration-500 ${motoCheckAll ? 'scale-100 opacity-100' : 'opacity-80'}`}>
                              <select 
                                disabled={!motoCheckAll}
                                value={student.SH_KetQua || ''}
                                onChange={(e) => handleUpdate(student.MaDK, 'SH_KetQua', e.target.value)}
                                className={`w-20 px-2 py-1 text-xs border rounded font-medium transition-colors ${motoCheckAll ? 'border-amber-400 bg-white text-amber-700 shadow-[0_0_8px_rgba(251,191,36,0.4)]' : 'border-slate-300 bg-slate-100 cursor-not-allowed text-slate-400'}`}
                              >
                                <option value="">- Chọn -</option>
                                <option value="Đậu">Đậu</option>
                                <option value="Rớt">Rớt</option>
                                <option value="Vắng">Vắng</option>
                              </select>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50">
            <span className="text-sm text-slate-600 font-medium">
              Trang {page} / {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 text-sm font-bold border border-slate-300 rounded-md bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Trước
              </button>
              <button 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 text-sm font-bold border border-slate-300 rounded-md bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
