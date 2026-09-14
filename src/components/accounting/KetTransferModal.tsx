"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { createKetTransfer, getKetTransfers } from "@/actions/accounting";

export function KetTransferModal({
  isOpen,
  onClose,
  onSuccess,
  todayTotal,
  totalBalance
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  todayTotal: number;
  totalBalance: number;
}) {
  const [loading, setLoading] = useState(false);
  const [soTien, setSoTien] = useState("");
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      loadHistory();
      setSoTien("");
    }
  }, [isOpen]);

  const loadHistory = async () => {
    const data = await getKetTransfers('Trang');
    // Only show transfers sent BY Trang to Me
    setHistory(data.filter((d: any) => d.tuKet === 'Trang'));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(soTien.replace(/,/g, ''));
    if (!amount || amount <= 0) {
      alert("Vui lòng nhập số tiền hợp lệ!");
      return;
    }
    
    setLoading(true);
    const res = await createKetTransfer({
      tuKet: "Trang",
      denKet: "Mẹ",
      soTien: amount
    });
    setLoading(false);

    if (res.success) {
      onSuccess();
      loadHistory();
      setSoTien("");
    } else {
      alert("Có lỗi xảy ra: " + res.error);
    }
  };

  const formatAmount = (val: string) => {
    const raw = val.replace(/,/g, '').replace(/\D/g, '');
    if (!raw) return '';
    return Number(raw).toLocaleString('en-US');
  };

  const handleNopHomNay = () => {
    setSoTien(todayTotal.toString());
    setTimeout(() => {
        setSoTien(formatAmount(todayTotal.toString()));
    }, 50);
  };

  const handleNopTatCa = () => {
    setSoTien(totalBalance.toString());
    setTimeout(() => {
        setSoTien(formatAmount(totalBalance.toString()));
    }, 50);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl p-6 sm:p-8">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-2xl text-slate-800 font-bold">Nộp tiền về két Mẹ</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="bg-slate-50 p-4 rounded-lg border border-slate-200">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 space-y-2 w-full">
              <label className="text-sm font-medium text-slate-700">Số tiền nộp (VNĐ) *</label>
              <Input 
                placeholder="0" 
                value={soTien} 
                onChange={e => setSoTien(e.target.value)} 
                onBlur={() => setSoTien(formatAmount(soTien))}
                required
                className="font-semibold text-black"
              />
            </div>
            <div className="flex flex-wrap gap-2 w-full md:w-auto">
              <Button type="button" variant="outline" onClick={handleNopHomNay} className="text-blue-600 border-blue-200 hover:bg-blue-50 whitespace-nowrap">
                Thu hôm nay ({Number(todayTotal).toLocaleString('en-US')}đ)
              </Button>
              <Button type="button" variant="outline" onClick={handleNopTatCa} className="text-indigo-600 border-indigo-200 hover:bg-indigo-50 whitespace-nowrap">
                Tất cả két ({Number(totalBalance).toLocaleString('en-US')}đ)
              </Button>
              <Button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 whitespace-nowrap">
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Tạo Lệnh Nộp
              </Button>
            </div>
          </div>
        </form>

        <div className="mt-6">
          <h4 className="font-semibold text-slate-800 mb-2">Lịch sử nộp tiền</h4>
          <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-md">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-100 text-slate-600 sticky top-0">
                <tr>
                  <th className="px-4 py-2 font-medium">Thời gian tạo lệnh</th>
                  <th className="px-4 py-2 font-medium">Số tiền (VNĐ)</th>
                  <th className="px-4 py-2 font-medium">Trạng thái</th>
                  <th className="px-4 py-2 font-medium">Thời gian duyệt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {history.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-4 text-center text-slate-500">Chưa có lịch sử nộp tiền</td>
                  </tr>
                ) : history.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="px-4 py-2 text-slate-700">
                      {new Date(item.ngayNop).toLocaleString('vi-VN')}
                    </td>
                    <td className="px-4 py-2 font-medium text-slate-900">
                      {Number(item.soTien).toLocaleString('en-US')}
                    </td>
                    <td className="px-4 py-2">
                      {item.trangThai === 'Chờ xác nhận' ? (
                        <span className="text-orange-600 bg-orange-50 px-2 py-0.5 rounded text-xs font-medium border border-orange-200">
                          Chờ duyệt
                        </span>
                      ) : (
                        <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded text-xs font-medium border border-emerald-200">
                          Đã duyệt
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-slate-700">
                      {item.ngayXacNhan ? new Date(item.ngayXacNhan).toLocaleString('vi-VN') : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Đóng</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
