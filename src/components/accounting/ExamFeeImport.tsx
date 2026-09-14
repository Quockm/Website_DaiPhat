"use client";

import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import PizZip from "pizzip";
import jsQR from 'jsqr';
import QRCode from 'qrcode';
import { useReactToPrint } from 'react-to-print';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Upload, Database, FileSpreadsheet, QrCode, Printer, Trash2, Check } from "lucide-react";
import { getExamStudents, saveExamStudents, updateExamQR, clearExamStudents, ExamStudent } from "@/actions/exam_fees";
import { ExamFeePrintTemplate, PrintStudent } from './ExamFeePrintTemplate';

export default function ExamFeeImport() {
  const [students, setStudents] = useState<ExamStudent[]>([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'grouped'>('all');
  const [selectedDate, setSelectedDate] = useState<string>('all');
  const [onlyWithQR, setOnlyWithQR] = useState(true);
  
  const [fileChung, setFileChung] = useState<File | null>(null);
  const [fileSdt, setFileSdt] = useState<File | null>(null);
  const [fileWord, setFileWord] = useState<File | null>(null);

  const printRef = React.useRef<HTMLDivElement>(null);
  const [printConfig, setPrintConfig] = useState<{
    students: PrintStudent[];
    isGrouped: boolean;
    teacherFilter?: string;
  }>({ students: [], isGrouped: true });
  const [shouldPrint, setShouldPrint] = useState(false);

  const handlePrintAction = useReactToPrint({
    contentRef: printRef,
    documentTitle: "DanhSachSathach",
    onAfterPrint: () => setLoading(false)
  });

  useEffect(() => {
    if (shouldPrint && printConfig.students.length > 0) {
      setShouldPrint(false);
      handlePrintAction();
    }
  }, [shouldPrint, printConfig, handlePrintAction]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const res = await getExamStudents();
    if (res.success && res.data) {
      setStudents(res.data);
    }
    setLoading(false);
  };

  const cleanCccd = (val: any) => {
    if (!val) return "";
    let str = String(val).trim();
    if (str.endsWith('.0')) str = str.slice(0, -2);
    if (str.length === 11) return "0" + str; // Add leading 0 if missing
    return str;
  };

  const cleanPhone = (val: any) => {
    if (!val) return "";
    let str = String(val).trim();
    if (str.endsWith('.0')) str = str.slice(0, -2);
    if (str.length === 9) return "0" + str;
    return str;
  };

  const processExcelFiles = async () => {
    if (!fileChung || !fileSdt) {
      alert("Vui lòng chọn đủ 2 file: Danh sách chung và Danh sách SĐT.");
      return;
    }
    
    setProcessing(true);
    try {
      // Read File Chung
      const chungBuffer = await fileChung.arrayBuffer();
      const wbChung = XLSX.read(chungBuffer);
      const wsChung = wbChung.Sheets[wbChung.SheetNames[0]];
      const dataChung: any[] = XLSX.utils.sheet_to_json(wsChung);

      // Trích xuất Ngày thi từ tên file chung (Ví dụ: danh_sach_12-05-2024.xlsx -> 12/05/2024)
      let fileNgayThi = "";
      const dateMatch = fileChung.name.match(/(\d{1,2}[-.\/_]\d{1,2}[-.\/_]\d{2,4})/);
      if (dateMatch) {
         fileNgayThi = dateMatch[1].replace(/[-._]/g, "/");
      }

      // Read File SDT
      const sdtBuffer = await fileSdt.arrayBuffer();
      const wbSdt = XLSX.read(sdtBuffer);
      const wsSdt = wbSdt.Sheets[wbSdt.SheetNames[0]];
      const dataSdt: any[] = XLSX.utils.sheet_to_json(wsSdt);

      // Helper to find a value by partial key match
      const getVal = (row: any, keywords: string[]) => {
        const keys = Object.keys(row);
        for (const key of keys) {
          const upperKey = key.toUpperCase();
          if (keywords.some(kw => upperKey.includes(kw.toUpperCase()))) {
            return row[key];
          }
        }
        return "";
      };

      // Map File SDT/GV by CCCD
      const sdtMap = new Map<string, any>();
      dataSdt.forEach(row => {
        let cccd = getVal(row, ["CCCD", "CMND", "CĂN CƯỚC"]);
        if (cccd) {
          cccd = cleanCccd(cccd);
          sdtMap.set(cccd, {
            sdt: getVal(row, ["SĐT", "SDT", "ĐIỆN THOẠI"]),
            gv: getVal(row, ["GIÁO VIÊN", "GV", "ĐẦU MỐI"])
          });
        }
      });

      // Process Chung data
      const mergedStudents: ExamStudent[] = [];
      dataChung.forEach((row, index) => {
        let cccd = getVal(row, ["CCCD", "CMND", "CĂN CƯỚC"]);
        if (!cccd) return; // Skip if no CCCD
        cccd = cleanCccd(cccd);

        let ho = getVal(row, ["HỌ"]);
        let ten = getVal(row, ["TÊN"]);
        let hoTen = getVal(row, ["HỌ TÊN", "HỌ VÀ TÊN"]);
        
        // If exact "HỌ" and "TÊN" exist, combine them.
        if (!hoTen && (ho || ten)) {
           // Because the header "HỌ TÊN" might match "HỌ" if we are not careful,
           // we need to be sure. Our getVal uses .includes() so "HỌ TÊN" includes "HỌ".
           // But actually we have separate HỌ and TÊN in the file.
           hoTen = `${ho} ${ten}`.trim();
        }

        const mappedSdt = sdtMap.get(cccd);
        
        // Format Date Excel (Serial number to date string)
        let rawNgayThi = getVal(row, ["NGÀY SHLX", "NGÀY THI", "NGAY SHLX", "NGAY THI"]);
        let rawNgaySinh = getVal(row, ["NGÀY SINH", "NGAY SINH"]);
        
        const parseExcelDate = (excelDate: any) => {
          if (!excelDate) return "";
          if (typeof excelDate === "number") {
             const date = new Date((excelDate - 25569) * 86400 * 1000);
             return date.toLocaleDateString("vi-VN");
          }
          return String(excelDate);
        };

        mergedStudents.push({
          STT: String(getVal(row, ["STT"]) || index + 1),
          NgayThi: fileNgayThi || parseExcelDate(rawNgayThi),
          HoTen: String(hoTen || ""),
          NgaySinh: parseExcelDate(rawNgaySinh),
          CCCD: cccd,
          Hang: String(getVal(row, ["HẠNG"]) || ""),
          GhiChu: String(getVal(row, ["GHI CHÚ", "GHI CHU"]) || ""),
          ThanhTien: String(getVal(row, ["THÀNH TIỀN", "SỐ TIỀN"])),
          GiaoVien: mappedSdt?.gv || String(getVal(row, ["GIÁO VIÊN", "GV"])),
          MaQR: "",
          TrangThaiThanhToan: "Chưa nạp"
        });
      });

      // Save to DB
      const res = await saveExamStudents(mergedStudents);
      if (res.success) {
        alert(`Đã lưu thành công ${res.count} học viên.`);
        loadData();
      } else {
        alert(`Lỗi khi lưu: ${res.error}`);
      }
    } catch (err: any) {
      alert("Lỗi xử lý file: " + err.message);
    }
    setProcessing(false);
  };

  const processWordFile = async () => {
    if (!fileWord) {
      alert("Vui lòng chọn File Word chứa mã QR.");
      return;
    }
    setProcessing(true);
    
    try {
      const buffer = await fileWord.arrayBuffer();
      const zip = new PizZip(buffer);
      
      const qrDataList: {cccd: string, qrCode: string}[] = [];
      const files = Object.keys(zip.files);
      
      const mediaFiles = files.filter(f => f.includes('media/') && (f.endsWith('.png') || f.endsWith('.jpeg') || f.endsWith('.jpg')));
      
      // Khởi tạo offscreen canvas để đọc ảnh
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      
      for (const mediaFile of mediaFiles) {
        const fileData = zip.files[mediaFile].asUint8Array();
        const blob = new Blob([fileData as unknown as BlobPart]);
        const url = URL.createObjectURL(blob);
        
        await new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = () => {
            // Chỉ đọc ảnh nhỏ (mã QR thường nhỏ)
            if (img.width < 1000 && img.height < 1000) {
              // Thêm viền trắng để jsqr dễ đọc hơn
              canvas.width = img.width + 80;
              canvas.height = img.height + 80;
              if (ctx) {
                ctx.fillStyle = "white";
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 40, 40);
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const code = jsQR(imageData.data, imageData.width, imageData.height, {
                  inversionAttempts: "attemptBoth",
                });
                if (code) {
                  // Phân tích QR VietQR
                  const qrText = code.data;
                  // Tìm CCCD trong CSDL khớp với văn bản QR
                  const matchedStudent = students.find(s => qrText.includes(s.CCCD));
                  if (matchedStudent) {
                    qrDataList.push({ cccd: matchedStudent.CCCD, qrCode: qrText });
                  }
                }
              }
            }
            URL.revokeObjectURL(url);
            resolve();
          };
          img.onerror = () => {
            URL.revokeObjectURL(url);
            resolve();
          };
          img.src = url;
        });
      }
      
      if (qrDataList.length > 0) {
        const res = await updateExamQR(qrDataList);
        if (res.success) {
          alert(`Đã cập nhật mã QR cho ${res.count} học viên.`);
          loadData();
        } else {
          alert(`Lỗi khi cập nhật QR: ${res.error}`);
        }
      } else {
        alert("Không tìm thấy mã QR hợp lệ nào khớp với danh sách CCCD.");
      }
      
    } catch (err: any) {
      console.error(err);
      alert("Lỗi khi đọc file Word: " + err.message);
    }
    
    setProcessing(false);
  };

  const handleClear = async () => {
    if (window.confirm("Bạn có chắc muốn xóa toàn bộ danh sách hiện tại?")) {
      const res = await clearExamStudents();
      if (res.success) {
        setStudents([]);
      }
    }
  };

  
  const generateQRImage = async (text: string) => {
    if (!text) return null;
    const txtStr = String(text).trim();
    if (txtStr === "" || txtStr.toLowerCase() === "null" || txtStr.toLowerCase() === "undefined" || txtStr.includes('❌') || txtStr.includes('Lỗi')) return null;
    try {
      return await QRCode.toDataURL(text, { margin: 0, width: 300, scale: 10 });
    } catch (err) {
      return null;
    }
  };

  const printPDF = async (teacherFilter?: string, isGrouped: boolean = true) => {
    if (students.length === 0) {
      alert("Không có dữ liệu để in.");
      return;
    }
    
    setLoading(true);
    try {
      const preparedStudents: PrintStudent[] = await Promise.all(
        filteredStudents.map(async (s) => ({
          ...s,
          qrDataUri: await generateQRImage(s.MaQR)
        }))
      );
      
      setPrintConfig({ students: preparedStudents, isGrouped, teacherFilter });
      setShouldPrint(true);
    } catch (err: any) {
      alert("Lỗi khi chuẩn bị in: " + err.message);
      setLoading(false);
    }
  };
  const allDates = Array.from(new Set(students.map(s => s.NgayThi).filter(Boolean)));
  let filteredStudents = selectedDate === 'all' ? students : students.filter(s => s.NgayThi === selectedDate);
  if (onlyWithQR) {
    filteredStudents = filteredStudents.filter(s => {
      if (!s.MaQR) return false;
      const qrStr = String(s.MaQR).trim();
      if (qrStr === "" || qrStr.toLowerCase() === "null" || qrStr.toLowerCase() === "undefined" || qrStr.includes("Lỗi") || qrStr.includes("❌")) return false;
      return true;
    });
  }
  
  return (
    <div className="space-y-6">
      <div className="hidden">
        <ExamFeePrintTemplate 
          ref={printRef} 
          students={printConfig.students} 
          isGrouped={printConfig.isGrouped} 
          teacherFilter={printConfig.teacherFilter} 
        />
      </div>
      
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="bg-white border-slate-200">
          <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-blue-600" /> Nạp dữ liệu Danh Sách
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">1. File Danh sách chung (Excel/CSV)</label>
              <input 
                type="file" 
                accept=".csv, .xlsx, .xls"
                onChange={(e) => setFileChung(e.target.files ? e.target.files[0] : null)}
                className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 border border-slate-200 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">2. File Danh sách SĐT & GV (Excel/CSV)</label>
              <input 
                type="file" 
                accept=".csv, .xlsx, .xls"
                onChange={(e) => setFileSdt(e.target.files ? e.target.files[0] : null)}
                className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 border border-slate-200 rounded-md"
              />
            </div>
            <button
              onClick={processExcelFiles}
              disabled={processing || !fileChung || !fileSdt}
              className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Database className="w-5 h-5" />}
              Đọc và Lưu vào CSDL
            </button>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200">
          <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <QrCode className="w-5 h-5 text-purple-600" /> Bóc tách Mã VietQR từ File Word
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="bg-purple-50 text-purple-800 p-3 rounded-md text-sm border border-purple-100 mb-4">
              <p>Hệ thống sẽ tự động tìm ảnh mã VietQR trong file Word, giải mã nội dung và khớp với CCCD của học viên trong CSDL.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">File Word chứa ảnh QR (.docx)</label>
              <input 
                type="file" 
                accept=".docx"
                onChange={(e) => setFileWord(e.target.files ? e.target.files[0] : null)}
                className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 border border-slate-200 rounded-md"
              />
            </div>
            <button
              onClick={processWordFile}
              disabled={processing || !fileWord}
              className="w-full mt-2 bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-md transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <QrCode className="w-5 h-5" />}
              Giải mã QR & Cập nhật
            </button>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-4 border-b border-slate-200 mb-6">
        <button 
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${activeTab === 'all' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Danh sách tổng
        </button>
        <button 
          onClick={() => setActiveTab('grouped')}
          className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${activeTab === 'grouped' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Phân nhóm theo Giáo viên
        </button>
        <div className="ml-auto flex items-center gap-4">
          <label className="flex items-center gap-1.5 text-sm font-medium text-slate-600 cursor-pointer">
            <input 
              type="checkbox" 
              checked={onlyWithQR} 
              onChange={e => setOnlyWithQR(e.target.checked)}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
            />
            Chỉ học viên có QR
          </label>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-slate-600">Ngày thi:</label>
          <select 
            value={selectedDate} 
            onChange={e => setSelectedDate(e.target.value)}
            className="border border-slate-200 rounded text-sm p-1.5 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">Tất cả</option>
            {allDates.map((d: any) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        </div>
      </div>

      <Card className="bg-white border-slate-200">
        <CardHeader className="bg-slate-50 border-b border-slate-100 py-3 flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            {activeTab === 'all' ? `Danh sách Học viên (${filteredStudents.length})` : "Phân nhóm theo Giáo viên"}
          </CardTitle>
          <div className="flex gap-2">
            <button 
              onClick={handleClear}
              className="flex items-center gap-1 bg-white border border-red-200 text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
            >
              <Trash2 className="w-4 h-4" /> Xóa danh sách
            </button>
            {activeTab === 'all' ? (
              <button 
                onClick={() => printPDF(undefined, false)}
                className="flex items-center gap-1 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
              >
                <Printer className="w-4 h-4" /> In toàn bộ PDF
              </button>
            ) : (
              <button 
                onClick={() => printPDF(undefined, true)}
                className="flex items-center gap-1 bg-emerald-600 border border-emerald-600 text-white hover:bg-emerald-700 px-3 py-1.5 rounded-md text-sm font-medium transition-colors shadow-sm"
              >
                <Printer className="w-4 h-4" /> In Hàng Loạt Tất Cả
              </button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            {loading ? (
              <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
            ) : activeTab === 'all' ? (
              <table className="w-full text-sm whitespace-nowrap">
                <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                  <tr className="text-left text-slate-500 border-b border-slate-200">
                    <th className="p-3 font-medium">STT</th>
                    <th className="p-3 font-medium">Họ tên</th>
                    <th className="p-3 font-medium">CCCD</th>
                    <th className="p-3 font-medium">Hạng</th>
                    <th className="p-3 font-medium">Ghi chú</th>
                    <th className="p-3 font-medium text-right">Thành tiền</th>
                    <th className="p-3 font-medium">Giáo viên</th>
                    <th className="p-3 font-medium text-center">Trạng thái QR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.map((s, i) => (
                    <tr key={s.CCCD || i} className="hover:bg-slate-50">
                      <td className="p-3 text-slate-600">{s.STT}</td>
                      <td className="p-3 font-medium text-slate-800">{s.HoTen}</td>
                      <td className="p-3 font-medium">{s.CCCD}</td>
                      <td className="p-3"><span className="bg-slate-100 px-2 py-0.5 rounded text-xs font-bold text-slate-700">{s.Hang}</span></td>
                      <td className="p-3 text-slate-600 max-w-[150px] truncate" title={s.GhiChu}>{s.GhiChu}</td>
                      <td className="p-3 text-right text-emerald-600 font-medium">{s.ThanhTien}</td>
                      <td className="p-3 text-slate-600">{s.GiaoVien}</td>
                      <td className="p-3 text-center">
                        {s.MaQR ? (
                          s.MaQR.includes(s.CCCD) ? (
                            <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-xs font-semibold flex items-center justify-center gap-1 w-fit mx-auto cursor-help" title={s.MaQR}>
                              <Check className="w-3 h-3" /> Hợp lệ (Khớp CCCD)
                            </span>
                          ) : (
                            <span className="bg-red-100 text-red-800 px-2 py-0.5 rounded text-xs font-semibold flex items-center justify-center gap-1 w-fit mx-auto cursor-help" title={s.MaQR}>
                              Sai CCCD
                            </span>
                          )
                        ) : (
                          <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-xs font-semibold">Chưa có QR</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filteredStudents.length === 0 && (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-500">Chưa có dữ liệu. Hãy nạp file Excel.</td>
                    </tr>
                  )}
                </tbody>
              </table>

            ) : (
              <div className="p-4 space-y-4">
                {Object.entries(filteredStudents.reduce((acc: any, curr) => {
                  const gv = curr.GiaoVien || "Khác";
                  if (!acc[gv]) acc[gv] = [];
                  acc[gv].push(curr);
                  return acc;
                }, {})).map(([gv, list]: [string, any]) => (
                  <div key={gv} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-lg hover:border-blue-300 transition-colors">
                    <div>
                      <h3 className="font-bold text-slate-800 text-base">{gv}</h3>
                      <p className="text-slate-500 text-sm mt-1">Sĩ số: <span className="font-semibold text-blue-600">{list.length}</span> học viên</p>
                    </div>
                    <button 
                      onClick={() => printPDF(gv, true)}
                      className="flex items-center gap-2 bg-white border border-slate-300 text-slate-700 hover:text-blue-700 hover:border-blue-400 hover:bg-blue-50 px-4 py-2 rounded-md font-medium transition-all"
                    >
                      <Printer className="w-4 h-4" /> In PDF
                    </button>
                  </div>
                ))}
                {filteredStudents.length === 0 && (
                  <div className="p-8 text-center text-slate-500">Chưa có dữ liệu. Hãy nạp file Excel.</div>
                )}
              </div>
            )}
          </div>
        </CardContent>

      </Card>
    </div>
  );
}
