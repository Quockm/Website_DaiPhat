"use client";

import React, { useState, useEffect } from "react";
import { Package, Plus, Trash, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger 
} from "@/components/ui/dialog";
import { 
  getStorageLocations, addStorageLocation, deleteStorageLocation, updateStorageLocation
} from "@/actions/absent/storage.actions";

export function StorageLocationsTab() {
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  
  const [formData, setFormData] = useState({ name: "", code: "", description: "" });
  const [editData, setEditData] = useState({ name: "", code: "", description: "" });

  const loadData = async () => {
    setLoading(true);
    const res = await getStorageLocations();
    if (res.success) {
      setLocations(res.data || []);
    } else {
      alert("Lỗi: " + res.error);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAdd = async () => {
    if (!formData.name) return alert("Vui lòng nhập tên vị trí / ngăn xếp!");
    
    const res = await addStorageLocation(formData.name, formData.code, formData.description);
    if (res.success) {
      setIsAddOpen(false);
      setFormData({ name: "", code: "", description: "" });
      loadData();
    } else {
      alert("Lỗi: " + res.error);
    }
  };

  const openEdit = (loc: any) => {
    setEditId(loc.id);
    setEditData({ name: loc.name || "", code: loc.code || "", description: loc.description || "" });
    setIsEditOpen(true);
  };

  const handleEditSubmit = async () => {
    if (!editId) return;
    if (!editData.name) return alert("Vui lòng nhập tên vị trí / ngăn xếp!");
    
    const res = await updateStorageLocation(editId, editData.name, editData.code, editData.description);
    if (res.success) {
      setIsEditOpen(false);
      setEditId(null);
      setEditData({ name: "", code: "", description: "" });
      loadData();
    } else {
      alert("Lỗi: " + res.error);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("Bạn có chắc chắn muốn xoá ngăn xếp này? Hãy đảm bảo không còn hồ sơ nào đang nằm ở đây.")) {
      const res = await deleteStorageLocation(id);
      if (res.success) loadData();
      else alert("Lỗi: " + res.error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
            <Package className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-bold text-slate-800">Quản lý ngăn xếp / vị trí lưu kho</h2>
        </div>
        <div>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="bg-indigo-600 hover:bg-indigo-700">
                <Plus className="w-4 h-4 mr-2" /> Thêm ngăn xếp
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] p-8">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-black mb-4">Thêm vị trí cất hồ sơ mới</DialogTitle>
              </DialogHeader>
              <div className="py-2 space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-black">Tên ngăn xếp (Ví dụ: Tủ 1 - Tầng 2) *</label>
                  <Input 
                    value={formData.name} 
                    onChange={(e) => setFormData({...formData, name: e.target.value})} 
                    placeholder="Nhập tên..." 
                    className="h-11 px-4 py-2 text-black font-semibold placeholder:text-slate-400"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-black">Mã tự đặt (Ví dụ: TT1)</label>
                  <Input 
                    value={formData.code} 
                    onChange={(e) => setFormData({...formData, code: e.target.value})} 
                    placeholder="Mã tìm nhanh..." 
                    className="h-11 px-4 py-2 text-black font-semibold placeholder:text-slate-400 uppercase"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-black">Ghi chú thêm</label>
                  <Input 
                    value={formData.description} 
                    onChange={(e) => setFormData({...formData, description: e.target.value})} 
                    placeholder="Mô tả..." 
                    className="h-11 px-4 py-2 text-black placeholder:text-slate-400"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddOpen(false)}>Huỷ</Button>
                <Button onClick={handleAdd} className="bg-indigo-600 hover:bg-indigo-700">Lưu thông tin</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
            <DialogContent className="sm:max-w-[500px] p-8">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-black mb-4">Sửa thông tin ngăn xếp</DialogTitle>
              </DialogHeader>
              <div className="py-2 space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-black">Tên ngăn xếp (Ví dụ: Tủ 1 - Tầng 2) *</label>
                  <Input 
                    value={editData.name} 
                    onChange={(e) => setEditData({...editData, name: e.target.value})} 
                    placeholder="Nhập tên..." 
                    className="h-11 px-4 py-2 text-black font-semibold placeholder:text-slate-400"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-black">Mã tự đặt (Ví dụ: TT1)</label>
                  <Input 
                    value={editData.code} 
                    onChange={(e) => setEditData({...editData, code: e.target.value})} 
                    placeholder="Mã tìm nhanh..." 
                    className="h-11 px-4 py-2 text-black font-semibold placeholder:text-slate-400 uppercase"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-black">Ghi chú thêm</label>
                  <Input 
                    value={editData.description} 
                    onChange={(e) => setEditData({...editData, description: e.target.value})} 
                    placeholder="Mô tả..." 
                    className="h-11 px-4 py-2 text-black placeholder:text-slate-400"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditOpen(false)}>Huỷ</Button>
                <Button onClick={handleEditSubmit} className="bg-indigo-600 hover:bg-indigo-700">Lưu thay đổi</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-600 uppercase bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-4 py-3 w-16">ID</th>
                <th className="px-4 py-3">Mã Ngăn xếp</th>
                <th className="px-4 py-3">Tên vị trí / Ngăn xếp</th>
                <th className="px-4 py-3">Ghi chú</th>
                <th className="px-4 py-3 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={5} className="text-center py-8 text-slate-500">Đang tải dữ liệu...</td></tr>
              ) : locations.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-slate-500">Chưa có ngăn xếp nào được tạo.</td></tr>
              ) : (
                locations.map((loc) => (
                  <tr key={loc.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">#{loc.id}</td>
                    <td className="px-4 py-3 font-mono font-bold text-indigo-600">{loc.code || '---'}</td>
                    <td className="px-4 py-3 font-bold text-slate-800">{loc.name}</td>
                    <td className="px-4 py-3 text-slate-600">{loc.description || '---'}</td>
                    <td className="px-4 py-3 text-right flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-blue-50 text-blue-500" onClick={() => openEdit(loc)}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-red-50 text-red-500" onClick={() => handleDelete(loc.id)}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                      </Button>
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
