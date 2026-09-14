"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useState, useMemo } from "react";
import { Clock, CheckCircle2, XCircle, Download } from "lucide-react";
import * as XLSX from 'xlsx';

export default function HistoryClient({ initialHistory }: { initialHistory: any[] }) {
  const [filterType, setFilterType] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [search, setSearch] = useState('');

  const filteredHistory = useMemo(() => {
    return initialHistory.filter(h => {
      if (filterType !== 'ALL' && h.CampaignType !== filterType) return false;
      if (filterStatus !== 'ALL' && h.Status !== filterStatus) return false;
      if (search) {
        const s = search.toLowerCase();
        if (
          !h.StudentName?.toLowerCase().includes(s) &&
          !h.Phone?.includes(s) &&
          !h.CourseName?.toLowerCase().includes(s) &&
          !h.TeacherName?.toLowerCase().includes(s)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [initialHistory, filterType, filterStatus, search]);

  const handleExport = () => {
    if (filteredHistory.length === 0) {
      alert("Không có dữ liệu để xuất.");
      return;
    }
    const ws = XLSX.utils.json_to_sheet(filteredHistory.map(h => ({
      "Thời gian gửi": new Date(h.SentTime).toLocaleString('vi-VN'),
      "Họ Tên": h.StudentName,
      "SĐT": h.Phone,
      "Loại": h.CampaignType,
      "Khóa Học": h.CourseName,
      "Giáo Viên": h.TeacherName,
      "Trạng Thái": h.Status,
      "Lỗi Chi Tiết": h.ErrorDetail
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "LichSuZalo");
    XLSX.writeFile(wb, `LichSu_ZaloZNS_${new Date().getTime()}.xlsx`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
          <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg">
            <Clock className="w-6 h-6" />
          </div>
          Lịch sử Gửi tin ZNS
        </h1>
        <p className="text-slate-600 mt-2 text-base font-medium">Theo dõi trạng thái các thông báo Zalo đã phát hành.</p>
      </div>

      <Card className="shadow-md border-slate-200">
        <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="text-lg font-bold text-slate-800">Tất cả lịch sử</CardTitle>
            <div className="flex items-center gap-2">
              <select 
                value={filterType} 
                onChange={e => setFilterType(e.target.value)}
                className="px-3 py-2 border rounded-lg text-sm bg-white font-medium focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ALL">Tất cả chiến dịch</option>
                <option value="MOTO">Mô Tô</option>
                <option value="OTO">Ô Tô</option>
              </select>
              <select 
                value={filterStatus} 
                onChange={e => setFilterStatus(e.target.value)}
                className="px-3 py-2 border rounded-lg text-sm bg-white font-medium focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="Thành công">Thành công</option>
                <option value="Thất bại">Thất bại</option>
              </select>
              <input 
                type="text" 
                placeholder="Tìm tên, SĐT, khóa..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
              />
              <button 
                onClick={handleExport}
                className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-lg flex items-center gap-2 hover:bg-emerald-700 transition-colors"
              >
                <Download className="w-4 h-4" /> Xuất Excel
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto h-[600px] overflow-y-auto custom-scrollbar">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-700 uppercase bg-slate-100 sticky top-0 shadow-sm z-10">
                <tr>
                  <th className="px-4 py-3 font-bold">Thời gian</th>
                  <th className="px-4 py-3 font-bold">Chiến dịch</th>
                  <th className="px-4 py-3 font-bold">Khóa Học</th>
                  <th className="px-4 py-3 font-bold">Họ và Tên</th>
                  <th className="px-4 py-3 font-bold">SĐT</th>
                  <th className="px-4 py-3 font-bold">Giáo Viên</th>
                  <th className="px-4 py-3 font-bold">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.map((h, i) => (
                  <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-600">
                      {new Date(h.SentTime).toLocaleString('vi-VN')}
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-700">{h.CampaignType}</td>
                    <td className="px-4 py-3 text-slate-700 max-w-[200px] truncate" title={h.CourseName}>{h.CourseName}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">{h.StudentName}</td>
                    <td className="px-4 py-3 font-mono text-slate-600">{h.Phone}</td>
                    <td className="px-4 py-3 text-slate-600">{h.TeacherName}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 font-bold">
                          {h.Status === 'Thành công' ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-rose-500" />}
                          <span className={h.Status === 'Thành công' ? 'text-emerald-600' : 'text-rose-600'}>
                            {h.Status}
                          </span>
                        </div>
                        {h.ErrorDetail && <div className="text-xs text-rose-500 max-w-[250px] truncate" title={h.ErrorDetail}>{h.ErrorDetail}</div>}
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredHistory.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-12 text-center text-slate-500 font-medium">
                      Không tìm thấy lịch sử gửi tin nào.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
