"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Clock, Clock3, Search, Trash2, Calendar, CheckCircle2, XCircle } from "lucide-react";
import { useState } from "react";
import { deleteZaloQueueItem, updateZaloQueueTime } from "@/actions/zalo";

export default function QueueClient({ initialQueue }: { initialQueue: any[] }) {
  const [queue, setQueue] = useState(initialQueue);
  const [searchTerm, setSearchTerm] = useState("");

  const filtered = queue.filter(q => 
    q.StudentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.CCCD.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.CourseName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (id: number) => {
    if (!confirm("Bạn có chắc muốn xoá học viên này khỏi hàng đợi tự động?")) return;
    const res = await deleteZaloQueueItem(id);
    if (res.success) {
      setQueue(queue.filter(q => q.ID !== id));
    } else {
      alert("Lỗi xoá: " + res.error);
    }
  };

  const handleUpdateTime = async (id: number, currentVal: string) => {
    const val = prompt("Nhập thời gian gửi mới (YYYY-MM-DDTHH:mm):", currentVal.split('Z')[0]);
    if (!val) return;
    
    const res = await updateZaloQueueTime(id, val);
    if (res.success) {
      setQueue(queue.map(q => q.ID === id ? { ...q, ScheduledTime: new Date(val).toISOString() } : q));
    } else {
      alert("Lỗi cập nhật: " + res.error);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
          <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg">
            <Clock3 className="w-6 h-6" />
          </div>
          Hàng Đợi Zalo ZNS (OTO GĐ2)
        </h1>
        <p className="text-slate-600 mt-2 text-base font-medium">Danh sách các tin nhắn chờ được hệ thống tự động gửi trong tương lai.</p>
      </div>

      <Card className="shadow-md border-slate-200">
        <CardHeader className="bg-slate-50 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-600" />
              Lịch trình tự động
            </CardTitle>
            <CardDescription>Các tin nhắn có trạng thái Pending và đến giờ hẹn sẽ được gửi đi tự động mỗi 30 phút.</CardDescription>
          </div>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Tìm tên, CCCD, khóa học..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 border rounded-lg text-sm w-full md:w-64 focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-700 uppercase bg-slate-100 border-b">
                <tr>
                  <th className="px-4 py-3">Học viên</th>
                  <th className="px-4 py-3">Khóa học / Hạng</th>
                  <th className="px-4 py-3">Lịch Gửi</th>
                  <th className="px-4 py-3">Trạng thái</th>
                  <th className="px-4 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                      Không có tin nhắn nào trong hàng đợi.
                    </td>
                  </tr>
                ) : (
                  filtered.map(q => (
                    <tr key={q.ID} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {q.StudentName}
                        <div className="text-xs text-slate-500 font-normal">CCCD: {q.CCCD} • SĐT: {q.Phone}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-600 font-medium">
                        {q.CourseName}
                        <div className="text-xs text-indigo-600 font-bold">{q.CourseType}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-600 font-bold">
                        {new Date(q.ScheduledTime).toLocaleString('vi-VN')}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 font-bold">
                          {q.Status === 'Sent' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                          {q.Status === 'Failed' && <XCircle className="w-4 h-4 text-rose-500" />}
                          {q.Status === 'Pending' && <Clock className="w-4 h-4 text-amber-500" />}
                          
                          <span className={
                            q.Status === 'Sent' ? 'text-emerald-600' : 
                            (q.Status === 'Failed' ? 'text-rose-600' : 'text-amber-600')
                          }>
                            {q.Status}
                          </span>
                        </div>
                        {q.ErrorDetail && <div className="text-xs text-rose-500 mt-1 max-w-[200px] truncate" title={q.ErrorDetail}>{q.ErrorDetail}</div>}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {q.Status === 'Pending' && (
                          <div className="flex justify-end gap-2">
                            <button 
                              onClick={() => handleUpdateTime(q.ID, q.ScheduledTime)}
                              className="text-xs text-indigo-600 font-bold hover:underline"
                            >
                              Sửa giờ
                            </button>
                            <button 
                              onClick={() => handleDelete(q.ID)}
                              className="text-slate-400 hover:text-rose-600 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
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
