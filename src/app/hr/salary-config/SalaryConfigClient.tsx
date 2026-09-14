"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Save, Edit, X, Briefcase, Users, Calculator } from "lucide-react";
import { SalaryConfigData, updateSalaryConfig } from "@/actions/payroll";

export default function SalaryConfigClient({ initialConfigs }: { initialConfigs: SalaryConfigData[] }) {
  const [configs, setConfigs] = useState<SalaryConfigData[]>(initialConfigs);
  const [search, setSearch] = useState("");
  
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<SalaryConfigData>>({});
  const [saving, setSaving] = useState(false);

  const filtered = configs.filter(c => 
    (c.HoTen || "").toLowerCase().includes(search.toLowerCase()) ||
    (c.ChucVu || "").toLowerCase().includes(search.toLowerCase())
  );

  const handleEdit = (c: SalaryConfigData) => {
    setEditingId(c.GiaoVienId);
    setEditForm({
      LuongCoBan: c.LuongCoBan,
      NPT: c.NPT
    });
  };

  const handleSave = async (giaoVienId: number) => {
    setSaving(true);
    const res = await updateSalaryConfig(giaoVienId, editForm);
    if (res.success) {
      setConfigs(configs.map(c => 
        c.GiaoVienId === giaoVienId 
          ? { ...c, LuongCoBan: editForm.LuongCoBan || 0, NPT: editForm.NPT || 0 }
          : c
      ));
      setEditingId(null);
    } else {
      alert("Lỗi khi lưu cấu hình: " + res.error);
    }
    setSaving(false);
  };

  const formatMoney = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Calculator className="w-7 h-7 text-indigo-600" />
            Cấu hình Lương Nhân Sự
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Thiết lập mức lương cơ bản & Số người phụ thuộc (NPT) cho nhân sự.
          </p>
        </div>
        
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Tìm theo tên, chức vụ..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
          />
        </div>
      </div>

      <Card className="bg-white shadow-xl shadow-slate-200/50 border-slate-200/60 overflow-hidden rounded-xl">
        <CardContent className="p-0">
          <div className="overflow-x-auto min-h-[500px]">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-gradient-to-r from-slate-50 to-slate-100 text-slate-700 font-bold uppercase text-[11px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-4 py-4 w-12 text-center border-r border-slate-100">STT</th>
                  <th className="px-4 py-4 min-w-[200px] border-r border-slate-100">Nhân sự</th>
                  <th className="px-4 py-4 border-r border-slate-100">Chức vụ</th>
                  <th className="px-4 py-4 text-center border-r border-slate-100">Trạng thái BHXH</th>
                  <th className="px-4 py-4 text-right min-w-[150px] border-r border-slate-100 text-indigo-700">Lương cơ bản (VNĐ)</th>
                  <th className="px-4 py-4 text-center w-24 border-r border-slate-100">NPT</th>
                  <th className="px-4 py-4 text-right w-24">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((c, idx) => (
                  <tr key={c.GiaoVienId} className="hover:bg-indigo-50/40 transition-colors duration-200 bg-white group">
                    <td className="px-4 py-4 text-center font-semibold text-slate-400 border-r border-slate-100">
                      {idx + 1}
                    </td>
                    <td className="px-4 py-4 border-r border-slate-100">
                      <div className="font-bold text-slate-800 text-[14px]">
                        {c.HoTen}
                      </div>
                      <div className="text-slate-500 text-[11px] mt-0.5 tracking-wide">{c.PhongBan || "Phòng ban chung"}</div>
                    </td>
                    <td className="px-4 py-4 border-r border-slate-100">
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-md text-[11px] font-bold border border-slate-200 uppercase tracking-wider">
                        {c.ChucVu || "Nhân sự"}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center border-r border-slate-100">
                      {c.TinhTrangBHXH ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md text-[11px] font-bold border border-emerald-200 uppercase tracking-wider">
                          Có đóng BHXH
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-slate-400 bg-slate-50 px-2.5 py-1 rounded-md text-[11px] font-bold border border-slate-200 uppercase tracking-wider">
                          Không đóng
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-right border-r border-slate-100">
                      {editingId === c.GiaoVienId ? (
                        <input 
                          type="number" 
                          value={editForm.LuongCoBan}
                          onChange={e => setEditForm({...editForm, LuongCoBan: Number(e.target.value)})}
                          className="w-full text-right px-3 py-2 border border-indigo-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-indigo-700 shadow-sm"
                        />
                      ) : (
                        <span className="font-bold text-[15px] text-indigo-700">{formatMoney(c.LuongCoBan)}</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-center border-r border-slate-100">
                      {editingId === c.GiaoVienId ? (
                        <input 
                          type="number" 
                          min={0}
                          value={editForm.NPT}
                          onChange={e => setEditForm({...editForm, NPT: Number(e.target.value)})}
                          className="w-16 text-center px-2 py-2 border border-indigo-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700 shadow-sm"
                        />
                      ) : (
                        <span className="font-bold text-[15px] text-slate-700">{c.NPT}</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-right">
                      {editingId === c.GiaoVienId ? (
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => handleSave(c.GiaoVienId)}
                            disabled={saving}
                            className="p-2 text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm"
                            title="Lưu"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => setEditingId(null)}
                            className="p-2 text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors shadow-sm"
                            title="Hủy"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => handleEdit(c)}
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                          title="Sửa cấu hình"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                      Không tìm thấy nhân sự nào.
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
