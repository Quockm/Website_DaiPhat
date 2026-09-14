"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { QrCode, Filter, PieChart, RefreshCw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog";
import QRCode from "qrcode";
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

function QRCodeImage({ value, title }: { value: string, title: string }) {
  const [src, setSrc] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!value) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          QRCode.toDataURL(value, { margin: 1, width: 300 })
            .then(setSrc)
            .catch(console.error);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [value]);
  
  const amount = getVietQRAmount(value);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <div ref={containerRef} className="cursor-pointer hover:opacity-80 transition-opacity relative group mx-auto w-16 h-16">
          {src ? (
            <img src={src} alt="QR Code" className="w-16 h-16 object-contain border border-slate-200 rounded p-1" />
          ) : (
            <div className="w-16 h-16 bg-slate-100 animate-pulse rounded mx-auto border border-slate-200 p-1" />
          )}
          <div className="absolute inset-0 bg-black/40 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-white text-xs font-bold">ZOOM</span>
          </div>
        </div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm p-6 flex flex-col items-center justify-center bg-white rounded-xl shadow-2xl border-0 mx-auto">
        <DialogTitle className="sr-only">{title}</DialogTitle>
        <div className="text-center mb-6 w-full">
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">{title}</h2>
          <div className="mt-2 inline-block px-4 py-1.5 bg-blue-50 border border-blue-200 rounded-full">
            <p className="text-lg font-bold text-blue-700">{amount}</p>
          </div>
        </div>
        <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-100 mb-6 w-full flex items-center justify-center min-h-[256px]">
          {src ? (
            <img src={src} alt="QR Code Large" className="w-64 h-64 object-contain" />
          ) : (
             <div className="w-64 h-64 bg-slate-100 animate-pulse rounded" />
          )}
        </div>
        <p className="text-xs text-slate-400 text-center break-all bg-slate-50 p-3 rounded-lg border border-slate-100 font-mono w-full">{value}</p>
      </DialogContent>
    </Dialog>
  );
}

