"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, Plus, Pencil, Trash2, Loader2, Phone, StickyNote, UserRound } from "lucide-react";
import { getDauMois, addDauMoi, updateDauMoi, deleteDauMoi, DauMoi } from "@/actions/daumoi";

export default function DauMoiManagerDialog({ onUpdate }: { onUpdate?: () => void }) {
  const [open, setOpen] = useState(false);
  const [daumois, setDaumois] = useState<DauMoi[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [editingId, setEditingId] = useState<number | null>(null);
  const [hoTen, setHoTen] = useState("");
  const [soDienThoai, setSoDienThoai] = useState("");
  const [ghiChu, setGhiChu] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchDauMois = async () => {
    setLoading(true);
    const data = await getDauMois();
    setDaumois(data);
    setLoading(false);
    if (onUpdate) onUpdate();
  };

  useEffect(() => {
    if (open) {
      fetchDauMois();
      resetForm();
    }
  }, [open]);

  const resetForm = () => {
    setEditingId(null);
    setHoTen("");
    setSoDienThoai("");
    setGhiChu("");
  };

  const handleEdit = (dm: DauMoi) => {
    setEditingId(dm.id);
    setHoTen(dm.hoTen);
    setSoDienThoai(dm.soDienThoai || "");
    setGhiChu(dm.ghiChu || "");
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Bạn có chắc chắn muốn xóa đầu mối này? (Hồ sơ cũ sẽ không bị ảnh hưởng)")) return;
    
    setLoading(true);
    const res = await deleteDauMoi(id);
    if (res.success) {
      alert("Đã xóa đầu mối thành công!");
      await fetchDauMois();
    } else {
      alert("Lỗi: " + res.error);
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hoTen.trim()) {
      alert("Vui lòng nhập họ tên!");
      return;
    }

    setSaving(true);
    let res;
    if (editingId) {
      res = await updateDauMoi(editingId, hoTen, soDienThoai, ghiChu);
    } else {
      res = await addDauMoi(hoTen, soDienThoai, ghiChu);
    }

    setSaving(false);
    
    if (res.success) {
      alert(editingId ? "Đã cập nhật đầu mối thành công!" : "Đã thêm đầu mối thành công!");
      resetForm();
      await fetchDauMois();
    } else {
      alert("Lỗi: " + res.error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="text-slate-700 bg-white hover:bg-slate-50 hover:text-indigo-600 border-slate-200 shadow-sm hover:shadow transition-all duration-200 whitespace-nowrap shrink-0 rounded-lg">
          <Users className="w-4 h-4 mr-2 shrink-0 text-indigo-500" />
          Quản lý Đầu mối
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden border-0 shadow-2xl rounded-2xl">
        {/* Premium Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-6 text-white shrink-0">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <Users className="w-6 h-6 text-indigo-100" />
              Danh bạ Đầu mối
            </DialogTitle>
            <DialogDescription className="text-indigo-100/80 text-sm mt-1">
              Quản lý danh sách người giới thiệu, người nộp hồ sơ. Dữ liệu được đồng bộ toàn hệ thống.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="flex flex-col overflow-y-auto p-6 bg-slate-50/50 max-h-[calc(90vh-80px)]">
          {/* Form Card */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm shrink-0 mb-6 transition-all hover:shadow-md">
            <h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
              {editingId ? <Pencil className="w-4 h-4 text-indigo-500" /> : <Plus className="w-4 h-4 text-indigo-500" />}
              {editingId ? "Cập nhật thông tin" : "Thêm mới đầu mối"}
            </h3>
            <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-[2fr_1.5fr_2fr_auto] gap-4 items-end">
              <div className="space-y-1.5 relative">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Họ tên <span className="text-rose-500">*</span></label>
                <div className="relative">
                  <UserRound className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input 
                    value={hoTen} 
                    onChange={e => setHoTen(e.target.value)} 
                    placeholder="Ví dụ: Nguyễn Văn A"
                    className="pl-9 bg-slate-50 focus:bg-white border-slate-200 h-10 transition-colors"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Số điện thoại</label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input 
                    value={soDienThoai} 
                    onChange={e => setSoDienThoai(e.target.value)} 
                    placeholder="SĐT..."
                    className="pl-9 bg-slate-50 focus:bg-white border-slate-200 h-10 transition-colors"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Ghi chú</label>
                <div className="relative">
                  <StickyNote className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input 
                    value={ghiChu} 
                    onChange={e => setGhiChu(e.target.value)} 
                    placeholder="Ghi chú thêm..."
                    className="pl-9 bg-slate-50 focus:bg-white border-slate-200 h-10 transition-colors"
                  />
                </div>
              </div>
              <div className="flex gap-2 h-10">
                {editingId && (
                  <Button type="button" variant="outline" onClick={resetForm} className="h-10 px-4 rounded-lg">Hủy</Button>
                )}
                <Button type="submit" disabled={saving} className="h-10 px-6 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm hover:shadow transition-all min-w-[120px]">
                  {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : (editingId ? <Pencil className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />)}
                  {editingId ? "Cập nhật" : "Thêm mới"}
                </Button>
              </div>
            </form>
          </div>

          {/* Table Card */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden shrink-0">
          <table className="w-full text-sm text-left">
            <thead className="text-xs font-semibold text-slate-500 bg-slate-50 sticky top-0 z-10 shadow-[0_1px_2px_rgba(0,0,0,0.05)] uppercase tracking-wider">
              <tr>
                <th className="px-5 py-4 w-[60px] text-center rounded-tl-xl">#</th>
                <th className="px-5 py-4">Họ và tên</th>
                <th className="px-5 py-4">Số điện thoại</th>
                <th className="px-5 py-4">Ghi chú</th>
                <th className="px-5 py-4 text-right w-[120px] rounded-tr-xl">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="h-40 text-center text-slate-400">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-indigo-400" />
                    <span className="font-medium">Đang tải danh sách...</span>
                  </td>
                </tr>
              ) : daumois.length === 0 ? (
                <tr>
                  <td colSpan={5} className="h-40 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                        <Users className="w-8 h-8 text-slate-300" />
                      </div>
                      <span className="font-medium">Chưa có đầu mối nào. Hãy thêm mới!</span>
                    </div>
                  </td>
                </tr>
              ) : (
                daumois.map((dm, index) => (
                  <tr key={dm.id} className="hover:bg-indigo-50/40 transition-colors group">
                    <td className="px-5 py-4 text-center font-medium text-slate-400">{index + 1}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 text-indigo-700 flex items-center justify-center font-bold text-sm shadow-inner shrink-0 ring-1 ring-indigo-50">
                          {dm.hoTen.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-semibold text-slate-700 group-hover:text-indigo-900 transition-colors">{dm.hoTen}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-1.5 text-slate-600 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100 text-sm">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        {dm.soDienThoai || "—"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-600 text-sm">{dm.ghiChu || "—"}</td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex justify-end gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(dm)} className="h-8 w-8 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-100 rounded-full">
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(dm.id)} className="h-8 w-8 text-rose-600 hover:text-rose-700 hover:bg-rose-100 rounded-full">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
