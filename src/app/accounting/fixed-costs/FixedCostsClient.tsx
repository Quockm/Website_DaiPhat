"use client";

import { useState } from "react";
import { FixedCost, saveFixedCost, deleteFixedCost } from "@/actions/fixed-costs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Wallet, AlertCircle, Plus, Trash2, Edit } from "lucide-react";

export default function FixedCostsClient({ initialCosts }: { initialCosts: FixedCost[] }) {
  const [costs, setCosts] = useState(initialCosts);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<Partial<FixedCost>>({ TrangThaiHoatDong: true, NgayChotHangThang: 1 });
  
  const handleSave = async () => {
    if (!formData.TenChiPhi || !formData.SoTien || !formData.NgayChotHangThang) {
      alert("Vui lòng điền đủ Tên chi phí, Số tiền và Ngày chốt.");
      return;
    }
    const res = await saveFixedCost(formData);
    if (res.success) {
      window.location.reload();
    } else {
      alert("Lỗi khi lưu: " + res.error);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("Chắc chắn muốn xóa chi phí này?")) {
      const res = await deleteFixedCost(id);
      if (res.success) {
        setCosts(costs.filter(c => c.Id !== id));
      }
    }
  };

  const formatMoney = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  const today = new Date().getDate();
  // Tìm các chi phí sắp đến hạn trong vòng 5 ngày tới
  const dueCosts = costs.filter(c => {
    if (!c.TrangThaiHoatDong) return false;
    const diff = c.NgayChotHangThang - today;
    return diff >= 0 && diff <= 5;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Quản lý Chi Phí Cố Định
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Quản lý các khoản thanh toán định kỳ như thuê nhà, internet, dịch vụ...
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => { setFormData({ TrangThaiHoatDong: true, NgayChotHangThang: 1 }); setShowModal(true); }} className="bg-pink-600 hover:bg-pink-700">
            <Plus className="w-4 h-4 mr-2" />
            Thêm Chi Phí
          </Button>
        </div>
      </div>

      {dueCosts.length > 0 && (
        <Card className="bg-rose-50 border-rose-200">
          <CardHeader className="py-3 px-4 border-b border-rose-100 flex flex-row items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-600" />
            <CardTitle className="text-rose-800 text-base">Cảnh báo đến hạn thanh toán</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <ul className="space-y-2">
              {dueCosts.map(c => (
                <li key={c.Id} className="flex justify-between items-center text-sm">
                  <span className="font-medium text-slate-700">{c.TenChiPhi}</span>
                  <span className="text-rose-600 font-semibold">Ngày {c.NgayChotHangThang} ({formatMoney(c.SoTien)})</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Card className="shadow-sm border-slate-200 bg-white overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="text-[11px] text-slate-600 uppercase tracking-wider bg-slate-100 border-b border-slate-200">
                <tr>
                  <th scope="col" className="px-6 py-4 font-semibold text-left">Tên Chi Phí</th>
                  <th scope="col" className="px-6 py-4 font-semibold text-left">Nhà Cung Cấp</th>
                  <th scope="col" className="px-6 py-4 font-semibold text-left">Chu Kỳ</th>
                  <th scope="col" className="px-6 py-4 font-semibold text-left">Số Tiền (VNĐ)</th>
                  <th scope="col" className="px-6 py-4 font-semibold text-center">Ngày Chốt</th>
                  <th scope="col" className="px-6 py-4 font-semibold text-center">Trạng Thái</th>
                  <th scope="col" className="px-6 py-4 font-semibold text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {costs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                      Chưa có khoản chi phí cố định nào.
                    </td>
                  </tr>
                ) : (
                  costs.map((c) => (
                    <tr key={c.Id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="px-6 py-4 font-semibold text-slate-800">{c.TenChiPhi}</td>
                      <td className="px-6 py-4">{c.NhaCungCap || "-"}</td>
                      <td className="px-6 py-4 text-slate-600">{c.ChuKy || "Hàng tháng"}</td>
                      <td className="px-6 py-4 font-medium text-pink-600">{formatMoney(c.SoTien)}</td>
                      <td className="px-6 py-4 text-center font-bold text-slate-700">{c.NgayChotHangThang}</td>
                      <td className="px-6 py-4 text-center">
                        {c.TrangThaiHoatDong ? (
                          <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs">Đang hoạt động</span>
                        ) : (
                          <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-full text-xs">Tạm ngưng</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {c.HopDongUrl && (
                          <a href={c.HopDongUrl} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center w-8 h-8 rounded-full hover:bg-emerald-100 text-emerald-600 mr-2 transition-colors" title="Xem hợp đồng">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-file-text"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><line x1="10" x2="8" y1="9" y2="9"/></svg>
                          </a>
                        )}
                        <button onClick={() => { setFormData(c); setShowModal(true); }} className="inline-flex items-center justify-center w-8 h-8 rounded-full hover:bg-blue-100 text-blue-600 mr-2 transition-colors">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(c.Id)} className="inline-flex items-center justify-center w-8 h-8 rounded-full hover:bg-red-100 text-red-600 transition-colors">
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
          <Card className="w-full max-w-md shadow-2xl">
            <CardHeader className="border-b bg-slate-50 pb-4">
              <CardTitle className="text-lg">{formData.Id ? "Cập nhật" : "Thêm"} Chi phí cố định</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">Tên chi phí (*)</label>
                <Input 
                  placeholder="Vd: Tiền thuê mặt bằng..." 
                  value={formData.TenChiPhi || ""}
                  onChange={e => setFormData({ ...formData, TenChiPhi: e.target.value })}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">Số tiền (*)</label>
                  <Input 
                    type="number" 
                    value={formData.SoTien || ""}
                    onChange={e => setFormData({ ...formData, SoTien: parseFloat(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">Ngày chốt (1-31) (*)</label>
                  <Input 
                    type="number" min={1} max={31}
                    value={formData.NgayChotHangThang || ""}
                    onChange={e => setFormData({ ...formData, NgayChotHangThang: parseInt(e.target.value) })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">Nhà cung cấp / Đối tác</label>
                  <Input 
                    placeholder="Vd: VNPT / Chủ nhà..." 
                    value={formData.NhaCungCap || ""}
                    onChange={e => setFormData({ ...formData, NhaCungCap: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">Chu kỳ thanh toán</label>
                  <select 
                    className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                    value={formData.ChuKy || "Hàng tháng"}
                    onChange={e => setFormData({ ...formData, ChuKy: e.target.value })}
                  >
                    <option value="Hàng tháng">Hàng tháng</option>
                    <option value="Hàng quý">Hàng quý</option>
                    <option value="Hàng năm">Hàng năm</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">Link Hợp đồng (Google Drive / OneDrive)</label>
                <Input 
                  placeholder="https://..." 
                  value={formData.HopDongUrl || ""}
                  onChange={e => setFormData({ ...formData, HopDongUrl: e.target.value })}
                />
              </div>
              
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="active"
                  checked={formData.TrangThaiHoatDong}
                  onChange={e => setFormData({ ...formData, TrangThaiHoatDong: e.target.checked })}
                  className="w-4 h-4 text-pink-600 rounded border-gray-300 focus:ring-pink-500"
                />
                <label htmlFor="active" className="text-sm font-medium text-slate-700">Đang hoạt động</label>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setShowModal(false)}>Hủy</Button>
                <Button className="bg-pink-600 hover:bg-pink-700" onClick={handleSave}>Lưu thông tin</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
