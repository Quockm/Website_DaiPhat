"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Car, ChevronLeft, ChevronRight, AlertTriangle, Edit, X, Save, Trash2, Truck } from "lucide-react";
import { getCars, updateCar, deleteCar, CarData } from "@/actions/cars";

type Props = {
  initialCars: CarData[];
  initialTotal: number;
  initialPages: number;
  initialStats: {
    total: number;
    details: Record<string, number>;
    expired: number;
    warning: number;
  };
};

function getStatus(dateStr: string | null) {
  if (!dateStr || dateStr.toLowerCase().includes('không')) return "normal";
  try {
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const d = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
      const now = new Date();
      const diffTime = d.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays < 0) return "expired";
      if (diffDays <= 30) return "warning";
    }
  } catch(e) {}
  return "normal";
}

export default function CarsClient({ initialCars, initialTotal, initialPages, initialStats }: Props) {
  const [cars, setCars] = useState<CarData[]>(initialCars);
  const [total, setTotal] = useState(initialTotal);
  const [totalPages, setTotalPages] = useState(initialPages);
  const [stats, setStats] = useState(initialStats);
  
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [trungTamFilter, setTrungTamFilter] = useState("Đại Phát");
  const [loading, setLoading] = useState(false);
  
  // Edit State
  const [editingCar, setEditingCar] = useState<CarData | null>(null);
  const [editForm, setEditForm] = useState<Partial<CarData>>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    
    const timer = setTimeout(async () => {
      setLoading(true);
      const res = await getCars(page, 50, search, category, statusFilter, "", trungTamFilter);
      setCars(res.data);
      setTotal(res.totalRecords);
      setTotalPages(res.totalPages);
      setPage(res.currentPage);
      setLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [page, search, category, statusFilter, trungTamFilter]);

  const handleEditClick = (car: CarData) => {
    setEditingCar(car);
    setEditForm({
      BienSo: car.BienSo,
      ChuXe: car.ChuXe,
      HangXe: car.HangXe,
      HanGPTL: car.HanGPTL,
      HanPhiDAT: car.HanPhiDAT,
      IMEI: car.IMEI,
      TrungTam: car.TrungTam || "Đại Phát"
    });
  };

  const handleSave = async () => {
    if (!editingCar) return;
    setSaving(true);
    const res = await updateCar(editingCar.Id, editForm);
    if (res.success) {
      setCars(cars.map(c => c.Id === editingCar.Id ? { ...c, ...editForm } : c));
      setEditingCar(null);
    } else {
      alert("Lỗi khi lưu: " + res.error);
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!editingCar) return;
    if (confirm(`Bạn có chắc chắn muốn xóa xe biển số ${editingCar.BienSo}?`)) {
      setDeleting(true);
      const res = await deleteCar(editingCar.Id);
      if (res.success) {
        setCars(cars.filter(c => c.Id !== editingCar.Id));
        setTotal(t => Math.max(0, t - 1));
        setEditingCar(null);
      } else {
        alert("Lỗi khi xóa: " + res.error);
      }
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Compact Stats Ribbon */}
      <div className="flex flex-col md:flex-row justify-between gap-4 bg-white p-3 rounded-xl border border-slate-200 shadow-sm items-center">
        {/* Left: Tổng */}
        <div className="flex items-center gap-3 px-4 py-2 bg-orange-50 text-orange-700 rounded-lg border border-orange-100 w-full md:w-auto">
          <Truck className="w-5 h-5" />
          <span className="text-sm font-bold uppercase tracking-wider">Tổng cộng:</span>
          <span className="text-xl font-black">{stats.total}</span>
        </div>
        
        {/* Right: Chi tiết (Sát phải) */}
        <div className="flex flex-wrap items-center justify-end gap-2 ml-auto w-full md:w-auto">
          {Object.entries(stats.details).map(([cat, count]) => (
            <div key={cat} className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 text-slate-700 rounded-lg border border-slate-100 hover:border-orange-200 hover:bg-white transition-colors cursor-default shadow-sm">
              <span className="text-xs font-semibold text-slate-500 uppercase">Hạng {cat}:</span>
              <span className="text-sm font-black text-orange-600">{count}</span>
            </div>
          ))}
        </div>
      </div>

      <Card className="bg-white shadow-md border-slate-200 overflow-hidden relative">
        <CardHeader className="bg-slate-50/80 border-b border-slate-100 pb-4 flex flex-col gap-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4">
              <CardTitle className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                <div className="p-1.5 bg-orange-100 rounded-md">
                  <Car className="h-5 w-5 text-orange-700" />
                </div>
                Danh sách Xe ({total})
              </CardTitle>
              
              {/* Cảnh báo hết hạn */}
              <div className="flex items-center gap-2">
                {stats.expired > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200 shadow-sm">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {stats.expired} xe hết hạn
                  </span>
                )}
                {stats.warning > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200 shadow-sm">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {stats.warning} xe sắp hết
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto mt-4 lg:mt-0">
              <select
                value={trungTamFilter}
                onChange={(e) => { setTrungTamFilter(e.target.value); setPage(1); }}
                className="w-full sm:w-auto px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium bg-white text-slate-700"
              >
                <option value="Đại Phát">Đại Phát</option>
                <option value="Tiến Thành">Tiến Thành</option>
              </select>

              <select 
                value={category}
                onChange={(e) => { setCategory(e.target.value); setPage(1); }}
                className="w-full sm:w-auto px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium bg-white text-slate-700"
              >
                <option value="all">Tất cả hạng</option>
                {Object.keys(stats.details).map(cat => (
                  <option key={cat} value={cat}>Hạng {cat}</option>
                ))}
              </select>
              
              <select 
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className="w-full sm:w-auto px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium bg-white text-slate-700"
              >
                <option value="all">Tất cả thời hạn</option>
                <option value="valid">Còn hạn</option>
                <option value="warning">Sắp hết hạn</option>
                <option value="expired">Đã hết hạn</option>
              </select>

              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  placeholder="Biển số, Chủ xe, IMEI..." 
                  className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 w-full sm:w-60 font-medium"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0 relative">
          {loading && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
            </div>
          )}
          
          <div className="overflow-x-auto min-h-[500px]">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-extrabold uppercase text-xs border-b border-slate-200">
                <tr>
                  <th className="px-4 py-4 w-12 text-center">STT</th>
                  <th className="px-4 py-4 min-w-[150px]">Biển số</th>
                  <th className="px-4 py-4">Trung tâm</th>
                  <th className="px-4 py-4">Chủ xe</th>
                  <th className="px-4 py-4">Hãng xe</th>
                  <th className="px-4 py-4 text-center">Giấy PTL</th>
                  <th className="px-4 py-4 text-center">Phí ĐAT</th>
                  <th className="px-4 py-4">Thiết bị</th>
                  <th className="px-4 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {cars.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-slate-500">
                      Không tìm thấy dữ liệu phù hợp.
                    </td>
                  </tr>
                ) : (
                  cars.map((car, idx) => {
                    const statusGPTL = getStatus(car.HanGPTL);
                    const statusDAT = getStatus(car.HanPhiDAT);

                    return (
                      <tr key={car.Id || idx} className="hover:bg-orange-50/50 transition-colors bg-white group">
                        <td className="px-4 py-3 text-center font-semibold text-slate-500">
                          {idx + 1 + (page - 1) * 50}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-bold text-slate-900">{car.BienSo}</div>
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-700">
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs font-bold border border-slate-200">
                            {car.TrungTam || 'Đại Phát'}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-700">
                          {car.ChuXe || '-'}
                        </td>
                        <td className="px-4 py-3 text-center font-bold text-indigo-700">
                          {car.HangXe || '-'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                            statusGPTL === 'expired' ? 'bg-red-100 text-red-700' :
                            statusGPTL === 'warning' ? 'bg-amber-100 text-amber-700' :
                            car.HanGPTL ? 'bg-emerald-100 text-emerald-700' : 'text-slate-400'
                          }`}>
                            {(statusGPTL === 'expired' || statusGPTL === 'warning') && <AlertTriangle className="w-3.5 h-3.5" />}
                            {car.HanGPTL || '-'}
                          </span>
                        </td>

                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                            statusDAT === 'expired' ? 'bg-red-100 text-red-700' :
                            statusDAT === 'warning' ? 'bg-amber-100 text-amber-700' :
                            car.HanPhiDAT ? 'bg-emerald-100 text-emerald-700' : 'text-slate-400'
                          }`}>
                            {(statusDAT === 'expired' || statusDAT === 'warning') && <AlertTriangle className="w-3.5 h-3.5" />}
                            {car.HanPhiDAT || '-'}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-600">
                          {car.IMEI || '-'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button 
                            onClick={() => handleEditClick(car)}
                            className="p-1.5 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
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

      {/* Edit Modal */}
      {editingCar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <Card className="w-full max-w-lg bg-white shadow-2xl border-0 overflow-hidden">
            <CardHeader className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-bold text-slate-800">Chỉnh sửa Phương tiện</CardTitle>
              <button onClick={() => setEditingCar(null)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Biển số xe</label>
                  <input 
                    type="text" 
                    value={editForm.BienSo || ""} 
                    onChange={(e) => setEditForm({...editForm, BienSo: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Hạng xe</label>
                  <input 
                    type="text" 
                    value={editForm.HangXe || ""} 
                    onChange={(e) => setEditForm({...editForm, HangXe: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Chủ xe</label>
                  <input 
                    type="text" 
                    value={editForm.ChuXe || ""} 
                    onChange={(e) => setEditForm({...editForm, ChuXe: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Hạn GPTL (dd/MM/yyyy)</label>
                  <input 
                    type="text" 
                    value={editForm.HanGPTL || ""} 
                    onChange={(e) => setEditForm({...editForm, HanGPTL: e.target.value})}
                    placeholder="dd/mm/yyyy"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Hạn phí DAT (dd/MM/yyyy)</label>
                  <input 
                    type="text" 
                    value={editForm.HanPhiDAT || ""} 
                    onChange={(e) => setEditForm({...editForm, HanPhiDAT: e.target.value})}
                    placeholder="dd/mm/yyyy"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">IMEI Thiết bị</label>
                  <input 
                    type="text" 
                    value={editForm.IMEI || ""} 
                    onChange={(e) => setEditForm({...editForm, IMEI: e.target.value})}
                    placeholder="VD: 1234567890"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Trung tâm</label>
                  <select
                    value={editForm.TrungTam || "Đại Phát"}
                    onChange={(e) => setEditForm({...editForm, TrungTam: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="Đại Phát">Đại Phát</option>
                    <option value="Tiến Thành">Tiến Thành</option>
                  </select>
                </div>
              </div>
            </CardContent>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <button 
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
              >
                {deleting ? <div className="w-4 h-4 border-2 border-red-200 border-t-red-600 rounded-full animate-spin"/> : <Trash2 className="w-4 h-4" />}
                Xóa
              </button>

              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setEditingCar(null)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Hủy
                </button>
                <button 
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors disabled:opacity-50 shadow-sm"
                >
                  {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <Save className="w-4 h-4" />}
                  Lưu thay đổi
                </button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
