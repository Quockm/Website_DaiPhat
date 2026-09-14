"use client";

import React, { useState, useEffect, useRef } from "react";
import { Package, Search, Plus, Archive, ExternalLink, RotateCcw, Trash2, UserSearch, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger 
} from "@/components/ui/dialog";
import { 
  getAbsentRecords, addAbsentRecord, checkoutAbsentRecord, returnAbsentRecord, deleteAbsentRecord, getStudentInfoByCCCD, searchStudentsByCCCD 
} from "@/actions/absent/absent.actions";
import { getStorageLocations } from "@/actions/absent/storage.actions";
import { getExamSchedules } from "@/actions/exam-schedules.actions";

interface AbsentInventoryTabProps {
  type: "TN" | "SH";
  title: string;
}

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
    cccd: "", sbd: "", name: "", hang: "", original_exam_date: "", result: "Vắng", storage_location: "", note: ""
  });
  const [checkoutDate, setCheckoutDate] = useState("");
  const [returnLocation, setReturnLocation] = useState("");
  
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  
  const [storageLocations, setStorageLocations] = useState<any[]>([]);
  const [showStorageSuggestions, setShowStorageSuggestions] = useState(false);
  const storageWrapperRef = useRef<HTMLDivElement>(null);
  const returnStorageWrapperRef = useRef<HTMLDivElement>(null);
  const [showReturnStorageSuggestions, setShowReturnStorageSuggestions] = useState(false);
  
  const [examSchedules, setExamSchedules] = useState<any[]>([]);

  useEffect(() => {
    async function fetchLocations() {
      const res = await getStorageLocations();
      if (res.success) setStorageLocations(res.data || []);
    }
    async function fetchSchedules() {
      const res = await getExamSchedules(type);
      if (res.success) setExamSchedules(res.data || []);
    }
    fetchLocations();
    fetchSchedules();
    
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
      if (storageWrapperRef.current && !storageWrapperRef.current.contains(event.target as Node)) {
        setShowStorageSuggestions(false);
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
    const res = await getAbsentRecords(type, search);
    if (res.success) {
      setRecords(res.data || []);
    } else {
      alert("Lỗi: " + res.error);
    }
    setLoading(false);
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      loadData();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [search, type]);

  const handleAdd = async () => {
    if (!formData.name) return alert("Vui lòng nhập họ tên!");
    
    const res = await addAbsentRecord({ ...formData, type });
    if (res.success) {
      setIsAddOpen(false);
      setFormData({ cccd: "", sbd: "", name: "", hang: "", original_exam_date: "", result: "Vắng", storage_location: "", note: "" });
      loadData();
    } else {
      alert("Lỗi: " + res.error);
    }
  };

  const handleCccdChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setFormData({...formData, cccd: val});
    
    const searchVal = val.trim();
    if (searchVal.length >= 3) {
      const res = await searchStudentsByCCCD(searchVal, type);
      if (res.success) {
        setSuggestions(res.data || []);
        setShowSuggestions(true);
      }
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSelectSuggestion = (student: any) => {
    let formattedDate: string | null = null;
    if (student.original_exam_date) {
      const d = new Date(student.original_exam_date);
      if (!isNaN(d.getTime())) {
        formattedDate = d.toLocaleDateString('vi-VN');
      }
    }

    setFormData(prev => ({
      ...prev,
      cccd: student.cccd,
      name: student.name || prev.name,
      sbd: student.sbd || prev.sbd,
      hang: student.hang || prev.hang,
      original_exam_date: formattedDate ? formattedDate : prev.original_exam_date,
      result: student.result === 'RỚT' || student.result === 'HỎNG' || student.result === 'KHÔNG ĐẠT' ? 'Rớt' : 'Vắng'
    }));
    setShowSuggestions(false);
  };

  const handleCheckout = async () => {
    if (!selectedRecord) return;
    if (!checkoutDate) return alert("Vui lòng nhập ngày dự định thi lại!");
    
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
    if (!returnLocation) return alert("Vui lòng nhập vị trí lưu kho mới!");
    
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
    if (confirm("Bạn có chắc chắn muốn xoá hồ sơ này khỏi kho?")) {
      const res = await deleteAbsentRecord(id);
      if (res.success) loadData();
      else alert("Lỗi: " + res.error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-rose-100 text-rose-600 rounded-lg">
            <Archive className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-bold text-slate-800">Kho lưu trữ - {title}</h2>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input 
              placeholder="Tìm tên, CCCD, Vị trí..." 
              className="pl-9 w-64"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="bg-indigo-600 hover:bg-indigo-700">
                <Plus className="w-4 h-4 mr-2" /> Nhập hồ sơ
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[650px] overflow-visible p-8">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold flex items-center gap-2 text-black mb-4">
                  <Archive className="w-6 h-6 text-indigo-600" />
                  Nhập hồ sơ mới vào kho
                </DialogTitle>
              </DialogHeader>
              
              <div className="py-2 space-y-8">
                {/* Section 1: Thông tin học viên */}
                <div className="space-y-4">
                  <h3 className="text-base font-semibold text-slate-800 border-b pb-2 flex items-center gap-2">
                    <UserSearch className="w-5 h-5 text-slate-500" /> Thông tin học viên
                  </h3>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-6">
                    <div className="space-y-2 relative" ref={wrapperRef}>
                      <label className="text-sm font-medium text-slate-700">CCCD (Gợi ý tự động)</label>
                      <Input 
                        value={formData.cccd} 
                        onChange={handleCccdChange} 
                        placeholder="Nhập 3+ số CCCD..."
                        className="h-11 px-4 py-2 font-mono text-sm text-black font-semibold placeholder:text-slate-400"
                      />
                      {showSuggestions && suggestions.length > 0 && (
                        <div className="absolute z-50 w-full bg-white border border-slate-200 rounded-md shadow-lg top-[70px] max-h-60 overflow-y-auto">
                          {suggestions.map((st, i) => (
                            <div 
                              key={i} 
                              className="px-3 py-2 hover:bg-slate-50 cursor-pointer border-b last:border-0 border-slate-100"
                              onClick={() => handleSelectSuggestion(st)}
                            >
                              <div className="font-semibold text-sm text-slate-800">{st.name}</div>
                              <div className="text-xs text-slate-500 font-mono">{st.cccd} | Hạng: {st.hang}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Họ và tên *</label>
                      <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="Nguyễn Văn A" className="h-11 px-4 py-2 font-bold text-black placeholder:text-slate-400" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Hạng</label>
                      <Input value={formData.hang} onChange={(e) => setFormData({...formData, hang: e.target.value})} placeholder="Ví dụ: B2" className="h-11 px-4 py-2 text-black font-semibold placeholder:text-slate-400" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Ngày thi cũ</label>
                      <Input value={formData.original_exam_date} onChange={(e) => setFormData({...formData, original_exam_date: e.target.value})} placeholder="Ví dụ: 15/08/2026" className="h-11 px-4 py-2 text-black font-semibold placeholder:text-slate-400" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Kết quả</label>
                      <select 
                        className="w-full flex h-11 items-center justify-between rounded-md border border-slate-200 bg-white px-4 py-2 text-sm text-black font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                        value={formData.result} 
                        onChange={(e) => setFormData({...formData, result: e.target.value})}
                      >
                        <option value="Vắng">Vắng</option>
                        <option value="Rớt">Rớt</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Section 2: Thông lưu kho */}
                <div className="space-y-4">
                  <h3 className="text-base font-semibold text-slate-800 border-b pb-2 flex items-center gap-2">
                    <Package className="w-5 h-5 text-slate-500" /> Thông tin lưu kho
                  </h3>
                  <div className="grid grid-cols-1 gap-6">
                    <div className="space-y-2 relative" ref={storageWrapperRef}>
                      <label className="text-sm font-medium text-slate-700">Vị trí cất hồ sơ (Gõ tên hoặc mã) *</label>
                      <Input 
                        className="w-full flex h-11 items-center justify-between rounded-md border border-slate-200 bg-white px-4 py-2 text-sm text-black font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-slate-400"
                        value={formData.storage_location} 
                        onChange={(e) => {
                          setFormData({...formData, storage_location: e.target.value});
                          setShowStorageSuggestions(true);
                        }}
                        onFocus={() => setShowStorageSuggestions(true)}
                        placeholder="Ví dụ: K1, Tủ A..."
                      />
                      {showStorageSuggestions && storageLocations.filter(l => l.name.toLowerCase().includes(formData.storage_location.toLowerCase()) || (l.code && l.code.toLowerCase().includes(formData.storage_location.toLowerCase()))).length > 0 && (
                        <div className="absolute z-50 w-full bg-white border border-slate-200 rounded-md shadow-lg top-[70px] max-h-48 overflow-y-auto">
                          {storageLocations.filter(l => l.name.toLowerCase().includes(formData.storage_location.toLowerCase()) || (l.code && l.code.toLowerCase().includes(formData.storage_location.toLowerCase()))).map((loc) => (
                            <div 
                              key={loc.id} 
                              className="px-3 py-2 hover:bg-slate-50 cursor-pointer border-b last:border-0 border-slate-100 flex justify-between"
                              onClick={() => {
                                setFormData({...formData, storage_location: loc.name});
                                setShowStorageSuggestions(false);
                              }}
                            >
                              <span className="font-bold text-slate-800 text-sm">{loc.name}</span>
                              {loc.code && <span className="font-mono text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{loc.code}</span>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Ghi chú (nếu có)</label>
                      <Input value={formData.note} onChange={(e) => setFormData({...formData, note: e.target.value})} placeholder="Hồ sơ còn thiếu giấy khám sức khoẻ..." className="h-11 px-4 py-2 text-black placeholder:text-slate-400" />
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddOpen(false)}>Huỷ</Button>
                <Button onClick={handleAdd} className="bg-indigo-600 hover:bg-indigo-700">Lưu hồ sơ</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-600 uppercase bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Học viên</th>
                <th className="px-4 py-3">Kỳ thi cũ</th>
                <th className="px-4 py-3 text-center">Tình trạng</th>
                <th className="px-4 py-3">Vị trí lưu trữ</th>
                <th className="px-4 py-3 text-center">Trạng thái kho</th>
                <th className="px-4 py-3 text-center">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={7} className="text-center py-8 text-slate-500">Đang tải dữ liệu...</td></tr>
              ) : records.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-slate-500">Kho trống, không có hồ sơ nào.</td></tr>
              ) : (
                records.map((r) => {
                  const isStored = r.status === 'Đang lưu kho';
                  return (
                    <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-slate-500">#{r.id}</td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-800">{r.name}</div>
                        <div className="text-xs text-slate-500">CCCD: {r.cccd || '---'} | Hạng: <span className="font-semibold text-indigo-600">{r.hang || '---'}</span></div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {r.original_exam_date || '---'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${r.result === 'Rớt' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                          {r.result}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-700">
                        {r.storage_location || '---'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {isStored ? (
                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
                            Đang lưu kho
                          </span>
                        ) : (
                          <div className="flex flex-col items-center gap-1">
                            <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                              Đã xuất kho
                            </span>
                            {r.target_exam_date && (
                              <span className="text-xs text-slate-500">Cho ngày: {r.target_exam_date}</span>
                            )}
                            {r.checkout_date && (
                              <span className="text-xs text-slate-400">({new Date(r.checkout_date).toLocaleDateString('vi-VN')})</span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          {isStored ? (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 text-blue-500 hover:bg-blue-50 hover:text-blue-700 font-medium" 
                              onClick={() => {
                                setSelectedRecord(r);
                                setIsCheckoutOpen(true);
                              }}
                            >
                              <LogOut className="w-4 h-4 mr-1" />
                              Đã lấy
                            </Button>
                          ) : (
                            <Button 
                              variant="outline" size="sm" 
                              className="h-8 text-xs bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 border-emerald-200"
                              onClick={() => { setSelectedRecord(r); setReturnLocation(r.storage_location); setIsReturnOpen(true); }}
                            >
                              <RotateCcw className="w-3 h-3 mr-1" /> Nhập lại kho
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-50 hover:text-red-700" onClick={() => handleDelete(r.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Checkout Dialog */}
      <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xuất hồ sơ đi thi lại</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <p className="text-sm text-slate-600">
              Bạn đang xuất hồ sơ của học viên <strong className="text-slate-900">{selectedRecord?.name}</strong>.
            </p>
            <div className="space-y-2">
              <label className="text-sm font-medium">Chọn lịch thi sắp tới (Ngày thi lại) *</label>
              <select 
                className="w-full flex h-11 items-center justify-between rounded-md border border-slate-200 bg-white px-4 py-2 text-sm text-black font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                value={checkoutDate} 
                onChange={(e) => setCheckoutDate(e.target.value)}
              >
                <option value="">-- Chọn lịch thi --</option>
                {examSchedules.map(sch => {
                  const d = new Date(sch.exam_date);
                  const dateStr = !isNaN(d.getTime()) ? d.toLocaleDateString('vi-VN') : sch.exam_date;
                  return (
                    <option key={sch.id} value={dateStr}>
                      {dateStr} {sch.title ? `- ${sch.title}` : ''}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCheckoutOpen(false)}>Huỷ</Button>
            <Button onClick={handleCheckout} className="bg-amber-600 hover:bg-amber-700">Xác nhận xuất kho</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Return Dialog */}
      <Dialog open={isReturnOpen} onOpenChange={setIsReturnOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nhập lại hồ sơ vào kho</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <p className="text-sm text-slate-600">
              Đưa hồ sơ của <strong className="text-slate-900">{selectedRecord?.name}</strong> trở lại kho lưu trữ.
            </p>
            <div className="space-y-2 relative" ref={returnStorageWrapperRef}>
              <label className="text-sm font-medium">Cất vào ngăn xếp / Vị trí nào (Gõ tên hoặc mã)? *</label>
              <Input 
                className="w-full flex h-11 items-center justify-between rounded-md border border-slate-200 bg-white px-4 py-2 text-sm text-black font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-slate-400"
                value={returnLocation} 
                onChange={(e) => {
                  setReturnLocation(e.target.value);
                  setShowReturnStorageSuggestions(true);
                }}
                onFocus={() => setShowReturnStorageSuggestions(true)}
                placeholder="Ví dụ: K1, Tủ A..."
              />
              {showReturnStorageSuggestions && storageLocations.filter(l => l.name.toLowerCase().includes(returnLocation.toLowerCase()) || (l.code && l.code.toLowerCase().includes(returnLocation.toLowerCase()))).length > 0 && (
                <div className="absolute z-50 w-full bg-white border border-slate-200 rounded-md shadow-lg top-[70px] max-h-48 overflow-y-auto">
                  {storageLocations.filter(l => l.name.toLowerCase().includes(returnLocation.toLowerCase()) || (l.code && l.code.toLowerCase().includes(returnLocation.toLowerCase()))).map((loc) => (
                    <div 
                      key={loc.id} 
                      className="px-3 py-2 hover:bg-slate-50 cursor-pointer border-b last:border-0 border-slate-100 flex justify-between"
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