export function QRManagementTab() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedSchool, setSelectedSchool] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [noSbdOnly, setNoSbdOnly] = useState(false);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [selectedScheduleId, setSelectedScheduleId] = useState<string>("");

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

  const schools = useMemo(() => Array.from(new Set(students.map(s => s.school).filter(Boolean))), [students]);

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

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const term = search.toLowerCase();
      const matchSearch = term === "" || 
        (s.name && s.name.toLowerCase().includes(term)) ||
        (s.sbd && s.sbd.toString().includes(term)) ||
        (s.cccd && s.cccd.toString().includes(term));
      const matchSchool = selectedSchool === "" || s.school === selectedSchool;
      const matchNoSbd = !noSbdOnly || !s.sbd;
      
      let matchStatus = true;
      if (selectedStatus === "missing_hinh") {
        matchStatus = isRequired(s.ndsh, 'hinh', s.hang) && !s.qr_hinh;
      } else if (selectedStatus === "missing_duong") {
        matchStatus = isRequired(s.ndsh, 'duong', s.hang) && !s.qr_duong;
      } else if (selectedStatus === "missing_gplx") {
        matchStatus = isRequired(s.ndsh, 'gplx', s.hang) && !s.qr_gplx;
      }

      return matchSearch && matchSchool && matchNoSbd && matchStatus;
    });
  }, [students, search, selectedSchool, selectedStatus, noSbdOnly]);

  // Compute stats by school based on full student list (not filtered)
  const statsBySchool = useMemo(() => {
    const stats: Record<string, { total: number; req_hinh: number; req_duong: number; req_gplx: number; hinh: number; duong: number; gplx: number }> = {};
    students.forEach((s) => {
      const school = s.school || "Không rõ";
      if (!stats[school]) stats[school] = { total: 0, req_hinh: 0, req_duong: 0, req_gplx: 0, hinh: 0, duong: 0, gplx: 0 };
      stats[school].total += 1;
      
      const reqH = isRequired(s.ndsh, 'hinh', s.hang);
      const reqD = isRequired(s.ndsh, 'duong', s.hang);
      const reqG = isRequired(s.ndsh, 'gplx', s.hang);

      if (reqH) {
        stats[school].req_hinh += 1;
        if (s.qr_hinh) stats[school].hinh += 1;
      }
      if (reqD) {
        stats[school].req_duong += 1;
        if (s.qr_duong) stats[school].duong += 1;
      }
      if (reqG) {
        stats[school].req_gplx += 1;
        if (s.qr_gplx) stats[school].gplx += 1;
      }
    });
    return Object.entries(stats).map(([name, data]) => ({ name, ...data }));
  }, [students]);

  const renderPrefix = (schoolName: string = "") => {
    const lower = schoolName.toLowerCase();
    if (lower.includes("đại phát")) return <span className="font-bold text-blue-500 mr-1">ĐP</span>;
    if (lower.includes("tiến thành")) return <span className="font-bold text-blue-800 mr-1">TT</span>;
    return null;
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
              <QrCode className="w-5 h-5" />
            </div>
            Quản Lý Tiến Độ Mã QR
          </h2>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] md:w-60">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input 
              className="pl-9 bg-slate-50 border-slate-200" 
              placeholder="Tìm SBD, Tên..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select 
            className="bg-white border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2 outline-none font-medium"
            value={selectedScheduleId}
            onChange={(e) => setSelectedScheduleId(e.target.value)}
          >
            {schedules.map(s => (
              <option key={s.id} value={s.id}>{s.title} ({s.exam_date})</option>
            ))}
          </select>
          <select 
            className="bg-white border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2 outline-none font-medium"
            value={selectedSchool}
            onChange={(e) => setSelectedSchool(e.target.value)}
          >
            <option value="">Tất cả Cơ sở đào tạo</option>
            {schools.map(s => <option key={s as string} value={s as string}>{s as string}</option>)}
          </select>
          <select 
            className="h-10 px-3 py-2 rounded-md border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="missing_hinh">Thiếu QR Hình</option>
            <option value="missing_duong">Thiếu QR Đường</option>
            <option value="missing_gplx">Thiếu QR GPLX</option>
          </select>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer p-2 hover:bg-slate-50 rounded-md transition-colors border border-transparent hover:border-slate-200">
            <input 
              type="checkbox" 
              className="rounded border-slate-300 text-purple-600" 
              checked={noSbdOnly}
              onChange={(e) => setNoSbdOnly(e.target.checked)}
            />
            HV chưa SBD
          </label>
          <Button variant="outline" className="gap-2" onClick={() => loadData(selectedScheduleId)} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-purple-500' : ''}`} /> Làm mới
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><PieChart className="w-5 h-5 text-purple-500" /> Thống Kê Mã QR Theo Trường</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-center text-sm">
            <thead className="bg-slate-100 text-slate-600 font-semibold">
              <tr>
                <th className="p-3 border border-slate-200">Trường</th>
                <th className="p-3 border border-slate-200">Tổng HV</th>
                <th className="p-3 border border-slate-200">Mã QR Hình</th>
                <th className="p-3 border border-slate-200">Mã QR Đường</th>
                <th className="p-3 border border-slate-200">Mã QR GPLX</th>
              </tr>
            </thead>
            <tbody>
              {statsBySchool.length === 0 ? (
                 <tr><td colSpan={5} className="p-3 border border-slate-200 text-slate-400">Không có dữ liệu</td></tr>
              ) : (
                statsBySchool.map(stat => (
                  <tr key={stat.name}>
                    <td className="p-3 border border-slate-200 font-medium text-slate-800 text-left">{stat.name}</td>
                    <td className="p-3 border border-slate-200 font-bold">{stat.total}</td>
                    <td className="p-3 border border-slate-200 font-bold text-green-600">{stat.hinh} / {stat.req_hinh} <span className="text-slate-400 font-normal">({stat.req_hinh > 0 ? Math.round((stat.hinh/stat.req_hinh)*100) : 0}%)</span></td>
                    <td className="p-3 border border-slate-200 font-bold text-green-600">{stat.duong} / {stat.req_duong} <span className="text-slate-400 font-normal">({stat.req_duong > 0 ? Math.round((stat.duong/stat.req_duong)*100) : 0}%)</span></td>
                    <td className="p-3 border border-slate-200 font-bold text-blue-600">{stat.gplx} / {stat.req_gplx} <span className="text-slate-400 font-normal">({stat.req_gplx > 0 ? Math.round((stat.gplx/stat.req_gplx)*100) : 0}%)</span></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto max-h-[600px] relative">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="p-4">STT</th>
                <th className="p-4">SBD</th>
                <th className="p-4">Họ Tên (CCCD)</th>
                <th className="p-4">Hạng</th>
                <th className="p-4">Giáo Viên</th>
                <th className="p-4">Nội dung SH</th>
                <th className="p-4 text-center">QR Hình</th>
                <th className="p-4 text-center">QR Đường</th>
                <th className="p-4 text-center">QR GPLX</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={9} className="p-10 text-center text-slate-500 flex flex-col items-center justify-center gap-2"><RefreshCw className="w-6 h-6 animate-spin text-purple-500" /> Đang tải dữ liệu mã QR...</td></tr>
              ) : filteredStudents.length === 0 ? (
                <tr><td colSpan={9} className="p-10 text-center text-slate-400">Không tìm thấy dữ liệu phù hợp.</td></tr>
              ) : (
                filteredStudents.map((student, idx) => (
                  <tr key={student.cccd || idx} className="hover:bg-slate-50">
                    <td className="p-4 font-medium text-slate-500">{student.stt}</td>
                    <td className="p-4 font-medium text-slate-800">{student.sbd}</td>
                    <td className="p-4">
                      <div className="font-bold text-slate-800">{student.name}</div>
                      <div className="text-slate-500 text-xs">
                        {renderPrefix(student.school)}
                        {student.cccd} 
                        {student.dob ? ` - NS: ${student.dob}` : ''}
                      </div>
                    </td>
                    <td className="p-4 font-bold text-slate-700">{student.hang || "-"}</td>
                    <td className="p-4 text-slate-700">{student.gv || <span className="italic text-slate-400">N/A</span>}</td>
                    <td className="p-4 text-slate-700 font-medium">{student.ndsh || <span className="italic text-slate-400">N/A</span>}</td>
                    <td className="p-4 text-center">
                      {!isRequired(student.ndsh, 'hinh', student.hang) ? (
                        <div className="text-slate-400 italic text-xs">Không thi</div>
                      ) : student.qr_hinh ? (
                        <QRCodeImage value={student.qr_hinh} title="Mã QR HÌNH" />
                      ) : (
                        <div className="text-rose-500 font-semibold text-xs italic">Chưa có mã</div>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      {!isRequired(student.ndsh, 'duong', student.hang) ? (
                        <div className="text-slate-400 italic text-xs">Không thi</div>
                      ) : student.qr_duong ? (
                        <QRCodeImage value={student.qr_duong} title="Mã QR ĐƯỜNG" />
                      ) : (
                        <div className="text-rose-500 font-semibold text-xs italic">Chưa có mã</div>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      {!isRequired(student.ndsh, 'gplx', student.hang) ? (
                        <div className="text-slate-400 italic text-xs">Không thi</div>
                      ) : student.qr_gplx ? (
                        <QRCodeImage value={student.qr_gplx} title="Mã QR GPLX" />
                      ) : (
                        <div className="text-rose-500 font-semibold text-xs italic">Chưa có mã</div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
