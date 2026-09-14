"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Contact, ChevronLeft, ChevronRight, Edit, X, Save, Trash2, UserPlus, Archive } from "lucide-react";
import { getStaffs, addStaff, updateStaff, deleteStaff, StaffData } from "@/actions/hr";
import Link from "next/link";
import * as Tabs from "@radix-ui/react-tabs";

type Props = {
  initialStaffs: StaffData[];
  initialTotal: number;
  initialPages: number;
};

export default function StaffListClient({ initialStaffs, initialTotal, initialPages }: Props) {
  const [staffs, setStaffs] = useState<StaffData[]>(initialStaffs);
  const [total, setTotal] = useState(initialTotal);
  const [totalPages, setTotalPages] = useState(initialPages);
  
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loaiNhanSu, setLoaiNhanSu] = useState("all");
  const [loading, setLoading] = useState(false);
  
  // Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<Partial<StaffData>>({
    TinhTrangBHXH: false,
    LoaiNhanSu: "Nhân viên",
    TrungTam: "Đại Phát"
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    
    const timer = setTimeout(async () => {
      setLoading(true);
      const res = await getStaffs(page, 50, search, loaiNhanSu);
      setStaffs(res.data);
      setTotal(res.totalRecords);
      setTotalPages(res.totalPages);
      setPage(res.currentPage);
      setLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [page, search, loaiNhanSu]);

  const handleAddNew = () => {
    setEditingId(null);
    setForm({
      TinhTrangBHXH: false,
      LoaiNhanSu: "Nhân viên",
      TrungTam: "Đại Phát"
    });
    setIsModalOpen(true);
  };

  const handleEditClick = (staff: StaffData) => {
    setEditingId(staff.Id);
    setForm({ ...staff });
    setIsModalOpen(true);
  };

  const trinhDoOptions = ["Trung cấp", "Cao đẳng", "Đại học", "Cao học", "Khác"];
  const bacNVSPOptions = ["Bậc 1", "Bậc 2", "Bậc 3", "Bậc 4", "Khác"];

  const handleSave = async () => {
    if (!form.HoTen) {
      alert("Vui lòng nhập Họ Tên!");
      return;
    }
    
    setSaving(true);
    let res;
    if (editingId) {
      res = await updateStaff(editingId, form);
    } else {
      res = await addStaff(form);
    }
    
    if (res.success) {
      // Reload current page
      setLoading(true);
      const freshRes = await getStaffs(page, 50, search, loaiNhanSu);
      setStaffs(freshRes.data);
      setTotal(freshRes.totalRecords);
      setTotalPages(freshRes.totalPages);
      setLoading(false);
      setIsModalOpen(false);
    } else {
      alert("Lỗi khi lưu: " + res.error);
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!editingId) return;
    if (confirm(`Bạn có chắc chắn muốn xóa nhân sự ${form.HoTen}?`)) {
      setDeleting(true);
      const res = await deleteStaff(editingId);
      if (res.success) {
        setLoading(true);
        const freshRes = await getStaffs(page, 50, search, loaiNhanSu);
        setStaffs(freshRes.data);
        setTotal(freshRes.totalRecords);
        setTotalPages(freshRes.totalPages);
        setLoading(false);
        setIsModalOpen(false);
      } else {
        alert("Lỗi khi xóa: " + res.error);
      }
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Main Table Card */}
      <Card className="bg-white shadow-md border-slate-200 overflow-hidden relative">
        <CardHeader className="bg-slate-50/80 border-b border-slate-100 pb-4 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <div className="p-1.5 bg-blue-100 rounded-md">
                <Contact className="h-5 w-5 text-blue-700" />
              </div>
              Danh sách Nhân sự ({total})
            </CardTitle>
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
              <Link
                href="/archive?tab=teachers"
                className="flex items-center gap-2 px-3 py-2 bg-slate-100 text-indigo-700 font-semibold rounded-lg hover:bg-slate-200 transition-colors border border-slate-200 shadow-sm"
              >
                <Archive className="w-4 h-4" />
                Lưu trữ Giáo viên
              </Link>
              <Link
                href="/archive?tab=staff"
                className="flex items-center gap-2 px-3 py-2 bg-slate-100 text-emerald-700 font-semibold rounded-lg hover:bg-slate-200 transition-colors border border-slate-200 shadow-sm"
              >
                <Archive className="w-4 h-4" />
                Lưu trữ Nhân viên
              </Link>
              <button
                onClick={handleAddNew}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
              >
                <UserPlus className="w-4 h-4" />
                Thêm mới
              </button>

              <select 
                value={loaiNhanSu}
                onChange={(e) => { setLoaiNhanSu(e.target.value); setPage(1); }}
                className="w-full sm:w-auto px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium bg-white text-slate-700"
              >
                <option value="all">Tất cả nhân sự</option>
                <option value="Nhân viên">Chỉ Nhân viên</option>
                <option value="Giáo viên">Chỉ Giáo viên</option>
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
                  <th className="px-4 py-4 min-w-[200px]">Nhân sự</th>
                  <th className="px-4 py-4">Phân loại</th>
                  <th className="px-4 py-4">SĐT</th>
                  <th className="px-4 py-4">Hợp đồng</th>
                  <th className="px-4 py-4 text-center">Tình trạng BHXH</th>
                  <th className="px-4 py-4 text-center">GPLX / Hạn</th>
                  <th className="px-4 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {staffs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                      Không tìm thấy dữ liệu phù hợp.
                    </td>
                  </tr>
                ) : (
                  staffs.map((staff, idx) => (
                    <tr key={staff.Id || idx} className="hover:bg-indigo-50/50 transition-colors bg-white group">
                      <td className="px-4 py-3 text-center font-semibold text-slate-500">
                        {(page - 1) * 50 + idx + 1}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900">{staff.HoTen}</div>
                        <div className="text-slate-500 text-xs mt-0.5">{staff.NgaySinh} | {staff.CCCD}</div>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-700">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold border ${staff.LoaiNhanSu === 'Giáo viên' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                          {staff.LoaiNhanSu || 'Nhân viên'}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-700">
                        {staff.SDT || '-'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-700">{staff.LoaiHopDong || '-'}</div>
                        <div className="text-slate-500 text-xs">{staff.SoHopDong ? `Số: ${staff.SoHopDong}` : ''}</div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {staff.TinhTrangBHXH ? (
                           <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">Đóng BHXH</span>
                        ) : (
                           <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-xs font-bold">Không</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="font-bold text-indigo-700">{staff.HangGPLX || '-'}</div>
                        <div className="text-rose-600 text-xs font-semibold">{staff.HanGPLX || ''}</div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button 
                          onClick={() => handleEditClick(staff)}
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

      {/* Edit Modal with Tabs */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <Card className="w-full max-w-3xl bg-white shadow-2xl border-0 overflow-hidden flex flex-col max-h-[90vh]">
            <CardHeader className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex flex-row items-center justify-between shrink-0">
              <CardTitle className="text-lg font-bold text-slate-800">
                {editingId ? "Chỉnh sửa Thông tin" : "Thêm mới Nhân sự"}
              </CardTitle>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </CardHeader>

            <CardContent className="p-0 overflow-hidden flex flex-col">
              
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/80 flex gap-4 shrink-0">
                <div className="w-1/2">
                  <label className="block text-sm font-bold text-slate-700 mb-1">Phân loại nhân sự</label>
                  <select value={form.LoaiNhanSu || "Nhân viên"} onChange={e => setForm({...form, LoaiNhanSu: e.target.value})} disabled={editingId !== null} className={`w-full px-3 py-2 border-2 border-indigo-200 rounded-lg font-bold focus:ring-2 focus:ring-indigo-500 outline-none ${editingId !== null ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'bg-white text-indigo-700'}`}>
                    <option value="Nhân viên">Nhân viên</option>
                    <option value="Giáo viên">Giáo viên</option>
                  </select>
                </div>
                <div className="w-1/2">
                  <label className="block text-sm font-bold text-slate-700 mb-1">Trung tâm</label>
                  <select 
                    value={form.TrungTam || "Đại Phát"} 
                    onChange={e => setForm({...form, TrungTam: e.target.value})} 
                    className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg bg-white font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="Đại Phát">Đại Phát</option>
                    <option value="Tiến Thành">Tiến Thành</option>
                  </select>
                </div>
              </div>

              <Tabs.Root defaultValue="personal" className="flex flex-col h-full">
                <Tabs.List className="flex border-b border-slate-200 px-6 shrink-0 bg-white shadow-sm z-10 overflow-x-auto">
                  <Tabs.Trigger 
                    value="personal" 
                    className="px-4 py-3 text-sm font-bold text-slate-500 border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-700 hover:text-slate-700 transition-colors focus:outline-none uppercase whitespace-nowrap"
                  >
                    1. THÔNG TIN CÁ NHÂN
                  </Tabs.Trigger>
                  
                  <Tabs.Trigger 
                    value="work" 
                    className="px-4 py-3 text-sm font-bold text-slate-500 border-b-2 border-transparent data-[state=active]:border-emerald-600 data-[state=active]:text-emerald-700 hover:text-slate-700 transition-colors focus:outline-none uppercase whitespace-nowrap"
                  >
                    '2. CÔNG TÁC & BẢO HIỂM'
                  </Tabs.Trigger>
                </Tabs.List>

                <div className="overflow-y-auto p-6 max-h-[60vh] bg-slate-50/30">
                  {/* TAB 1: THÔNG TIN CÁ NHÂN */}
                  <Tabs.Content value="personal" className="space-y-6 focus:outline-none">
                    <div className="space-y-4">
                      <h3 className="text-sm font-bold text-blue-800 uppercase border-b border-blue-100 pb-2">Định danh Cơ bản</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-1">Họ Tên </label>
                          <input type="text" value={form.HoTen || ""} onChange={e => setForm({...form, HoTen: e.target.value})} placeholder="Nguyễn Văn A" disabled={form.LoaiNhanSu === 'Giáo viên' && editingId !== null} className={`w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 shadow-sm ${form.LoaiNhanSu === 'Giáo viên' && editingId !== null ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'bg-white'}`} />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-1">Năm sinh </label>
                          <input type="text" value={form.NgaySinh || ""} onChange={e => setForm({...form, NgaySinh: e.target.value})} placeholder="VD: 1990" disabled={form.LoaiNhanSu === 'Giáo viên' && editingId !== null} className={`w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 shadow-sm ${form.LoaiNhanSu === 'Giáo viên' && editingId !== null ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'bg-white'}`} />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-1">Số điện thoại </label>
                          <input type="text" value={form.SDT || ""} onChange={e => setForm({...form, SDT: e.target.value})} disabled={form.LoaiNhanSu === 'Giáo viên' && editingId !== null} className={`w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 shadow-sm ${form.LoaiNhanSu === 'Giáo viên' && editingId !== null ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'bg-white'}`} />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-1">Nơi sinh </label>
                          <input type="text" value={form.NoiSinh || ""} onChange={e => setForm({...form, NoiSinh: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white shadow-sm" placeholder="Tỉnh/Thành phố" />
                        </div>
                        <div className="col-span-1 md:col-span-2">
                          <label className="block text-sm font-semibold text-slate-700 mb-1">Địa chỉ thường trú </label>
                          <input type="text" value={form.DiaChiThuongTru || ""} onChange={e => setForm({...form, DiaChiThuongTru: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white shadow-sm" />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-sm font-bold text-blue-800 uppercase border-b border-blue-100 pb-2">Căn cước & Thuế</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-1">Số CCCD </label>
                          <input type="text" value={form.CCCD || ""} onChange={e => setForm({...form, CCCD: e.target.value})} disabled={form.LoaiNhanSu === 'Giáo viên' && editingId !== null} className={`w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 shadow-sm ${form.LoaiNhanSu === 'Giáo viên' && editingId !== null ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'bg-white'}`} />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-1">Mã số thuế </label>
                          <input type="text" value={form.MaSoThue || ""} onChange={e => setForm({...form, MaSoThue: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white shadow-sm font-mono text-emerald-700 font-bold" />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-1">Hạn CCCD </label>
                          <input type="text" value={form.HanCCCD || ""} onChange={e => setForm({...form, HanCCCD: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white shadow-sm" placeholder="dd/mm/yyyy" />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-1">Tình trạng hạn CCCD </label>
                          <select value={form.TinhTrangHanCCCD || ""} onChange={e => setForm({...form, TinhTrangHanCCCD: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white shadow-sm">
                            <option value="">- Chọn -</option>
                            <option value="Còn hạn">Còn hạn</option>
                            <option value="Hết hạn">Hết hạn</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </Tabs.Content>

                  {/* TAB 2: CHUYÊN MÔN & BẰNG CẤP */}
                  

                  {/* TAB 3: CÔNG TÁC & BẢO HIỂM */}
                  <Tabs.Content value="work" className="space-y-6 focus:outline-none">
                    {/* Công tác */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-bold text-emerald-800 uppercase border-b border-emerald-100 pb-2">Thông tin Công tác</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-1">Hình thức tuyển dụng </label>
                          <select value={form.HinhThucTuyenDung || ""} onChange={e => setForm({...form, HinhThucTuyenDung: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white shadow-sm">
                            <option value="">- Chọn -</option>
                            <option value="Biên chế">Biên chế</option>
                            <option value="Hợp đồng">Hợp đồng</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-1">Lương Cơ Bản (VNĐ) </label>
                          <input type="number" value={form.LuongCoBan || ""} onChange={e => setForm({...form, LuongCoBan: parseFloat(e.target.value) || 0})} className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white shadow-sm font-bold text-slate-800" placeholder="VD: 5310000" />
                        </div>
                        {(form.LoaiNhanSu === 'Giáo viên') && (
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Nhóm giáo viên (Phụ trách) </label>
                            <input type="text" value={form.NhomGiaoVien || form.NguoiPhuTrach || ""} onChange={e => setForm({...form, NhomGiaoVien: e.target.value, NguoiPhuTrach: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white shadow-sm" />
                          </div>
                        )}
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-1">Loại hợp đồng </label>
                          <input type="text" value={form.LoaiHopDong || ""} onChange={e => setForm({...form, LoaiHopDong: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white shadow-sm" placeholder="VD: Có thời hạn 1 năm" />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-1">Số hợp đồng </label>
                          <input type="text" value={form.SoHopDong || ""} onChange={e => setForm({...form, SoHopDong: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white shadow-sm" />
                        </div>
                      </div>
                    </div>

                    {/* Y tế */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-bold text-emerald-800 uppercase border-b border-emerald-100 pb-2">Sức khỏe & Y tế</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-1">Nơi ĐK Khám chữa bệnh ban đầu </label>
                          <input type="text" value={form.NoiDangKyKhamChuaBenh || form.NoiDKKCB || ""} onChange={e => setForm({...form, NoiDangKyKhamChuaBenh: e.target.value, NoiDKKCB: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white shadow-sm" />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-1">Hạn sức khoẻ </label>
                          <input type="text" value={form.HanSucKhoe || ""} onChange={e => setForm({...form, HanSucKhoe: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white shadow-sm" placeholder="dd/mm/yyyy" />
                        </div>
                      </div>
                    </div>

                    {/* BHXH */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-bold text-emerald-800 uppercase border-b border-emerald-100 pb-2">Bảo Hiểm Xã Hội </h3>
                      <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl shadow-sm">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={form.TinhTrangBHXH || false}
                            onChange={(e) => setForm({...form, TinhTrangBHXH: e.target.checked})}
                            className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500"
                          />
                          <span className="font-bold text-emerald-900 uppercase">Có tham gia đóng Bảo Hiểm Xã Hội (BHXH)</span>
                        </label>
                      </div>

                      {form.TinhTrangBHXH && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border border-emerald-200 bg-white rounded-xl shadow-sm mt-2">
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Ngày báo tăng BHXH (Ngày ký HĐ)</label>
                            <input type="text" value={form.NgayBaoTangBHXH || ""} onChange={e => setForm({...form, NgayBaoTangBHXH: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white shadow-sm" placeholder="dd/mm/yyyy" />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Số Sổ BHXH</label>
                            <input type="text" value={form.SoBHXH || ""} onChange={e => setForm({...form, SoBHXH: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white shadow-sm font-mono font-bold text-emerald-700" />
                          </div>
                        </div>
                      )}
                    </div>
                  </Tabs.Content>
                </div>
              </Tabs.Root>

            </CardContent>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
              {editingId ? (
                <button 
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                >
                  {deleting ? <div className="w-4 h-4 border-2 border-red-200 border-t-red-600 rounded-full animate-spin"/> : <Trash2 className="w-4 h-4" />}
                  Xóa
                </button>
              ) : (
                <div></div> // Placeholder for layout
              )}
              
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setIsModalOpen(false)}
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
                  Lưu thông tin
                </button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
