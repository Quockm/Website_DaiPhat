"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Filter, Wallet, ArrowDownToLine, ArrowUpFromLine, Trash2, Printer } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { deleteTransaction } from "@/actions/accounting";
import { TransactionForm } from "./TransactionForm";
import { useRouter } from "next/navigation";

export default function TransactionsClient({
  initialTransactions,
  initialStats,
  currentMonth,
  currentYear
}: {
  initialTransactions: any[];
  initialStats: any;
  currentMonth: number;
  currentYear: number;
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const router = useRouter();

  const handleSuccess = () => {
    window.location.reload();
  };

  const handleDelete = async (id: number) => {
    if (confirm("Bạn có chắc chắn muốn xóa giao dịch này?")) {
      await deleteTransaction(id);
      window.location.reload();
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

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Quản lý Thu Chi</h1>
          <p className="text-slate-500 mt-1 flex items-center gap-2">
            <span>Sổ quỹ và nhật ký giao dịch tháng:</span>
            <input 
              type="month" 
              className="px-2 py-1 border rounded text-sm font-medium bg-white"
              value={`${currentYear}-${currentMonth.toString().padStart(2, '0')}`}
              onChange={(e) => {
                const val = e.target.value;
                if (val) {
                  const [y, m] = val.split('-');
                  window.location.href = `/accounting/transactions?month=${m}&year=${y}`;
                }
              }}
            />
          </p>
        </div>
        <Button onClick={() => setIsFormOpen(true)} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="w-4 h-4 mr-2" /> Lập Phiếu Thu / Chi
        </Button>
      </div>

      {/* DASHBOARD STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-sm border-emerald-100 bg-emerald-50/30 overflow-hidden">
          <div className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
              <ArrowDownToLine className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-emerald-600">Tổng Thu Trong Tháng</p>
              <h3 className="text-2xl font-bold text-slate-900">
                {Number(initialStats.totalIncome).toLocaleString('vi-VN')} đ
              </h3>
            </div>
          </div>
        </Card>
        
        <Card className="shadow-sm border-rose-100 bg-rose-50/30 overflow-hidden">
          <div className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
              <ArrowUpFromLine className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-rose-600">Tổng Chi Trong Tháng</p>
              <h3 className="text-2xl font-bold text-slate-900">
                {Number(initialStats.totalExpense).toLocaleString('vi-VN')} đ
              </h3>
            </div>
          </div>
        </Card>

        <Card className="shadow-sm border-indigo-100 bg-indigo-50/30 overflow-hidden">
          <div className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-indigo-600">Tồn Quỹ Thực Tế</p>
              <h3 className={`text-2xl font-bold ${initialStats.balance >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                {Number(initialStats.balance).toLocaleString('vi-VN')} đ
              </h3>
            </div>
          </div>
        </Card>
      </div>

      {/* TRANSACTIONS GRID */}
      <Card className="shadow-sm">
        <div className="p-4 border-b flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-50 rounded-t-xl">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Tìm theo mã GD, danh mục, người nộp/nhận..." 
              className="pl-9 bg-white"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2 items-center">
            <Filter className="w-4 h-4 text-slate-400" />
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[140px] h-9 bg-white text-sm">
                <SelectValue placeholder="Tất cả phiếu" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tất cả</SelectItem>
                <SelectItem value="THU">Chỉ Phiếu Thu</SelectItem>
                <SelectItem value="CHI">Chỉ Phiếu Chi</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-100 border-b">
              <tr>
                <th className="px-5 py-4 font-semibold">Mã GD</th>
                <th className="px-5 py-4 font-semibold">Ngày GD</th>
                <th className="px-5 py-4 font-semibold">Loại</th>
                <th className="px-5 py-4 font-semibold">Danh Mục</th>
                <th className="px-5 py-4 font-semibold text-right">Số Tiền (VNĐ)</th>
                <th className="px-5 py-4 font-semibold">Người Nộp/Nhận</th>
                <th className="px-5 py-4 font-semibold">Hình Thức</th>
                <th className="px-5 py-4 font-semibold text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                    Không tìm thấy giao dịch nào.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map(t => {
                  const isThu = t.loaiGD === 'THU';
                  return (
                    <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-4 font-medium text-indigo-600">{t.maGD}</td>
                      <td className="px-5 py-4 text-slate-700">{new Date(t.ngayGD).toLocaleDateString('vi-VN')}</td>
                      <td className="px-5 py-4">
                        <span className={`px-2.5 py-1.5 rounded-md text-xs font-semibold ${isThu ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                          {t.loaiGD}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-medium text-slate-800">{t.danhMuc}</td>
                      <td className={`px-5 py-4 text-right font-bold text-base ${isThu ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {isThu ? '+' : '-'}{Number(t.soTien).toLocaleString('vi-VN')}
                      </td>
                      <td className="px-5 py-4 text-slate-600">{t.nguoiNhanNop || '-'}</td>
                      <td className="px-5 py-4 text-slate-600">
                        <span className="px-2 py-1 rounded bg-slate-100 text-slate-700 text-xs font-medium">
                          {t.hinhThuc || '-'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            className="p-1.5 rounded text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 outline-none focus:ring-0 transition-colors" 
                            title="In phiếu"
                            onClick={() => window.open(`/accounting/transactions/print/${t.id}`, '_blank')}
                          >
                            <Printer className="h-4 w-4" />
                          </button>
                          <button 
                            className="p-1.5 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 outline-none focus:ring-0 transition-colors" 
                            title="Xóa giao dịch"
                            onClick={() => handleDelete(t.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
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
    </div>
  );
}
