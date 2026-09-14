"use client";

import React, { useRef, useState, useEffect } from "react";
import { Upload, FileSpreadsheet, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import * as XLSX from "xlsx";
import { addGraduationStudents } from "@/actions/graduation/graduation.actions";
import { getExamSchedules } from "@/actions/exam-schedules.actions";

export function GraduationUploadTab() {
  const [loading, setLoading] = useState(false);
  const [retakeLoading, setRetakeLoading] = useState(false);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [selectedSchedule, setSelectedSchedule] = useState<string>("");
  
  useEffect(() => {
    getExamSchedules('TN').then(res => {
      if (res.success && res.data) setSchedules(res.data);
    });
  }, []);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const retakeFileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (e: React.ChangeEvent<HTMLInputElement>, isRetake: boolean) => {
    if (!selectedSchedule) {
      alert("Vui lòng chọn Ngày thi Tốt Nghiệp trước khi upload!");
      if (e.target) e.target.value = '';
      return;
    }
    const file = e.target.files?.[0];
    if (!file) return;

    if (isRetake) setRetakeLoading(true);
    else setLoading(true);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      // Parse data (assuming header is on row 0 or 1, with specific columns)
      // For simplicity, assuming standard columns: STT, SBD, Họ tên, Ngày sinh, CCCD, Hạng, Trường...
      // Realistically we need to map based on Excel headers. Let's do a basic mapping for now.
      const parsedStudents: any[] = [];
      
      // Find header row index roughly by looking for "cccd" or "cmnd"
      let headerRowIndex = 0;
      for (let i=0; i<Math.min(10, jsonData.length); i++) {
        const row = jsonData[i] as any[];
        if (row.some(cell => typeof cell === 'string' && (cell.toLowerCase().includes('cccd') || cell.toLowerCase().includes('cmnd')))) {
          headerRowIndex = i;
          break;
        }
      }

      const headers = (jsonData[headerRowIndex] as any[]).map(h => typeof h === 'string' ? h.toLowerCase() : '');
      const cccdIdx = headers.findIndex(h => h.includes('cccd') || h.includes('cmnd'));
      const sbdIdx = headers.findIndex(h => h.includes('sbd') || h.includes('báo danh'));
      const nameIdx = headers.findIndex(h => h.includes('họ và tên') || h.includes('họ tên'));
      const dobIdx = headers.findIndex(h => h.includes('ngày sinh'));
      const hangIdx = headers.findIndex(h => h.includes('hạng'));
      
      if (cccdIdx === -1) {
        throw new Error("Không tìm thấy cột CCCD trong file Excel.");
      }

      for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
        const row = jsonData[i] as any[];
        if (!row || row.length === 0 || !row[cccdIdx]) continue;
        
        parsedStudents.push({
          cccd: String(row[cccdIdx]),
          stt: String(i - headerRowIndex),
          sbd: sbdIdx !== -1 ? String(row[sbdIdx] || '') : '',
          name: nameIdx !== -1 ? String(row[nameIdx] || '') : '',
          dob: dobIdx !== -1 ? String(row[dobIdx] || '') : '',
          hang: hangIdx !== -1 ? String(row[hangIdx] || '') : '',
          exam_date: selectedSchedule,
        });
      }

      const res = await addGraduationStudents(parsedStudents, isRetake);
      if (res.success) {
        alert("Upload thành công! " + res.message); // Using alert for robustness
      } else {
        alert("Có lỗi xảy ra: " + res.error);
      }
    } catch (error: any) {
      alert("Lỗi đọc file: " + error.message);
    } finally {
      if (isRetake) setRetakeLoading(false);
      else setLoading(false);
      if (e.target) e.target.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
        <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
          <Upload className="w-5 h-5" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">Upload Danh sách Tốt nghiệp</h2>
        
        <div className="ml-auto flex items-center gap-3">
          <label className="text-sm font-bold text-slate-700">Chọn Lịch thi:</label>
          <select 
            className="h-10 px-3 py-2 rounded-md border border-slate-300 bg-white min-w-[200px]"
            value={selectedSchedule}
            onChange={e => setSelectedSchedule(e.target.value)}
          >
            <option value="">-- Chọn lịch thi TN --</option>
            {schedules.map(sc => (
              <option key={sc.id} value={sc.exam_date}>
                {sc.title} ({sc.exam_date})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Danh sách mới */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
          <div className="bg-blue-50 border-b border-blue-100 p-4 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-blue-800">Tải lên Danh sách Mới</h3>
          </div>
          <div className="p-5 space-y-4 flex flex-col flex-1">
            <input type="file" accept=".xlsx,.xls" className="hidden" ref={fileInputRef} onChange={(e) => processFile(e, false)} />
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 border-2 border-dashed border-blue-200 bg-blue-50/50 rounded-xl p-8 text-center cursor-pointer hover:bg-blue-50 transition-colors flex flex-col items-center justify-center min-h-[200px]"
            >
              {loading ? (
                <RefreshCw className="w-8 h-8 text-blue-400 mx-auto mb-3 animate-spin" />
              ) : (
                <Upload className="w-8 h-8 text-blue-400 mx-auto mb-3" />
              )}
              <p className="text-slate-600 font-medium">{loading ? "Đang xử lý..." : "Chọn file Excel Danh Sách Học Viên Mới"}</p>
            </div>
            <Button disabled={loading} onClick={() => fileInputRef.current?.click()} className="w-full bg-blue-600 hover:bg-blue-700 mt-auto">
              Upload Danh Sách Mới
            </Button>
          </div>
        </div>

        {/* Danh sách thi lại */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
          <div className="bg-orange-50 border-b border-orange-100 p-4 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-orange-600" />
            <h3 className="font-bold text-orange-800">Tải lên Danh sách Thi Lại</h3>
          </div>
          <div className="p-5 space-y-4 flex flex-col flex-1">
            <input type="file" accept=".xlsx,.xls" className="hidden" ref={retakeFileInputRef} onChange={(e) => processFile(e, true)} />
            <div 
              onClick={() => retakeFileInputRef.current?.click()}
              className="flex-1 border-2 border-dashed border-orange-200 bg-orange-50/50 rounded-xl p-8 text-center cursor-pointer hover:bg-orange-50 transition-colors flex flex-col items-center justify-center min-h-[200px]"
            >
              {retakeLoading ? (
                <RefreshCw className="w-8 h-8 text-orange-400 mx-auto mb-3 animate-spin" />
              ) : (
                <Upload className="w-8 h-8 text-orange-400 mx-auto mb-3" />
              )}
              <p className="text-slate-600 font-medium">{retakeLoading ? "Đang xử lý..." : "Chọn file Excel Học Viên Thi Lại (Rớt/Vắng kỳ trước)"}</p>
            </div>
            <Button disabled={retakeLoading} onClick={() => retakeFileInputRef.current?.click()} className="w-full bg-orange-600 hover:bg-orange-700 mt-auto">
              Upload Danh Sách Thi Lại
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
