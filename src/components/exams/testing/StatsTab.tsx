"use client";

import React, { useState, useEffect, useMemo } from "react";
import { BarChart3, PieChart, TrendingUp, Users, Upload, Search, Download, FileSpreadsheet, ListOrdered } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import * as XLSX from "xlsx";
import { getExamSchedules, saveKqshResults, getKqshResults } from "@/actions/exam-schedules.actions";

const normalizeKq = (s: any) => {
  const rLt = (s.result_lt || "").toString().toLowerCase();
  const rHinh = (s.result_hinh || "").toString().toLowerCase();
  const rDuong = (s.result_duong || "").toString().toLowerCase();
  const final = (s.kq_final || '').toString().trim().toLowerCase();
  
  // Requirement: "học viên vắng là học viên có 1 môn trong 3 môn là vắng"
  if (rLt.includes('vắng') || rHinh.includes('vắng') || rDuong.includes('vắng') || final.includes('vắng')) {
    return 'absent';
  }
  
  if (final.includes('rớt') || final.includes('trượt') || final.includes('không') || final.includes('hỏng')) return 'fail';
  if (final.includes('đạt')) return 'pass';

  const hasFail = rLt.includes("rớt") || rLt.includes("trượt") || rLt.includes("không") || 
                  rHinh.includes("rớt") || rHinh.includes("trượt") || rHinh.includes("không") ||
                  rDuong.includes("rớt") || rDuong.includes("trượt") || rDuong.includes("không");
                  
  const hasPass = (rLt.includes("đạt") && !rLt.includes("không")) || 
                  (rHinh.includes("đạt") && !rHinh.includes("không")) || 
                  (rDuong.includes("đạt") && !rDuong.includes("không"));
                  
  if (hasFail) return 'fail';
  if (hasPass) return 'pass';
  
  if (!rLt && !rHinh && !rDuong && !final) return '';
  return 'fail';
};


// Removed isRequired as user requested to rely on 'x' in result columns instead

