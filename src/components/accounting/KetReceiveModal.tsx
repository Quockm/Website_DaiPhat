"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Check } from "lucide-react";
import { getKetTransfers, confirmKetTransfer } from "@/actions/accounting";

export function KetReceiveModal({
  isOpen,
  onClose,
  onSuccess
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      loadHistory();
    }
  }, [isOpen]);

  const loadHistory = async () => {
    const data = await getKetTransfers('Mẹ');
    // Mẹ only cares about money sent TO Mẹ
    setHistory(data.filter((d: any) => d.denKet === 'Mẹ'));
  };

  const handleConfirm = async (id: number) => {
    setLoadingId(id);
    const res = await confirmKetTransfer(id);
    setLoadingId(null);
    if (res.success) {
      onSuccess();
      loadHistory();
    } else {
      alert("Có lỗi xảy ra: " + res.error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl p-6 sm:p-8 bg-slate-50">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-2xl text-slate-800 font-bold">Lịch sử nhận tiền từ két Trang</DialogTitle>
        </DialogHeader>

        <div className="bg-white border border-slate-200 rounded-md overflow-hidden shadow-sm">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-100 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 font-semibold">Thời gian tạo lệnh</th>
                <th className="px-4 py-3 font-semibold">Két gửi</th>
                <th className="px-4 py-3 font-semibold text-right">Số tiền (VNĐ)</th>
                <th className="px-4 py-3 font-semibold">Trạng thái</th>
                <th className="px-4 py-3 font-semibold">Thời gian duyệt</th>
                <th className="px-4 py-3 font-semibold text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {history.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                    Chưa có lịch sử nhận tiền nào
                  </td>
                </tr>
              ) : history.map((item, idx) => (
                <tr key={idx} className="hover:bg-blue-50/30 transition-colors">
                  <td className="px-4 py-3 text-slate-700">
                    {new Date(item.ngayNop).toLocaleString('vi-VN')}
                  </td>
                  <td className="px-4 py-3 font-medium text-blue-600">
                    {item.tuKet}
                  </td>
                  <td className="px-4 py-3 font-bold text-slate-900 text-right">
                    {Number(item.soTien).toLocaleString('en-US')}
                  </td>
                  <td className="px-4 py-3">
                    {item.trangThai === 'Chờ xác nhận' ? (
                      <span className="text-orange-600 bg-orange-50 px-2 py-1 rounded text-xs font-medium border border-orange-200">
                        Chờ duyệt
                      </span>
                    ) : (
                      <span className="text-emerald-600 bg-emerald-50 px-2 py-1 rounded text-xs font-medium border border-emerald-200">
                        Đã xác nhận
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {item.ngayXacNhan ? new Date(item.ngayXacNhan).toLocaleString('vi-VN') : '-'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {item.trangThai === 'Chờ xác nhận' && (
                      <Button 
                        size="sm" 
                        onClick={() => handleConfirm(item.id)}
                        disabled={loadingId === item.id}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-xs px-3"
                      >
                        {loadingId === item.id ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Check className="w-3 h-3 mr-1" />}
                        Xác nhận
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <DialogFooter className="mt-6">
          <Button type="button" variant="outline" onClick={onClose}>Đóng</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
