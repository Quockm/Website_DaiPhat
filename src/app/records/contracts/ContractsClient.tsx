"use client";

import { useState, useEffect } from "react";
import { getStudentsByCourse } from "@/actions/contracts";
import { Button } from "@/components/ui/button";
import { FileDown, Users, Loader2, Bike, Car } from "lucide-react";

interface Course {
  MaKhoa: string;
  HangXe: string;
  KhaiGiang: string | null;
}

interface Student {
  MaDK: string;
  HoTen: string;
  NgaySinh: string;
  CCCD: string;
  SDT: string;
  DiaChi: string;
  HocPhi: number;
  HoSoDaThu: string;
  MaKhoa: string;
}

const TEMPLATES_HOPTDONG_MOTO = [
  "1.1 HĐĐT_Phụ lục 01 (A1).docx",
  "1.2 HĐĐT_Phụ lục 01 (A).docx"
];

const TEMPLATES_HOPTDONG_OTO = [
  "1.1 HĐĐT_Phụ Lục (BSS).docx",
  "1.2 HĐĐT_Phụ Lục (B01).docx",
  "1.3 HĐĐT_Phụ Lục ((C1).docx"
];

const TEMPLATES_PHIEUTHU = [
  "2.1 Phiếu thu (BSS).docx",
  "2.2 Phiếu thu (B01).docx",
  "2.2 Phiếu thu (C1).docx"
];

