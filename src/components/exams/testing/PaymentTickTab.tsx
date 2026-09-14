"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Banknote, Search, CheckCircle2, QrCode, UserCircle, Calendar, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { getExamSchedules } from "@/actions/exam-schedules.actions";

function getVietQRAmount(qr: string) {
  if (!qr) return "N/A";
  const match = qr.match(/54(\d{2})/);
  if (match && match.index !== undefined) {
    const len = parseInt(match[1], 10);
    const amountStr = qr.substring(match.index + 4, match.index + 4 + len);
    const amount = parseInt(amountStr, 10);
    if (!isNaN(amount)) {
      return amount.toLocaleString('vi-VN') + ' đ';
    }
  }
  return "N/A";
}

  const isRequired = (ndsh: string, type: 'lt' | 'hinh' | 'duong' | 'gplx', hang: string = "") => {
  if (type === 'gplx') return true;
  if (!ndsh) return true;

  const s = ndsh.toLowerCase();
  const hangLower = hang.toLowerCase();

  let hasLt = false;
  let hasHinh = false;
  let hasDuong = false;

  const isRetake = s.includes('lại') || s.includes('lai');
  if (isRetake) {
    const sClean = s.replace('lại', '').replace('lai', '');
    const checkSubject = (sub: string, singleChar: string) => {
      if (sClean.includes(sub)) return true;
      const regex = new RegExp('(^|[^\\p{L}])' + singleChar + '([^\\p{L}]|$)', 'u');
      return regex.test(sClean);
    };
    
    hasLt = checkSubject('lý thuyết', 'l') || sClean.includes('lt');
    hasHinh = checkSubject('hình', 'h');
    hasDuong = checkSubject('đường', 'đ') || checkSubject('đường', 'd');
  } else {
    hasLt = true;
    hasHinh = true;
    hasDuong = !hangLower.includes('a');
  }

  const subjects: string[] = [];
  if (hasLt) subjects.push('lt');
  if (hasHinh) subjects.push('hinh');
  if (hasDuong) subjects.push('duong');

  if (!subjects.includes(type)) return false;
  if (subjects[0] === type) return false;
  
  return true;
};

