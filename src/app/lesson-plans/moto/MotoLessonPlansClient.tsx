"use client";

import { useState, useEffect } from "react";
import { getStudents, getCourseInfo } from "@/actions/students";
import { getTeachers } from "@/actions/teachers";
import { Download, Search, AlertCircle, FileText, Calendar, Users, GraduationCap, Map, Settings, Archive } from "lucide-react";

export default function MotoLessonPlansClient({ courses }: { courses: { MaKhoa: string, Hang: string }[] }) {
  const [category, setCategory] = useState("A1");
  const [search, setSearch] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [filteredCourses, setFilteredCourses] = useState<{ MaKhoa: string, Hang: string }[]>([]);
  
  const [students, setStudents] = useState<any[]>([]);
  const [courseInfo, setCourseInfo] = useState<any>(null);
  
  const [wordTemplate, setWordTemplate] = useState("");
  const [biaTemplate, setBiaTemplate] = useState("");
  const [excelTemplate, setExcelTemplate] = useState("");

  const [gvLT, setGvLT] = useState("");
  const [gvTH, setGvTH] = useState("");
  const [className, setClassName] = useState("");
  const [ngayThi, setNgayThi] = useState("");
  const [khaiGiang, setKhaiGiang] = useState("");
  const [beGiang, setBeGiang] = useState("");

  const [exportingWord, setExportingWord] = useState(false);
  const [exportingBia, setExportingBia] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);
  const [exportingZip, setExportingZip] = useState(false);

  const [allTeachers, setAllTeachers] = useState<any[]>([]);
  const [showOnlyMotoTeachers, setShowOnlyMotoTeachers] = useState(false);

  // Fetch teachers
  useEffect(() => {
    const fetchT = async () => {
      try {
        const res = await getTeachers(1, 1000, "", "all");
        if (res && res.data) {
          setAllTeachers(res.data);
        }
      } catch (e) {
        console.error("Error fetching teachers", e);
      }
    };
    fetchT();
  }, []);

  const displayedTeachers = showOnlyMotoTeachers 
    ? allTeachers.filter(t => {
        const gvth = (t.HangGVTH || "").toUpperCase();
        const gplx = (t.HangGPLX || "").toUpperCase();
        return gvth.includes("A") || gplx.includes("A");
      })
    : allTeachers;

  const uniqueTeacherNames = Array.from(new Set(displayedTeachers.map(t => t.HoTen))).sort();

  // Lọc khóa học theo Hạng Mô tô (A1 hoặc A) sử dụng trường Hang
  useEffect(() => {
    let list = courses;
    if (category === "A1") {
      list = courses.filter(c => c.Hang === "A1" || c.Hang === "A1M" || c.Hang === "A.03");
    } else if (category === "A") {
      list = courses.filter(c => c.Hang === "A");
    } else if (category === "A2") {
      list = courses.filter(c => c.Hang === "A2" || c.Hang === "AM");
    }
    
    if (search) {
      list = list.filter(c => c.MaKhoa.toLowerCase().includes(search.toLowerCase()));
    }
    
    // Sort courses by code for better UX
    list = [...list].sort((a, b) => a.MaKhoa.localeCompare(b.MaKhoa));
    
    setFilteredCourses(list);
  }, [category, search, courses]);

  // Cập nhật biểu mẫu và thông tin khi đổi khóa
  useEffect(() => {
    if (category === "A1") {
      setWordTemplate("GA A1m.docx");
      setBiaTemplate("BIA A1m.docx");
      setExcelTemplate("SLL A1m.xlsx");
    } else {
      setWordTemplate("GA Am.docx");
      setBiaTemplate("BIA Am.docx");
      setExcelTemplate("SLL Am.xlsx");
    }

    if (selectedCourse) {
      fetchCourseData(selectedCourse);
    } else {
      setStudents([]);
      setCourseInfo(null);
    }
  }, [selectedCourse, category]);

  const fetchCourseData = async (courseCode: string) => {
    try {
      const result = await getStudents(1, 1000, courseCode);
      setStudents(result.data || []);
      const info = await getCourseInfo(courseCode);
      setCourseInfo(info);
      if (info) {
        setNgayThi(info.dk_sat_hach || "");
        setKhaiGiang(info.khai_giang || "");
        setBeGiang(info.be_giang || "");
      }
    } catch (e) {
      console.error(e);
      setStudents([]);
    }
  };

  const getNextWorkingDay = (date: Date) => {
    let nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);
    if (nextDay.getDay() === 0) nextDay.setDate(nextDay.getDate() + 1);
    return nextDay;
  };

  const parseDateStr = (str: string) => {
    if(!str) return null;
    let parts = str.split('/');
    if(parts.length === 3) return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    return null;
  };

  const formatDateObj = (date: Date) => {
    return ("0" + date.getDate()).slice(-2) + "/" + ("0" + (date.getMonth() + 1)).slice(-2) + "/" + date.getFullYear();
  };

  const renderTKB = () => {
    if (!khaiGiang) return <div className="text-red-500 italic p-4 text-center text-sm">Chưa có ngày khai giảng hợp lệ.</div>;
    
    let kg_date = parseDateStr(khaiGiang);
    if (!kg_date) return <div className="text-red-500 italic p-4 text-center text-sm">Định dạng ngày KG không đúng (dd/MM/yyyy).</div>;

    let isA1 = category === "A1";
    let lt_days = isA1 ? 1 : 2; 
    let max_th_days = isA1 ? 1 : 8; 

    let current_date = new Date(kg_date);
    if (current_date.getDay() === 0) current_date = getNextWorkingDay(current_date);

    let html: any[] = [];
    for(let i=0; i<lt_days; i++) {
        html.push(
          <div key={`lt-${i}`} className="bg-white border border-slate-200 border-l-4 border-l-blue-500 p-3 rounded-md flex justify-between text-xs mb-2 shadow-sm">
            <span className="font-bold text-slate-800">Ngày {formatDateObj(current_date)}</span>
            <span className="text-slate-500 font-medium">Học Lý Thuyết</span>
          </div>
        );
        if(i < lt_days - 1 || max_th_days > 0) current_date = getNextWorkingDay(current_date);
    }

    if(max_th_days > 0) {
        let th_count = 0;
        while(th_count < max_th_days) {
            html.push(
              <div key={`th-${th_count}`} className="bg-white border border-slate-200 border-l-4 border-l-emerald-500 p-3 rounded-md flex justify-between text-xs mb-2 shadow-sm">
                <span className="font-bold text-slate-800">Ngày {formatDateObj(current_date)}</span>
                <span className="text-slate-500 font-medium">Thực Hành Lái Xe</span>
              </div>
            );
            th_count++;
            if(th_count < max_th_days) current_date = getNextWorkingDay(current_date);
        }
    }
    return <div className="mt-3">{html}</div>;
  };

  const calculatePayload = () => {
    let tu_ngay = "";
    let den_ngay = "";
    let ngay_ky_full = "";
    let dates: string[] = [];

    if (khaiGiang) {
      let kg_date = parseDateStr(khaiGiang);
      if (kg_date) {
        ngay_ky_full = `Ngày ${("0" + kg_date.getDate()).slice(-2)} tháng ${("0" + (kg_date.getMonth() + 1)).slice(-2)} năm ${kg_date.getFullYear()}`;
        
        let isA1 = category === "A1";
        let lt_days = isA1 ? 1 : 2; 
        let max_th_days = isA1 ? 1 : 8; 

        let current_date = new Date(kg_date);
        if (current_date.getDay() === 0) current_date = getNextWorkingDay(current_date);
        
        for(let i=0; i<lt_days; i++) {
          dates.push(formatDateObj(current_date));
          if(i < lt_days - 1 || max_th_days > 0) current_date = getNextWorkingDay(current_date);
        }

        if(max_th_days > 0) {
            tu_ngay = formatDateObj(current_date); 
            let th_count = 0;
            while(th_count < max_th_days) {
                dates.push(formatDateObj(current_date));
                den_ngay = formatDateObj(current_date); 
                th_count++;
                if(th_count < max_th_days) current_date = getNextWorkingDay(current_date);
            }
        }
      }
    }

    return {
      khoa: {
        ma_khoa: selectedCourse,
        sl_hv: students.length,
        quyet_dinh: courseInfo?.quyet_dinh || selectedCourse
      },
      hang: category,
      template: wordTemplate,
      biaTemplate: biaTemplate,
      excelTemplate: excelTemplate,
      ngay_thi: ngayThi,
      tu_ngay: tu_ngay,
      den_ngay: den_ngay,
      khai_giang: khaiGiang,
      be_giang: beGiang,
      ngay_ky_full: ngay_ky_full,
      lop: className,
      giao_vien: gvLT || gvTH, // Gộp lại cho đơn giản hoặc gửi cả 2
      gv_lt: gvLT,
      gv_th: gvTH,
      dates: dates,
      students: students
    };
  };

  const handleExportWord = async () => {
    if (!selectedCourse) return alert("Vui lòng chọn khóa học");
    setExportingWord(true);
    try {
      const payload = calculatePayload();
      const res = await fetch("/api/export/moto/docx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("Lỗi máy chủ");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `GA_Moto_${selectedCourse}.docx`;
      a.click();
    } catch (e) {
      alert("Lỗi xuất Word");
    }
    setExportingWord(false);
  };

  const handleExportBia = async () => {
    if (!selectedCourse) return alert("Vui lòng chọn khóa học");
    setExportingBia(true);
    try {
      const payload = calculatePayload();
      payload.template = biaTemplate; // Use Bia template
      const res = await fetch("/api/export/moto/docx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("Lỗi máy chủ");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `BIA_Moto_${selectedCourse}.docx`;
      a.click();
    } catch (e) {
      alert("Lỗi xuất Bìa");
    }
    setExportingBia(false);
  };

  const handleExportExcel = async () => {
    if (!selectedCourse) return alert("Vui lòng chọn khóa học");
    setExportingExcel(true);
    try {
      const payload = calculatePayload();
      const res = await fetch("/api/export/moto/xlsx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("Lỗi máy chủ");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `SoLenLop_Moto_${selectedCourse}.xlsx`;
      a.click();
    } catch (e) {
      alert("Lỗi xuất Excel");
    }
    setExportingExcel(false);
  };

  const handleExportZip = async () => {
    if (!selectedCourse) return alert("Vui lòng chọn khóa học");
    setExportingZip(true);
    try {
      const payload = calculatePayload();
      payload.template = wordTemplate; 
      payload.biaTemplate = biaTemplate;
      payload.excelTemplate = excelTemplate;
      
      const res = await fetch("/api/export/moto/zip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("Lỗi máy chủ");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedCourse}.zip`;
      a.click();
      alert("Đã xuất và tải lên Drive thành công!");
    } catch (e) {
      alert("Lỗi xuất File ZIP");
    }
    setExportingZip(false);
  };

  return (
    <div className="flex-1 bg-slate-50/50 flex flex-col h-screen overflow-hidden">
      <div className="bg-white border-b border-slate-200 px-8 py-5 shrink-0 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600/10 p-2 rounded-xl">
            <GraduationCap className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Tự động hóa Giáo án (MÔ TÔ)</h1>
            <p className="text-sm text-slate-500 font-medium">Xuất giáo án, sổ lên lớp hạng A1, A, A2</p>
          </div>
        </div>
        
        <div className="flex gap-3">
          <button 
            disabled={!selectedCourse || exportingWord}
            onClick={handleExportWord}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
          >
            <FileText className="w-4 h-4" />
            {exportingWord ? 'Đang xử lý...' : 'Xuất Giáo Án Word'}
          </button>
          
          <button 
            disabled={!selectedCourse || exportingBia}
            onClick={handleExportBia}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
          >
            <FileText className="w-4 h-4" />
            {exportingBia ? 'Đang xử lý...' : 'Xuất Bìa Word'}
          </button>

          <button 
            disabled={!selectedCourse || exportingExcel}
            onClick={handleExportExcel}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" />
            {exportingExcel ? 'Đang xử lý...' : 'Xuất Sổ Lên Lớp'}
          </button>

          <button 
            disabled={!selectedCourse || exportingZip}
            onClick={handleExportZip}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
          >
            <Archive className="w-4 h-4" />
            {exportingZip ? 'Đang xử lý...' : 'In Toàn Bộ'}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8">
        <div className="grid grid-cols-12 gap-8 w-full h-full">
          
          {/* Cột trái: Cấu hình Khóa học & Form MOTO */}
          <div className="col-span-12 xl:col-span-4 flex flex-col gap-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
                <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                  <Settings className="w-4 h-4 text-indigo-500" />
                  Cấu hình Khóa học Mô tô
                </h3>
              </div>
              <div className="p-5 space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500 uppercase">Hạng đào tạo</label>
                    <select 
                      value={category} 
                      onChange={e => { setCategory(e.target.value); setSelectedCourse(""); }}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                    >
                      <option value="A1">Hạng A1</option>
                      <option value="A">Hạng A</option>
                      <option value="A2">Hạng A2 (Cũ)</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500 uppercase">Tìm kiếm</label>
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                      <input 
                        type="text" 
                        placeholder="Mã khóa..." 
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase flex justify-between">
                    <span>Chọn khóa học</span>
                    <span className="text-indigo-600">{filteredCourses.length} khóa</span>
                  </label>
                  <div className="h-[180px] overflow-y-auto border border-slate-200 rounded-lg bg-slate-50/50 p-1 custom-scrollbar">
                    {filteredCourses.length > 0 ? filteredCourses.map(c => (
                      <button
                        key={c.MaKhoa}
                        onClick={() => setSelectedCourse(c.MaKhoa)}
                        className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-all mb-1 ${
                          selectedCourse === c.MaKhoa 
                            ? 'bg-indigo-600 text-white shadow-sm' 
                            : 'text-slate-600 hover:bg-slate-200/50'
                        }`}
                      >
                        {c.MaKhoa}
                      </button>
                    )) : (
                      <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
                        <AlertCircle className="w-5 h-5" />
                        <span className="text-sm">Không tìm thấy khóa học</span>
                      </div>
                    )}
                  </div>
                </div>

                {selectedCourse && (
                  <div className="space-y-4 pt-4 border-t border-slate-100">
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-semibold text-slate-500 uppercase">Giáo viên Lý Thuyết</label>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input type="checkbox" checked={showOnlyMotoTeachers} onChange={e => setShowOnlyMotoTeachers(e.target.checked)} className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5" />
                          <span className="text-xs text-slate-500 font-medium">Chỉ hiện GV Mô Tô</span>
                        </label>
                      </div>
                      <select 
                        value={gvLT} 
                        onChange={e => setGvLT(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white"
                      >
                        <option value="">-- Chọn Giáo viên --</option>
                        {uniqueTeacherNames.map(t => <option key={t} value={t as string}>{t as string}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-semibold text-slate-500 uppercase">Giáo viên Thực Hành</label>
                      </div>
                      <select 
                        value={gvTH} 
                        onChange={e => setGvTH(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white"
                      >
                        <option value="">-- Chọn Giáo viên --</option>
                        {uniqueTeacherNames.map(t => <option key={t} value={t as string}>{t as string}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-500 uppercase">Tên Lớp (Mẫu: K1-A1)</label>
                      <input type="text" value={className} onChange={e => setClassName(e.target.value)} placeholder="Tên lớp..." className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-500 uppercase">Ngày Thi (dd/MM/yyyy)</label>
                      <input type="text" value={ngayThi} onChange={e => setNgayThi(e.target.value)} placeholder="Có thể sửa tay..." className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-500 uppercase">Khai Giảng (dd/MM/yyyy)</label>
                      <input type="text" value={khaiGiang} onChange={e => setKhaiGiang(e.target.value)} placeholder="Có thể sửa tay..." className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-500 uppercase">Bế Giảng (dd/MM/yyyy)</label>
                      <input type="text" value={beGiang} onChange={e => setBeGiang(e.target.value)} placeholder="Có thể sửa tay..." className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Cột phải: Thông tin tổng quan và Danh sách */}
          <div className="col-span-12 xl:col-span-8 flex flex-col gap-6 h-full">
            
            {/* Thống kê Tổng quan */}
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 overflow-hidden">
                <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                  <Map className="w-6 h-6 text-blue-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-slate-500 uppercase truncate">Lộ trình</p>
                  <p className="text-base font-bold text-slate-800 truncate" title={category === 'A1' ? '2 Ngày' : '10 Ngày'}>{category === 'A1' ? '2 Ngày' : '10 Ngày'}</p>
                </div>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 overflow-hidden">
                <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                  <Users className="w-6 h-6 text-emerald-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-slate-500 uppercase truncate">Sĩ số lớp</p>
                  <p className="text-base font-bold text-slate-800 truncate" title={`${students.length} HV`}>{students.length} <span className="text-sm font-medium text-slate-500">HV</span></p>
                </div>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 overflow-hidden">
                <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
                  <Calendar className="w-6 h-6 text-amber-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-slate-500 uppercase truncate">Khai Giảng</p>
                  <p className="text-base font-bold text-slate-800 truncate" title={khaiGiang || '---'}>{khaiGiang || '---'}</p>
                </div>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 overflow-hidden">
                <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                  <Calendar className="w-6 h-6 text-red-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-slate-500 uppercase truncate">Bế Giảng</p>
                  <p className="text-base font-bold text-slate-800 truncate" title={beGiang || '---'}>{beGiang || '---'}</p>
                </div>
              </div>
            </div>

            {/* Thời khóa biểu & Danh sách */}
            <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 flex overflow-hidden min-h-[400px] max-h-[600px]">
              <div className="w-1/3 border-r border-slate-200 flex flex-col bg-slate-50/30">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-600" />
                  <h3 className="font-semibold text-slate-800">Thời khóa biểu</h3>
                </div>
                <div className="p-4 flex-1 overflow-y-auto custom-scrollbar">
                  {selectedCourse ? renderTKB() : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400">
                      <Calendar className="w-8 h-8 mb-2 opacity-20" />
                      <p className="text-sm">Chưa chọn khóa học</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="w-2/3 flex flex-col">
                <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-white">
                  <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                    <Users className="w-4 h-4 text-indigo-500" />
                    Danh sách Học viên
                  </h3>
                  <div className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
                    Tổng: {students.length}
                  </div>
                </div>
                <div className="flex-1 overflow-auto custom-scrollbar bg-white">
                  {students.length > 0 ? (
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-slate-500 uppercase bg-slate-50 sticky top-0 border-b border-slate-200 shadow-sm z-10">
                        <tr>
                          <th className="px-4 py-3 font-semibold w-16 text-center">STT</th>
                          <th className="px-4 py-3 font-semibold">Họ tên</th>
                          <th className="px-4 py-3 font-semibold">Ngày sinh</th>
                          <th className="px-4 py-3 font-semibold">CCCD</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {students.map((hv, idx) => (
                          <tr key={idx} className="hover:bg-indigo-50/30 transition-colors">
                            <td className="px-4 py-3 text-center text-slate-500 font-medium">{idx + 1}</td>
                            <td className="px-4 py-3 font-semibold text-slate-800">{hv.HoTen}</td>
                            <td className="px-4 py-3 text-slate-600">{hv.NgaySinh}</td>
                            <td className="px-4 py-3 text-slate-600 font-mono text-xs">{hv.CCCD}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50/50">
                      <Users className="w-12 h-12 mb-3 opacity-20 text-slate-500" />
                      <p className="font-medium text-slate-500">Chưa có dữ liệu</p>
                      <p className="text-sm mt-1 text-slate-400">Chọn khóa học để hiển thị danh sách</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
