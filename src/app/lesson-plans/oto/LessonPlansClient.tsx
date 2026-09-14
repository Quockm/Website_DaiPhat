"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Upload, Printer, Download, Search, Loader2, Eye, Calendar, Clock } from "lucide-react";

type Props = {
  courses: { MaKhoa: string, Hang: string }[];
}

import { getStudents, getAppKhoaInfo } from "@/actions/students";

export default function LessonPlansClient({ courses }: Props) {
  const [selectedCourse, setSelectedCourse] = useState("");
  const [category, setCategory] = useState("ALL");
  const [students, setStudents] = useState<any[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  
  // Stages Dates
  const [c1BD, setC1BD] = useState("");
  const [c1KT, setC1KT] = useState("");
  const [c1Ngay, setC1Ngay] = useState("0");
  
  const [c2BD, setC2BD] = useState("");
  const [c2KT, setC2KT] = useState("");
  const [c2Ngay, setC2Ngay] = useState("0");
  
  const [c3BD, setC3BD] = useState("");
  const [c3KT, setC3KT] = useState("");
  const [c3Ngay, setC3Ngay] = useState("0");

  const [wordTemplate, setWordTemplate] = useState("");
  const [excelTemplate, setExcelTemplate] = useState("");
  
  // Dat records mapping: idx -> datData
  const [datRecords, setDatRecords] = useState<Record<number, any>>({});
  const [uploadingStatus, setUploadingStatus] = useState<Record<number, string>>({});

  let filteredCourses = courses.filter(c => {
    if (category === 'ALL') return true;
    if (category === 'B' || category === 'B1' || category === 'B2' || category === 'B11') {
       return c.Hang.includes('B');
    }
    if (category === 'C1' || category === 'C') {
       return c.Hang.includes('C');
    }
    return c.Hang === category;
  });
  
  filteredCourses = [...filteredCourses].sort((a, b) => a.MaKhoa.localeCompare(b.MaKhoa));

  useEffect(() => {
    if (selectedCourse) {
      fetchStudents(selectedCourse);
      autoSelectTemplates(selectedCourse, category);
      fetchCourseDates(selectedCourse);
    } else {
      setStudents([]);
      setDatRecords({});
      setC1BD(""); setC1KT(""); setC2BD(""); setC2KT(""); setC3BD(""); setC3KT("");
    }
  }, [selectedCourse]);

  const fetchCourseDates = async (courseId: string) => {
    try {
      const info = await getAppKhoaInfo(courseId);
      if (info) {
        if (info.NgayKhaiGiang) setC1BD(info.NgayKhaiGiang.replace(/-/g, '/'));
        if (info.NgayBeGiang) setC3KT(info.NgayBeGiang.replace(/-/g, '/'));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const calculateDays = (start: string, end: string) => {
    if (!start || !end) return "";
    const parseDate = (dStr: string) => {
      const parts = dStr.split('/');
      if (parts.length === 3) {
        return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
      }
      return null;
    };
    const d1 = parseDate(start);
    const d2 = parseDate(end);
    if (d1 && d2 && !isNaN(d1.getTime()) && !isNaN(d2.getTime())) {
      const diffTime = d2.getTime() - d1.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return diffDays > 0 ? String(diffDays) : "0";
    }
    return "";
  };

  useEffect(() => {
    const days = calculateDays(c1BD, c1KT);
    if (days) setC1Ngay(days);
  }, [c1BD, c1KT]);

  useEffect(() => {
    const days = calculateDays(c2BD, c2KT);
    if (days) setC2Ngay(days);
  }, [c2BD, c2KT]);

  useEffect(() => {
    const days = calculateDays(c3BD, c3KT);
    if (days) setC3Ngay(days);
  }, [c3BD, c3KT]);

  const autoSelectTemplates = (course: string, cat: string) => {
    let hang = cat.toUpperCase();
    let wordTpl = "";
    let excelTpl = "";
    
    if (course.includes("C1") && !course.includes("C1-C")) {
      wordTpl = "GA C1 - 6hv.docx";
      excelTpl = "STD C1 - 6HV .xlsx";
    } else if (course.includes("B01") || course.includes("B1") || course.includes("STĐ")) {
      wordTpl = "GA B(STĐ).docx";
      excelTpl = "STD B (STĐ).xlsx";
    } else if (course.includes("B2") || course.includes("B")) {
      wordTpl = "GA B.docx";
      excelTpl = "STD B.xlsx";
    } else if (course.includes("C1-C") || course.includes("C")) {
      wordTpl = "GA C1-C.docx";
      excelTpl = "STD C1-C.xlsx";
    } else if (course.includes("A1")) {
      wordTpl = "GA A1m.docx";
      excelTpl = "SLL A1m.xlsx";
    } else if (course.includes("A")) {
      wordTpl = "GA Am.docx";
      excelTpl = "SLL Am.xlsx";
    }
    setWordTemplate(wordTpl);
    setExcelTemplate(excelTpl);
  };

  const fetchStudents = async (courseId: string) => {
    setLoadingStudents(true);
    try {
      const res = await getStudents(1, 1000, courseId, "", "");
      if (res.data) {
        setStudents(res.data);
      }
    } catch (err) {
      console.error(err);
    }
    setLoadingStudents(false);
  };

  const handleDatUpload = async (e: React.ChangeEvent<HTMLInputElement>, idx: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingStatus(prev => ({ ...prev, [idx]: 'processing' }));
    
    if (file.name.toLowerCase().endsWith('.csv')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        processCSVText(text, idx);
      };
      reader.readAsText(file, 'UTF-8');
    } else if (file.name.toLowerCase().endsWith('.pdf')) {
      if (!(window as any).pdfjsLib) {
        const script = document.createElement('script');
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js";
        script.onload = () => extractPDFText(file, idx);
        document.head.appendChild(script);
      } else {
        extractPDFText(file, idx);
      }
    }
  };

  const processCSVText = (text: string, idx: number) => {
    const lines = text.split(/\r?\n/);
    const sessions: any[] = [];
    let isDataRow = false;
    let dateCol = -1, autoCol = -1, nightCol = -1, durationCol = -1, kmCol = -1;

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();
        if (!line) continue;
        let cols: string[] = [];
        let inQuotes = false;
        let current = '';
        for (let char of line) {
            if (char === '"') inQuotes = !inQuotes;
            else if (char === ',' && !inQuotes) { cols.push(current.trim().replace(/^"|"$/g, '')); current = ''; }
            else current += char;
        }
        cols.push(current.trim().replace(/^"|"$/g, ''));

        if (!isDataRow) {
            let hText = line.toLowerCase();
            if (hText.includes('mã phiên') || hText.includes('ngày đào tạo')) {
                dateCol = cols.findIndex(c => c.toLowerCase().includes('ngày đào tạo') || c.toLowerCase().includes('bắt đầu'));
                autoCol = cols.findIndex(c => c.toLowerCase().includes('tự động'));
                nightCol = cols.findIndex(c => c.toLowerCase().includes('ban đêm'));
                durationCol = cols.findIndex(c => c.toLowerCase().includes('thời gian đào tạo'));
                kmCol = cols.findIndex(c => c.toLowerCase().includes('quãng đường') || c.toLowerCase().includes('km'));
                if (dateCol === -1) dateCol = 4; if (autoCol === -1) autoCol = 8; if (nightCol === -1) nightCol = 9; if (durationCol === -1) durationCol = 7; if (kmCol === -1) kmCol = 10;
                isDataRow = true;
            }
            continue;
        }
        
        if (cols.length <= dateCol || !cols[0].match(/^\d+$/)) continue;
        let dateMatch = cols[dateCol].match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
        if (!dateMatch) {
            for (let col of cols) {
                let m = col.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
                if (m) { dateMatch = m; break; }
            }
        }
        if (!dateMatch) continue;
        let year = parseInt(dateMatch[3]); if (year < 2020) continue;
        let dateObj = new Date(year, parseInt(dateMatch[2]) - 1, parseInt(dateMatch[1]));
        if (isNaN(dateObj.getTime())) continue;

        let isAuto = (cols[autoCol] ? cols[autoCol].toLowerCase() : "").match(/[1-9]/) !== null;
        let isNight = (cols[nightCol] ? cols[nightCol].toLowerCase() : "").match(/[1-9]/) !== null;
        let durMatch = (cols[durationCol] ? cols[durationCol].toLowerCase() : "").match(/(\d+)\s*giờ\s*(\d+)\s*phút/);
        let duration = durMatch ? `${durMatch[1].padStart(2, '0')}:${durMatch[2].padStart(2, '0')}` : "02:00";
        let kmMatch = (cols[kmCol] ? cols[kmCol].toLowerCase() : "").match(/(\d+(?:\.\d+)?)/);
        let km = kmMatch ? kmMatch[1] : "40.0";
        
        const dateStr = ("0" + dateObj.getDate()).slice(-2) + "/" + ("0" + (dateObj.getMonth() + 1)).slice(-2) + "/" + dateObj.getFullYear();
        
        sessions.push({
            dateObj, dateStr, duration, km,
            type: (isNight ? 'NIGHT' : (isAuto ? 'AUTO' : 'NORMAL')),
            timestamp: dateObj.getTime()
        });
    }

    if (sessions.length > 0) {
        finalizeDatData(sessions, idx);
    } else {
        setUploadingStatus(prev => ({ ...prev, [idx]: 'error' }));
    }
  };

  const extractPDFText = (file: File, idx: number) => {
    (window as any).pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
    let reader = new FileReader();
    reader.onload = function() {
        let typedarray = new Uint8Array(this.result as any);
        (window as any).pdfjsLib.getDocument(typedarray).promise.then(function(pdf: any) {
            let maxPages = pdf.numPages; let promises: any[] = [];
            for (let j = 1; j <= maxPages; j++) {
                promises.push(pdf.getPage(j).then((page: any) => page.getTextContent().then((text: any) => text.items.map((s: any) => s.str).join(' '))));
            }
            Promise.all(promises).then(function(texts) { processPDFText(texts.join(' '), idx); });
        }).catch(() => {
            setUploadingStatus(prev => ({ ...prev, [idx]: 'error' }));
        });
    };
    reader.readAsArrayBuffer(file);
  };

  const processPDFText = (text: string, idx: number) => {
    let sessions: any[] = [];
    let startIndex = text.toLowerCase().indexOf('quá trình đào tạo');
    if (startIndex === -1) startIndex = text.toLowerCase().indexOf('mã phiên');
    let dataText = startIndex !== -1 ? text.substring(startIndex) : text;
    let blockRegex = /(\d{1,2}\/\d{1,2}\/\d{4})[\s\S]*?(?:(\d+)\s*giờ\s*(\d+)\s*phút)[\s\S]*?(?:(\d+(?:\.\d+)?)\s*km)/g;
    let match;
    while ((match = blockRegex.exec(dataText)) !== null) {
        let dateStr = match[1]; let p = dateStr.split('/'); let year = parseInt(p[2]); if (year < 2020) continue;
        let d = new Date(year, parseInt(p[1]) - 1, parseInt(p[0]));
        let duration = `${match[2].padStart(2, '0')}:${match[3].padStart(2, '0')}`;
        
        const fDateStr = ("0" + d.getDate()).slice(-2) + "/" + ("0" + (d.getMonth() + 1)).slice(-2) + "/" + d.getFullYear();

        sessions.push({ dateObj: d, dateStr: fDateStr, duration: duration, km: match[4], type: 'NORMAL', timestamp: d.getTime() });
    }
    if (sessions.length === 0) {
        let dateRegex = /\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/g;
        while ((match = dateRegex.exec(dataText)) !== null) {
            let year = parseInt(match[3]); if (year < 2020) continue;
            let d = new Date(year, parseInt(match[2]) - 1, parseInt(match[1]));
            if (!isNaN(d.getTime())) {
                const fDateStr = ("0" + d.getDate()).slice(-2) + "/" + ("0" + (d.getMonth() + 1)).slice(-2) + "/" + d.getFullYear();
                sessions.push({ dateObj: d, dateStr: fDateStr, duration: "02:00", km: "40.0", type: 'NORMAL', timestamp: d.getTime() });
            }
        }
    }
    if (sessions.length > 0) finalizeDatData(sessions, idx);
    else setUploadingStatus(prev => ({ ...prev, [idx]: 'error' }));
  };

  const finalizeDatData = (sessions: any[], idx: number) => {
    sessions.sort((a, b) => a.timestamp - b.timestamp);
    let normals = sessions.filter(s => s.type === 'NORMAL'); 
    let nights = sessions.filter(s => s.type === 'NIGHT'); 
    let autos = sessions.filter(s => s.type === 'AUTO');
    
    if (normals.length === 0) normals = sessions; 
    
    let b7: any[] = [], b8: any[] = [], b9: any[] = [], b11: any[] = []; 
    let currentBucket = b7;
    
    for (let i = 0; i < normals.length; i++) {
        if (currentBucket === b7 && b7.length >= 5) currentBucket = b8;
        if (currentBucket === b8 && b8.length >= 5) currentBucket = b9;
        if (currentBucket === b9 && b9.length >= 5) currentBucket = b11;
        currentBucket.push(normals[i]);
    }
    
    if (b8.length === 0 && b7.length > 0) b8.push(b7[b7.length - 1]);
    if (b9.length === 0 && b8.length > 0) b9.push(b8[b8.length - 1]);
    if (b11.length === 0 && b9.length > 0) b11.push(b9[b9.length - 1]);
    
    setDatRecords(prev => ({
      ...prev,
      [idx]: {
        b7, b8, b9, b11,
        b10: [nights.length > 0 ? nights[0] : normals[0]],
        b12: [autos.length > 0 ? autos[0] : normals[normals.length - 1]]
      }
    }));
    
    setUploadingStatus(prev => ({ ...prev, [idx]: 'success' }));
  };

  // Export functions
  const [exportingWord, setExportingWord] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);

  const handleExportWord = async () => {
    if (!selectedCourse) return alert("Vui lòng chọn khóa học");
    if (!wordTemplate) return alert("Vui lòng chọn file mẫu Word");
    setExportingWord(true);
    try {
      const payload = {
        ma_khoa: selectedCourse,
        hang: category === "ALL" ? "B2" : category,
        template: wordTemplate,
        c1: { bd: c1BD, kt: c1KT, soNgay: c1Ngay },
        c2: { bd: c2BD, kt: c2KT, soNgay: c2Ngay },
        c3: { bd: c3BD, kt: c3KT, soNgay: c3Ngay },
        sl_hv: students.length,
        sl_xe: Math.ceil(students.length / 5) // approx
      };

      const res = await fetch("/api/export/docx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("Lỗi máy chủ");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `GiaoAn_${selectedCourse}.docx`;
      a.click();
    } catch (e) {
      alert("Lỗi xuất Word");
    }
    setExportingWord(false);
  };

  const handleExportExcel = async () => {
    if (!selectedCourse) return alert("Vui lòng chọn khóa học");
    if (!excelTemplate) return alert("Vui lòng chọn file mẫu Excel");
    if (students.length === 0) return alert("Khóa học không có học viên");
    setExportingExcel(true);
    try {
      const payload = {
        ma_khoa: selectedCourse,
        template: excelTemplate,
        students,
        datRecords
      };

      const res = await fetch("/api/export/xlsx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("Lỗi máy chủ");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `SoTheoDoi_${selectedCourse}.xlsx`;
      a.click();
    } catch (e) {
      alert("Lỗi xuất Excel");
    }
    setExportingExcel(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Tự động hóa: Giáo án & Sổ theo dõi</h1>
          <p className="text-slate-600 mt-2 text-base font-medium">Xuất biểu mẫu Báo cáo, Giáo án Word và Sổ thực hành Excel tự động.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="bg-white shadow-sm border-slate-200">
          <CardHeader className="bg-slate-50/80 border-b border-slate-100 py-4">
            <CardTitle className="text-sm font-bold text-slate-700 uppercase">1. Cấu hình Khóa học & Chặng</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Chọn Hạng Xe:</label>
                <select value={category} onChange={e => setCategory(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg font-semibold focus:ring-2 focus:ring-indigo-500">
                  <option value="ALL">-- Tất cả --</option>
                  <option value="B">Hạng B (B1, B2)</option>
                  <option value="B01">Hạng B01</option>
                  <option value="C1">Hạng C1</option>
                  <option value="C">Hạng C</option>
                  <option value="A1">Hạng A1</option>
                  <option value="A">Hạng A</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Chọn Khóa Học:</label>
                <select value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)} className="w-full px-3 py-2 border-2 border-indigo-500 rounded-lg font-bold text-indigo-700 focus:ring-2 focus:ring-indigo-500">
                  <option value="">-- Chọn khóa --</option>
                  {filteredCourses.map(c => <option key={c.MaKhoa} value={c.MaKhoa}>{c.MaKhoa}</option>)}
                </select>
              </div>
            </div>

            {/* Time mapping form */}
            <div className="mt-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="bg-indigo-100 p-1.5 rounded-md text-indigo-600">
                  <Calendar className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-bold text-slate-700 tracking-wide uppercase">Cấu hình Thời gian Giáo án</h4>
              </div>
              
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2.5 shadow-inner">
                {/* Header Row */}
                <div className="grid grid-cols-[110px_1fr_1fr_60px] sm:grid-cols-[130px_1fr_1fr_70px] gap-2 px-2 pb-1 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <div>Giai đoạn</div>
                  <div>Ngày Bắt Đầu</div>
                  <div>Ngày Kết Thúc</div>
                  <div className="text-center">Số Ngày</div>
                </div>
                
                {/* Row 1 */}
                <div className="grid grid-cols-[110px_1fr_1fr_60px] sm:grid-cols-[130px_1fr_1fr_70px] gap-2 items-center bg-white p-2 rounded-lg border border-slate-200 shadow-sm transition-all hover:border-indigo-300">
                  <div className="font-bold text-slate-700 text-xs sm:text-sm pl-1 flex items-center gap-1.5">
                    <div className="w-1.5 h-4 bg-blue-500 rounded-full"></div>
                    1. Lý thuyết
                  </div>
                  <input type="text" placeholder="dd/MM/yyyy" value={c1BD} onChange={e => setC1BD(e.target.value)} className="w-full px-2 py-1.5 text-xs sm:text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none transition-shadow" />
                  <input type="text" placeholder="dd/MM/yyyy" value={c1KT} onChange={e => setC1KT(e.target.value)} className="w-full px-2 py-1.5 text-xs sm:text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none transition-shadow" />
                  <input type="text" placeholder="Số" value={c1Ngay} onChange={e => setC1Ngay(e.target.value)} className="w-full px-2 py-1.5 text-xs sm:text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-center font-bold text-slate-700" title="Số ngày" />
                </div>
                
                {/* Row 2 */}
                <div className="grid grid-cols-[110px_1fr_1fr_60px] sm:grid-cols-[130px_1fr_1fr_70px] gap-2 items-center bg-white p-2 rounded-lg border border-slate-200 shadow-sm transition-all hover:border-indigo-300">
                  <div className="font-bold text-slate-700 text-xs sm:text-sm pl-1 flex items-center gap-1.5">
                    <div className="w-1.5 h-4 bg-amber-500 rounded-full"></div>
                    2. Sa hình
                  </div>
                  <input type="text" placeholder="dd/MM/yyyy" value={c2BD} onChange={e => setC2BD(e.target.value)} className="w-full px-2 py-1.5 text-xs sm:text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-amber-500 outline-none transition-shadow" />
                  <input type="text" placeholder="dd/MM/yyyy" value={c2KT} onChange={e => setC2KT(e.target.value)} className="w-full px-2 py-1.5 text-xs sm:text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-amber-500 outline-none transition-shadow" />
                  <input type="text" placeholder="Số" value={c2Ngay} onChange={e => setC2Ngay(e.target.value)} className="w-full px-2 py-1.5 text-xs sm:text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-amber-500 outline-none text-center font-bold text-slate-700" />
                </div>
                
                {/* Row 3 */}
                <div className="grid grid-cols-[110px_1fr_1fr_60px] sm:grid-cols-[130px_1fr_1fr_70px] gap-2 items-center bg-white p-2 rounded-lg border border-slate-200 shadow-sm transition-all hover:border-indigo-300">
                  <div className="font-bold text-slate-700 text-xs sm:text-sm pl-1 flex items-center gap-1.5">
                    <div className="w-1.5 h-4 bg-green-500 rounded-full"></div>
                    3. Đường (DAT)
                  </div>
                  <input type="text" placeholder="dd/MM/yyyy" value={c3BD} onChange={e => setC3BD(e.target.value)} className="w-full px-2 py-1.5 text-xs sm:text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-green-500 outline-none transition-shadow" />
                  <input type="text" placeholder="dd/MM/yyyy" value={c3KT} onChange={e => setC3KT(e.target.value)} className="w-full px-2 py-1.5 text-xs sm:text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-green-500 outline-none transition-shadow" />
                  <input type="text" placeholder="Số" value={c3Ngay} onChange={e => setC3Ngay(e.target.value)} className="w-full px-2 py-1.5 text-xs sm:text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-green-500 outline-none text-center font-bold text-slate-700" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm border-slate-200">
          <CardHeader className="bg-slate-50/80 border-b border-slate-100 py-4">
            <CardTitle className="text-sm font-bold text-slate-700 uppercase">2. File mẫu & Xuất File</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Giáo án Lý thuyết & Thực hành (.DOCX):</label>
              <div className="flex gap-2">
                <select value={wordTemplate} onChange={e => setWordTemplate(e.target.value)} className="flex-1 px-3 py-2 bg-amber-50 border border-amber-300 text-amber-900 rounded-lg font-semibold text-sm">
                  <option value="">-- Chọn mẫu Word --</option>
                  <option value="GA B(STĐ).docx">Giáo án B (Số sàn).docx</option>
                  <option value="GA B.docx">Giáo án B.docx</option>
                  <option value="GA C1-C.docx">Giáo án C1-C.docx</option>
                  <option value="GA B-C.docx">Giáo án B-C.docx</option>
                  <option value="GA C1 - 6hv.docx">Giáo án C1 - 6hv.docx</option>
                  <option value="GA C1 - 7hv.docx">Giáo án C1 - 7hv.docx</option>
                  <option value="GA A1m.docx">Giáo án A1m.docx</option>
                  <option value="GA Am.docx">Giáo án Am.docx</option>
                </select>
                <button disabled={exportingWord} onClick={handleExportWord} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 shadow-sm transition-colors text-sm disabled:opacity-50 min-w-32 justify-center">
                  {exportingWord ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />} {exportingWord ? "Đang xử lý" : "Xuất Word"}
                </button>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Sổ Theo Dõi Thực Hành (.XLSX):</label>
              <div className="flex gap-2">
                <select value={excelTemplate} onChange={e => setExcelTemplate(e.target.value)} className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 text-slate-700 rounded-lg font-semibold text-sm">
                  <option value="">-- Chọn mẫu Excel --</option>
                  <option value="STD B (STĐ).xlsx">SỔ THEO DÕI B (SỐ SÀN).xlsx</option>
                  <option value="STD B.xlsx">SỔ THEO DÕI B.xlsx</option>
                  <option value="STD C1-C.xlsx">SỔ THEO DÕI C1-C.xlsx</option>
                  <option value="STD B-C.xlsx">SỔ THEO DÕI B-C.xlsx</option>
                  <option value="STD C1 - 6HV .xlsx">SỔ THEO DÕI C1 - 6HV.xlsx</option>
                  <option value="STD C1 - 7HV.xlsx">SỔ THEO DÕI C1 - 7HV.xlsx</option>
                  <option value="SLL A1m.xlsx">SLL A1m.xlsx</option>
                  <option value="SLL Am.xlsx">SLL Am.xlsx</option>
                </select>
                <button disabled={exportingExcel} onClick={handleExportExcel} className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 shadow-sm transition-colors text-sm disabled:opacity-50 min-w-32 justify-center">
                  {exportingExcel ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />} {exportingExcel ? "Đang nén ZIP" : "Xuất Excel"}
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white shadow-md border-slate-200 overflow-hidden flex flex-col min-h-[400px]">
        <CardHeader className="bg-slate-50/80 border-b border-slate-100 py-3 flex flex-row justify-between items-center shrink-0">
          <div>
            <CardTitle className="text-sm font-bold text-slate-700 uppercase">3. Dữ liệu DAT & Danh sách Học viên</CardTitle>
            <p className="text-xs text-slate-500 mt-1">Tải lên file báo cáo DAT (PDF/CSV) để hệ thống tự nội suy giờ học cho từng học viên.</p>
          </div>
        </CardHeader>
        <CardContent className="p-0 flex-1 overflow-auto custom-scrollbar relative">
          {loadingStudents ? (
             <div className="absolute inset-0 flex items-center justify-center bg-white/50 z-10">
               <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
             </div>
          ) : null}
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-extrabold uppercase text-xs border-b border-slate-200 sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="px-6 py-3 w-16 text-center">STT</th>
                <th className="px-6 py-3">Họ Tên Học Viên</th>
                <th className="px-6 py-3">CCCD</th>
                <th className="px-6 py-3 text-center">Trạng thái DAT</th>
                <th className="px-6 py-3 text-center">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {students.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-12 text-slate-400 font-medium italic">{selectedCourse ? "Khóa này không có học viên" : "Vui lòng chọn khóa học ở phần cấu hình bên trên để hiển thị."}</td></tr>
              ) : (
                students.map((hv, idx) => {
                  const status = uploadingStatus[idx];
                  return (
                    <tr key={hv.ID || idx} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-3 text-center font-semibold">{idx + 1}</td>
                      <td className="px-6 py-3 font-bold text-slate-800">{hv.HoTen}</td>
                      <td className="px-6 py-3">{hv.CCCD}</td>
                      <td className="px-6 py-3 text-center">
                        {status === 'processing' && <span className="text-amber-500 font-semibold text-xs flex items-center justify-center gap-1"><Loader2 className="w-3 h-3 animate-spin"/> Xử lý...</span>}
                        {status === 'success' && <span className="text-green-600 font-bold text-xs flex items-center justify-center gap-1">✅ Phân tích xong</span>}
                        {status === 'error' && <span className="text-red-600 font-bold text-xs">❌ Lỗi</span>}
                        {!status && <span className="text-slate-400 font-medium text-xs">⚪ Chưa upload</span>}
                      </td>
                      <td className="px-6 py-3 text-center">
                         <div className="flex items-center justify-center gap-2">
                           <input type="file" id={`dat_file_${idx}`} className="hidden" accept=".csv, .pdf" onChange={(e) => handleDatUpload(e, idx)} />
                           <button onClick={() => document.getElementById(`dat_file_${idx}`)?.click()} className="px-3 py-1.5 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded transition-colors flex items-center gap-1">
                             <Upload className="w-3 h-3" /> Tải File
                           </button>
                           {status === 'success' && (
                              <button className="px-3 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded transition-colors flex items-center gap-1" title="Đã lưu dữ liệu">
                                <Eye className="w-3 h-3" /> OK
                              </button>
                           )}
                         </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
