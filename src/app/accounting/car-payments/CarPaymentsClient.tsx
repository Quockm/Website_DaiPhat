"use client";

import { useState } from "react";
import { CarPayment, updateCarPaymentStatus, generateCarPayments } from "@/actions/car-payments";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Check, Clock, RefreshCw, Car } from "lucide-react";

export default function CarPaymentsClient({ 
  initialPayments, currentMonth, currentYear 
}: { 
  initialPayments: CarPayment[], currentMonth: number, currentYear: number 
}) {
  const router = useRouter();
  const [payments, setPayments] = useState(initialPayments);
  const [generating, setGenerating] = useState(false);
  
  const handleGenerate = async () => {
    setGenerating(true);
    const kyThanhToan = `${currentMonth.toString().padStart(2, '0')}/${currentYear}`;
    const res = await generateCarPayments(kyThanhToan);
    if (res.success) {
      window.location.reload();
    } else {
      alert("Lỗi khi tạo danh sách thanh toán: " + res.error);
    }
    setGenerating(false);
  };
  
  const handlePay = async (id: number) => {
    if (confirm("Xác nhận chi 3.000.000đ cho xe này?")) {
      const nguoiXacNhan = "Kế toán viên"; // TODO: get from Auth
      const res = await updateCarPaymentStatus(id, "Đã thanh toán", nguoiXacNhan);
      if (res.success) {
        setPayments(payments.map(p => 
          p.Id === id ? { ...p, TrangThai: "Đã thanh toán", NgayThanhToan: new Date().toISOString(), NguoiXacNhan: nguoiXacNhan } : p
        ));
      } else {
        alert("Lỗi cập nhật: " + res.error);
      }
    }
  };
  
  const formatMoney = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  const totalPaid = payments.filter(p => p.TrangThai === "Đã thanh toán").reduce((sum, p) => sum + p.SoTien, 0);
  const totalUnpaid = payments.filter(p => p.TrangThai !== "Đã thanh toán").reduce((sum, p) => sum + p.SoTien, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Thanh toán Hợp đồng Xe
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Kỳ thanh toán: {currentMonth.toString().padStart(2, '0')}/{currentYear}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleGenerate} disabled={generating} className="bg-indigo-600 hover:bg-indigo-700">
            <RefreshCw className={`w-4 h-4 mr-2 ${generating ? "animate-spin" : ""}`} />
            Quét & Lập danh sách
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-sm border-slate-200 bg-white">
          <div className="p-6">
            <div className="flex flex-col">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-md w-max mb-3">
                <Car className="w-5 h-5" />
              </div>
              <p className="text-sm font-medium text-slate-500 mb-1">Tổng số xe cần chi trả</p>
              <p className="text-2xl font-bold text-slate-900">{payments.length} xe</p>
            </div>
          </div>
        </Card>
        <Card className="shadow-sm border-slate-200 bg-white">
          <div className="p-6">
            <div className="flex flex-col">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-md w-max mb-3">
                <Check className="w-5 h-5" />
              </div>
              <p className="text-sm font-medium text-slate-500 mb-1">Đã thanh toán</p>
              <p className="text-2xl font-bold text-slate-900">{formatMoney(totalPaid)}</p>
            </div>
          </div>
        </Card>
        <Card className="shadow-sm border-slate-200 bg-white">
          <div className="p-6">
            <div className="flex flex-col">
              <div className="p-2 bg-amber-50 text-amber-600 rounded-md w-max mb-3">
                <Clock className="w-5 h-5" />
              </div>
              <p className="text-sm font-medium text-slate-500 mb-1">Chưa thanh toán</p>
              <p className="text-2xl font-bold text-slate-900">{formatMoney(totalUnpaid)}</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="shadow-sm border-slate-200 bg-white overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="text-[11px] text-slate-600 uppercase tracking-wider bg-slate-100 border-b border-slate-200">
                <tr>
                  <th scope="col" className="px-6 py-4 font-semibold text-left">Biển Số / Xe</th>
                  <th scope="col" className="px-6 py-4 font-semibold text-left">Chủ Xe</th>
                  <th scope="col" className="px-6 py-4 font-semibold text-left">Số Tiền</th>
                  <th scope="col" className="px-6 py-4 font-semibold text-left">Trạng Thái</th>
                  <th scope="col" className="px-6 py-4 font-semibold text-left">Thời gian Thu/Chi</th>
                  <th scope="col" className="px-6 py-4 font-semibold text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                      Chưa có dữ liệu. Vui lòng nhấn "Quét & Lập danh sách" để tự động tạo danh sách chi trả cho các xe đăng ký MST.
                    </td>
                  </tr>
                ) : (
                  payments.map((p) => (
                    <tr key={p.Id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="px-6 py-4 font-semibold text-slate-800">{p.BienSo || "N/A"}</td>
                      <td className="px-6 py-4">{p.ChuXe || "N/A"}</td>
                      <td className="px-6 py-4 font-medium text-slate-800">{formatMoney(p.SoTien)}</td>
                      <td className="px-6 py-4">
                        {p.TrangThai === "Đã thanh toán" ? (
                          <span className="inline-flex items-center px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-xs">
                            <Check className="w-3 h-3 mr-1" /> Đã thanh toán
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 bg-amber-100 text-amber-700 rounded text-xs">
                            <Clock className="w-3 h-3 mr-1" /> Chưa thanh toán
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-slate-500 text-xs">
                        {p.TrangThai === "Đã thanh toán" ? (
                          <>
                            {p.NgayThanhToan ? new Date(p.NgayThanhToan).toLocaleDateString("vi-VN") : ""}
                            <br />
                            <span className="text-slate-400">({p.NguoiXacNhan})</span>
                          </>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {p.TrangThai !== "Đã thanh toán" && (
                          <Button size="sm" onClick={() => handlePay(p.Id)} className="bg-emerald-600 hover:bg-emerald-700">
                            Xác nhận Chi
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
