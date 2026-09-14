"use client";

import { useState } from "react";
import { TaxRecord, saveTaxRecord, deleteTaxRecord } from "@/actions/taxes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Download, Trash2, Plus, Upload, Filter, AlertCircle } from "lucide-react";

export default function TaxesClient({ initialRecords }: { initialRecords: TaxRecord[] }) {
  const [records, setRecords] = useState(initialRecords);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<Partial<TaxRecord>>({ NamTaiChinh: new Date().getFullYear() });
  const [uploading, setUploading] = useState(false);
  
  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploading(true);
    const data = new FormData();
    data.append("file", file);
    
    try {
      // Dùng chung endpoint api/upload đang có trong hệ thống (nếu có)
      const res = await fetch("/api/upload", {
        method: "POST",
        body: data,
      });
      const json = await res.json();
      if (json.url) {
        setFormData({ ...formData, FileUrl: json.url });
      } else {
        alert("Upload thất bại. Có thể API /api/upload chưa hỗ trợ loại file này.");
      }
    } catch (err) {
      alert("Lỗi khi upload file.");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.TenHoSo || !formData.LoaiHoSo) {
      alert("Vui lòng nhập Tên và Loại hồ sơ!");
      return;
    }
    const res = await saveTaxRecord(formData);
    if (res.success) {
      setShowModal(false);
      setFormData({ NamTaiChinh: new Date().getFullYear() });
      window.location.reload();
    } else {
      alert("Lỗi khi lưu: " + res.error);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("Bạn có chắc muốn xóa hồ sơ này?")) {
      const res = await deleteTaxRecord(id);
      if (res.success) {
        setRecords(records.filter(r => r.Id !== id));
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Hồ sơ Thuế & Báo cáo Tài chính
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Lưu trữ BCTC, tờ khai thuế, chứng từ nộp thuế các năm.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => { setFormData({ NamTaiChinh: new Date().getFullYear() }); setShowModal(true); }} className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="w-4 h-4 mr-2" />
            Thêm Hồ Sơ
          </Button>
        </div>
      </div>

      {records.some(r => r.HanNopThue && new Date(r.HanNopThue).getTime() - new Date().getTime() < 1000 * 3600 * 24 * 7 && new Date(r.HanNopThue).getTime() > new Date().getTime() - 1000 * 3600 * 24) && (
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-amber-600" />
            <div>
              <div className="font-semibold text-amber-800">Cảnh báo: Sắp đến hạn nộp thuế/báo cáo!</div>
              <ul className="text-sm text-amber-700 mt-1 list-disc list-inside">
                {records.filter(r => r.HanNopThue && new Date(r.HanNopThue).getTime() - new Date().getTime() < 1000 * 3600 * 24 * 7 && new Date(r.HanNopThue).getTime() > new Date().getTime() - 1000 * 3600 * 24).map(r => (
                  <li key={r.Id}>Hồ sơ: {r.TenHoSo} - Hạn: {new Date(r.HanNopThue!).toLocaleDateString('vi-VN')}</li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="shadow-sm border-slate-200 bg-white overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="text-[11px] text-slate-600 uppercase tracking-wider bg-slate-100 border-b border-slate-200">
                <tr>
                  <th scope="col" className="px-6 py-4 font-semibold text-left">Tên Hồ Sơ</th>
                  <th scope="col" className="px-6 py-4 font-semibold text-left">Phân Loại</th>
                  <th scope="col" className="px-6 py-4 font-semibold text-left">Năm Tài Chính</th>
                  <th scope="col" className="px-6 py-4 font-semibold text-left">Hạn Nộp</th>
                  <th scope="col" className="px-6 py-4 font-semibold text-left">Người tạo</th>
                  <th scope="col" className="px-6 py-4 font-semibold text-left">Ngày Cập Nhật</th>
                  <th scope="col" className="px-6 py-4 font-semibold text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {records.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                      Chưa có hồ sơ nào.
                    </td>
                  </tr>
                ) : (
                  records.map((r) => (
                    <tr key={r.Id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="px-6 py-4 font-medium text-slate-800">{r.TenHoSo}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">{r.LoaiHoSo}</span>
                      </td>
                      <td className="px-6 py-4 font-semibold text-emerald-600">{r.NamTaiChinh}</td>
                      <td className="px-6 py-4">
                        {r.HanNopThue ? (
                          <span className={new Date(r.HanNopThue).getTime() < new Date().getTime() ? "text-red-600 font-bold" : "text-amber-600"}>
                            {new Date(r.HanNopThue).toLocaleDateString("vi-VN")}
                          </span>
                        ) : "-"}
                      </td>
                      <td className="px-6 py-4">{r.NguoiTao}</td>
                      <td className="px-6 py-4">{r.NgayCapNhat ? new Date(r.NgayCapNhat).toLocaleDateString("vi-VN") : ""}</td>
                      <td className="px-6 py-4 text-right">
                        {r.FileUrl && (
                          <a href={r.FileUrl} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center w-8 h-8 rounded-full hover:bg-emerald-100 text-emerald-600 mr-2 transition-colors">
                            <Download className="w-4 h-4" />
                          </a>
                        )}
                        <button onClick={() => handleDelete(r.Id)} className="inline-flex items-center justify-center w-8 h-8 rounded-full hover:bg-red-100 text-red-600 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Modal Thêm */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md shadow-2xl">
            <CardHeader className="border-b bg-slate-50 pb-4">
              <CardTitle className="text-lg">Thêm Hồ sơ Thuế</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">Tên Hồ sơ</label>
                <Input 
                  placeholder="Vd: BCTC 2026..." 
                  value={formData.TenHoSo || ""}
                  onChange={e => setFormData({ ...formData, TenHoSo: e.target.value })}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">Phân loại</label>
                  <select 
                    className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                    value={formData.LoaiHoSo || ""}
                    onChange={e => setFormData({ ...formData, LoaiHoSo: e.target.value })}
                  >
                    <option value="">Chọn loại</option>
                    <option value="Báo cáo kết quả KD">Báo cáo kết quả KD</option>
                    <option value="Hồ sơ pháp lý">Hồ sơ pháp lý</option>
                    <option value="Tờ khai thuế">Tờ khai thuế</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">Năm Tài Chính</label>
                  <Input 
                    type="number" 
                    value={formData.NamTaiChinh || ""}
                    onChange={e => setFormData({ ...formData, NamTaiChinh: parseInt(e.target.value) })}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">Hạn nộp (Deadline)</label>
                <Input 
                  type="date" 
                  value={formData.HanNopThue ? new Date(formData.HanNopThue).toISOString().split('T')[0] : ""}
                  onChange={e => setFormData({ ...formData, HanNopThue: e.target.value })}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">File đính kèm</label>
                <div className="flex gap-2 items-center">
                  <Input 
                    type="file" 
                    onChange={handleUploadFile} 
                    className="cursor-pointer"
                    accept=".pdf,.xlsx,.xls,.doc,.docx,.jpg,.png"
                  />
                  {uploading && <span className="text-sm text-slate-500 animate-pulse">Đang tải...</span>}
                </div>
                {formData.FileUrl && (
                  <p className="text-xs text-emerald-600 mt-2 truncate">
                    Đã tải lên: {formData.FileUrl}
                  </p>
                )}
              </div>
              
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">Ghi chú thêm</label>
                <Input 
                  placeholder="Ghi chú..." 
                  value={formData.GhiChu || ""}
                  onChange={e => setFormData({ ...formData, GhiChu: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setShowModal(false)}>Hủy</Button>
                <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleSave}>Lưu Hồ Sơ</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
