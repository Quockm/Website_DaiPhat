"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Filter, Wallet, ArrowDownToLine, ArrowUpFromLine, Trash2, Printer, Eye, Banknote, Clock } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { deleteTransaction, getGroupedFeeStudents } from "@/actions/accounting";
import { TransactionForm } from "./TransactionForm";
import { KetTransferModal } from "./KetTransferModal";
import { KetReceiveModal } from "./KetReceiveModal";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function TransactionsClient({
  initialTransactions,
  initialStats,
  currentDate,
  currentKet
}: {
  initialTransactions: any[];
  initialStats: any;
  currentDate: string;
  currentKet: string;
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isKetTransferOpen, setIsKetTransferOpen] = useState(false);
  const [isKetReceiveOpen, setIsKetReceiveOpen] = useState(false);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [groupStudents, setGroupStudents] = useState<any[]>([]);
  const [loadingGroup, setLoadingGroup] = useState(false);
  const [selectedGroupName, setSelectedGroupName] = useState("");
  const router = useRouter();

  const handleViewGroup = async (t: any) => {
    const parts = t.maGD.split('_');
    const nguoiNop = parts[1];
    const maKhoa = parts[2];
    
    // Convert to YYYY-MM-DD
    const d = new Date(t.ngayGD);
    const dateStr = `${d.getFullYear()}-${(d.getMonth()+1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
    
    setSelectedGroupName(`Học viên thu bởi ${nguoiNop} (Khoá ${maKhoa === 'ALL' ? 'Chung' : maKhoa})`);
    setIsGroupModalOpen(true);
    setLoadingGroup(true);
    const result = await getGroupedFeeStudents(nguoiNop, maKhoa === 'ALL' ? '' : maKhoa, dateStr);
    setGroupStudents(result);
    setLoadingGroup(false);
  };

  const handleSuccess = () => {
    router.refresh();
  };

  const handleDelete = async (id: number) => {
    if (confirm("Bạn có chắc chắn muốn xóa giao dịch này?")) {
      await deleteTransaction(id);
      router.refresh();
    }
  };

  const removeAccents = (str: string) => {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  };

  const filteredTransactions = initialTransactions.filter(t => {
    const sTerm = removeAccents(searchTerm);
    const matchSearch = 
      removeAccents(t.danhMuc || "").includes(sTerm) || 
      removeAccents(t.maGD || "").includes(sTerm) ||
      removeAccents(t.nguoiNhanNop || "").includes(sTerm);
    
    const matchType = typeFilter === "ALL" || t.loaiGD === typeFilter;
    
    return matchSearch && matchType;
  });

  const handleKetChange = (ket: string) => {
    window.location.href = `/accounting/transactions?date=${currentDate}&ket=${ket}`;
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Quản lý Thu Chi</h1>
          <p className="text-slate-500 mt-1 flex items-center gap-2">
            <span>Ngày giao dịch:</span>
            <input 
              type="date" 
              className="px-2 py-1 border rounded text-sm font-medium bg-white"
              value={currentDate}
              onChange={(e) => {
                const val = e.target.value;
                if (val) {
                  window.location.href = `/accounting/transactions?date=${val}&ket=${currentKet}`;
                }
              }}
            />
          </p>
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex bg-slate-200/50 p-1 rounded-lg border border-slate-200">
            {[
              { id: 'ALL', name: 'Tất cả (Tổng hợp)' },
              { id: 'Trang', name: 'Trang' },
              { id: 'Mẹ', name: 'Mẹ' }
            ].map(k => (
              <button
                key={k.id}
                onClick={() => handleKetChange(k.id)}
                className={`px-4 py-2 text-sm font-semibold rounded-md transition-all ${currentKet === k.id ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/50' : 'text-slate-600 hover:text-slate-900'}`}
              >
                {k.name}
              </button>
            ))}
          </div>
          <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 md:ml-auto">
            {currentKet === 'Trang' && (
              <Button onClick={() => setIsKetTransferOpen(true)} className="bg-blue-600 hover:bg-blue-700 whitespace-nowrap">
                <ArrowUpFromLine className="w-4 h-4 mr-2" />
                Nộp tiền về két Mẹ
              </Button>
            )}
            {currentKet === 'Mẹ' && (
              <Button onClick={() => setIsKetReceiveOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 whitespace-nowrap">
                <ArrowDownToLine className="w-4 h-4 mr-2" />
                Lịch sử nhận tiền
              </Button>
            )}
            <Button onClick={() => setIsFormOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 whitespace-nowrap">
              <Plus className="w-4 h-4 mr-2" />
              Lập phiếu Thu / Chi
            </Button>
            <Button variant="outline" className="text-slate-700 whitespace-nowrap">
              <ArrowDownToLine className="w-4 h-4 mr-2" />
              Xuất báo cáo
            </Button>
          </div>
        </div>
      </div>

      {/* THỐNG KÊ HỌC PHÍ & TỒN QUỸ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-sm border-slate-200 bg-white">
          <div className="p-6">
            <div className="flex flex-col">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-md w-max mb-3">
                <Banknote className="w-5 h-5" />
              </div>
              <p className="text-sm font-medium text-slate-500 mb-1">Học phí duyệt (Trong ngày)</p>
              <p className="text-2xl font-bold text-slate-900">{Number(initialStats.todayTotal).toLocaleString('en-US')} đ</p>
              {currentKet === 'ALL' && (
                <div className="mt-4 flex gap-4 text-xs font-medium bg-slate-50 p-2 rounded-lg border border-slate-100 w-max text-slate-600">
                  <span>Trang: {Number(initialStats.todayApprovedTrang).toLocaleString('en-US')} đ</span>
                  <span className="w-px h-4 bg-slate-200"></span>
                  <span>Mẹ: {Number(initialStats.todayApprovedMe).toLocaleString('en-US')} đ</span>
                </div>
              )}
            </div>
          </div>
        </Card>

        <Card className="shadow-sm border-slate-200 bg-white">
          <div className="p-6 h-full flex flex-col justify-center">
            <div className="flex flex-col">
              <div className="p-2 bg-amber-50 text-amber-600 rounded-md w-max mb-3">
                <Clock className="w-5 h-5" />
              </div>
              <p className="text-sm font-medium text-slate-500 mb-1">Học phí chờ duyệt (Toàn HT)</p>
              <p className="text-2xl font-bold text-slate-900">{Number(initialStats.totalPending).toLocaleString('en-US')} đ</p>
            </div>
          </div>
        </Card>
        
        <Card className="shadow-sm border-slate-200 bg-white">
          <div className="p-6 h-full flex flex-col justify-center">
            <div className="flex flex-col">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-md w-max mb-3">
                <Wallet className="w-5 h-5" />
              </div>
              <p className="text-sm font-medium text-slate-500 mb-1 uppercase">TỒN QUỸ (TRONG NGÀY) {currentKet !== 'ALL' ? `(${currentKet})` : ''}</p>
              <p className={`text-3xl font-bold ${initialStats.balance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {Number(initialStats.balance).toLocaleString('en-US')} đ
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* DASHBOARD STATS NỘI BỘ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-sm border-slate-200 bg-white">
          <div className="p-6 flex items-center gap-5">
            <div className="w-12 h-12 rounded bg-indigo-50 flex items-center justify-center text-indigo-600">
              <ArrowDownToLine className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Tổng Thu (Học phí + Thu khác)</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                {Number(initialStats.totalIncome + initialStats.todayTotal).toLocaleString('en-US')} đ
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="shadow-sm border-slate-200 bg-white">
          <div className="p-6 flex items-center gap-5">
            <div className="w-12 h-12 rounded bg-rose-50 flex items-center justify-center text-rose-600">
              <ArrowUpFromLine className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Tổng Chi (Trong ngày) {currentKet !== 'ALL' ? `của ${currentKet}` : ''}</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                {Number(initialStats.totalExpense).toLocaleString('en-US')} đ
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* TRANSACTIONS GRID */}
      <Card className="shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row gap-4 justify-between items-center bg-white">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Tìm mã GD, danh mục, người nộp/nhận..." 
              className="pl-9 bg-slate-50 border-slate-200 focus-visible:ring-indigo-500 transition-all rounded-lg"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-3 items-center bg-slate-50 p-1.5 rounded-lg border border-slate-200/60">
            <Filter className="w-4 h-4 text-slate-400 ml-2" />
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[150px] h-8 bg-transparent border-0 shadow-none text-sm font-medium focus:ring-0">
                <SelectValue placeholder="Tất cả phiếu" />
              </SelectTrigger>
              <SelectContent className="rounded-xl shadow-lg border-slate-100">
                <SelectItem value="ALL" className="cursor-pointer">Tất cả giao dịch</SelectItem>
                <SelectItem value="THU" className="cursor-pointer text-emerald-600 font-medium">Chỉ Phiếu Thu</SelectItem>
                <SelectItem value="CHI" className="cursor-pointer text-rose-600 font-medium">Chỉ Phiếu Chi</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="overflow-x-auto bg-white">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="text-[11px] text-slate-600 uppercase tracking-wider bg-slate-100 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-semibold text-left">Mã GD</th>
                <th className="px-6 py-4 font-semibold text-left">Ngày GD</th>
                <th className="px-6 py-4 font-semibold text-left">Loại</th>
                <th className="px-6 py-4 font-semibold text-left">Két</th>
                <th className="px-6 py-4 font-semibold text-left">Danh Mục</th>
                <th className="px-6 py-4 font-semibold text-right">Số Tiền (VNĐ)</th>
                <th className="px-6 py-4 font-semibold text-left">Người Nộp/Nhận</th>
                <th className="px-6 py-4 font-semibold text-left">Hình Thức</th>
                <th className="px-6 py-4 font-semibold text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-16 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center">
                      <Search className="w-10 h-10 mb-3 text-slate-300" />
                      <p className="text-base font-medium">Không tìm thấy giao dịch nào</p>
                      <p className="text-xs mt-1">Hãy thử thay đổi từ khóa hoặc bộ lọc</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTransactions.map(t => {
                  const isThu = t.loaiGD === 'THU';
                  return (
                    <tr key={t.id === -1 ? t.maGD : t.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="px-6 py-4 font-semibold text-slate-700">
                        {t.maGD.startsWith('HPG_') ? (
                          <button 
                            className="hover:text-indigo-600 text-indigo-500 text-left outline-none font-semibold transition-colors flex items-center gap-1"
                            onClick={() => handleViewGroup(t)}
                          >
                            <Eye className="w-3.5 h-3.5" />
                            {t.maGD}
                          </button>
                        ) : (
                          t.maGD
                        )}
                      </td>
                      <td className="px-6 py-4 text-slate-500 font-medium">{new Date(t.ngayGD).toLocaleDateString('vi-VN')}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${isThu ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-rose-50 text-rose-600 border-rose-200'}`}>
                          {t.loaiGD}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-semibold border border-slate-200">
                          {t.ket || 'Chưa phân bổ'}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-700">{t.danhMuc}</td>
                      <td className={`px-6 py-4 text-right font-black text-[15px] ${isThu ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {isThu ? '+' : '-'}{Number(t.soTien).toLocaleString('en-US')}
                      </td>
                      <td className="px-6 py-4 text-slate-600 font-medium">{t.nguoiNhanNop || '-'}</td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 rounded-md bg-slate-100/80 text-slate-600 text-[11px] font-semibold border border-slate-200/60 uppercase">
                          {t.hinhThuc || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                          <button 
                            className="p-2 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 outline-none transition-colors" 
                            title="In phiếu"
                            onClick={() => {
                              if (t.maGD.startsWith('HPG_')) {
                                const parts = t.maGD.split('_');
                                const url = `/accounting/transactions/print/group?nguoiNop=${encodeURIComponent(parts[1])}&maKhoa=${encodeURIComponent(parts[2])}&ngayDuyet=${encodeURIComponent(new Date(t.ngayGD).toISOString())}`;
                                window.open(url, '_blank');
                              } else {
                                window.open(`/accounting/transactions/print/${t.id}`, '_blank');
                              }
                            }}
                          >
                            <Printer className="h-4 w-4" />
                          </button>
                          {!t.maGD.startsWith('HP_') && !t.maGD.startsWith('HPG_') && (
                            <button 
                              className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 outline-none transition-colors" 
                              title="Xóa giao dịch"
                              onClick={() => handleDelete(t.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* MODAL FORM */}
      <TransactionForm 
        isOpen={isFormOpen} 
        onClose={() => setIsFormOpen(false)} 
        onSuccess={handleSuccess} 
      />

      <KetTransferModal
        isOpen={isKetTransferOpen}
        onClose={() => setIsKetTransferOpen(false)}
        onSuccess={handleSuccess}
        todayTotal={initialStats.todayApprovedTrang || 0}
        totalBalance={initialStats.balance || 0}
      />

      <KetReceiveModal
        isOpen={isKetReceiveOpen}
        onClose={() => setIsKetReceiveOpen(false)}
        onSuccess={handleSuccess}
      />

      {/* MODAL CHI TIẾT NHÓM HỌC VIÊN */}
      <Dialog open={isGroupModalOpen} onOpenChange={setIsGroupModalOpen}>
        <DialogContent className="max-w-4xl bg-white p-6">
          <DialogHeader className="mb-2">
            <DialogTitle className="text-xl font-bold text-black">{selectedGroupName}</DialogTitle>
          </DialogHeader>
          <div className="mt-2">
            {loadingGroup ? (
              <p className="text-black py-8 text-center">Đang tải dữ liệu...</p>
            ) : groupStudents.length === 0 ? (
              <p className="text-black py-8 text-center">Không tìm thấy học viên nào.</p>
            ) : (
              <div className="overflow-x-auto max-h-[60vh]">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-black uppercase bg-slate-50 border-b">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Mã ĐK</th>
                      <th className="px-4 py-3 font-semibold">Họ tên</th>
                      <th className="px-4 py-3 font-semibold">Hình thức</th>
                      <th className="px-4 py-3 font-semibold text-right">Số tiền (VNĐ)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {groupStudents.map((s, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-medium text-black">{s.maDK}</td>
                        <td className="px-4 py-3 text-black">{s.hoTen}</td>
                        <td className="px-4 py-3 text-black">{s.hinhThucThu || '-'}</td>
                        <td className="px-4 py-3 text-right font-semibold text-emerald-600">
                          {Number(s.daNop).toLocaleString('en-US')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-50 font-bold border-t text-black">
                    <tr>
                      <td colSpan={3} className="px-4 py-3 text-right">Tổng cộng:</td>
                      <td className="px-4 py-3 text-right text-emerald-700">
                        {Number(groupStudents.reduce((acc, s) => acc + (s.daNop || 0), 0)).toLocaleString('en-US')}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
