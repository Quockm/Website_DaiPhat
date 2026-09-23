"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Contact, ChevronLeft, ChevronRight, Edit, X, Save, Trash2, Users } from "lucide-react";
import { getTeachers, updateTeacher, addTeacher, deleteTeacher, TeacherData } from "@/actions/teachers";
import * as Tabs from "@radix-ui/react-tabs";

type Props = {
  initialTeachers: TeacherData[];
  initialTotal: number;
  initialPages: number;
  initialStats: {
    total: number;
    details: Record<string, number>;
  };
};

export default function TeachersClient({ initialTeachers, initialTotal, initialPages, initialStats }: Props) {
  const [teachers, setTeachers] = useState<TeacherData[]>(initialTeachers);
  const [total, setTotal] = useState(initialTotal);
  const [totalPages, setTotalPages] = useState(initialPages);
  const [stats, setStats] = useState(initialStats);
  
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [trungTamFilter, setTrungTamFilter] = useState("Đại Phát");
  const [loading, setLoading] = useState(false);
  
  // Edit State
  const [editingTeacher, setEditingTeacher] = useState<TeacherData | null>(null);
  const [editForm, setEditForm] = useState<Partial<TeacherData>>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState("dao-tao");

  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    
    const timer = setTimeout(async () => {
      setLoading(true);
      const res = await getTeachers(page, 50, search, category, "", trungTamFilter);
      setTeachers(res.data);
      setTotal(res.totalRecords);
      setTotalPages(res.totalPages);
      setPage(res.currentPage);
      setLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [page, search, category, trungTamFilter]);

  const handleEditClick = (teacher: TeacherData) => {
    setEditingTeacher(teacher);
    setActiveTab("dao-tao");
    setEditForm({
      HoTen: teacher.HoTen,
      NgaySinh: teacher.NgaySinh,
      CCCD: teacher.CCCD,
      TrinhDo: teacher.TrinhDo,
      HangGPLX: teacher.HangGPLX,
      HanGPLX: teacher.HanGPLX,
      HangGVTH: teacher.HangGVTH,
      SDT: teacher.SDT,
      NguoiPhuTrach: teacher.NguoiPhuTrach,
      TrungTam: teacher.TrungTam || "Đại Phát",
      
      // New fields
      NhomGiaoVien: teacher.NhomGiaoVien,
      HanCCCD: teacher.HanCCCD,
      TinhTrangHanCCCD: teacher.TinhTrangHanCCCD,
      HinhThucTuyenDung: teacher.HinhThucTuyenDung,
      LoaiHopDong: teacher.LoaiHopDong,
      SoHopDong: teacher.SoHopDong,
      NgayBaoTangBHXH: teacher.NgayBaoTangBHXH,
      SoBHXH: teacher.SoBHXH,
      TrinhDoVanHoa: teacher.TrinhDoVanHoa,
      TrinhDoChuyenMon: teacher.TrinhDoChuyenMon,
      TrinhDoSuPham: teacher.TrinhDoSuPham,
      BacNVSP: teacher.BacNVSP,
      NgayTrungTuyenGPLX: teacher.NgayTrungTuyenGPLX,
      TinhTrangHanGPLX: teacher.TinhTrangHanGPLX,
      HangGiaoVien: teacher.HangGiaoVien,
      HanSucKhoe: teacher.HanSucKhoe,
      TrangThaiBHXH: teacher.TrangThaiBHXH,
      NoiSinh: teacher.NoiSinh,
      DiaChiThuongTru: teacher.DiaChiThuongTru,
      NoiDangKyKhamChuaBenh: teacher.NoiDangKyKhamChuaBenh,
      MaSoThue: teacher.MaSoThue,
    });
  };

  const commonHangs = ["B", "B1", "B2", "C", "D", "E", "F", "GVLT"];
  const allHangs = Array.from(new Set([...commonHangs, ...Object.keys(stats.details)])).filter(h => h && h !== "Khác");
  const trinhDoOptions = ["Trung cấp", "Cao đẳng", "Đại học", "Cao học"];

  const handleSave = async () => {
    if (!editingTeacher) return;
    setSaving(true);
    if (editingTeacher.Id === 0) {
      const res = await addTeacher(editForm);
      if (res.success) {
        window.location.reload();
      } else {
        alert("Lỗi khi thêm: " + res.error);
      }
    } else {
      const res = await updateTeacher(editingTeacher.Id, editForm);
      if (res.success) {
        setTeachers(teachers.map(t => t.Id === editingTeacher.Id ? { ...t, ...editForm } : t));
        setEditingTeacher(null);
      } else {
        alert("Lỗi khi lưu: " + res.error);
      }
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!editingTeacher) return;
    if (confirm(`Bạn có chắc chắn muốn xóa giáo viên ${editingTeacher.HoTen}?`)) {
      setDeleting(true);
      const res = await deleteTeacher(editingTeacher.Id);
      if (res.success) {
        setTeachers(teachers.filter(t => t.Id !== editingTeacher.Id));
        setTotal(t => Math.max(0, t - 1));
        setEditingTeacher(null);
      } else {
        alert("Lỗi khi xóa: " + res.error);
      }
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Compact Stats Ribbon */}
      <div className="flex flex-col md:flex-row justify-between gap-4 bg-white p-3 rounded-xl border border-slate-200 shadow-sm items-stretch">
        {/* Left: Tổng */}
        <div className="flex items-center justify-center gap-4 px-6 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-200 shadow-sm min-h-full w-full md:w-auto">
          <Users className="w-8 h-8 text-indigo-500" />
          <div className="flex flex-col items-start">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-500 mb-1">Tổng cộng</span>
            <span className="text-4xl font-black leading-none">{stats.total}</span>
          </div>
        </div>
        
        {/* Right: Chi tiết */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 ml-auto w-full md:w-auto">
          {Object.entries(stats.details).map(([cat, count]) => (
            <div key={cat} className="flex items-center justify-between gap-3 px-3 py-2 bg-slate-50 text-slate-700 rounded-lg border border-slate-100 hover:border-indigo-200 hover:bg-white transition-colors cursor-default shadow-sm">
              <span className="text-xs font-semibold text-slate-500 uppercase">Hạng {cat}:</span>
              <span className="text-sm font-black text-indigo-600">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Table Card */}
      <Card className="bg-white shadow-md border-slate-200 overflow-hidden relative">
        <CardHeader className="bg-slate-50/80 border-b border-slate-100 pb-4 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <div className="p-1.5 bg-blue-100 rounded-md">
                <Contact className="h-5 w-5 text-blue-700" />
              </div>
              Danh sách Giáo viên ({total})
            </CardTitle>
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
              <button
                onClick={() => {
                  setEditingTeacher({ Id: 0, HoTen: '', STT: 0, NgaySinh: '', CCCD: '', TrinhDo: '', HangGPLX: '', HangGVTH: '', SDT: '', NguoiPhuTrach: '', HanGPLX: '', Avatar: '', TrungTam: 'Đại Phát' });
                  setEditForm({});
                }}
                className="w-full sm:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                Thêm mới
              </button>
              <select
                value={trungTamFilter}
                onChange={(e) => { setTrungTamFilter(e.target.value); setPage(1); }}
                className="w-full sm:w-auto px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium bg-white text-slate-700"
              >
                <option value="Đại Phát">Đại Phát</option>
                <option value="Tiến Thành">Tiến Thành</option>
              </select>

              <select 
                value={category}
                onChange={(e) => { setCategory(e.target.value); setPage(1); }}
                className="w-full sm:w-auto px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium bg-white text-slate-700"
              >
                <option value="all">Tất cả hạng</option>
                {Object.keys(stats.details).map(cat => (
                  <option key={cat} value={cat}>Hạng {cat}</option>
                ))}
              </select>

              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  placeholder="Tìm Tên, CCCD, SĐT..." 
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
          
          <div className="overflow-x-auto min-h-[500px]">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-extrabold uppercase text-xs border-b border-slate-200">
                <tr>
                  <th className="px-4 py-4 w-12 text-center">STT</th>
                  <th className="px-4 py-4 min-w-[200px]">Giáo viên</th>
                  <th className="px-4 py-4">Trung tâm</th>
                  <th className="px-4 py-4">Trình độ</th>
                  <th className="px-4 py-4 text-center">Hạng GPLX</th>
                  <th className="px-4 py-4 text-center">Hạn GPLX</th>
                  <th className="px-4 py-4 text-center">GVTH</th>
                  <th className="px-4 py-4">SĐT</th>
                  <th className="px-4 py-4">Người phụ trách</th>
                  <th className="px-4 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {teachers.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-slate-500">
                      Không tìm thấy dữ liệu phù hợp.
                    </td>
                  </tr>
                ) : (
                  teachers.map((teacher, idx) => (
                    <tr key={teacher.Id || idx} className="hover:bg-indigo-50/50 transition-colors bg-white group">
                      <td className="px-4 py-3 text-center font-semibold text-slate-500">
                        {(page - 1) * 50 + idx + 1}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900">{teacher.HoTen}</div>
                        <div className="text-slate-500 text-xs mt-0.5">{teacher.NgaySinh} | {teacher.CCCD}</div>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-700">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs font-bold border border-slate-200">
                          {teacher.TrungTam || 'Đại Phát'}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-700">
                        {teacher.TrinhDo || '-'}
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-indigo-700">
                        {teacher.HangGPLX || '-'}
                      </td>
                      <td className="px-4 py-3 text-center font-semibold text-rose-600">
                        {teacher.HanGPLX || '-'}
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-emerald-700">
                        {teacher.HangGVTH || '-'}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-700">
                        {teacher.SDT || '-'}
                      </td>
                      <td className="px-4 py-3 text-xs font-semibold text-indigo-600">
                        {teacher.NguoiPhuTrach || '-'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button 
                          onClick={() => handleEditClick(teacher)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
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

      {/* Edit Modal */}
      {editingTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <Card className="w-full max-w-4xl bg-white shadow-2xl border-0 overflow-hidden flex flex-col max-h-[90vh]">
            <CardHeader className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex flex-row items-center justify-between shrink-0">
              <CardTitle className="text-lg font-bold text-slate-800">{editingTeacher.Id === 0 ? "Thêm mới Giáo viên" : `Chỉnh sửa Giáo viên: ${editForm.HoTen || ""}`}</CardTitle>
              <button onClick={() => setEditingTeacher(null)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </CardHeader>
            <CardContent className="p-0 overflow-hidden flex flex-col">
              
              
              
              <Tabs.Root defaultValue="personal" className="flex flex-col h-full flex-1 min-h-0">
                <Tabs.List className="flex border-b border-slate-200 px-6 shrink-0 bg-white shadow-sm z-10 overflow-x-auto">
                  <Tabs.Trigger 
                    value="personal" 
                    className="px-4 py-3 text-sm font-bold text-slate-500 border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-700 hover:text-slate-700 transition-colors focus:outline-none uppercase whitespace-nowrap"
                  >
                    1. THÔNG TIN CƠ BẢN
                  </Tabs.Trigger>
                  <Tabs.Trigger 
                    value="qualifications" 
                    className="px-4 py-3 text-sm font-bold text-slate-500 border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-700 hover:text-slate-700 transition-colors focus:outline-none uppercase whitespace-nowrap"
                  >
                    2. CHUYÊN MÔN & BẰNG CẤP
                  </Tabs.Trigger>
                </Tabs.List>

                <div className="overflow-y-auto p-6 flex-1 bg-slate-50/30">
                  {/* TAB 1: THÔNG TIN CƠ BẢN */}
                  <Tabs.Content value="personal" className="space-y-6 focus:outline-none">
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Left Column: Định danh */}
                      <div className="space-y-4">
                        <h3 className="text-sm font-bold text-blue-800 uppercase border-b border-blue-100 pb-2">Thông tin Cá nhân</h3>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-1">Họ Tên</label>
                          <input type="text" value={editForm.HoTen || ""} onChange={e => setEditForm({...editForm, HoTen: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white shadow-sm" placeholder="Nguyễn Văn A" />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-1">Số điện thoại</label>
                          <input type="text" value={editForm.SDT || ""} onChange={e => setEditForm({...editForm, SDT: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white shadow-sm" />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-1">Năm sinh</label>
                          <input type="text" value={editForm.NgaySinh || ""} onChange={e => setEditForm({...editForm, NgaySinh: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white shadow-sm" placeholder="VD: 1990" />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-1">Số CCCD</label>
                          <input type="text" value={editForm.CCCD || ""} onChange={e => setEditForm({...editForm, CCCD: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white shadow-sm" />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-1">Hạn CCCD</label>
                          <input type="text" value={editForm.HanCCCD || ""} onChange={e => setEditForm({...editForm, HanCCCD: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white shadow-sm" placeholder="dd/mm/yyyy" />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-1">Tình trạng hạn CCCD</label>
                          <select value={editForm.TinhTrangHanCCCD || ""} onChange={e => setEditForm({...editForm, TinhTrangHanCCCD: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white shadow-sm">
                            <option value="">- Chọn -</option>
                            <option value="Còn hạn">Còn hạn</option>
                            <option value="Hết hạn">Hết hạn</option>
                          </select>
                        </div>
                      </div>

                      {/* Right Column: Công tác */}
                      <div className="space-y-4">
                        <h3 className="text-sm font-bold text-blue-800 uppercase border-b border-blue-100 pb-2">Thông tin Công tác</h3>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-1">Hình thức tuyển dụng</label>
                          <select value={editForm.HinhThucTuyenDung || ""} onChange={e => setEditForm({...editForm, HinhThucTuyenDung: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white shadow-sm">
                            <option value="">- Chọn -</option>
                            <option value="Biên chế">Biên chế</option>
                            <option value="Hợp đồng">Hợp đồng</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-1">Trung tâm</label>
                          <select value={editForm.TrungTam || "Đại Phát"} onChange={e => setEditForm({...editForm, TrungTam: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white shadow-sm">
                            <option value="Đại Phát">Đại Phát</option>
                            <option value="Tiến Thành">Tiến Thành</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-1">Nhóm giáo viên (Phụ trách)</label>
                          <input type="text" value={editForm.NhomGiaoVien || editForm.NguoiPhuTrach || ""} onChange={e => setEditForm({...editForm, NhomGiaoVien: e.target.value, NguoiPhuTrach: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white shadow-sm" />
                        </div>
                      </div>
                    </div>

                  </Tabs.Content>

                  {/* TAB 2: CHUYÊN MÔN & BẰNG CẤP */}
                  <Tabs.Content value="qualifications" className="space-y-6 focus:outline-none">
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Left Column: Trình độ Học vấn */}
                      <div className="space-y-4">
                        <h3 className="text-sm font-bold text-indigo-800 uppercase border-b border-indigo-100 pb-2">Trình độ Học vấn</h3>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-1">Trình độ Văn hóa</label>
                          <select value={editForm.TrinhDoVanHoa || ""} onChange={e => setEditForm({...editForm, TrinhDoVanHoa: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white shadow-sm">
                            <option value="">- Chọn -</option>
                            <option value="12/12">12/12</option>
                            <option value="9/12">9/12</option>
                            <option value="Khác">Khác</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-1">Trình độ Chuyên môn</label>
                          <select value={editForm.TrinhDoChuyenMon || editForm.TrinhDo || ""} onChange={e => setEditForm({...editForm, TrinhDoChuyenMon: e.target.value, TrinhDo: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white shadow-sm">
                            <option value="">- Chọn -</option>
                            {['Trung cấp', 'Cao đẳng', 'Đại học', 'Cao học', 'Khác'].map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-1">Sư phạm</label>
                          <input type="text" value={editForm.TrinhDoSuPham || ""} onChange={e => setEditForm({...editForm, TrinhDoSuPham: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white shadow-sm" placeholder="VD: Chứng chỉ SP Dạy nghề..." />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-1">Bậc NVSP</label>
                          <select value={editForm.BacNVSP || ""} onChange={e => setEditForm({...editForm, BacNVSP: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white shadow-sm">
                            <option value="">- Chọn -</option>
                            <option value="Bậc 1">Bậc 1</option>
                            <option value="Bậc 2">Bậc 2</option>
                            <option value="Bậc 3">Bậc 3</option>
                            <option value="Bậc 4">Bậc 4</option>
                          </select>
                        </div>
                      </div>

                      {/* Right Column: Giấy phép lái xe */}
                      <div className="space-y-4">
                        <h3 className="text-sm font-bold text-indigo-800 uppercase border-b border-indigo-100 pb-2">Giấy phép Lái xe & Hạng GV</h3>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-1">Hạng GPLX</label>
                          <select value={editForm.HangGPLX || ""} onChange={e => setEditForm({...editForm, HangGPLX: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white shadow-sm">
                            <option value="">- Chọn -</option>
                            {['A1', 'A', 'B-TD', 'B-SS', 'C1', 'C', 'D2', 'D'].map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-1">Ngày trúng tuyển (Cấp phép)</label>
                          <input type="text" value={editForm.NgayTrungTuyenGPLX || ""} onChange={e => setEditForm({...editForm, NgayTrungTuyenGPLX: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white shadow-sm" placeholder="dd/mm/yyyy" />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-1">Ngày hết hạn GPLX</label>
                          <input type="text" value={editForm.HanGPLX || ""} onChange={e => setEditForm({...editForm, HanGPLX: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white shadow-sm" placeholder="dd/mm/yyyy" />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-1">Tình trạng hạn GPLX</label>
                          <select value={editForm.TinhTrangHanGPLX || ""} onChange={e => setEditForm({...editForm, TinhTrangHanGPLX: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white shadow-sm">
                            <option value="">- Chọn -</option>
                            <option value="Còn hạn">Còn hạn</option>
                            <option value="Hết hạn">Hết hạn</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-1">Hạng giáo viên (Hạng GVTH)</label>
                          <select value={editForm.HangGiaoVien || editForm.HangGVTH || ""} onChange={e => setEditForm({...editForm, HangGiaoVien: e.target.value, HangGVTH: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white shadow-sm">
                            <option value="">- Chọn -</option>
                            {['A1', 'A', 'B-TD', 'B-SS', 'C1', 'C', 'D2', 'D'].map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                        </div>
                      </div>
                    </div>
                    
                  </Tabs.Content>
                </div>
              </Tabs.Root>



            </CardContent>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
              <button 
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
              >
                {deleting ? <div className="w-4 h-4 border-2 border-red-200 border-t-red-600 rounded-full animate-spin"/> : <Trash2 className="w-4 h-4" />}
                Xóa
              </button>
              
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setEditingTeacher(null)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Hủy
                </button>
                <button 
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50 shadow-sm"
                >
                  {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <Save className="w-4 h-4" />}
                  Lưu thay đổi
                </button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