export default function ContractsClient({ courses }: { courses: Course[] }) {
  const [activeTab, setActiveTab] = useState<'MOTO' | 'OTO'>('MOTO');
  
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [exportingFile, setExportingFile] = useState<string | null>(null);

  // Search and Filter
  const [courseSearch, setCourseSearch] = useState("");
  const [hangXeFilter, setHangXeFilter] = useState("");
  const [studentSearch, setStudentSearch] = useState("");

  // Template selections
  const [motoHdTemplate, setMotoHdTemplate] = useState(TEMPLATES_HOPTDONG_MOTO[0]);
  const [otoHdTemplate, setOtoHdTemplate] = useState(TEMPLATES_HOPTDONG_OTO[0]);
  const [otoPtTemplate, setOtoPtTemplate] = useState(TEMPLATES_PHIEUTHU[0]);

  const filteredCourses = courses.filter(c => {
    const isMoto = c.HangXe === 'A' || c.HangXe === 'A1';
    const matchesTab = activeTab === 'MOTO' ? isMoto : !isMoto;
    const matchesSearch = c.MaKhoa.toLowerCase().includes(courseSearch.toLowerCase());
    const matchesHang = hangXeFilter ? c.HangXe === hangXeFilter : true;
    return matchesTab && matchesSearch && matchesHang;
  });

  const filteredStudents = students.filter(s => 
    s.HoTen.toLowerCase().includes(studentSearch.toLowerCase()) || 
    s.CCCD.includes(studentSearch)
  );

  // Available HangXe for current tab
  const availableHangXe = Array.from(new Set(courses.filter(c => {
    const isMoto = c.HangXe === 'A' || c.HangXe === 'A1';
    return activeTab === 'MOTO' ? isMoto : !isMoto;
  }).map(c => c.HangXe)));

  // Reset selections when tab changes
  useEffect(() => {
    setSelectedCourse("");
    setStudents([]);
    setSelectedStudent("");
    setCourseSearch("");
    setHangXeFilter("");
    setStudentSearch("");
  }, [activeTab]);

  useEffect(() => {
    if (selectedCourse) {
      setLoadingStudents(true);
      getStudentsByCourse(selectedCourse).then(data => {
        setStudents(data);
        setLoadingStudents(false);
      });
    } else {
      setStudents([]);
      setSelectedStudent("");
    }
  }, [selectedCourse]);

  const handleExportSingle = async (templateName: string) => {
    if (!selectedCourse || !selectedStudent || !templateName) return;
    
    setExportingFile(`single-${templateName}`);
    try {
      const student = students.find(s => s.MaDK === selectedStudent);
      const res = await fetch("/api/export/contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          template: templateName,
          student,
          bulk: false,
          courseName: selectedCourse,
          hangXe: courses.find(c => c.MaKhoa === selectedCourse)?.HangXe || ""
        })
      });

      if (!res.ok) throw new Error("Failed to generate file");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${student?.HoTen}_${templateName}`;
      a.click();
    } catch (error) {
      console.error(error);
      alert("Đã xảy ra lỗi khi in hợp đồng cá nhân!");
    } finally {
      setExportingFile(null);
    }
  };

  const handleExportBulk = async (templateName: string) => {
    if (!selectedCourse || students.length === 0 || !templateName) return;
    
    setExportingFile(`bulk-${templateName}`);
    try {
      const res = await fetch("/api/export/contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          template: templateName,
          students: students,
          bulk: true,
          courseName: selectedCourse,
          hangXe: courses.find(c => c.MaKhoa === selectedCourse)?.HangXe || ""
        })
      });

      if (!res.ok) throw new Error("Failed to generate zip");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `HopDong_${selectedCourse}_${templateName.replace('.docx', '')}.zip`;
      a.click();
    } catch (error) {
      console.error(error);
      alert("Đã xảy ra lỗi khi in hợp đồng hàng loạt!");
    } finally {
      setExportingFile(null);
    }
  };

  const FileRow = ({ 
    label, 
    templates, 
    selected, 
    onChange 
  }: { 
    label: string, 
    templates?: string[], 
    selected: string, 
    onChange?: (v: string) => void 
  }) => (
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 border rounded-xl bg-gray-50/50 hover:bg-gray-50 hover:border-blue-200 transition-colors">
      <div className="flex-1 space-y-1.5">
        <h4 className="font-semibold text-gray-800 text-sm md:text-base">{label}</h4>
        {templates && onChange ? (
          <select
            className="w-full md:w-72 border rounded-md p-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            value={selected}
            onChange={(e) => onChange(e.target.value)}
          >
            {templates.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        ) : (
          <div className="text-sm text-gray-600 border bg-gray-100/50 rounded-md p-2 w-full md:w-72 truncate">
            {selected}
          </div>
        )}
      </div>
      <div className="flex items-center gap-3 w-full md:w-auto">
        <Button 
          onClick={() => handleExportSingle(selected)}
          disabled={!selectedStudent || exportingFile !== null}
          variant="default"
          className="flex-1 md:flex-none shadow-sm"
        >
          {exportingFile === `single-${selected}` ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileDown className="w-4 h-4 mr-2" />}
          Tải Cá nhân
        </Button>
        <Button 
          onClick={() => handleExportBulk(selected)}
          disabled={students.length === 0 || exportingFile !== null}
          variant="outline"
          className="flex-1 md:flex-none bg-green-50 hover:bg-green-100 text-green-700 border-green-200 shadow-sm"
        >
          {exportingFile === `bulk-${selected}` ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileDown className="w-4 h-4 mr-2" />}
          Tải Hàng loạt
        </Button>
      </div>
    </div>
  );

  return (
    <div className="p-6 w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">In Hợp đồng & Sổ sách</h1>
        
        <div className="flex space-x-1 bg-gray-100/80 p-1 rounded-lg w-fit border shadow-inner">
          <button
            onClick={() => setActiveTab('MOTO')}
            className={`flex items-center gap-2 px-6 py-2 rounded-md font-semibold text-sm transition-all ${
              activeTab === 'MOTO' ? 'bg-white shadow-sm text-blue-600 ring-1 ring-gray-200' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
            }`}
          >
            <Bike className="w-4 h-4" />
            MÔ TÔ (A1, A)
          </button>
          <button
            onClick={() => setActiveTab('OTO')}
            className={`flex items-center gap-2 px-6 py-2 rounded-md font-semibold text-sm transition-all ${
              activeTab === 'OTO' ? 'bg-white shadow-sm text-blue-600 ring-1 ring-gray-200' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
            }`}
          >
            <Car className="w-4 h-4" />
            Ô TÔ (B, C)
          </button>
        </div>
      </div>

      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-3">
            <label className="text-sm font-semibold text-gray-700">1. Chọn Khóa học</label>
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="Tìm mã khóa..." 
                className="w-full border-gray-300 rounded-lg p-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white shadow-sm"
                value={courseSearch}
                onChange={(e) => setCourseSearch(e.target.value)}
              />
              <select
                className="w-1/3 border-gray-300 rounded-lg p-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white shadow-sm"
                value={hangXeFilter}
                onChange={(e) => setHangXeFilter(e.target.value)}
              >
                <option value="">Hạng</option>
                {availableHangXe.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
            <select
              className="w-full border-gray-300 rounded-lg p-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all bg-gray-50 hover:bg-white font-medium text-gray-800"
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
            >
              <option value="">-- Chọn khóa học --</option>
              {filteredCourses.length === 0 ? (
                <option value="" disabled>Không tìm thấy khóa nào...</option>
              ) : (
                filteredCourses.map(c => (
                  <option key={c.MaKhoa} value={c.MaKhoa} className="p-1.5 hover:bg-blue-50">
                    {c.MaKhoa} (Hạng {c.HangXe})
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-semibold text-gray-700 flex items-center justify-between">
              <span>2. Chọn Học viên</span>
              {selectedCourse && (
                <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                  Áp dụng cho tải cá nhân
                </span>
              )}
            </label>
            <input 
              type="text" 
              placeholder="Tìm tên hoặc CCCD..." 
              className="w-full border-gray-300 rounded-lg p-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white shadow-sm disabled:opacity-50"
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
              disabled={students.length === 0}
            />
            <select
              className="w-full border-gray-300 rounded-lg p-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all bg-gray-50 hover:bg-white font-medium text-gray-800 disabled:opacity-50"
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
              disabled={students.length === 0}
            >
              <option value="">-- Chọn học viên --</option>
              {filteredStudents.length === 0 ? (
                <option value="" disabled>{students.length > 0 ? "Không tìm thấy học viên..." : "Chưa chọn khóa học"}</option>
              ) : (
                filteredStudents.map(s => {
                  const isComplete = s.HoTen && s.CCCD && s.NgaySinh && s.DiaChi && s.SDT;
                  return (
                    <option key={s.MaDK} value={s.MaDK} className="p-1.5 hover:bg-blue-50">
                      {isComplete ? "✅ " : "⚠️ "}{s.HoTen} - {s.CCCD || "Trống CCCD"}
                    </option>
                  );
                })
              )}
            </select>
            {loadingStudents && <p className="text-sm text-blue-500 flex items-center mt-1.5"><Loader2 className="w-3 h-3 mr-1 animate-spin" />Đang tải dữ liệu...</p>}
            {!loadingStudents && selectedCourse && students.length > 0 && (
              <p className="text-sm text-green-600 flex items-center mt-1.5">
                <Users className="w-3.5 h-3.5 mr-1" />
                Đã tải {students.length} học viên
              </p>
            )}
          </div>
        </div>

        {selectedCourse && (
          <div className="space-y-5 pt-8 border-t border-gray-100 animate-in fade-in duration-500">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-6 w-1.5 bg-blue-500 rounded-full"></div>
              <h3 className="font-bold text-lg text-gray-800">3. In Biểu mẫu ({activeTab})</h3>
            </div>
            
            {activeTab === 'MOTO' && (
              <div className="space-y-4">
                <FileRow 
                  label="File 1: Hợp đồng Đào tạo" 
                  templates={TEMPLATES_HOPTDONG_MOTO} 
                  selected={motoHdTemplate} 
                  onChange={setMotoHdTemplate} 
                />
                <FileRow 
                  label="File 2: Biên bản Thanh lý" 
                  selected="2. BBTL MÔ TÔ.docx" 
                />
              </div>
            )}

            {activeTab === 'OTO' && (
              <div className="space-y-4">
                <FileRow 
                  label="File 1: Hợp đồng Đào tạo" 
                  templates={TEMPLATES_HOPTDONG_OTO} 
                  selected={otoHdTemplate} 
                  onChange={setOtoHdTemplate} 
                />
                <FileRow 
                  label="File 2: Phiếu thu" 
                  templates={TEMPLATES_PHIEUTHU} 
                  selected={otoPtTemplate} 
                  onChange={setOtoPtTemplate} 
                />
                <FileRow 
                  label="File 3: Biên bản Thanh lý" 
                  selected="3. Biên bản thanh lý.docx" 
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
