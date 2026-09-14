"use client";

import React, { useState, useEffect } from "react";
import { Trash2, BookOpen, AlertCircle, Search } from "lucide-react";

function formatDate(dateStr: string) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const hh = d.getHours().toString().padStart(2, '0');
  const mm = d.getMinutes().toString().padStart(2, '0');
  const dd = d.getDate().toString().padStart(2, '0');
  const MM = (d.getMonth() + 1).toString().padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${hh}:${mm} ${dd}/${MM}/${yyyy}`;
}

interface PrintLog {
  id: number;
  entity_type: string;
  entity_id: string;
  entity_name: string;
  document_type: string;
  document_name: string;
  printed_by: string;
  printed_at: string;
}

export default function LogbookPage() {
  const [logs, setLogs] = useState<PrintLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [password, setPassword] = useState("");
  const [selectedLogId, setSelectedLogId] = useState<number | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/logs/prints");
      const data = await res.json();
      if (data.success) {
        setLogs(data.data);
      } else {
        alert("Lỗi khi tải lịch sử in");
      }
    } catch (err) {
      alert("Lỗi kết nối máy chủ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleReset = async () => {
    if (!password) {
      alert("Vui lòng nhập mật khẩu quản trị!");
      return;
    }
    if (!selectedLogId) return;

    try {
      const res = await fetch("/api/logs/prints/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedLogId, password })
      });
      const data = await res.json();
      
      if (data.success) {
        alert(data.message);
        setSelectedLogId(null);
        setPassword("");
        fetchLogs();
      } else {
        alert(data.error || "Mật khẩu không đúng");
      }
    } catch (err) {
      alert("Lỗi khi thực hiện reset");
    }
  };

  const filteredLogs = logs.filter(log => 
    log.entity_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    log.entity_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.document_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 w-full space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-blue-600" />
            Quản Lý Sổ Sách & In Ấn
          </h1>
          <p className="text-slate-500 mt-1">Lịch sử xuất và in các biểu mẫu, hợp đồng, quyết định</p>
        </div>
        
        <div className="relative">
          <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Tìm theo tên/CCCD/Loại..." 
            className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 min-w-[300px]"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-600 uppercase bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-semibold">Tên tài liệu</th>
                <th className="px-6 py-4 font-semibold">Loại</th>
                <th className="px-6 py-4 font-semibold">Đối tượng</th>
                <th className="px-6 py-4 font-semibold">Thời gian in</th>
                <th className="px-6 py-4 font-semibold text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={5} className="text-center py-10 text-slate-500">Đang tải lịch sử...</td></tr>
              ) : filteredLogs.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-10 text-slate-500">Không tìm thấy bản ghi nào</td></tr>
              ) : (
                filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-blue-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-800">{log.document_name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {log.document_type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-700">{log.entity_name}</div>
                      <div className="text-xs text-slate-500 mt-1">{log.entity_id}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {formatDate(log.printed_at)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => setSelectedLogId(log.id)}
                        className="p-2 text-rose-500 hover:bg-rose-100 rounded-lg transition-colors"
                        title="Reset trạng thái in (Xóa lịch sử)"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reset Modal */}
      {selectedLogId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center gap-3 text-rose-600">
              <AlertCircle className="w-6 h-6" />
              <h3 className="text-lg font-bold">Xác nhận Reset Trạng Thái In</h3>
            </div>
            
            <div className="p-6 space-y-4">
              <p className="text-slate-600 text-sm">
                Nếu bạn reset lịch sử in này, học viên/khóa học sẽ được phép <strong>in lại biểu mẫu này một lần nữa</strong>. 
                Vui lòng nhập mật khẩu quản trị để tiếp tục.
              </p>
              
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Mật khẩu quản trị</label>
                <input 
                  type="password" 
                  className="w-full border-slate-300 rounded-lg p-2.5 outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-200"
                  placeholder="Nhập mật khẩu..."
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleReset()}
                  autoFocus
                />
              </div>
            </div>
            
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button 
                onClick={() => setSelectedLogId(null)}
                className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-200 rounded-lg transition-colors"
              >
                Hủy bỏ
              </button>
              <button 
                onClick={handleReset}
                className="px-4 py-2 bg-rose-600 text-white font-medium hover:bg-rose-700 rounded-lg transition-colors shadow-sm"
              >
                Xác nhận Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
