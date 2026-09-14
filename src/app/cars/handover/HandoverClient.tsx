"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, ChevronLeft, ChevronRight, FileCheck, CheckCircle2 } from "lucide-react";
import { getCars, updateCar, CarData } from "@/actions/cars";

type Props = {
  initialCars: CarData[];
  initialTotal: number;
  initialPages: number;
};

export default function HandoverClient({ initialCars, initialTotal, initialPages }: Props) {
  const [cars, setCars] = useState<CarData[]>(initialCars);
  const [total, setTotal] = useState(initialTotal);
  const [totalPages, setTotalPages] = useState(initialPages);
  
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    
    const timer = setTimeout(async () => {
      setLoading(true);
      const res = await getCars(page, 50, search);
      setCars(res.data);
      setTotal(res.totalRecords);
      setTotalPages(res.totalPages);
      setPage(res.currentPage);
      setLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [page, search]);

  const handleUpdate = async (id: number, updates: Partial<CarData>) => {
    // Optimistic update
    setCars(prev => prev.map(c => c.Id === id ? { ...c, ...updates } : c));
    
    const res = await updateCar(id, updates);
    if (!res.success) {
      alert("Lỗi khi cập nhật: " + res.error);
      // Revert on error
      const freshRes = await getCars(page, 50, search);
      setCars(freshRes.data);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-white shadow-md border-slate-200 overflow-hidden relative">
        <CardHeader className="bg-slate-50/80 border-b border-slate-100 pb-4 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <div className="p-1.5 bg-green-100 rounded-md">
                <FileCheck className="h-5 w-5 text-green-700" />
              </div>
              Bàn giao Hồ sơ Phương tiện ({total})
            </CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Tìm biển số, chủ xe..." 
                className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full font-medium"
              />
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
                  <th className="px-4 py-4">Biển số</th>
                  <th className="px-4 py-4">Chủ xe</th>
                  <th className="px-4 py-4 text-center" colSpan={4}>04 Hạng Mục (Đào Tạo Giữ & Bàn Giao)</th>
                  <th className="px-4 py-4 text-center">Bàn giao Nhân sự</th>
                  <th className="px-4 py-4 text-center">Nhân sự ĐK MST</th>
                </tr>
                <tr className="bg-slate-50/50 text-[11px] text-slate-500 border-b border-slate-200">
                  <th colSpan={3}></th>
                  <th className="px-2 py-2 text-center font-semibold">CCCD</th>
                  <th className="px-2 py-2 text-center font-semibold">Cà vẹt/Thế chấp</th>
                  <th className="px-2 py-2 text-center font-semibold">Ngân hàng</th>
                  <th className="px-2 py-2 text-center font-semibold">Đăng kiểm</th>
                  <th colSpan={2}></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {cars.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-slate-500">
                      Không có dữ liệu.
                    </td>
                  </tr>
                ) : (
                  cars.map((car, idx) => {
                    const isCompleted = car.DangKyMST;
                    return (
                      <tr 
                        key={car.Id} 
                        className={`transition-colors ${isCompleted ? 'bg-green-50/80 hover:bg-green-100/80' : 'bg-white hover:bg-slate-50'}`}
                      >
                        <td className="px-4 py-3 text-center font-semibold text-slate-500">
                          {(page - 1) * 50 + idx + 1}
                        </td>
                        <td className="px-4 py-3 font-bold text-indigo-700">
                          {car.BienSo}
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-700">
                          {car.ChuXe || '-'}
                        </td>
                        <td className="px-2 py-3 text-center">
                          <input 
                            type="checkbox" 
                            checked={!!car.BanGiaoCCCD_Xe} 
                            onChange={(e) => handleUpdate(car.Id, { BanGiaoCCCD_Xe: e.target.checked })}
                            className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                          />
                        </td>
                        <td className="px-2 py-3 text-center">
                          <input 
                            type="checkbox" 
                            checked={!!car.BanGiaoCaVet} 
                            onChange={(e) => handleUpdate(car.Id, { BanGiaoCaVet: e.target.checked })}
                            className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                          />
                        </td>
                        <td className="px-2 py-3 text-center">
                          <input 
                            type="checkbox" 
                            checked={!!car.BanGiaoNganHang} 
                            onChange={(e) => handleUpdate(car.Id, { BanGiaoNganHang: e.target.checked })}
                            className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                          />
                        </td>
                        <td className="px-2 py-3 text-center border-r border-slate-100">
                          <input 
                            type="checkbox" 
                            checked={!!car.BanGiaoDangKiem} 
                            onChange={(e) => handleUpdate(car.Id, { BanGiaoDangKiem: e.target.checked })}
                            className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                          />
                        </td>
                        
                        <td className="px-4 py-3 text-center">
                          <select
                            value={car.TrangThaiBanGiao || "Chưa nhận"}
                            onChange={(e) => {
                              const value = e.target.value;
                              const updates: Partial<CarData> = { TrangThaiBanGiao: value };
                              if (value === "Đã bàn giao") {
                                const now = new Date();
                                updates.NgayBanGiao = now.toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });
                              } else {
                                updates.NgayBanGiao = null;
                              }
                              handleUpdate(car.Id, updates);
                            }}
                            className={`px-2 py-1.5 text-xs font-bold rounded border-0 cursor-pointer outline-none ${
                              car.TrangThaiBanGiao === 'Đã bàn giao' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            <option value="Chưa nhận">Chưa nhận</option>
                            <option value="Đã bàn giao">Đã bàn giao</option>
                          </select>
                          {car.TrangThaiBanGiao === 'Đã bàn giao' && car.NgayBanGiao && (
                            <div className="text-[10px] text-emerald-600 mt-1 font-medium">{car.NgayBanGiao}</div>
                          )}
                        </td>
                        
                        <td className="px-4 py-3 text-center flex items-center justify-center gap-2">
                          {isCompleted ? (
                            <span className="flex items-center gap-1 text-green-600 font-bold text-xs bg-green-100 px-2 py-1 rounded border border-green-200">
                              <CheckCircle2 className="w-4 h-4" /> Đã ĐK
                            </span>
                          ) : (
                            <span className="text-slate-400 text-xs font-medium">Chưa ĐK</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
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
    </div>
  );
}
