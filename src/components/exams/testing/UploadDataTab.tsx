"use client";

import React, { useRef, useState, useEffect } from "react";
import { Upload, FileSpreadsheet, FileCode2, FileText, RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getExamSchedules } from "@/actions/exam-schedules.actions";
import { addTestingStudents, updateSbdNdsh, updateQrCodes, updateStudentXmlData, updateSTTData } from "@/actions/testing/students.actions";
import * as XLSX from "xlsx";
import JSZip from "jszip";
import jsQR from "jsqr";

export function UploadDataTab() {
  const [schedules, setSchedules] = useState<any[]>([]);
  const [selectedScheduleId, setSelectedScheduleId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [sbdLoading, setSbdLoading] = useState(false);
  const [qrLoading, setQrLoading] = useState<string>("");
  const [xmlLoading, setXmlLoading] = useState(false);
  const [xmlFiles, setXmlFiles] = useState<File[]>([]);
  
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imageLoading, setImageLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const sbdInputRef = useRef<HTMLInputElement>(null);
  const sttInputRef = useRef<HTMLInputElement>(null);
  const [sttLoading, setSttLoading] = useState(false);
  const qrHinhRef = useRef<HTMLInputElement>(null);
  const qrDuongRef = useRef<HTMLInputElement>(null);
  const qrGplxRef = useRef<HTMLInputElement>(null);
  const xmlInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getExamSchedules('SH').then(res => {
      if (res.success && res.data) setSchedules(res.data);
    });
  }, []);

  const getSelectedExamDate = () => {
    return schedules.find(s => s.id.toString() === selectedScheduleId)?.exam_date || "";
  };

  const processFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedDate = getSelectedExamDate();
    if (!selectedDate) {
      alert("Vui lòng chọn Lịch thi Sát Hạch trước khi upload!");
      if (e.target) e.target.value = '';
      return;
    }
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      let worksheetName = workbook.SheetNames[0];
      const lowerFileName = file.name.toLowerCase();
      let centerNameFromFileName = "";
      
      let customSheetName = "";
      if (lowerFileName.includes("đại phát") || lowerFileName.includes("dai phat")) {
        centerNameFromFileName = "Đại Phát";
        const customSheet = workbook.SheetNames.find(n => n.toLowerCase().includes("đại phát") || n.toLowerCase().includes("dai phat"));
        if (customSheet) customSheetName = customSheet;
      } else if (lowerFileName.includes("tiến thành") || lowerFileName.includes("tien thanh")) {
        centerNameFromFileName = "Tiến Thành";
        const customSheet = workbook.SheetNames.find(n => n.toLowerCase().includes("tiến thành") || n.toLowerCase().includes("tien thanh"));
        if (customSheet) customSheetName = customSheet;
      }

      const sheet1Map = new Map<string, any>();
      
      // Parse Sheet1 (Main data with ma_dk, cccd, etc)
      if (workbook.SheetNames.includes("Sheet1") || workbook.SheetNames.length > 0) {
        const mainSheetName = workbook.SheetNames.includes("Sheet1") ? "Sheet1" : workbook.SheetNames[0];
        const mainSheet = workbook.Sheets[mainSheetName];
        const mainData = XLSX.utils.sheet_to_json(mainSheet, { header: 1, raw: false, defval: "" });
        
        let headerRowIndex = 0;
        for (let i=0; i<Math.min(10, mainData.length); i++) {
          const row = mainData[i] as any[];
          if (row.some(cell => typeof cell === 'string' && (cell.toLowerCase().includes('cccd') || cell.toLowerCase().includes('cmnd') || cell.toLowerCase().includes('chứng minh')))) {
            headerRowIndex = i;
            break;
          }
        }

        const headers = (mainData[headerRowIndex] as any[]).map(h => typeof h === 'string' ? h.toLowerCase() : '');
        const cccdIdx = headers.findIndex(h => h.includes('cccd') || h.includes('cmnd') || h.includes('chứng minh'));
        const sbdIdx = headers.findIndex(h => h.includes('sbd') || h.includes('báo danh'));
        const nameIdx = headers.findIndex(h => h.includes('họ và tên') || h.includes('họ tên'));
        const dobIdx = headers.findIndex(h => h.includes('ngày sinh'));
        const hangIdx = headers.findIndex(h => h.includes('hạng'));
        const schoolIdx = headers.findIndex(h => h.includes('cơ sở') || h.includes('trường'));
        const madkIdx = headers.findIndex(h => h.includes('mã đăng ký') || h.includes('mã đk'));
        const ndshIdx = headers.findIndex(h => h.includes('nội dung') || h.includes('ndsh'));
        const gvIdx = headers.findIndex(h => h.includes('giáo viên') || h.includes('gv'));
        
        if (cccdIdx !== -1) {
          for (let i = headerRowIndex + 1; i < mainData.length; i++) {
            const row = mainData[i] as any[];
            if (!row || row.length === 0 || !row[cccdIdx]) continue;
            const cccd = String(row[cccdIdx]).trim();
            sheet1Map.set(cccd, {
              cccd,
              stt: String(i - headerRowIndex),
              sbd: sbdIdx !== -1 ? String(row[sbdIdx] || '').trim() : '',
              name: nameIdx !== -1 ? String(row[nameIdx] || '').trim() : '',
              dob: dobIdx !== -1 ? String(row[dobIdx] || '').trim() : '',
              hang: hangIdx !== -1 ? String(row[hangIdx] || '').trim() : '',
              school: centerNameFromFileName || (schoolIdx !== -1 ? String(row[schoolIdx] || '').trim() : ''),
              ma_dk: madkIdx !== -1 ? String(row[madkIdx] || '').trim() : '',
              ndsh: ndshIdx !== -1 ? String(row[ndshIdx] || '').trim() : '',
              gv: gvIdx !== -1 ? String(row[gvIdx] || '').trim() : '',
              exam_date: selectedDate,
            });
          }
        }
      }

      const parsedStudentsMap = new Map<string, any>();

      // Parse Custom Sheet (Tiến Thành / Đại Phát) to override SBD and other details
      if (customSheetName && customSheetName !== "Sheet1") {
        const customSheet = workbook.Sheets[customSheetName];
        const customData = XLSX.utils.sheet_to_json(customSheet, { header: 1, raw: false, defval: "" });
        
        let headerRowIndex = 0;
        for (let i=0; i<Math.min(10, customData.length); i++) {
          const row = customData[i] as any[];
          if (row.some(cell => typeof cell === 'string' && (cell.toLowerCase().includes('cccd') || cell.toLowerCase().includes('cmnd') || cell.toLowerCase().includes('chứng minh') || cell.toLowerCase().includes('số cc')))) {
            headerRowIndex = i;
            break;
          }
        }

        const headers = (customData[headerRowIndex] as any[]).map(h => typeof h === 'string' ? h.toLowerCase() : '');
        const cccdIdx = headers.findIndex(h => h.includes('cccd') || h.includes('cmnd') || h.includes('chứng minh') || h.includes('số cc'));
        const sbdIdx = headers.findIndex(h => h.includes('sbd') || h.includes('báo danh'));
        const ndshIdx = headers.findIndex(h => h.includes('nội dung') || h.includes('ndsh'));
        const nameIdx = headers.findIndex(h => h.includes('họ và tên') || h.includes('họ tên'));
        const dobIdx = headers.findIndex(h => h.includes('ngày sinh'));
        const hangIdx = headers.findIndex(h => h.includes('hạng'));

        if (cccdIdx !== -1) {
          for (let i = headerRowIndex + 1; i < customData.length; i++) {
            const row = customData[i] as any[];
            if (!row || row.length === 0 || !row[cccdIdx]) continue;
            const cccd = String(row[cccdIdx]).trim();
            const sbd = sbdIdx !== -1 ? String(row[sbdIdx] || '').trim() : '';
            const ndsh = ndshIdx !== -1 ? String(row[ndshIdx] || '').trim() : '';
            const name = nameIdx !== -1 ? String(row[nameIdx] || '').trim() : '';
            const dob = dobIdx !== -1 ? String(row[dobIdx] || '').trim() : '';
            const hang = hangIdx !== -1 ? String(row[hangIdx] || '').trim() : '';

            const s1 = sheet1Map.get(cccd);

            parsedStudentsMap.set(cccd, {
              cccd,
              stt: String(i - headerRowIndex),
              sbd: sbd || (s1?.sbd || ''),
              name: name || (s1?.name || ''),
              dob: dob || (s1?.dob || ''),
              hang: hang || (s1?.hang || ''),
              school: centerNameFromFileName || (s1?.school || ''),
              ma_dk: s1?.ma_dk || '',
              ndsh: ndsh || (s1?.ndsh || ''),
              gv: s1?.gv || '',
              exam_date: selectedDate,
            });
          }
        }
      } else {
        // Fallback to Sheet1 if no custom sheet
        for (const [k, v] of sheet1Map.entries()) {
          parsedStudentsMap.set(k, v);
        }
      }

      const parsedStudents = Array.from(parsedStudentsMap.values());

      const res = await addTestingStudents(parsedStudents);
      if (res.success) {
        alert("Upload thành công! " + res.message);
      } else {
        alert("Có lỗi xảy ra: " + res.error);
      }
    } catch (error: any) {
      alert("Lỗi đọc file: " + error.message);
    } finally {
      setLoading(false);
      if (e.target) e.target.value = '';
    }
  };

  const processSbdFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    // Reuse processFile since addTestingStudents now handles both insert and update for all fields
    await processFile(e);
  };

  const processSTTFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setSttLoading(true);
    const sttDataList: { cccd: string, stt: string }[] = [];

    try {
      for (let f = 0; f < files.length; f++) {
        const file = files[f];
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });

        let headerRowIndex = -1;
        for (let i = 0; i < Math.min(20, rows.length); i++) {
          const row = rows[i] as any[];
          if (row.some(cell => typeof cell === 'string' && (cell.toLowerCase().includes('định danh') || cell.toLowerCase().includes('cccd') || cell.toLowerCase().includes('cmnd')))) {
            headerRowIndex = i;
            break;
          }
        }

        if (headerRowIndex === -1) {
          console.warn(`Bỏ qua file ${file.name}: Không tìm thấy tiêu đề CCCD`);
          continue;
        }

        const headers = (rows[headerRowIndex] as any[]).map(h => typeof h === 'string' ? h.toLowerCase() : '');
        const sttIdx = headers.findIndex(h => h === 'stt' || h.includes('thứ tự'));
        const cccdIdx = headers.findIndex(h => h.includes('định danh') || h.includes('cccd') || h.includes('cmnd'));

        if (sttIdx === -1 || cccdIdx === -1) {
          console.warn(`Bỏ qua file ${file.name}: Không tìm thấy cột STT hoặc CCCD`);
          continue;
        }

        for (let i = headerRowIndex + 1; i < rows.length; i++) {
          const row = rows[i] as any[];
          if (!row || row.length === 0) continue;
          const cccd = String(row[cccdIdx]).trim();
          const stt = String(row[sttIdx]).trim();
          
          if (cccd && stt) {
            sttDataList.push({ cccd, stt });
          }
        }
      }

      if (sttDataList.length === 0) {
        alert("Không tìm thấy dữ liệu STT nào hợp lệ trong các file đã chọn.");
        return;
      }

      const res = await updateSTTData(sttDataList);
      if (res.success) {
        alert("Upload Mẫu 6 (STT) thành công! " + res.message);
      } else {
        alert("Có lỗi xảy ra: " + res.error);
      }
    } catch (error: any) {
      alert("Lỗi đọc file STT: " + error.message);
    } finally {
      setSttLoading(false);
      if (e.target) e.target.value = '';
    }
  };

  const processDocxFile = async (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
    const selectedDate = getSelectedExamDate();
    if (!selectedDate) {
      alert("Vui lòng chọn Lịch thi Sát Hạch!");
      if (e.target) e.target.value = '';
      return;
    }
    const file = e.target.files?.[0];
    if (!file) return;

    setQrLoading(type);
    try {
      const data = await file.arrayBuffer();
      const zip = await JSZip.loadAsync(data);
      
      const imageFiles = Object.keys(zip.files).filter(name => 
        (name.startsWith("word/media/") || name.startsWith("media/")) && (name.endsWith(".png") || name.endsWith(".jpeg") || name.endsWith(".jpg"))
      );
      
      // Sort images by name to maintain order (e.g., image1.png, image2.png)
      imageFiles.sort((a, b) => {
        const numA = parseInt(a.split('/').pop()?.replace(/[^0-9]/g, '') || '0') || 0;
        const numB = parseInt(b.split('/').pop()?.replace(/[^0-9]/g, '') || '0') || 0;
        return numA - numB;
      });

      let cccds: string[] = [];
      try {
        const docXml = await zip.files['word/document.xml'].async('string');
        const plainText = docXml.replace(/<[^>]+>/g, ' ');
        const cccdRegex = /(?:CCCD|CMND|số cc)\s*:?\s*(\d{9,12})/gi;
        let match;
        while ((match = cccdRegex.exec(plainText)) !== null) {
          cccds.push(match[1]);
        }
      } catch (e) {
        console.warn("Lỗi đọc CCCD từ document.xml", e);
      }

      const qrDataList: {cccd: string, qr_data: string}[] = [];
      let qrIndex = 0; // Tracks which CCCD to map the NEXT valid QR code to
      
      for (let i = 0; i < imageFiles.length; i++) {
        const imgName = imageFiles[i];
        const blob = await zip.files[imgName].async("blob");
        const url = URL.createObjectURL(blob);
        const img = new Image();
        img.src = url;
        await new Promise(resolve => { img.onload = resolve; });
        
        let qrData = "";
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          if (code) {
            qrData = code.data;
          }
        }
        URL.revokeObjectURL(url);

        if (qrData && qrIndex < cccds.length) {
          qrDataList.push({ cccd: cccds[qrIndex], qr_data: qrData });
          qrIndex++;
        }
      }
      
      if (qrDataList.length === 0) {
         alert("Không trích xuất được mã QR hợp lệ hoặc không tìm thấy CCCD nào trong file Word!");
         setQrLoading("");
         if (e.target) e.target.value = '';
         return;
      }

      const res = await updateQrCodes(selectedDate, type, qrDataList);
      if (res.success) alert("Trích xuất QR thành công! " + res.message);
      else alert("Lỗi: " + res.error);
    } catch (error: any) {
      alert("Lỗi đọc file Word: " + error.message);
    } finally {
      setQrLoading("");
      if (e.target) e.target.value = '';
    }
  };

  const handleXmlFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setXmlFiles(Array.from(e.target.files));
    }
  };

  const processXmlFiles = async () => {
    if (xmlFiles.length === 0) return;
    setXmlLoading(true);
    
    try {
      const parsedData: any[] = [];
      
      for (const file of xmlFiles) {
        const text = await file.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, "text/xml");
        
        const cccd = doc.getElementsByTagName("SoCMT")[0]?.textContent || doc.getElementsByTagName("SoCMND")[0]?.textContent || "";
        const pet = doc.getElementsByTagName("SoGPLX")[0]?.textContent || doc.getElementsByTagName("PET")[0]?.textContent || "";
        
        if (cccd) {
          parsedData.push({ cccd, pet });
        }
      }
      
      const res = await updateStudentXmlData(parsedData);
      if (res.success) {
        alert("Upload XML thành công! " + res.message);
        setXmlFiles([]);
      } else {
        alert("Lỗi: " + res.error);
      }
    } catch (error: any) {
      alert("Lỗi xử lý file XML: " + error.message);
    } finally {
      setXmlLoading(false);
    }
  };

  const handleImageFolderSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImageFiles(Array.from(e.target.files).filter(f => f.type.startsWith('image/')));
    }
  };

  const processImageFiles = async () => {
    if (imageFiles.length === 0) return;
    setImageLoading(true);
    
    try {
      const chunkSize = 20;
      let hasError = false;
      let totalSaved = 0;
      let totalNotFound = 0;
      
      for (let i = 0; i < imageFiles.length; i += chunkSize) {
        const chunk = imageFiles.slice(i, i + chunkSize);
        const formData = new FormData();
        chunk.forEach(file => {
          formData.append('files', file);
        });
        
        const response = await fetch('/api/testing/upload-images', {
          method: 'POST',
          body: formData,
        });
        
        const result = await response.json();
        if (!result.success) {
          hasError = true;
          console.error("Lỗi chunk upload ảnh:", result.error);
        } else {
          totalSaved += result.savedCount || 0;
          totalNotFound += result.notFoundCount || 0;
        }
      }
      
      if (!hasError) {
        let msg = `Đã upload và xử lý xong ${imageFiles.length} file ảnh!`;
        if (totalSaved > 0) msg += `\n- Map thành công: ${totalSaved} học viên.`;
        if (totalNotFound > 0) msg += `\n- KHÔNG tìm thấy Mã ĐK: ${totalNotFound} file. (Vui lòng kiểm tra lại tên file đã đúng với Mã ĐK chưa)`;
        alert(msg);
        setImageFiles([]);
      } else {
        alert("Upload hoàn tất nhưng có một số file bị lỗi trong quá trình gửi. Vui lòng kiểm tra lại.");
      }
    } catch (error: any) {
      alert("Lỗi xử lý file ảnh: " + error.message);
    } finally {
      setImageLoading(false);
      if (imageInputRef.current) imageInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
          <Upload className="w-5 h-5" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">Upload Danh sách & File QR</h2>
        
        <div className="ml-auto flex items-center gap-3">
          <label className="text-sm font-bold text-slate-700">Chọn Lịch thi:</label>
          <select 
            className="h-10 px-3 py-2 rounded-md border border-slate-300 bg-white min-w-[200px]"
            value={selectedScheduleId}
            onChange={e => setSelectedScheduleId(e.target.value)}
          >
            <option value="">-- Chọn lịch thi SH --</option>
            {schedules.map(sc => (
              <option key={sc.id} value={sc.id.toString()}>
                {sc.title} ({sc.exam_date})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Dữ liệu Học viên (Excel) */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
          <div className="bg-emerald-50 border-b border-emerald-100 p-4 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-emerald-800">Dữ Liệu Học Viên (Excel)</h3>
          </div>
          <div className="p-5 space-y-4">
            <input type="file" accept=".xlsx,.xls" className="hidden" ref={fileInputRef} onChange={processFile} />
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-emerald-200 bg-emerald-50/50 rounded-xl p-8 text-center cursor-pointer hover:bg-emerald-50 transition-colors"
            >
              {loading ? (
                <RefreshCw className="w-8 h-8 text-emerald-400 mx-auto mb-3 animate-spin" />
              ) : (
                <Upload className="w-8 h-8 text-emerald-400 mx-auto mb-3" />
              )}
              <p className="text-slate-600 font-medium">{loading ? "Đang xử lý..." : "Kéo thả file Excel vào đây"}</p>
              {!loading && <p className="text-slate-400 text-sm mt-1">hoặc click để chọn file (.xlsx, .xls)</p>}
            </div>
            <Button disabled={loading} onClick={() => fileInputRef.current?.click()} className="w-full bg-emerald-600 hover:bg-emerald-700">
              {loading ? "Đang Tải lên..." : "Tải lên Danh Sách Gốc"}
            </Button>
            
            <div className="pt-4 border-t border-slate-100 grid grid-cols-2 gap-4">
              <div>
                <input type="file" accept=".xlsx,.xls" className="hidden" ref={sbdInputRef} onChange={processSbdFile} />
                <div 
                  onClick={() => sbdInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-200 bg-slate-50 rounded-xl p-4 text-center cursor-pointer hover:bg-slate-100 transition-colors flex flex-col items-center justify-center gap-2 h-full"
                >
                  {sbdLoading ? <RefreshCw className="w-5 h-5 text-slate-500 animate-spin" /> : null}
                  <p className="text-slate-600 text-sm font-medium">{sbdLoading ? "Đang xử lý..." : "Upload file SBD & NDSH"}</p>
                </div>
              </div>

              <div>
                <input type="file" accept=".xlsx,.xls" multiple className="hidden" ref={sttInputRef} onChange={processSTTFile} />
                <div 
                  onClick={() => sttInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-200 bg-slate-50 rounded-xl p-4 text-center cursor-pointer hover:bg-slate-100 transition-colors flex flex-col items-center justify-center gap-2 h-full"
                >
                  {sttLoading ? <RefreshCw className="w-5 h-5 text-slate-500 animate-spin" /> : null}
                  <p className="text-slate-600 text-sm font-medium">{sttLoading ? "Đang xử lý..." : "Upload Mẫu 6 (STT)"}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mã QR Thanh Toán (Word) */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
          <div className="bg-blue-50 border-b border-blue-100 p-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-blue-800">Mã QR Thanh Toán (Word)</h3>
          </div>
          <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { id: 'hinh', name: 'QR HÌNH', ref: qrHinhRef },
              { id: 'duong', name: 'QR ĐƯỜNG', ref: qrDuongRef },
              { id: 'gplx', name: 'QR GPLX', ref: qrGplxRef }
            ].map(type => (
              <div key={type.id} className="border border-slate-200 rounded-lg p-4 flex flex-col justify-between hover:border-blue-300 transition-colors">
                <input type="file" accept=".docx" className="hidden" ref={type.ref} onChange={(e) => processDocxFile(e, type.id)} />
                <div className="text-center mb-4">
                  <span className="inline-block px-2 py-1 bg-slate-100 text-slate-700 font-bold text-xs rounded mb-2">{type.name}</span>
                  <div 
                    onClick={() => type.ref.current?.click()}
                    className="border-2 border-dashed border-slate-200 rounded-lg p-3 py-6 bg-slate-50 cursor-pointer hover:bg-slate-100 flex items-center justify-center gap-2"
                  >
                    {qrLoading === type.id ? <RefreshCw className="w-4 h-4 text-slate-400 animate-spin" /> : null}
                    <p className="text-xs font-medium text-slate-500">{qrLoading === type.id ? "Đang xử lý..." : "Thả file .docx"}</p>
                  </div>
                </div>
                <Button disabled={qrLoading === type.id} onClick={() => type.ref.current?.click()} variant="outline" size="sm" className="w-full border-blue-200 text-blue-700 hover:bg-blue-50">
                  {qrLoading === type.id ? "Đang tải..." : "Trích xuất QR"}
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Dữ Liệu Học Viên (XML) */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden lg:col-span-2 hover:shadow-md transition-shadow">
          <div className="bg-amber-50 border-b border-amber-100 p-4 flex items-center gap-2">
            <FileCode2 className="w-5 h-5 text-amber-600" />
            <h3 className="font-bold text-amber-800">Dữ Liệu Học Viên (XML)</h3>
          </div>
          <div className="p-6 flex flex-col items-center justify-center">
             <input type="file" accept=".xml" multiple className="hidden" ref={xmlInputRef} onChange={handleXmlFileSelect} />
             <div 
               onClick={() => xmlInputRef.current?.click()}
               className="border-2 border-dashed border-amber-200 bg-amber-50/50 rounded-xl p-10 w-full max-w-2xl text-center cursor-pointer hover:bg-amber-50 transition-colors"
             >
                {xmlLoading ? (
                  <RefreshCw className="w-10 h-10 text-amber-400 mx-auto mb-4 animate-spin" />
                ) : (
                  <Upload className="w-10 h-10 text-amber-400 mx-auto mb-4" />
                )}
                <p className="text-slate-700 font-bold text-lg">{xmlLoading ? "Đang xử lý..." : "Kéo thả file XML hoặc click để chọn"}</p>
                {!xmlLoading && <p className="text-slate-500 text-sm mt-2">Hỗ trợ chọn nhiều file để tải lên cùng lúc (Gồm danh sách & Ảnh thẻ)</p>}
                
                {xmlFiles.length > 0 && (
                  <div className="mt-4 p-3 bg-white rounded-lg border border-amber-100 text-left">
                    <p className="text-sm font-bold text-amber-800">Đã chọn {xmlFiles.length} file:</p>
                    <div className="max-h-24 overflow-y-auto mt-2 space-y-1">
                      {xmlFiles.map((f, i) => (
                        <p key={i} className="text-xs text-slate-600 flex items-center gap-2"><FileCode2 className="w-3 h-3"/> {f.name}</p>
                      ))}
                    </div>
                  </div>
                )}
             </div>
             <div className="mt-6 flex gap-4">
               <Button disabled={xmlFiles.length === 0 || xmlLoading} onClick={() => setXmlFiles([])} variant="outline" className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700">
                 Xóa danh sách file
               </Button>
               <Button disabled={xmlFiles.length === 0 || xmlLoading} onClick={processXmlFiles} className="bg-amber-600 hover:bg-amber-700">
                 {xmlLoading ? "Đang lưu..." : "Lưu Dữ Liệu XML"}
               </Button>
             </div>
          </div>
        </div>

        {/* Thư mục Ảnh (JPG) */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden lg:col-span-2 hover:shadow-md transition-shadow">
          <div className="bg-emerald-50 border-b border-emerald-100 p-4 flex items-center gap-2">
            <Upload className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-emerald-800">Thư mục Hình Ảnh Học Viên (JPG)</h3>
          </div>
          <div className="p-6 flex flex-col items-center justify-center">
             {/* @ts-ignore: webkitdirectory is not in standard react types */}
             <input type="file" accept="image/*" multiple webkitdirectory="" directory="" className="hidden" ref={imageInputRef} onChange={handleImageFolderSelect} />
             <div 
               onClick={() => imageInputRef.current?.click()}
               className="border-2 border-dashed border-emerald-200 bg-emerald-50/50 rounded-xl p-10 w-full max-w-2xl text-center cursor-pointer hover:bg-emerald-50 transition-colors"
             >
                {imageLoading ? (
                  <RefreshCw className="w-10 h-10 text-emerald-400 mx-auto mb-4 animate-spin" />
                ) : (
                  <Upload className="w-10 h-10 text-emerald-400 mx-auto mb-4" />
                )}
                <p className="text-slate-700 font-bold text-lg">{imageLoading ? "Đang xử lý..." : "Chọn thư mục chứa ảnh học viên"}</p>
                {!imageLoading && <p className="text-slate-500 text-sm mt-2">Hệ thống sẽ tự động ghép ảnh theo Mã ĐK của học viên. Tên ảnh: [Mã ĐK].jpg</p>}
                
                {imageFiles.length > 0 && (
                  <div className="mt-4 p-3 bg-white rounded-lg border border-emerald-100 text-left">
                    <p className="text-sm font-bold text-emerald-800">Đã chọn {imageFiles.length} file ảnh</p>
                  </div>
                )}
             </div>
             <div className="mt-6 flex gap-4">
               <Button disabled={imageFiles.length === 0 || imageLoading} onClick={() => setImageFiles([])} variant="outline" className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700">
                 Hủy
               </Button>
               <Button disabled={imageFiles.length === 0 || imageLoading} onClick={processImageFiles} className="bg-emerald-600 hover:bg-emerald-700">
                 {imageLoading ? "Đang lưu..." : "Upload Thư Mục Ảnh"}
               </Button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
