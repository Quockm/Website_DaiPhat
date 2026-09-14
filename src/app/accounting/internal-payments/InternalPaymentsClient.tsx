"use client";

import { useState } from "react";
import { InternalPayment, saveInternalPayment, deleteInternalPayment } from "@/actions/internal-payments";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileStack, CheckCircle, Clock, Trash2, Edit, Plus, Download } from "lucide-react";

export default function InternalPaymentsClient({ initialPayments }: { initialPayments: InternalPayment[] }) {
  const [payments, setPayments] = useState(initialPayments);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<Partial<InternalPayment>>({ LoaiPhieu: "Thanh toán" });
  const [uploading, setUploading] = useState(false);

  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploading(true);
    const data = new FormData();
    data.append("file", file);
    
    try {
      const res = await fetch("/api/upload", { method: "POST", body: data });
      const json = await res.json();
      if (json.url) {
        setFormData({ ...formData, FileDinhKem: json.url });
      } else {
        alert("Upload thất bại.");
      }
    } catch (err) {
      alert("Lỗi khi upload file.");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.TieuDe || !formData.SoTien || !formData.NguoiDeXuat) {
      alert("Vui lòng điền đủ Tiêu đề, Số tiền và Người đề xuất.");
      return;
    }
    const res = await saveInternalPayment(formData);
    if (res.success) {
      window.location.reload();
    } else {
      alert("Lỗi khi lưu: " + res.error);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("Chắc chắn muốn xóa phiếu này?")) {
      const res = await deleteInternalPayment(id);
      if (res.success) {
        setPayments(payments.filter(p => p.Id !== id));
      }
    }
  };

  const formatMoney = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Thanh toán Nội bộ
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Quản lý các phiếu đề nghị chi tiền, tạm ứng, mua sắm từ nhân sự.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => { setFormData({ LoaiPhieu: "Thanh toán", TrangThaiDuyet: "Chờ duyệt", TrangThaiChi: "Chưa chi" }); setShowModal(true); }} className="bg-sky-600 hover:bg-sky-700">
            <Plus className="w-4 h-4 mr-2" />
            Tạo Đề Nghị
          </Button>
        </div>
      </div>

      <Card className="shadow-sm border-slate-200 bg-white overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="text-[11px] text-slate-600 uppercase tracking-wider bg-slate-100 border-b border-slate-200">
                <tr>
                  <th scope="col" className="px-6 py-4 font-semibold text-left">Tiêu Đề / Loại</th>
                  <th scope="col" className="px-6 py-4 font-semibold text-left">Người Yêu Cầu</th>
                  <th scope="col" className="px-6 py-4 font-semibold text-left">Số Tiền</th>
                  <th scope="col" className="px-6 py-4 font-semibold text-left">Ngày Cần</th>
                  <th scope="col" className="px-6 py-4 font-semibold text-left">Trạng Thái Duyệt</th>
                  <th scope="col" className="px-6 py-4 font-semibold text-left">Trạng Thái Chi</th>
                  <th scope="col" className="px-6 py-4 font-semibold text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                      Chưa có phiếu đề nghị thanh toán nào.
                    </td>
                  </tr>
                ) : (
                  payments.map((p) => (
                    <tr key={p.Id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-800">{p.TieuDe}</div>
                        <div className="text-xs text-slate-500 mt-1">{p.LoaiPhieu}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div>{p.NguoiDeXuat}</div>
                        <div className="text-xs text-slate-500 mt-1">{p.PhongBan}</div>
                      </td>
                      <td className="px-6 py-4 font-medium text-sky-600">{formatMoney(p.SoTien)}</td>
                      <td className="px-6 py-4 text-slate-700">
                        {p.NgayCanTien ? new Date(p.NgayCanTien).toLocaleDateString("vi-VN") : "-"}
                      </td>
                      <td className="px-6 py-4">
                        {p.TrangThaiDuyet === "Đã duyệt" ? (
                          <span className="inline-flex items-center px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-xs">
                            <CheckCircle className="w-3 h-3 mr-1" /> {p.TrangThaiDuyet}
                          </span>
                        ) : p.TrangThaiDuyet === "Từ chối" ? (
                          <span className="inline-flex items-center px-2 py-1 bg-red-100 text-red-700 rounded text-xs">
                            Từ chối
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 bg-amber-100 text-amber-700 rounded text-xs">
                            <Clock className="w-3 h-3 mr-1" /> {p.TrangThaiDuyet}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {p.TrangThaiChi === "Đã chi" ? (
                          <span className="inline-flex items-center px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-xs font-semibold">
                            Đã chi tiền
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs">
                            Chưa chi
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {p.FileDinhKem && (
                          <a href={p.FileDinhKem} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center w-8 h-8 rounded-full hover:bg-emerald-100 text-emerald-600 mr-2 transition-colors" title="Xem chứng từ">
                            <Download className="w-4 h-4" />
                          </a>
                        )}
                        <button onClick={() => { setFormData(p); setShowModal(true); }} className="inline-flex items-center justify-center w-8 h-8 rounded-full hover:bg-blue-100 text-blue-600 mr-2 transition-colors">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(p.Id)} className="inline-flex items-center justify-center w-8 h-8 rounded-full hover:bg-red-100 text-red-600 transition-colors">
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

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg shadow-2xl">
            <CardHeader className="border-b bg-slate-50 pb-4">
              <CardTitle className="text-lg">{formData.Id ? "Chi tiết/Cập nhật" : "Tạo"} Phiếu Đề Nghị</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">Tiêu đề (*)</label>
                <Input placeholder="Vd: Tạm ứng tiếp khách..." value={formData.TieuDe || ""} onChange={e => setFormData({ ...formData, TieuDe: e.target.value })} />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">Người đề xuất (*)</label>
                  <Input value={formData.NguoiDeXuat || ""} onChange={e => setFormData({ ...formData, NguoiDeXuat: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">Phòng ban</label>
                  <Input value={formData.PhongBan || ""} onChange={e => setFormData({ ...formData, PhongBan: e.target.value })} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">Số tiền (VNĐ) (*)</label>
                  <Input type="number" value={formData.SoTien || ""} onChange={e => setFormData({ ...formData, SoTien: parseFloat(e.target.value) })} />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">Ngày cần tiền</label>
                  <Input type="date" value={formData.NgayCanTien ? new Date(formData.NgayCanTien).toISOString().split('T')[0] : ""} onChange={e => setFormData({ ...formData, NgayCanTien: e.target.value })} />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">Loại phiếu</label>
                  <select className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm" value={formData.LoaiPhieu || ""} onChange={e => setFormData({ ...formData, LoaiPhieu: e.target.value })}>
                    <option value="Thanh toán">Thanh toán</option>
                    <option value="Tạm ứng">Tạm ứng</option>
                    <option value="Mua sắm">Mua sắm</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">Duyệt (Sếp)</label>
                  <select className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm" value={formData.TrangThaiDuyet || ""} onChange={e => setFormData({ ...formData, TrangThaiDuyet: e.target.value })}>
                    <option value="Chờ duyệt">Chờ duyệt</option>
                    <option value="Đã duyệt">Đã duyệt</option>
                    <option value="Từ chối">Từ chối</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">Kế toán chi</label>
                  <select className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm" value={formData.TrangThaiChi || ""} onChange={e => setFormData({ ...formData, TrangThaiChi: e.target.value })}>
                    <option value="Chưa chi">Chưa chi</option>
                    <option value="Đã chi">Đã chi</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">File đính kèm (Báo giá/Hóa đơn)</label>
                <div className="flex gap-2 items-center">
                  <Input type="file" onChange={handleUploadFile} className="cursor-pointer" accept=".pdf,.jpg,.png" />
                  {uploading && <span className="text-sm text-slate-500">Đang tải...</span>}
                </div>
                {formData.FileDinhKem && <p className="text-xs text-sky-600 mt-2 truncate">Đã tải lên: {formData.FileDinhKem}</p>}
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setShowModal(false)}>Hủy</Button>
                <Button className="bg-sky-600 hover:bg-sky-700" onClick={handleSave}>Lưu thông tin</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
