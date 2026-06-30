"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createTransaction } from "@/actions/accounting";
import { Loader2 } from "lucide-react";

export function TransactionForm({
  isOpen,
  onClose,
  onSuccess
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  
  const [loaiGD, setLoaiGD] = useState("THU");
  const [ngayGD, setNgayGD] = useState(new Date().toISOString().split('T')[0]);
  const [danhMuc, setDanhMuc] = useState("");
  const [soTien, setSoTien] = useState("");
  const [nguoiNhanNop, setNguoiNhanNop] = useState("");
  const [hinhThuc, setHinhThuc] = useState("Tiền mặt");
  const [chungTu, setChungTu] = useState("");
  const [ghiChu, setGhiChu] = useState("");
  const [maKhoa, setMaKhoa] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!danhMuc || !soTien) {
      alert("Vui lòng nhập danh mục và số tiền!");
      return;
    }
    
    setLoading(true);
    const amount = parseFloat(soTien.replace(/,/g, ''));
    
    const res = await createTransaction({
      loaiGD,
      ngayGD,
      danhMuc,
      soTien: amount,
      nguoiNhanNop,
      hinhThuc,
      chungTu,
      ghiChu,
      maKhoa
    });
    
    setLoading(false);
    if (res.success) {
      onSuccess();
      onClose();
      // Reset form
      setDanhMuc("");
      setSoTien("");
      setNguoiNhanNop("");
      setChungTu("");
      setGhiChu("");
      setMaKhoa("");
    } else {
      alert("Có lỗi xảy ra: " + res.error);
    }
  };

  const formatAmount = (val: string) => {
    const raw = val.replace(/,/g, '').replace(/\D/g, '');
    if (!raw) return '';
    return Number(raw).toLocaleString('en-US');
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl p-6 sm:p-8">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-2xl text-slate-800 font-bold">Thêm Giao Dịch Mới</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Loại giao dịch *</label>
              <div className="flex bg-slate-100 p-1 rounded-md">
                <button
                  type="button"
                  className={`flex-1 py-1.5 text-sm font-medium rounded ${loaiGD === 'THU' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  onClick={() => setLoaiGD('THU')}
                >
                  Phiếu Thu
                </button>
                <button
                  type="button"
                  className={`flex-1 py-1.5 text-sm font-medium rounded ${loaiGD === 'CHI' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  onClick={() => setLoaiGD('CHI')}
                >
                  Phiếu Chi
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Ngày giao dịch *</label>
              <Input type="date" required value={ngayGD} onChange={e => setNgayGD(e.target.value)} />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Danh mục *</label>
            <Input 
              placeholder={loaiGD === 'THU' ? "VD: Thu học phí, Thu lệ phí thi..." : "VD: Tiền điện, Lương GV, Thuê sân bãi..."}
              value={danhMuc} 
              onChange={e => setDanhMuc(e.target.value)} 
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Số tiền (VNĐ) *</label>
              <Input 
                placeholder="0" 
                value={soTien} 
                onChange={e => setSoTien(formatAmount(e.target.value))} 
                required
                className="font-semibold text-right"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Hình thức thanh toán</label>
              <Select value={hinhThuc} onValueChange={setHinhThuc}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn hình thức" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Tiền mặt">Tiền mặt</SelectItem>
                  <SelectItem value="Chuyển khoản">Chuyển khoản</SelectItem>
                  <SelectItem value="Khác">Khác</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Người nộp / Người nhận</label>
            <Input 
              placeholder={loaiGD === 'THU' ? "Tên người nộp tiền" : "Tên người nhận tiền"}
              value={nguoiNhanNop} 
              onChange={e => setNguoiNhanNop(e.target.value)} 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Mã Khóa (Nếu có)</label>
              <Input 
                placeholder="VD: 79106K26B00XX"
                value={maKhoa} 
                onChange={e => setMaKhoa(e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Số chứng từ</label>
              <Input 
                placeholder="Mã hóa đơn/UNC"
                value={chungTu} 
                onChange={e => setChungTu(e.target.value)} 
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Ghi chú thêm</label>
            <Input 
              placeholder="Nhập diễn giải..."
              value={ghiChu} 
              onChange={e => setGhiChu(e.target.value)} 
            />
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Hủy</Button>
            <Button type="submit" disabled={loading} className={loaiGD === 'THU' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {loaiGD === 'THU' ? "Lập Phiếu Thu" : "Lập Phiếu Chi"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
