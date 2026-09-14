"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, ChevronLeft, ChevronRight, Edit, X, Save, Trash2, Plus, MonitorSmartphone } from "lucide-react";
import { getDats, addDat, updateDat, deleteDat, DatData } from "@/actions/cars";

type Props = {
  initialDats: DatData[];
  initialTotal: number;
  initialPages: number;
};

export default function DatClient({ initialDats, initialTotal, initialPages }: Props) {
  const [dats, setDats] = useState<DatData[]>(initialDats);
  const [total, setTotal] = useState(initialTotal);
  const [totalPages, setTotalPages] = useState(initialPages);
  
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<Partial<DatData>>({});
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
      const res = await getDats(page, 50, search);
      setDats(res.data);
      setTotal(res.totalRecords);
      setTotalPages(res.totalPages);
      setPage(res.currentPage);
      setLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [page, search]);

  const handleAddNew = () => {
    setEditingId(null);
    setForm({ SoLuong: 1, NgayNhan: new Date().toLocaleDateString('vi-VN') });
    setIsModalOpen(true);
  };

  const handleEditClick = (dat: DatData) => {
    setEditingId(dat.Id);
    setForm({ ...dat });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    let res;
    if (editingId) {
      res = await updateDat(editingId, form);
    } else {
      res = await addDat(form);
    }
    
    if (res.success) {
      setLoading(true);
      const freshRes = await getDats(page, 50, search);
      setDats(freshRes.data);
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
    if (confirm(`Bạn có chắc chắn muốn xóa bản ghi này?`)) {
      setDeleting(true);
      const res = await deleteDat(editingId);
      if (res.success) {
        setLoading(true);
        const freshRes = await getDats(page, 50, search);
        setDats(freshRes.data);
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
      <Card className="bg-white shadow-md border-slate-200 overflow-hidden relative">
        <CardHeader className="bg-slate-50/80 border-b border-slate-100 pb-4 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <div className="p-1.5 bg-indigo-100 rounded-md">
                <MonitorSmartphone className="h-5 w-5 text-indigo-700" />
              </div>
              Danh sách Thiết bị DAT ({total})
            </CardTitle>
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
              <button
                onClick={handleAddNew}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Thêm lịch nhận
              </button>

              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  placeholder="Tìm người nhận..." 
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
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-extrabold uppercase text-xs border-b border-slate-200">
                <tr>
                  <th className="px-4 py-4 w-12 text-center">STT</th>
                  <th className="px-4 py-4">Ngày nhận</th>
                  <th className="px-4 py-4 text-center">Số lượng</th>
                  <th className="px-4 py-4">Người nhận (Giáo viên / Chủ xe)</th>
                  <th className="px-4 py-4">Ghi chú</th>
                  <th className="px-4 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {dats.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                      Không có lịch nhận DAT nào.
                    </td>
                  </tr>
                ) : (
                  dats.map((dat, idx) => (
                    <tr key={dat.Id} className="hover:bg-slate-50 transition-colors bg-white group">
                      <td className="px-4 py-3 text-center font-semibold text-slate-500">
                        {(page - 1) * 50 + idx + 1}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-800">
                        {dat.NgayNhan || '-'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="px-2 py-1 bg-indigo-50 text-indigo-700 font-black rounded border border-indigo-100">{dat.SoLuong}</span>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-700">
                        {dat.NguoiNhan || '-'}
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs max-w-[200px] truncate">
                        {dat.GhiChu || '-'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button 
                          onClick={() => handleEditClick(dat)}
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

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <Card className="w-full max-w-lg bg-white shadow-2xl border-0 overflow-hidden">
            <CardHeader className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-bold text-slate-800">
                {editingId ? "Chỉnh sửa Lịch nhận DAT" : "Thêm Lịch nhận DAT mới"}
              </CardTitle>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Ngày nhận</label>
                  <input 
                    type="text" 
                    value={form.NgayNhan || ""} 
                    onChange={(e) => setForm({...form, NgayNhan: e.target.value})}
                    placeholder="VD: 01-10-2026"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Số lượng</label>
                  <input 
                    type="number" 
                    value={form.SoLuong || 0} 
                    onChange={(e) => setForm({...form, SoLuong: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Người nhận</label>
                <input 
                  type="text" 
                  value={form.NguoiNhan || ""} 
                  onChange={(e) => setForm({...form, NguoiNhan: e.target.value})}
                  placeholder="Tên giáo viên hoặc Chủ xe"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Ghi chú / Nhãn hiệu thiết bị</label>
                <textarea 
                  value={form.GhiChu || ""} 
                  onChange={(e) => setForm({...form, GhiChu: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[80px]"
                />
              </div>
            </CardContent>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              {editingId ? (
                <button 
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                >
                  {deleting ? <div className="w-4 h-4 border-2 border-red-200 border-t-red-600 rounded-full animate-spin"/> : <Trash2 className="w-4 h-4" />}
                  Xóa
                </button>
              ) : <div></div>}
              
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
