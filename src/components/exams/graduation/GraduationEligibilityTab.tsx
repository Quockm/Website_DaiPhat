"use client";
import React, { useState, useEffect } from "react";
import { getGraduationStudents, updateEligibility } from "@/actions/graduation/graduation.actions";
import { Button } from "@/components/ui/button";
import { FileCheck, AlertCircle } from "lucide-react";

export function GraduationEligibilityTab() {
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

  const handleToggle = async (cccd: string, field: string, currentValue: boolean) => {
    // Optimistic update
    setStudents(prev => prev.map(s => s.cccd === cccd ? { ...s, [field]: !currentValue } : s));
    
    const res = await updateEligibility(cccd, { [field]: !currentValue });
    if (!res.success) {
      alert("Lỗi lưu dữ liệu: " + res.error);
      loadData(); // Revert on failure
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <FileCheck className="w-5 h-5 text-blue-600" />
          Xét duyệt điều kiện thi Tốt nghiệp
        </h2>
        <Button onClick={loadData} variant="outline" size="sm">Tải lại</Button>
      </div>
      
      <div className="overflow-x-auto max-h-[600px]">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-600 uppercase bg-slate-100 sticky top-0 z-10 shadow-sm">
            <tr>
              <th className="px-4 py-3 w-16">STT</th>
              <th className="px-4 py-3">Học viên</th>
              <th className="px-4 py-3 text-center">5 PDF Lý Thuyết</th>
              <th className="px-4 py-3 text-center">File DAT</th>
              <th className="px-4 py-3 text-center">File Mô Phỏng</th>
              <th className="px-4 py-3 text-center">Đủ Xăng/Dầu</th>
              <th className="px-4 py-3 text-center">In HĐ</th>
              <th className="px-4 py-3 text-center">In TL</th>
              <th className="px-4 py-3 text-center">In PT</th>
              <th className="px-4 py-3 text-center">Trạng thái</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={10} className="text-center py-8 text-slate-500">Đang tải dữ liệu...</td></tr>
            ) : students.length === 0 ? (
              <tr><td colSpan={10} className="text-center py-8 text-slate-500">Chưa có dữ liệu học viên</td></tr>
            ) : (
              students.map((st, i) => {
                const isEligible = st.has_5_pdf_lt && st.has_file_dat && st.has_file_mp; // Xăng dầu is optional
                return (
                  <tr key={st.cccd} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-600">{i + 1}</td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-800">{st.name}</div>
                      <div className="text-xs text-slate-500 mt-1 flex gap-2">
                        <span>CCCD: {st.cccd}</span>
                        {st.is_retake ? <span className="text-orange-600 font-medium border border-orange-200 bg-orange-50 px-1 rounded">Thi lại</span> : null}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <input type="checkbox" className="w-4 h-4 text-blue-600 rounded" checked={st.has_5_pdf_lt} onChange={() => handleToggle(st.cccd, 'has_5_pdf_lt', st.has_5_pdf_lt)} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <input type="checkbox" className="w-4 h-4 text-blue-600 rounded" checked={st.has_file_dat} onChange={() => handleToggle(st.cccd, 'has_file_dat', st.has_file_dat)} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <input type="checkbox" className="w-4 h-4 text-blue-600 rounded" checked={st.has_file_mp} onChange={() => handleToggle(st.cccd, 'has_file_mp', st.has_file_mp)} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <input type="checkbox" className="w-4 h-4 text-blue-600 rounded" checked={st.has_xang_dau} onChange={() => handleToggle(st.cccd, 'has_xang_dau', st.has_xang_dau)} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      {st.in_hop_dong ? <span className="text-emerald-500 font-bold" title="Đã in Hợp đồng">✅</span> : null}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {st.in_thanh_ly ? <span className="text-emerald-500 font-bold" title="Đã in Biên bản thanh lý">✅</span> : null}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {st.in_phieu_thu ? <span className="text-emerald-500 font-bold" title="Đã in Phiếu thu">✅</span> : null}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {isEligible ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                          Đủ điều kiện
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800">
                          <AlertCircle className="w-3 h-3" /> Chưa đủ
                        </span>
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
  );
}