export function StatsTab() {

  const [schedules, setSchedules] = React.useState<any[]>([]);
  const [selectedScheduleId, setSelectedScheduleId] = React.useState("");
  const [students, setStudents] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [teachers, setTeachers] = React.useState<string[]>([]);
  const [selectedGv, setSelectedGv] = React.useState("");
  const [uploading, setUploading] = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState(0);

  useEffect(() => {
    async function fetchSchedules() {
      const res = await getExamSchedules();
      if (res.success && res.data) {
        setSchedules(res.data);
        if (res.data.length > 0) {
          setSelectedScheduleId(res.data[0].id.toString());
        }
      }
    }
    fetchSchedules();
  }, []);

  useEffect(() => {
    async function fetchResults() {
      if (!selectedScheduleId) return;
      setLoading(true);
      const res = await getKqshResults(Number(selectedScheduleId));
      if (res.success && res.data) {
        setStudents(res.data);
        const distinctGV = Array.from(new Set(res.data.map(s => s.gv).filter(Boolean))) as string[];
        setTeachers(distinctGV);
      }
      setLoading(false);
    }
    fetchResults();
  }, [selectedScheduleId]);

  const handleFileUpload = async (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!selectedScheduleId) {
      alert("Vui lòng chọn một Ngày Sát Hạch (Kỳ SH) trước khi upload!");
      return;
    }

    setUploading(true);
    setUploadProgress(10);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = event.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false, dateNF: "dd-mm-yyyy" });
        
        let headerIdx = -1;
        for (let i = 0; i < Math.min(20, rows.length); i++) {
          if (rows[i] && rows[i].some(c => typeof c === 'string' && c.includes('Số báo danh'))) {
            headerIdx = i;
            break;
          }
        }
        
        if (headerIdx === -1) {
          alert("Không tìm thấy dòng tiêu đề hợp lệ trong file!");
          setUploading(false);
          return;
        }

        const headers = rows[headerIdx].map((h: any) => (h || '').toString().trim());
        const mappedStudents: any[] = [];
        
        const col = (name: string) => headers.findIndex(h => h.includes(name));
        const idxSTT = col('STT');
        const idxMaKy = col('Mã kỳ');
        const idxSBD = col('Số báo danh');
        const idxName = col('Họ và tên');
        const idxCCCD = col('Số chứng minh');
        const idxNgaySinh = col('Ngày sinh');
        const idxGioiTinh = col('Giới tính');
        const idxQuocTich = col('Quốc tịch');
        const idxNoiCuTru = col('Nơi cư trú');
        const idxHang = col('Hạng');
        const idxNdsh = col('Nội dung');
        const idxDiemLT = col('điểm đạt Lý thuyết');
        const idxKqLT = col('Kết quả môn Lý thuyết');
        const idxDiemHinh = col('điểm đạt Hình');
        const idxKqHinh = col('Kết quả môn Hình');
        const idxDiemDuong = col('điểm đạt Đường');
        const idxKqDuong = col('Kết quả môn Đường');
        const idxKqFinal = col('Kết quả sát hạch');
        const idxGV = col('GV');
        const idxNgaySH = col('Ngày SH');
        
        for (let i = headerIdx + 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row || row.length === 0 || !row[idxName]) continue;
          
          const sched = schedules.find(s => s.id.toString() === selectedScheduleId);
          mappedStudents.push({
            ma_ky_sh: row[idxMaKy],
            stt: row[idxSTT],
            sbd: row[idxSBD],
            name: row[idxName],
            cccd: row[idxCCCD],
            ngay_sinh: row[idxNgaySinh],
            gioi_tinh: row[idxGioiTinh],
            quoc_tich: row[idxQuocTich],
            noi_cu_tru: row[idxNoiCuTru],
            hang: row[idxHang],
            ndsh: row[idxNdsh],
            score_lt: row[idxDiemLT],
            result_lt: row[idxKqLT],
            score_hinh: row[idxDiemHinh],
            result_hinh: row[idxKqHinh],
            score_duong: row[idxDiemDuong],
            result_duong: row[idxKqDuong],
            kq_final: row[idxKqFinal],
            exam_date: (idxNgaySH !== -1 && row[idxNgaySH]) ? (row[idxNgaySH].toString().includes('-') || row[idxNgaySH].toString().includes('/') ? row[idxNgaySH].toString().replace(/\//g, '-') : row[idxNgaySH]) : (sched ? sched.exam_date : ""),
            gv: (idxGV !== -1 && row[idxGV]) ? row[idxGV] : ""
          });
        }
        
        setUploadProgress(50);

        // Save to DB
        setUploadProgress(70);
        const res = await saveKqshResults(Number(selectedScheduleId), mappedStudents);
        if (res.success) {
          alert("Lưu kết quả sát hạch thành công!");
          setUploadProgress(100);
          setStudents(mappedStudents);
          const distinctGV = Array.from(new Set(mappedStudents.map(s => s.gv).filter(Boolean)));
          setTeachers(distinctGV);
        } else {
          alert("Lưu kết quả thất bại: " + res.error);
        }
        
      } catch (err) {
        console.error(err);
        alert("Lỗi đọc file Excel.");
      }
      setUploading(false);
      e.target.value = null;
    };
    reader.readAsBinaryString(file);
  };


  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const term = search.toLowerCase();
      const matchSearch = term === "" || 
        (s.name && s.name.toLowerCase().includes(term)) ||
        (s.sbd && s.sbd.toString().includes(term));
      const matchGv = selectedGv ? s.gv === selectedGv : true;
      return matchSearch && matchGv;
    });
  }, [students, search, selectedGv]);

  const { total, pass, fail, absent } = useMemo(() => {
    let total = filteredStudents.length;
    let pass = 0;
    let fail = 0;
    let absent = 0;

    filteredStudents.forEach(s => {
      const res = normalizeKq(s);
      if (res === 'pass') pass++;
      else if (res === 'fail') fail++;
      else if (res === 'absent') absent++;
    });

    return { total, pass, fail, absent };
  }, [filteredStudents]);

  const passRate = total > 0 ? Math.round((pass / total) * 100) : 0;
  const failRate = total > 0 ? Math.round((fail / total) * 100) : 0;
  const absentRate = total > 0 ? Math.round((absent / total) * 100) : 0;

  // Teacher statistics aggregation
  const teacherStats = useMemo(() => {
    const stats: Record<string, any> = {};
    
    students.forEach(s => {
      const gv = s.gv || 'Chưa phân bổ';
      if (!stats[gv]) {
        stats[gv] = { gv, total: 0, pass: 0, fail: 0, absent: 0 };
      }
      stats[gv].total++;
      const res = normalizeKq(s);
      if (res === 'pass') stats[gv].pass++;
      else if (res === 'fail') stats[gv].fail++;
      else if (res === 'absent') stats[gv].absent++;
    });

    return Object.values(stats).sort((a, b) => b.total - a.total);
  }, [students]);

  const normalizeComponentKq = (text: string) => {
    if (!text) return null;
    const t = text.toLowerCase();
    if (t.includes('rớt') || t.includes('trượt') || t.includes('không') || t.includes('hỏng')) return 'RỚT';
    if (t.includes('vắng')) return 'VẮNG';
    if (t.includes('đạt')) return 'ĐẠT';
    return text; // Return text for things like 'x'
  };

  const renderScoreCell = (student: any, scoreProp: string, resultProp: string) => {
    const score = (student[scoreProp] || '').toString().trim();
    const resultText = (student[resultProp] || '').toString().trim();
    
    const normalizedRes = normalizeComponentKq(resultText);
    if (!score && !resultText) return <div className="text-slate-400 italic text-xs">Chưa có</div>;
    
    let colorClass = "text-slate-600 font-semibold";
    if (normalizedRes === 'ĐẠT') colorClass = "text-emerald-600 font-bold";
    else if (normalizedRes === 'RỚT') colorClass = "text-rose-600 font-bold";
    else if (normalizedRes === 'VẮNG') colorClass = "text-amber-600 font-bold";

    return (
      <div className="flex flex-col items-center justify-center gap-1">
        {normalizedRes ? (
          <span className={colorClass}>{normalizedRes}</span>
        ) : (
          <span className="text-slate-500 font-semibold">{score}</span>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
            <BarChart3 className="w-5 h-5" />
          </div>
          Kết Quả Sát Hạch & Thống Kê
        </h2>
        
        <div className="flex gap-2">
           <label className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors ${
             uploading ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer'
           }`}>
              {uploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-500 border-t-transparent rounded-full animate-spin" />
                  Đang xử lý {uploadProgress}%...
                </>
              ) : (
                <>
                  <FileSpreadsheet className="w-4 h-4" />
                  Upload File Kết Quả SH (KQSH)
                </>
              )}
              <input type="file" className="hidden" accept=".xls,.xlsx" onChange={handleFileUpload} disabled={uploading} />
           </label>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input 
            className="pl-9 bg-white border-slate-200" 
            placeholder="Tìm tên, SBD..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select 
          className="h-10 px-3 py-2 rounded-md border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          value={selectedScheduleId}
          onChange={(e) => setSelectedScheduleId(e.target.value)}
        >
          {schedules.map(s => (
            <option key={s.id} value={s.id}>{s.title} ({s.exam_date})</option>
          ))}
        </select>
        <select 
          className="h-10 px-3 py-2 rounded-md border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          value={selectedGv}
          onChange={(e) => setSelectedGv(e.target.value)}
        >
          <option value="">Tất cả Giáo viên</option>
          {teachers.map(g => <option key={g} value={g}>{g}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-xl border-l-4 border-l-indigo-600 border-y border-r border-slate-200 shadow-sm">
          <h3 className="font-semibold text-slate-700 text-sm">Tổng Học Viên</h3>
          <p className="text-3xl font-bold text-slate-800 mt-2">{total}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border-l-4 border-l-emerald-500 border-y border-r border-slate-200 shadow-sm">
          <h3 className="font-semibold text-slate-700 text-sm">Đậu Sát Hạch</h3>
          <p className="text-3xl font-bold text-emerald-600 mt-2">{pass}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border-l-4 border-l-rose-500 border-y border-r border-slate-200 shadow-sm">
          <h3 className="font-semibold text-slate-700 text-sm">Trượt Sát Hạch</h3>
          <p className="text-3xl font-bold text-rose-600 mt-2">{fail}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border-l-4 border-l-amber-500 border-y border-r border-slate-200 shadow-sm">
          <h3 className="font-semibold text-slate-700 text-sm">Vắng Sát Hạch</h3>
          <p className="text-3xl font-bold text-amber-600 mt-2">{absent}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border-l-4 border-l-purple-500 border-y border-r border-slate-200 shadow-sm">
          <h3 className="font-semibold text-slate-700 text-sm">Tỷ lệ Đậu</h3>
          <p className="text-3xl font-bold text-purple-600 mt-2">{passRate}%</p>
        </div>
      </div>
      
      <div className="mt-8">
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-indigo-600" /> Thống kê theo Giáo viên
        </h3>
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="p-4">Giáo Viên</th>
                  <th className="p-4 text-center">Tổng HV</th>
                  <th className="p-4 text-center text-emerald-600">Đậu</th>
                  <th className="p-4 text-center text-rose-600">Trượt</th>
                  <th className="p-4 text-center text-amber-600">Vắng</th>
                  <th className="p-4 text-center">Tỷ lệ Đậu</th>
                  <th className="p-4 text-center">Tỷ lệ Rớt</th>
                  <th className="p-4 text-center">Tỷ lệ Vắng</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="p-10 text-center text-slate-400">Đang tải dữ liệu...</td>
                  </tr>
                ) : teacherStats.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-10 text-center text-slate-400">Không có dữ liệu.</td>
                  </tr>
                ) : (
                  teacherStats.map((stat: any, idx: number) => {
                    const tRate = stat.total > 0 ? Math.round((stat.pass / stat.total) * 100) : 0;
                    const fRate = stat.total > 0 ? Math.round((stat.fail / stat.total) * 100) : 0;
                    const aRate = stat.total > 0 ? Math.round((stat.absent / stat.total) * 100) : 0;
                    return (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-4 font-bold text-slate-800">{stat.gv}</td>
                        <td className="p-4 text-center font-semibold">{stat.total}</td>
                        <td className="p-4 text-center text-emerald-600 font-bold">{stat.pass}</td>
                        <td className="p-4 text-center text-rose-600 font-bold">{stat.fail}</td>
                        <td className="p-4 text-center text-amber-600 font-bold">{stat.absent}</td>
                        <td className="p-4 text-center font-semibold text-slate-700">{tRate}%</td>
                        <td className="p-4 text-center font-semibold text-slate-700">{fRate}%</td>
                        <td className="p-4 text-center font-semibold text-slate-700">{aRate}%</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <ListOrdered className="w-5 h-5 text-indigo-600" /> Chi tiết Học Viên
        </h3>
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto max-h-[650px] relative">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold sticky top-0">
                <tr>
                  <th className="p-4">STT</th>
                  <th className="p-4">SBD</th>
                  <th className="p-4">Họ Tên (CCCD)</th>
                  <th className="p-4">Giáo Viên</th>
                  <th className="p-4 text-center">Hạng</th>
                  <th className="p-4 text-center">Nội dung thi</th>
                  <th className="p-4">Ngày Thi</th>
                  <th className="p-4 text-center border-l border-slate-200">Lý Thuyết</th>
                  <th className="p-4 text-center">Thực Hành</th>
                  <th className="p-4 text-center border-r border-slate-200">Đường</th>
                  <th className="p-4 text-center">Kết Quả Cuối</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={11} className="p-10 text-center text-slate-400">Đang tải dữ liệu...</td>
                  </tr>
                ) : filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="p-10 text-center text-slate-400">Không tìm thấy dữ liệu.</td>
                  </tr>
                ) : (
                  filteredStudents.map((student, idx) => (
                    <tr key={student.cccd || idx} className="hover:bg-slate-50">
                      <td className="p-4 font-medium text-slate-500">{student.stt}</td>
                      <td className="p-4 font-bold text-slate-800">{student.sbd}</td>
                      <td className="p-4">
                        <div className="font-bold text-slate-800">{student.name}</div>
                        <div className="text-slate-500 text-xs">CCCD: {student.cccd}</div>
                      </td>
                      <td className="p-4">{student.gv || "-"}</td>
                      <td className="p-4 text-center font-bold text-slate-700">{student.hang || "-"}</td>
                      <td className="p-4 text-center text-slate-600">{student.ndsh || "-"}</td>
                      <td className="p-4 text-slate-600">{student.exam_date || "-"}</td>
                      <td className="p-4 text-center border-l border-slate-100">
                        {renderScoreCell(student, 'score_lt', 'result_lt')}
                      </td>
                      <td className="p-4 text-center bg-slate-50/50">
                        {renderScoreCell(student, 'score_hinh', 'result_hinh')}
                      </td>
                      <td className="p-4 text-center border-r border-slate-100">
                        {renderScoreCell(student, 'score_duong', 'result_duong')}
                      </td>
                      <td className="p-4 text-center">
                        {(() => {
                           const res = normalizeKq(student);
                           
                           if (res === 'pass') return <span className="px-2 py-1 rounded-md text-xs font-bold bg-emerald-100 text-emerald-700">ĐẠT</span>;
                           if (res === 'fail') return <span className="px-2 py-1 rounded-md text-xs font-bold bg-rose-100 text-rose-700">RỚT</span>;
                           if (res === 'absent') return <span className="px-2 py-1 rounded-md text-xs font-bold bg-amber-100 text-amber-700">VẮNG</span>;
                           return <span className="text-slate-400 italic text-xs">Đang chờ kết quả...</span>;
                        })()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