export function PaymentTickTab() {

  const [schedules, setSchedules] = React.useState<any[]>([]);
  const [selectedScheduleId, setSelectedScheduleId] = React.useState("");
  const [students, setStudents] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [search, setSearch] = React.useState("");




  const [selectedStudent, setSelectedStudent] = useState<any>(null);

  // Mock states to store local ticks for UI simulation
  const [tickedPayments, setTickedPayments] = useState<Record<string, Record<string, boolean>>>({});

  const handleTick = (cccd: string, type: string) => {
    setTickedPayments(prev => ({
      ...prev,
      [cccd]: {
        ...(prev[cccd] || {}),
        [type]: true
      }
    }));
  };

  useEffect(() => {
    getExamSchedules('SH').then(res => {
      if (res.success && res.data && res.data.length > 0) {
        setSchedules(res.data);
        setSelectedScheduleId(res.data[0].id.toString());
      } else {
        loadData("");
      }
    });
  }, []);

  useEffect(() => {
    if (selectedScheduleId) {
      loadData(selectedScheduleId);
    }
  }, [selectedScheduleId]);

  const loadData = async (scheduleId: string) => {
    setLoading(true);
    try {
      const { getTestingStudents } = await import("@/actions/testing/students.actions");
      const res = await getTestingStudents(scheduleId);
      if (res.success && res.data) {
        setStudents(res.data);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };
  // Filter students
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const term = search.toLowerCase();
      const matchSearch = term === "" || 
        (s.name && s.name.toLowerCase().includes(term)) ||
        (s.sbd && s.sbd.toString().includes(term)) ||
        (s.cccd && s.cccd.toString().includes(term)) ||
        (s.stt && s.stt.toString().includes(term));
      return matchSearch;
    });
  }, [students, search]);

  // Auto-select student if search exact match for STT or SBD (simulate barcode scanner)
  useEffect(() => {
    if (search && filteredStudents.length === 1) {
      const s = filteredStudents[0];
      if (s.stt?.toString() === search || s.sbd?.toString() === search || s.cccd?.toString() === search) {
        setSelectedStudent(s);
      }
    }
  }, [search, filteredStudents]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-center justify-between border-b border-slate-200 pb-4 gap-4">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
            <Banknote className="w-5 h-5" />
          </div>
          Tick Thanh Toán
        </h2>
        <div className="flex gap-3 w-full md:w-auto">
          <div className="flex gap-2">
            <select 
              className="bg-white border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2 outline-none font-medium"
              value={selectedScheduleId}
              onChange={(e) => setSelectedScheduleId(e.target.value)}
            >
              {schedules.map(s => (
                <option key={s.id} value={s.id}>{s.title} ({s.exam_date})</option>
              ))}
            </select>
          </div>
          <Input 
            className="w-full md:w-64 bg-slate-50 border-slate-200" 
            placeholder="Lọc SBD, STT, CCCD, Tên..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Column: Student List */}
        <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col max-h-[700px]">
          <div className="p-4 border-b border-slate-100 font-bold text-slate-800 flex items-center justify-between">
            <span>Danh Sách Học Viên</span>
            <span className="text-sm font-normal text-slate-500">{filteredStudents.length} học viên</span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {loading ? (
              <p className="text-center text-slate-400 py-10">Đang tải dữ liệu...</p>
            ) : filteredStudents.length === 0 ? (
              <p className="text-center text-slate-400 py-10">Không tìm thấy học viên nào.</p>
            ) : (
              filteredStudents.map((student, idx) => {
                const isSelected = selectedStudent?.cccd === student.cccd;
                return (
                  <div 
                    key={student.cccd || idx}
                    onClick={() => setSelectedStudent(student)}
                    className={`p-3 border rounded-lg flex items-center justify-between cursor-pointer transition-colors ${
                      isSelected 
                        ? "border-emerald-500 bg-emerald-50" 
                        : "border-slate-200 bg-slate-50 hover:border-emerald-300"
                    }`}
                  >
                    <div>
                      <div className={`font-bold ${isSelected ? 'text-emerald-800' : 'text-slate-800'}`}>
                        {student.sbd ? `${student.sbd} - ` : ''}{student.name}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        CCCD: {student.cccd} | STT: {student.stt}
                        {student.exam_date && ` | Ngày thi: ${student.exam_date}`}
                      </div>
                    </div>
                    <div className={isSelected ? "text-emerald-500" : "text-slate-300"}>
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Scan and Tick */}
        <div className="lg:w-[450px] shrink-0 bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col">
          <div className="text-center w-full mb-6">
            <p className="text-slate-600 font-medium mb-4">Quét mã QR STT hoặc chọn từ danh sách</p>
            <div className="flex gap-2 w-full">
              <Input 
                className="flex-1 border-2 border-emerald-500 text-lg py-6 focus-visible:ring-emerald-500 shadow-inner" 
                placeholder="Nhập SBD, CCCD hoặc STT..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
              />
              <Button size="icon" className="w-14 h-14 bg-emerald-600 hover:bg-emerald-700 shrink-0">
                <Search className="w-6 h-6" />
              </Button>
            </div>
            {!selectedStudent && <p className="text-sm text-slate-400 mt-3">Đang chờ quét mã...</p>}
          </div>
          
          {selectedStudent ? (
            <div className="flex-1 flex flex-col">
               <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 relative overflow-hidden mb-4">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <UserCircle className="w-32 h-32 text-emerald-900" />
                  </div>
                  <div className="relative z-10">
                    <h3 className="text-xl font-black text-emerald-900 mb-1">{selectedStudent.name}</h3>
                    <p className="text-emerald-700 text-sm font-medium mb-3">SBD: {selectedStudent.sbd || 'Chưa có'} | STT: {selectedStudent.stt || 'Chưa có'}</p>
                    <div className="space-y-1 mt-2 text-emerald-800 text-sm">
                      <p className="flex justify-between border-b border-emerald-200/50 pb-1">
                        <span className="font-medium opacity-80">CCCD:</span> 
                        <span className="font-bold">{selectedStudent.cccd}</span>
                      </p>
                      <p className="flex justify-between border-b border-emerald-200/50 pb-1">
                        <span className="font-medium opacity-80">Hạng:</span> 
                        <span className="font-bold">{selectedStudent.hang}</span>
                      </p>
                      <p className="flex justify-between border-b border-emerald-200/50 pb-1">
                        <span className="font-medium opacity-80">Nội dung SH:</span> 
                        <span className="font-bold">{selectedStudent.ndsh || 'N/A'}</span>
                      </p>
                    </div>
                  </div>
               </div>

               <div className="flex-1 flex flex-col gap-3">
                 <h4 className="font-bold text-slate-700 uppercase text-sm">Các khoản phí cần thanh toán</h4>
                 
                 {/* HÌNH */}
                 {isRequired(selectedStudent.ndsh, 'hinh', selectedStudent.hang) && (
                   <div className="border border-slate-200 rounded-lg p-3 flex items-center justify-between bg-white shadow-sm">
                     <div className="flex items-center gap-3">
                       <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                         <CreditCard className="w-5 h-5" />
                       </div>
                       <div>
                         <p className="font-bold text-slate-800">Lệ phí thi HÌNH</p>
                         <p className="text-blue-600 font-bold text-sm">
                           {selectedStudent.qr_hinh ? getVietQRAmount(selectedStudent.qr_hinh) : 'Chưa có mã'}
                         </p>
                       </div>
                     </div>
                     <Button 
                       size="sm" 
                       className={tickedPayments[selectedStudent.cccd]?.hinh ? "bg-slate-200 text-slate-600 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}
                       onClick={() => handleTick(selectedStudent.cccd, 'hinh')}
                       disabled={tickedPayments[selectedStudent.cccd]?.hinh}
                     >
                       {tickedPayments[selectedStudent.cccd]?.hinh ? (
                         <><CheckCircle2 className="w-4 h-4 mr-1" /> Đã thu</>
                       ) : 'Xác nhận'}
                     </Button>
                   </div>
                 )}

                 {/* ĐƯỜNG */}
                 {isRequired(selectedStudent.ndsh, 'duong', selectedStudent.hang) && (
                   <div className="border border-slate-200 rounded-lg p-3 flex items-center justify-between bg-white shadow-sm">
                     <div className="flex items-center gap-3">
                       <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center">
                         <CreditCard className="w-5 h-5" />
                       </div>
                       <div>
                         <p className="font-bold text-slate-800">Lệ phí thi ĐƯỜNG</p>
                         <p className="text-indigo-600 font-bold text-sm">
                           {selectedStudent.qr_duong ? getVietQRAmount(selectedStudent.qr_duong) : 'Chưa có mã'}
                         </p>
                       </div>
                     </div>
                     <Button 
                       size="sm" 
                       className={tickedPayments[selectedStudent.cccd]?.duong ? "bg-slate-200 text-slate-600 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700"}
                       onClick={() => handleTick(selectedStudent.cccd, 'duong')}
                       disabled={tickedPayments[selectedStudent.cccd]?.duong}
                     >
                       {tickedPayments[selectedStudent.cccd]?.duong ? (
                         <><CheckCircle2 className="w-4 h-4 mr-1" /> Đã thu</>
                       ) : 'Xác nhận'}
                     </Button>
                   </div>
                 )}

                 {/* GPLX */}
                 {isRequired(selectedStudent.ndsh, 'gplx', selectedStudent.hang) && (
                   <div className="border border-slate-200 rounded-lg p-3 flex items-center justify-between bg-white shadow-sm">
                     <div className="flex items-center gap-3">
                       <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center">
                         <CreditCard className="w-5 h-5" />
                       </div>
                       <div>
                         <p className="font-bold text-slate-800">Lệ phí cấp GPLX</p>
                         <p className="text-amber-600 font-bold text-sm">
                           {selectedStudent.qr_gplx ? getVietQRAmount(selectedStudent.qr_gplx) : 'Chưa có mã'}
                         </p>
                       </div>
                     </div>
                     <Button 
                       size="sm" 
                       className={tickedPayments[selectedStudent.cccd]?.gplx ? "bg-slate-200 text-slate-600 cursor-not-allowed" : "bg-amber-500 hover:bg-amber-600 text-white"}
                       onClick={() => handleTick(selectedStudent.cccd, 'gplx')}
                       disabled={tickedPayments[selectedStudent.cccd]?.gplx}
                     >
                       {tickedPayments[selectedStudent.cccd]?.gplx ? (
                         <><CheckCircle2 className="w-4 h-4 mr-1" /> Đã thu</>
                       ) : 'Xác nhận'}
                     </Button>
                   </div>
                 )}

                 {/* No Fees Found */}
                 {!isRequired(selectedStudent.ndsh, 'hinh', selectedStudent.hang) && 
                  !isRequired(selectedStudent.ndsh, 'duong', selectedStudent.hang) && 
                  !isRequired(selectedStudent.ndsh, 'gplx', selectedStudent.hang) && (
                   <div className="text-center py-6 text-slate-500 italic">
                     Học viên này không có khoản phí nào cần thanh toán (Không thi).
                   </div>
                 )}
               </div>

               <div className="mt-4 pt-4 border-t border-slate-200">
                 <Button variant="outline" className="w-full h-10" onClick={() => setSelectedStudent(null)}>
                   Đóng
                 </Button>
               </div>
            </div>
          ) : (
            <div className="mt-4 w-full flex-1 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-400 bg-slate-50 min-h-[300px]">
               <QrCode className="w-16 h-16 mb-4 opacity-50" />
               <p className="font-medium text-center px-4">Thông tin học viên sẽ hiển thị tại đây để bạn xác nhận thanh toán.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
