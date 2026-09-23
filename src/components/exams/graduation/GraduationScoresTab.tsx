"use client";

import React, { useState, useEffect } from "react";
import { Edit3, Check, Save, CheckCircle2, FileSpreadsheet, X, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getGraduationStudents, updateScores } from "@/actions/graduation/graduation.actions";

export function GraduationScoresTab() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCccd, setEditingCccd] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});

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

  const handleEditClick = (st: any) => {
    setEditingCccd(st.cccd);
    setEditForm({
      diem_luat: st.diem_luat || "",
      diem_mo_phong: st.diem_mo_phong || "",
      diem_hinh: st.diem_hinh || "",
      diem_duong: st.diem_duong || "",
      kq_final: st.kq_final || ""
    });
  };

  const handleSaveClick = async (cccd: string) => {
    const res = await updateScores(cccd, editForm);
    if (res.success) {
      // toast({ title: "Thành công", description: "Đã cập nhật điểm thi." }); // Shadcn toast could be missing, using alert optionally or just UI update
      setEditingCccd(null);
      loadData();
    } else {
      alert("Lỗi lưu điểm: " + res.error);
    }
  };

  const handleScoreChange = (field: string, value: string) => {
    setEditForm((prev: any) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
            <Edit3 className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-bold text-slate-800">Cập nhật Điểm thi & Kết quả</h2>
        </div>
        <Button onClick={loadData} variant="outline">Tải lại dữ liệu</Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto max-h-[600px]">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-600 uppercase bg-slate-100 sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="px-4 py-3 w-12 text-center">STT</th>
                <th className="px-4 py-3">Học viên / Khóa</th>
                <th className="px-4 py-3 text-center">Điểm Luật</th>
                <th className="px-4 py-3 text-center">Điểm Mô phỏng</th>
                <th className="px-4 py-3 text-center">Điểm Hình</th>
                <th className="px-4 py-3 text-center">Điểm Đường</th>
                <th className="px-4 py-3 text-center">Kết quả chung cuộc</th>
                <th className="px-4 py-3 text-center w-24">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={8} className="text-center py-8 text-slate-500">Đang tải dữ liệu...</td></tr>
              ) : students.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-8 text-slate-500">Chưa có dữ liệu học viên</td></tr>
              ) : (
                students.map((st, i) => {
                  const isEditing = editingCccd === st.cccd;
                  const isDateValid = !st.exam_date || !st.file_completion_date || st.file_completion_date <= st.exam_date;
                  const isEligible = st.has_5_pdf_lt && st.has_file_dat && st.has_file_mp && isDateValid;
                  
                  return (
                    <tr key={st.cccd} className={`hover:bg-slate-50/50 transition-colors ${!isEligible ? 'opacity-60 bg-slate-50' : ''}`}>
                      <td className="px-4 py-3 font-medium text-slate-600 text-center">{st.stt || (i + 1)}</td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-800 flex items-center gap-2">
                          {st.name} 
                          {!isEligible ? (
                            <span className="text-xs bg-red-100 text-red-600 px-1 rounded uppercase">Chưa đủ ĐK</span>
                          ) : (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" title="Đủ điều kiện" />
                          )}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">Khóa: {st.khoa || 'N/A'} | {st.hang}</div>
                      </td>
                      
                      {/* Cột Điểm Luật */}
                      <td className="px-4 py-3 text-center">
                        {isEditing ? (
                          <Input className="w-16 h-8 text-center mx-auto" value={editForm.diem_luat} onChange={e => handleScoreChange('diem_luat', e.target.value)} />
                        ) : (
                          <span className="font-semibold text-slate-700">{st.diem_luat || '-'}</span>
                        )}
                      </td>
                      
                      {/* Cột Điểm Mô Phỏng */}
                      <td className="px-4 py-3 text-center">
                        {isEditing ? (
                          <Input className="w-16 h-8 text-center mx-auto" value={editForm.diem_mo_phong} onChange={e => handleScoreChange('diem_mo_phong', e.target.value)} />
                        ) : (
                          <span className="font-semibold text-slate-700">{st.diem_mo_phong || '-'}</span>
                        )}
                      </td>
                      
                      {/* Cột Điểm Hình */}
                      <td className="px-4 py-3 text-center">
                        {isEditing ? (
                          <Input className="w-16 h-8 text-center mx-auto" value={editForm.diem_hinh} onChange={e => handleScoreChange('diem_hinh', e.target.value)} />
                        ) : (
                          <span className="font-semibold text-slate-700">{st.diem_hinh || '-'}</span>
                        )}
                      </td>
                      
                      {/* Cột Điểm Đường */}
                      <td className="px-4 py-3 text-center">
                        {isEditing ? (
                          <Input className="w-16 h-8 text-center mx-auto" value={editForm.diem_duong} onChange={e => handleScoreChange('diem_duong', e.target.value)} />
                        ) : (
                          <span className="font-semibold text-slate-700">{st.diem_duong || '-'}</span>
                        )}
                      </td>
                      
                      {/* Kết quả chung cuộc */}
                      <td className="px-4 py-3 text-center">
                        {isEditing ? (
                          <select 
                            className="w-24 h-8 text-xs rounded-md border border-slate-300 bg-white"
                            value={editForm.kq_final}
                            onChange={e => handleScoreChange('kq_final', e.target.value)}
                          >
                            <option value="">- Chọn -</option>
                            <option value="ĐẠT">ĐẠT</option>
                            <option value="RỚT">RỚT</option>
                            <option value="VẮNG">VẮNG</option>
                          </select>
                        ) : (
                          <span className={`px-2 py-1 rounded text-xs font-bold ${
                            st.kq_final === 'ĐẠT' ? 'bg-emerald-100 text-emerald-700' :
                            st.kq_final === 'RỚT' ? 'bg-red-100 text-red-700' :
                            st.kq_final === 'VẮNG' ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-500'
                          }`}>
                            {st.kq_final || 'Chưa thi'}
                          </span>
                        )}
                      </td>
                      
                      {/* Thao tác */}
                      <td className="px-4 py-3 text-center">
                        {isEditing ? (
                          <Button size="sm" onClick={() => handleSaveClick(st.cccd)} className="bg-emerald-600 hover:bg-emerald-700 w-full h-8 px-2 flex gap-1">
                            <Save className="w-3 h-3" /> Lưu
                          </Button>
                        ) : (
                          <Button size="sm" variant="outline" onClick={() => handleEditClick(st)} className="w-full h-8 px-2 flex gap-1 text-slate-600 border-slate-300">
                            <Edit3 className="w-3 h-3" /> Sửa
                          </Button>
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
