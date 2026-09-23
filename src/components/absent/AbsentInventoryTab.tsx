"use client";

import React, { useState, useEffect, useRef } from "react";
import { Package, Search, Plus, Archive, ExternalLink, RotateCcw, Trash2, UserSearch, LogOut, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger 
} from "@/components/ui/dialog";
import { 
  getAbsentRecords, addAbsentRecord, checkoutAbsentRecord, returnAbsentRecord, deleteAbsentRecord, getStudentInfoByCCCD, searchStudentsByCCCD, updateAbsentRecordLocation, updateAbsentRecord
} from "@/actions/absent/absent.actions";
import { getStorageLocations } from "@/actions/absent/storage.actions";
import { getExamSchedules } from "@/actions/exam-schedules.actions";

interface AbsentInventoryTabProps {
  type: "TN" | "SH";
  title: string;
}

const HANG_OPTIONS = ["A1", "A2", "B1", "B2", "C", "D", "E", "FC"];
const RESULT_OPTIONS = [
  "Vắng LT", "Vắng MP", "Vắng SH", "Vắng ĐT", 
  "Rớt LT", "Rớt MP", "Rớt SH", "Rớt ĐT", 
  "Vắng", "Rớt"
];

export function AbsentInventoryTab({ type, title }: AbsentInventoryTabProps) {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isReturnOpen, setIsReturnOpen] = useState(false);
  
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  
  // Add Form State
  const [formData, setFormData] = useState({
    cccd: "", sbd: "", name: "", hang: "B2", original_exam_date: "", result: "Vắng LT", storage_location: "", note: "", gv: ""
  });
  
  const [editFormData, setEditFormData] = useState({
    name: "", cccd: "", hang: "", original_exam_date: "", result: "", storage_location: "", note: "", gv: ""
  });
  
  const [checkoutDate, setCheckoutDate] = useState("");
  const [returnLocation, setReturnLocation] = useState("");
  
  const [isUpdateLocationOpen, setIsUpdateLocationOpen] = useState(false);

  const [studentInfo, setStudentInfo] = useState<any>(null);
  const [searchingStudent, setSearchingStudent] = useState(false);

  const [storageLocations, setStorageLocations] = useState<any[]>([]);
  const [showStorageSuggestions, setShowStorageSuggestions] = useState(false);
  const storageWrapperRef = useRef<HTMLDivElement>(null);

  const [studentSuggestions, setStudentSuggestions] = useState<any[]>([]);
  const [showStudentSuggestions, setShowStudentSuggestions] = useState(false);
  const cccdWrapperRef = useRef<HTMLDivElement>(null);

  const [showUpdateStorageSuggestions, setShowUpdateStorageSuggestions] = useState(false);
  const updateStorageWrapperRef = useRef<HTMLDivElement>(null);

  const [showReturnStorageSuggestions, setShowReturnStorageSuggestions] = useState(false);
  const returnStorageWrapperRef = useRef<HTMLDivElement>(null);

  const [schedules, setSchedules] = useState<any[]>([]);
  const [showScheduleSuggestions, setShowScheduleSuggestions] = useState(false);
  const scheduleWrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadData();
    loadStorageLocations();
    loadExamSchedules();
  }, [type]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (storageWrapperRef.current && !storageWrapperRef.current.contains(event.target as Node)) {
        setShowStorageSuggestions(false);
      }
      if (cccdWrapperRef.current && !cccdWrapperRef.current.contains(event.target as Node)) {
        setShowStudentSuggestions(false);
      }
      if (updateStorageWrapperRef.current && !updateStorageWrapperRef.current.contains(event.target as Node)) {
        setShowUpdateStorageSuggestions(false);
      }
      if (scheduleWrapperRef.current && !scheduleWrapperRef.current.contains(event.target as Node)) {
        setShowScheduleSuggestions(false);
      }
      if (returnStorageWrapperRef.current && !returnStorageWrapperRef.current.contains(event.target as Node)) {
        setShowReturnStorageSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loadData = async () => {
    setLoading(true);
    const res = await getAbsentRecords(type);
    if (res.success) {
      setRecords(res.data);
    }
    setLoading(false);
  };

  const loadStorageLocations = async () => {
    const res = await getStorageLocations();
    if (res.success) setStorageLocations(res.data);
  };

  const loadExamSchedules = async () => {
    const res = await getExamSchedules();
    if (res.success) {
      const futureSchedules = res.data.filter((s: any) => new Date(s.exam_date) >= new Date());
      setSchedules(futureSchedules);
    }
  };

  const handleStudentSearch = async (val: string) => {
    setFormData({ ...formData, cccd: val });
    if (val.length >= 3) {
      setSearchingStudent(true);
      const res = await searchStudentsByCCCD(val, type);
      if (res.success && res.data.length > 0) {
        setStudentSuggestions(res.data);
        setShowStudentSuggestions(true);
      } else {
        setStudentSuggestions([]);
      }
      setSearchingStudent(false);
    } else {
      setStudentSuggestions([]);
      setShowStudentSuggestions(false);
    }
  };

  const handleSelectStudent = (student: any) => {
    setFormData({
      ...formData,
      cccd: student.cccd,
      sbd: student.sbd || "",
      name: student.name || "",
      hang: student.hang || "B2",
      original_exam_date: student.original_exam_date || "",
      result: student.result || "Vắng LT",
      gv: student.gv || ""
    });
    setStudentInfo(student);
    setShowStudentSuggestions(false);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.storage_location) return alert("Vui lòng điền các trường bắt buộc");
    const res = await addAbsentRecord({ ...formData, type });
    if (res.success) {
      setIsAddOpen(false);
      setFormData({ cccd: "", sbd: "", name: "", hang: "B2", original_exam_date: "", result: "Vắng LT", storage_location: "", note: "", gv: "" });
      setStudentInfo(null);
      loadData();
    } else {
      alert("Lỗi: " + res.error);
    }
  };

  const handleCheckout = async () => {
    if (!selectedRecord) return;
    if (!checkoutDate) return alert("Vui lòng chọn ngày thi mục tiêu!");
    const res = await checkoutAbsentRecord(selectedRecord.id, checkoutDate);
    if (res.success) {
      setIsCheckoutOpen(false);
      setSelectedRecord(null);
      setCheckoutDate("");
      loadData();
    } else {
      alert("Lỗi: " + res.error);
    }
  };

  const handleReturn = async () => {
    if (!selectedRecord) return;
    if (!returnLocation) return alert("Vui lòng nhập vị trí lưu kho!");
    const res = await returnAbsentRecord(selectedRecord.id, returnLocation);
    if (res.success) {
      setIsReturnOpen(false);
      setSelectedRecord(null);
      setReturnLocation("");
      loadData();
    } else {
      alert("Lỗi: " + res.error);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Bạn có chắc chắn muốn xoá hồ sơ này?")) {
      const res = await deleteAbsentRecord(id);
      if (res.success) loadData();
      else alert("Lỗi: " + res.error);
    }
  };

  const handleUpdateRecord = async () => {
    if (!selectedRecord) return;
    if (!editFormData.name) return alert("Vui lòng nhập tên học viên!");
    if (!editFormData.storage_location) return alert("Vui lòng nhập vị trí lưu kho!");
    
    const res = await updateAbsentRecord(selectedRecord.id, editFormData);
    if (res.success) {
      setIsUpdateLocationOpen(false);
      setSelectedRecord(null);
      loadData();
    } else {
      alert("Lỗi: " + res.error);
    }
  };

  const filteredRecords = records.filter(r => 
    r.name?.toLowerCase().includes(search.toLowerCase()) || 
    r.cccd?.toLowerCase().includes(search.toLowerCase()) ||
    r.storage_location?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Search & Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            placeholder="Tìm theo tên, CCCD, Vị trí..." 
            className="pl-9 h-11 border-slate-200 focus:border-indigo-500 bg-slate-50 focus:bg-white transition-colors"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Button onClick={() => setIsAddOpen(true)} className="w-full sm:w-auto h-11 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-md shadow-indigo-200 rounded-lg">
          <Plus className="w-4 h-4 mr-2" />
          Lưu Hồ Sơ Mới
        </Button>
      </div>

      {/* Main Data Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50/80 border-b border-slate-200">
              <tr>
                <th className="px-5 py-4 font-semibold">Học viên</th>
                <th className="px-5 py-4 font-semibold">Kỳ thi cũ</th>
                <th className="px-5 py-4 font-semibold">Tình trạng</th>
                <th className="px-5 py-4 font-semibold text-center">Trạng thái kho</th>
                <th className="px-5 py-4 font-semibold">Vị trí lưu trữ</th>
                <th className="px-5 py-4 font-semibold">Ngày nhận/xuất</th>
                <th className="px-5 py-4 font-semibold text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                      <p>Đang tải dữ liệu {title}...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-slate-400">
                    <Package className="w-10 h-10 mx-auto text-slate-300 mb-3" />
                    <p>Không có hồ sơ nào.</p>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-5 py-4">
                      <div className="font-bold text-slate-800">{r.name}</div>
                      <div className="text-xs text-slate-500 font-mono mt-0.5">{r.cccd || '---'} | Hạng: <span className="font-semibold text-slate-700">{r.hang}</span></div>
                    </td>
                    <td className="px-5 py-4 text-slate-900 font-semibold">
                      {r.original_exam_date ? (isNaN(new Date(r.original_exam_date).getTime()) ? r.original_exam_date : new Date(r.original_exam_date).toLocaleDateString("vi-VN")) : "---"}
                    </td>
                    <td className="px-5 py-4">
                      <span className="px-2.5 py-1 bg-rose-50 text-rose-700 font-semibold rounded-md text-xs border border-rose-100">
                        {r.result || "Vắng/Rớt"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      {r.status === "Đang lưu kho" ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 font-bold rounded-lg text-xs border border-emerald-200 shadow-sm">
                          <Archive className="w-3.5 h-3.5" /> Lưu kho
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 font-bold rounded-lg text-xs border border-amber-200 shadow-sm">
                          <ExternalLink className="w-3.5 h-3.5" /> Đã xuất kho
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      {r.status === "Đang lưu kho" ? (
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100">
                            {r.storage_location}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs italic">Không có trong kho</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-xs text-slate-500">
                        <span className="font-semibold text-slate-700">Nhận:</span> {new Date(r.created_at).toLocaleDateString("vi-VN")}
                      </div>
                      {r.checkout_date && (
                        <div className="text-xs text-slate-500 mt-1">
                          <span className="font-semibold text-amber-700">Xuất:</span> {new Date(r.checkout_date).toLocaleDateString("vi-VN")}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {r.status === "Đang lưu kho" ? (
                          <>
                            <button 
                              onClick={() => {
                                setSelectedRecord(r);
                                setEditFormData({
                                  name: r.name || "",
                                  cccd: r.cccd || "",
                                  hang: r.hang || "B2",
                                  original_exam_date: r.original_exam_date || "",
                                  result: r.result || "Vắng LT",
                                  storage_location: r.storage_location || "",
                                  note: r.note || "",
                                  gv: r.gv || ""
                                });
                                setIsUpdateLocationOpen(true);
                              }}
                              className="text-slate-400 hover:text-indigo-600 transition-colors"
                              title="Chỉnh sửa thông tin hồ sơ"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => { setSelectedRecord(r); setIsCheckoutOpen(true); }} className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Xuất kho">
                              <LogOut className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <button onClick={() => { setSelectedRecord(r); setIsReturnOpen(true); }} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Nhập lại kho">
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        )}
                        <button onClick={() => handleDelete(r.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" title="Xoá hồ sơ">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add New Record Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[650px] p-0 border-0 shadow-2xl !rounded-2xl overflow-hidden !gap-0">
          <div className="bg-gradient-to-r from-indigo-600 to-blue-600 p-6 text-white">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3 text-2xl font-bold tracking-tight text-white">
                <div className="p-2.5 bg-white/20 rounded-xl shadow-inner">
                  <Plus className="w-6 h-6 text-white" />
                </div>
                Tiếp nhận hồ sơ Vắng/Rớt
              </DialogTitle>
            </DialogHeader>
            <p className="mt-2 text-indigo-100 text-sm font-medium">Nhập CCCD để tự động lấy thông tin từ kỳ thi cũ, hoặc điền thủ công.</p>
          </div>
          
          <form onSubmit={handleAddSubmit} className="p-6 bg-slate-50 space-y-6">
            <div className="grid grid-cols-12 gap-5">
              {/* Left Col */}
              <div className="col-span-12 sm:col-span-5 space-y-5">
                <div className="space-y-1.5 relative" ref={cccdWrapperRef}>
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                    CCCD Học viên <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <UserSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input 
                      required 
                      className="pl-9 h-11 font-mono border-slate-300 focus:border-indigo-500 focus:ring-indigo-500"
                      value={formData.cccd} 
                      onChange={(e) => handleStudentSearch(e.target.value)}
                      onFocus={() => { if(studentSuggestions.length > 0) setShowStudentSuggestions(true) }}
                      placeholder="Nhập số CCCD..."
                    />
                    {showStudentSuggestions && studentSuggestions.length > 0 && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-64 overflow-y-auto divide-y divide-slate-100">
                        {studentSuggestions.map((s, idx) => (
                          <div 
                            key={idx} 
                            className="px-4 py-3 hover:bg-indigo-50 cursor-pointer transition-colors"
                            onClick={() => handleSelectStudent(s)}
                          >
                            <div className="font-bold text-slate-800">{s.name}</div>
                            <div className="text-xs text-slate-500 font-mono mt-0.5">
                              {s.cccd} | Hạng: {s.hang}
                              {s.gv && ` | GV: ${s.gv}`}
                            </div>
                            {s.original_exam_date && (
                              <div className="text-xs text-indigo-600 mt-0.5 font-medium">
                                Thi: {new Date(s.original_exam_date).toLocaleDateString("vi-VN")} - KQ: {s.result}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700">Họ và tên *</label>
                  <Input required className="h-11 border-slate-300" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700">Hạng</label>
                    <select 
                      className="w-full h-11 px-3 border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm text-slate-900 font-semibold"
                      value={formData.hang} 
                      onChange={(e) => setFormData({...formData, hang: e.target.value})}
                    >
                      {HANG_OPTIONS.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700">Tình trạng</label>
                    <select 
                      className="w-full h-11 px-3 border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm text-slate-900 font-semibold"
                      value={formData.result} 
                      onChange={(e) => setFormData({...formData, result: e.target.value})}
                    >
                      {RESULT_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Right Col */}
              <div className="col-span-12 sm:col-span-7 bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-5">
                
                <div className="space-y-1.5 relative" ref={storageWrapperRef}>
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                    Vị trí lưu kho <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Input 
                      required 
                      className="h-11 font-bold border-indigo-200 focus:border-indigo-500 bg-indigo-50/30"
                      value={formData.storage_location} 
                      onChange={(e) => {
                        setFormData({...formData, storage_location: e.target.value});
                        setShowStorageSuggestions(true);
                      }}
                      onFocus={() => setShowStorageSuggestions(true)}
                      placeholder="Tên/Mã ngăn xếp..."
                    />
                    {showStorageSuggestions && formData.storage_location.trim().length > 0 && storageLocations.filter(l => l.name.toLowerCase().includes(formData.storage_location.toLowerCase()) || (l.code && l.code.toLowerCase().includes(formData.storage_location.toLowerCase()))).length > 0 && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-56 overflow-y-auto">
                        {storageLocations.filter(l => l.name.toLowerCase().includes(formData.storage_location.toLowerCase()) || (l.code && l.code.toLowerCase().includes(formData.storage_location.toLowerCase()))).map((loc) => (
                          <div 
                            key={loc.id} 
                            className="px-4 py-2.5 hover:bg-indigo-50 cursor-pointer flex justify-between items-center"
                            onClick={() => {
                              setFormData({...formData, storage_location: loc.name});
                              setShowStorageSuggestions(false);
                            }}
                          >
                            <span className="font-semibold text-slate-700">{loc.name}</span>
                            {loc.code && <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded">{loc.code}</span>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700">Ngày thi cũ (Nếu có)</label>
                  <Input type="date" className="h-11 border-slate-300 text-slate-900 font-semibold" value={formData.original_exam_date} onChange={(e) => setFormData({...formData, original_exam_date: e.target.value})} />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700">Ghi chú thêm</label>
                  <Input className="h-11 border-slate-300" placeholder="VD: Bị thiếu hồ sơ gốc..." value={formData.note} onChange={(e) => setFormData({...formData, note: e.target.value})} />
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-end gap-3 border-t border-slate-200">
              <Button type="button" variant="ghost" className="h-11 px-6 font-semibold" onClick={() => setIsAddOpen(false)}>Huỷ</Button>
              <Button type="submit" className="h-11 px-8 bg-indigo-600 hover:bg-indigo-700 font-bold shadow-md shadow-indigo-200">
                Tiếp Nhận Hồ Sơ
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Record Dialog */}
      <Dialog open={isUpdateLocationOpen} onOpenChange={setIsUpdateLocationOpen}>
        <DialogContent className="sm:max-w-[600px] p-0 border-0 shadow-2xl !rounded-2xl !bg-transparent !gap-0">
          <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-6 text-white rounded-t-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3 text-2xl font-bold tracking-tight text-white">
                <div className="p-2.5 bg-white/20 rounded-xl shadow-inner border border-white/10">
                  <Edit2 className="w-6 h-6 text-white" />
                </div>
                Chỉnh sửa thông tin hồ sơ
              </DialogTitle>
            </DialogHeader>
            <p className="mt-2 text-indigo-100 text-sm font-medium">
              Cập nhật lại các thông tin của học viên, kỳ thi cũ hoặc vị trí lưu kho.
            </p>
          </div>
          
          <div className="p-6 space-y-4 bg-white relative z-10">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700">Họ và tên *</label>
                <Input 
                  readOnly
                  value={editFormData.name} 
                  onChange={(e) => setEditFormData({...editFormData, name: e.target.value})} 
                  className="h-11 border-slate-200 bg-slate-100 text-slate-500 font-medium cursor-not-allowed"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700">CCCD</label>
                <Input 
                  readOnly
                  value={editFormData.cccd} 
                  onChange={(e) => setEditFormData({...editFormData, cccd: e.target.value})} 
                  className="h-11 border-slate-200 bg-slate-100 text-slate-500 font-mono cursor-not-allowed"
                />
              </div>
              
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700">Hạng</label>
                <select 
                  className="w-full h-11 px-3 border border-slate-200 rounded-md focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 text-sm transition-colors text-slate-900 font-semibold"
                  value={editFormData.hang} 
                  onChange={(e) => setEditFormData({...editFormData, hang: e.target.value})} 
                >
                  {HANG_OPTIONS.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700">Kỳ thi cũ (Ngày thi)</label>
                <Input 
                  type="date"
                  value={(() => {
                    if (!editFormData.original_exam_date) return "";
                    const d = new Date(editFormData.original_exam_date);
                    return isNaN(d.getTime()) ? "" : d.toISOString().split('T')[0];
                  })()} 
                  onChange={(e) => setEditFormData({...editFormData, original_exam_date: e.target.value})} 
                  className="h-11 border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20 text-slate-900 font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                  Tình trạng (Vắng / Rớt)
                </label>
                <select 
                  className="w-full h-11 px-3 border border-slate-200 rounded-md focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 text-sm font-semibold transition-colors text-slate-900"
                  value={editFormData.result} 
                  onChange={(e) => setEditFormData({...editFormData, result: e.target.value})} 
                >
                  {/* Append dynamically if not in the list */}
                  {!RESULT_OPTIONS.includes(editFormData.result) && editFormData.result && (
                    <option value={editFormData.result}>{editFormData.result}</option>
                  )}
                  {RESULT_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-1.5 relative" ref={updateStorageWrapperRef}>
              <label className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                Vị trí ngăn xếp mới <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Input 
                  className="w-full h-11 px-4 font-bold bg-white border-2 border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition-colors placeholder:text-slate-400 placeholder:font-normal rounded-lg"
                  value={editFormData.storage_location} 
                  onChange={(e) => {
                    setEditFormData({...editFormData, storage_location: e.target.value});
                    setShowUpdateStorageSuggestions(true);
                  }}
                  onFocus={() => setShowUpdateStorageSuggestions(true)}
                  placeholder="Gõ tên hoặc mã vị trí (VD: K1, Tủ A...)"
                />
                
                {showUpdateStorageSuggestions && editFormData.storage_location.trim().length > 0 && storageLocations.filter(l => l.name.toLowerCase().includes(editFormData.storage_location.toLowerCase()) || (l.code && l.code.toLowerCase().includes(editFormData.storage_location.toLowerCase()))).length > 0 && (
                  <div className="absolute z-50 w-full bottom-full mb-2 bg-white border border-slate-200 rounded-xl shadow-2xl max-h-56 overflow-y-auto divide-y divide-slate-100 flex flex-col-reverse">
                    <div className="flex flex-col">
                      {storageLocations.filter(l => l.name.toLowerCase().includes(editFormData.storage_location.toLowerCase()) || (l.code && l.code.toLowerCase().includes(editFormData.storage_location.toLowerCase()))).map((loc) => (
                        <div 
                          key={loc.id} 
                          className="px-5 py-3 hover:bg-indigo-50 cursor-pointer flex justify-between items-center transition-colors group"
                          onClick={() => {
                            setEditFormData({...editFormData, storage_location: loc.name});
                            setShowUpdateStorageSuggestions(false);
                          }}
                        >
                          <span className="font-bold text-slate-700 group-hover:text-indigo-700">{loc.name}</span>
                          {loc.code && <span className="font-mono text-xs text-indigo-700 font-semibold bg-indigo-100 px-2.5 py-1 rounded-md">{loc.code}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-700">Ghi chú</label>
              <Input 
                value={editFormData.note} 
                onChange={(e) => setEditFormData({...editFormData, note: e.target.value})} 
                className="h-11 border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20"
              />
            </div>
          </div>
          
          {/* Footer Action */}
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 rounded-b-2xl relative z-10">
            <Button variant="ghost" className="h-11 px-6 font-semibold text-slate-600 hover:bg-slate-200 hover:text-slate-900 rounded-xl" onClick={() => setIsUpdateLocationOpen(false)}>
              Huỷ bỏ
            </Button>
            <Button 
              onClick={handleUpdateRecord} 
              className="h-11 px-8 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md shadow-indigo-200 transition-colors"
            >
              Lưu thay đổi
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Checkout Dialog */}
      <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Xuất kho hồ sơ</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <p className="text-sm text-slate-600">Bạn đang xuất kho hồ sơ của học viên <strong>{selectedRecord?.name}</strong>.</p>
            <div className="space-y-2 relative" ref={scheduleWrapperRef}>
              <label className="text-sm font-medium">Chuyển sang kỳ thi mới (Ngày thi):</label>
              <Input 
                value={checkoutDate}
                onChange={(e) => {
                  setCheckoutDate(e.target.value);
                  setShowScheduleSuggestions(true);
                }}
                onFocus={() => setShowScheduleSuggestions(true)}
                placeholder="Chọn hoặc nhập ngày thi (YYYY-MM-DD)"
              />
              {showScheduleSuggestions && schedules.filter(s => s.exam_date.includes(checkoutDate)).length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                  {schedules.filter(s => s.exam_date.includes(checkoutDate)).map((s, idx) => (
                    <div 
                      key={idx} 
                      className="px-3 py-2 hover:bg-slate-100 cursor-pointer text-sm"
                      onClick={() => {
                        setCheckoutDate(s.exam_date.split('T')[0]);
                        setShowScheduleSuggestions(false);
                      }}
                    >
                      <span className="font-semibold text-indigo-600">{new Date(s.exam_date).toLocaleDateString('vi-VN')}</span>
                      <span className="ml-2 text-slate-500 truncate inline-block align-bottom max-w-[200px]">{s.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCheckoutOpen(false)}>Huỷ</Button>
            <Button onClick={handleCheckout} className="bg-amber-600 hover:bg-amber-700">Xác nhận xuất</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Return Dialog */}
      <Dialog open={isReturnOpen} onOpenChange={setIsReturnOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Nhập lại hồ sơ vào kho</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <p className="text-sm text-slate-600">Bạn đang nhập lại hồ sơ của học viên <strong>{selectedRecord?.name}</strong>.</p>
            <div className="space-y-2 relative" ref={returnStorageWrapperRef}>
              <label className="text-sm font-medium">Vị trí ngăn xếp mới:</label>
              <Input 
                value={returnLocation}
                onChange={(e) => {
                  setReturnLocation(e.target.value);
                  setShowReturnStorageSuggestions(true);
                }}
                onFocus={() => setShowReturnStorageSuggestions(true)}
                placeholder="Tên/Mã ngăn xếp..."
              />
              {showReturnStorageSuggestions && returnLocation.trim().length > 0 && storageLocations.filter(l => l.name.toLowerCase().includes(returnLocation.toLowerCase()) || (l.code && l.code.toLowerCase().includes(returnLocation.toLowerCase()))).length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                  {storageLocations.filter(l => l.name.toLowerCase().includes(returnLocation.toLowerCase()) || (l.code && l.code.toLowerCase().includes(returnLocation.toLowerCase()))).map((loc) => (
                    <div 
                      key={loc.id} 
                      className="px-3 py-2 hover:bg-slate-100 cursor-pointer flex justify-between items-center"
                      onClick={() => {
                        setReturnLocation(loc.name);
                        setShowReturnStorageSuggestions(false);
                      }}
                    >
                      <span className="font-bold text-slate-800 text-sm">{loc.name}</span>
                      {loc.code && <span className="font-mono text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{loc.code}</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReturnOpen(false)}>Huỷ</Button>
            <Button onClick={handleReturn} className="bg-emerald-600 hover:bg-emerald-700">Xác nhận nhập kho</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
