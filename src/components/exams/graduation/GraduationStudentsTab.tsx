"use client";

import React, { useState, useEffect } from "react";
import { Users, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getGraduationStudents } from "@/actions/graduation/graduation.actions";

export function GraduationStudentsTab() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    const res = await getGraduationStudents();
    if (res.success) {
      setStudents(res.data || []);
    } else {
      alert("Lỗi: " + res.error);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
            <Users className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-bold text-slate-800">Danh sách Học viên Tốt nghiệp</h2>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadData} variant="outline">Tải lại dữ liệu</Button>
          <Button className="bg-emerald-600 hover:bg-emerald-700 flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4" /> Xuất Excel
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto max-h-[600px]">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-600 uppercase bg-slate-100 sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="px-4 py-3 w-16 text-center">STT</th>
                <th className="px-4 py-3">CCCD</th>
                <th className="px-4 py-3">SBD</th>
                <th className="px-4 py-3">Họ và tên</th>
                <th className="px-4 py-3">Ngày sinh</th>
                <th className="px-4 py-3">Hạng</th>
                <th className="px-4 py-3 text-center">Loại</th>
                <th className="px-4 py-3 text-center">Điều kiện</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={8} className="text-center py-8 text-slate-500">Đang tải dữ liệu...</td></tr>
              ) : students.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-8 text-slate-500">Chưa có dữ liệu học viên</td></tr>
              ) : (
                students.map((st, i) => {
                  const isEligible = st.has_5_pdf_lt && st.has_file_dat && st.has_file_mp;
                  return (
                    <tr key={st.cccd} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-600 text-center">{st.stt || (i + 1)}</td>
                      <td className="px-4 py-3 font-mono text-xs">{st.cccd}</td>
                      <td className="px-4 py-3 font-semibold text-slate-700">{st.sbd}</td>
                      <td className="px-4 py-3 font-bold text-slate-800">{st.name}</td>
                      <td className="px-4 py-3">{st.dob}</td>
                      <td className="px-4 py-3 font-bold text-indigo-600">{st.hang}</td>
                      <td className="px-4 py-3 text-center">
                        {st.is_retake ? (
                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-700">Thi lại</span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">Mới</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {isEligible ? (
                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800">Đủ điều kiện</span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-rose-100 text-rose-800">Chưa đủ</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
