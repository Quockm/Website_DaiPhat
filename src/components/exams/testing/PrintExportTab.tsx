"use client";

import React, { useState } from "react";
import { Printer, FileText, FileSpreadsheet, Settings, CloudUpload, CreditCard, LayoutTemplate } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { saveAs } from "file-saver";
import { getExamSchedules } from "@/actions/exam-schedules.actions";
import { getTestingStudents } from "@/actions/testing/students.actions";
import { useReactToPrint } from "react-to-print";
import { PrintBienBan, StudentPrintData } from "./PrintBienBan";

export function PrintExportTab() {
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("");
  
  const [schedules, setSchedules] = useState<any[]>([]);
  const [selectedScheduleId, setSelectedScheduleId] = useState<string>("");

  React.useEffect(() => {
    getExamSchedules('SH').then(res => {
      if (res.success && res.data && res.data.length > 0) {
        setSchedules(res.data);
        setSelectedScheduleId(res.data[0].id.toString());
      }
    });
  }, []);

  // Refs or states for Docs
  const [docsSttOrder, setDocsSttOrder] = useState(true);
  const [docsSingleVal, setDocsSingleVal] = useState("");
  const [docsSingleType, setDocsSingleType] = useState("stt");
  const [docsDay, setDocsDay] = useState("");
  const [docsMonth, setDocsMonth] = useState("");
  const [docsDonVi, setDocsDonVi] = useState("TRUNG TÂM GDNN ĐẠI PHÁT");
  const [docsTtsh, setDocsTtsh] = useState("TRUNG TÂM SÁT HẠCH LÁI XE HÓC MÔN");

  // Refs or states for Cards
  const [cardsSttOrder, setCardsSttOrder] = useState(true);
  const [cardsSingleVal, setCardsSingleVal] = useState("");
  const [cardsColor, setCardsColor] = useState("white");
  const [cardsDate, setCardsDate] = useState("");
  const [cardsDonVi, setCardsDonVi] = useState("TRUNG TÂM GDNN ĐẠI PHÁT");
  const [cardsTtsh, setCardsTtsh] = useState("TRUNG TÂM SÁT HẠCH LÁI XE HÓC MÔN");

  // GS Sync
  const [gsSttOrder, setGsSttOrder] = useState(true);

  // Hidden print reference
  const printRef = React.useRef<HTMLDivElement>(null);
  const [printStudents, setPrintStudents] = useState<StudentPrintData[]>([]);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: "BienBan_HocVien",
    onAfterPrint: () => {
      setIsExporting(false);
      setPrintStudents([]);
    }
  });

  const startExport = async (apiEndpoint: string, payload: any, defaultFilename: string) => {
    setIsExporting(true);
    setProgress(0);
    setStatusText("Đang xử lý dữ liệu...");

    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 90) return 90;
        return p + Math.random() * 15;
      });
    }, 500);

    try {
      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      clearInterval(interval);
      setProgress(100);

      if (!response.ok) {
        const err = await response.json();
        alert("Lỗi: " + (err.error || "Không xác định"));
        setIsExporting(false);
        return;
      }

      if (response.headers.get("Content-Type")?.includes("application/json")) {
        const data = await response.json();
        alert(data.message || "Thành công");
      } else {
        setStatusText("Đang tải file xuống...");
        const blob = await response.blob();

        const disposition = response.headers.get("Content-Disposition");
        let filename = defaultFilename;
        if (disposition && disposition.indexOf("attachment") !== -1) {
          const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
          const matches = filenameRegex.exec(disposition);
          if (matches != null && matches[1]) {
            filename = matches[1].replace(/['"]/g, "");
          }
        }
        saveAs(blob, filename);
      }
    } catch (e) {
      clearInterval(interval);
      alert("Lỗi kết nối");
    }

    setTimeout(() => setIsExporting(false), 500);
  };

  const handleExportDocs = async () => {
    setIsExporting(true);
    setStatusText("Đang chuẩn bị dữ liệu in...");
    setProgress(30);

    try {
      const res = await getTestingStudents(selectedScheduleId);
      if (!res.success || !res.data) {
        alert("Lỗi khi lấy dữ liệu học viên");
        setIsExporting(false);
        return;
      }
      setProgress(60);

      let students = res.data as any[];

      // Filter by don vi
      if (docsDonVi) {
        // Some records might have docsDonVi stored in 'don_vi' or 'school', but usually user uses TT from SBD or we just filter blindly?
        // Wait! The user says "khu vực chọn trung tâm thì sẽ tạo ra 1 file pdf sắp xếp theo TT để in". 
        // We can just filter students whose 'school' matches docsDonVi. But if school names are different, we can match loosely.
        students = students.filter(s => {
          const school = (s.school || "").toUpperCase();
          if (docsDonVi.includes("ĐẠI PHÁT") && school.includes("ĐẠI PHÁT")) return true;
          if (docsDonVi.includes("TIẾN THÀNH") && school.includes("TIẾN THÀNH")) return true;
          // Fallback if no school info but we want to print anyway?
          return docsDonVi === s.school || school.includes(docsDonVi.replace("TRUNG TÂM GDNN ", ""));
        });
      }

      if (docsSingleVal) {
        const val = docsSingleVal.trim().toLowerCase();
        if (docsSingleType === "stt") {
          students = students.filter(s => String(s.stt) === val);
        } else {
          students = students.filter(s => String(s.sbd).trim().toLowerCase() === val || String(s.cccd).trim().toLowerCase() === val);
        }
      }

      if (students.length === 0) {
        alert("Không có học viên nào thuộc Trung tâm này hoặc khớp điều kiện tìm kiếm!");
        setIsExporting(false);
        return;
      }

      // Sort
      if (docsSttOrder) {
        students.sort((a, b) => parseInt(a.stt || "999999", 10) - parseInt(b.stt || "999999", 10));
      } else {
        students.sort((a, b) => {
          const aSbd = parseInt(a.sbd || "999999", 10) || 999999;
          const bSbd = parseInt(b.sbd || "999999", 10) || 999999;
          return (aSbd % 1000) - (bSbd % 1000);
        });
      }

      setProgress(90);
      setPrintStudents(students);
      
      // Delay to let React render the hidden print element before calling window.print()
      setTimeout(() => {
        handlePrint();
      }, 500);

    } catch (e) {
      console.error(e);
      alert("Lỗi khi tạo dữ liệu in");
      setIsExporting(false);
    }
  };

  const handleExportCards = () => {
    if (!cardsDate) {
      alert("Vui lòng nhập ngày thi");
      return;
    }
    startExport(
      "/api/testing/export/cards",
      {
        stt_by_order: cardsSttOrder,
        single_val: cardsSingleVal,
        // Card uses same single_type logic mostly for CCCD/SBD fallback, we pass 'sbd' for convenience or match legacy
        single_type: "sbd", 
        exam_date: cardsDate,
        date_str: cardsDate,
        card_color: cardsColor,
        don_vi: cardsDonVi,
        tt_sh: cardsTtsh,
        scheduleId: selectedScheduleId,
      },
      "Cards.zip"
    );
  };

  const handleExportExcel = () => {
    startExport("/api/testing/export/xlsx-testing", { scheduleId: selectedScheduleId }, "DanhSachHocVien.xlsx");
  };

  const handleGsSync = () => {
    startExport("/api/testing/gs-sync", { stt_by_order: gsSttOrder, scheduleId: selectedScheduleId }, "Data_Sync.xlsx");
  };

  return (
    <div className="space-y-6 pb-20 relative">
      {/* OVERLAY TIẾN ĐỘ */}
      {isExporting && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/70 backdrop-blur-sm rounded-xl">
          <div className="bg-white p-6 rounded-xl shadow-xl border border-slate-200 w-full max-w-md text-center">
            <h3 className="font-bold text-lg text-slate-800 mb-4">{statusText}</h3>
            <div className="w-full bg-slate-200 rounded-full h-4 mb-2 overflow-hidden">
              <div 
                className="bg-blue-600 h-4 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="text-sm font-medium text-slate-500">{Math.round(progress)}%</p>
          </div>
        </div>
      )}

      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <div className="p-2 bg-pink-100 text-pink-600 rounded-lg">
              <Printer className="w-5 h-5" />
            </div>
            Xuất Hồ Sơ & Đồng Bộ
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <select 
            className="bg-white border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2 outline-none font-medium min-w-[200px]"
            value={selectedScheduleId}
            onChange={(e) => setSelectedScheduleId(e.target.value)}
          >
            {schedules.map(s => (
              <option key={s.id} value={s.id}>{s.title} ({s.exam_date})</option>
            ))}
          </select>
        </div>
      </div>
      <p className="text-slate-500 text-sm font-medium mt-1">Quản lý việc tạo biên bản và thẻ dự thi tự động cho học viên</p>
        <Button onClick={handleExportExcel} variant="outline" className="gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50">
          <FileSpreadsheet className="w-4 h-4" /> Xuất Excel Toàn Bộ Danh Sách
        </Button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* IN HỒ SƠ VÀ DANH SÁCH */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="bg-blue-50 border-b border-blue-100 p-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-blue-800">Tạo Hồ Sơ (Biên Bản)</h3>
          </div>
          <div className="p-5 flex flex-col gap-4 flex-1">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer p-3 bg-slate-50 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors">
              <input 
                type="checkbox" 
                checked={docsSttOrder}
                onChange={(e) => setDocsSttOrder(e.target.checked)}
                className="rounded border-slate-300 w-4 h-4 text-blue-600" 
              />
              Xếp STT theo thứ tự trong file (bỏ qua SBD)
            </label>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">In 1 học viên (Tùy chọn)</label>
                <Input 
                  value={docsSingleVal} 
                  onChange={(e) => setDocsSingleVal(e.target.value)} 
                  placeholder="Nhập mã..." 
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Loại mã tìm kiếm</label>
                <select 
                  value={docsSingleType} 
                  onChange={(e) => setDocsSingleType(e.target.value)}
                  className="w-full h-10 px-3 py-2 rounded-md border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="stt">Theo STT</option>
                  <option value="sbd">Theo SBD</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Ngày thi (Tùy chọn)</label>
                <Input 
                  value={docsDay} 
                  onChange={(e) => setDocsDay(e.target.value)} 
                  placeholder="VD: 20" 
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Tháng (Tùy chọn)</label>
                <Input 
                  value={docsMonth} 
                  onChange={(e) => setDocsMonth(e.target.value)} 
                  placeholder="VD: 07" 
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Đơn vị thi</label>
                <select 
                  value={docsDonVi} 
                  onChange={(e) => setDocsDonVi(e.target.value)}
                  className="w-full h-10 px-3 py-2 rounded-md border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="TRUNG TÂM GDNN TIẾN THÀNH">TRUNG TÂM GDNN TIẾN THÀNH</option>
                  <option value="TRUNG TÂM GDNN ĐẠI PHÁT">TRUNG TÂM GDNN ĐẠI PHÁT</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Trung tâm sát hạch</label>
                <Input 
                  value={docsTtsh} 
                  onChange={(e) => setDocsTtsh(e.target.value)} 
                  required 
                />
              </div>
            </div>

            <Button onClick={handleExportDocs} className="w-full bg-blue-600 hover:bg-blue-700 gap-2 mt-auto h-12 text-md font-bold">
              <Settings className="w-5 h-5" /> Tạo Hồ Sơ & Danh Sách
            </Button>
          </div>
        </div>

        {/* TẠO THẺ DỰ THI */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="bg-emerald-50 border-b border-emerald-100 p-4 flex items-center gap-2">
            <LayoutTemplate className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-emerald-800">Tạo Thẻ Dự Thi</h3>
          </div>
          <div className="p-5 flex flex-col gap-4 flex-1">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer p-3 bg-slate-50 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors">
              <input 
                type="checkbox" 
                checked={cardsSttOrder}
                onChange={(e) => setCardsSttOrder(e.target.checked)}
                className="rounded border-slate-300 w-4 h-4 text-emerald-600" 
              />
              Xếp STT theo thứ tự trong file (bỏ qua SBD)
            </label>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">In 1 học viên (Tùy chọn)</label>
              <Input 
                value={cardsSingleVal} 
                onChange={(e) => setCardsSingleVal(e.target.value)} 
                placeholder="Nhập CCCD hoặc SBD (Để trống nếu in tất cả)" 
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Màu nền tiêu đề thẻ</label>
                <select 
                  value={cardsColor} 
                  onChange={(e) => setCardsColor(e.target.value)}
                  className="w-full h-10 px-3 py-2 rounded-md border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="white">Trắng (Chữ đen)</option>
                  <option value="blue">Xanh dương (Chữ trắng)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Ngày thi</label>
                <Input 
                  value={cardsDate} 
                  onChange={(e) => setCardsDate(e.target.value)} 
                  placeholder="VD: 20/07/2026" 
                  required 
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Đơn vị thi</label>
                <select 
                  value={cardsDonVi} 
                  onChange={(e) => setCardsDonVi(e.target.value)}
                  className="w-full h-10 px-3 py-2 rounded-md border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="TRUNG TÂM GDNN TIẾN THÀNH">TRUNG TÂM GDNN TIẾN THÀNH</option>
                  <option value="TRUNG TÂM GDNN ĐẠI PHÁT">TRUNG TÂM GDNN ĐẠI PHÁT</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Trung tâm sát hạch</label>
                <Input 
                  value={cardsTtsh} 
                  onChange={(e) => setCardsTtsh(e.target.value)} 
                  required 
                />
              </div>
            </div>

            <Button onClick={handleExportCards} className="w-full bg-emerald-600 hover:bg-emerald-700 gap-2 mt-auto h-12 text-md font-bold">
              <CreditCard className="w-5 h-5" /> Tạo Thẻ (.zip)
            </Button>
          </div>
        </div>
      </div>

      {/* UPLOAD GOOGLE SHEETS */}
      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-orange-50 border-b border-orange-100 p-4 flex items-center gap-2">
            <CloudUpload className="w-5 h-5 text-orange-600" />
            <h3 className="font-bold text-orange-800">Upload Lên Google Sheets (DATA)</h3>
          </div>
          <div className="p-5 flex flex-col gap-4">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer p-3 bg-slate-50 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors w-fit">
              <input 
                type="checkbox" 
                checked={gsSttOrder}
                onChange={(e) => setGsSttOrder(e.target.checked)}
                className="rounded border-slate-300 w-4 h-4 text-orange-600" 
              />
              Xếp STT theo thứ tự trong file (bỏ qua SBD)
            </label>

            <p className="text-sm text-slate-500 max-w-2xl">
              Tải danh sách học viên từ cơ sở dữ liệu lên trang tính <strong>DATA</strong> của Google Sheets. Hành động này sẽ cập nhật dữ liệu để ứng dụng di động hoặc bên thứ 3 có thể xem thông tin.
            </p>

            <Button onClick={handleGsSync} className="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white gap-2 h-12 text-md font-bold self-start mt-2 px-8">
              <CloudUpload className="w-5 h-5" /> Đẩy dữ liệu lên trang tính
            </Button>
          </div>
        </div>
      </div>

      {/* Hidden Print Container */}
      <div className="hidden">
        {printStudents.length > 0 && (
          <PrintBienBan 
            ref={printRef}
            students={printStudents}
            center={docsDonVi}
            day={docsDay}
            month={docsMonth}
          />
        )}
      </div>
    </div>
  );
}
