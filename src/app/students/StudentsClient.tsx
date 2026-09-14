"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import { StudentData, getStudents, updateStudentField } from "@/actions/students";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, User, Filter, Check, X, Upload, Eye, FileUp, Loader2, Trash2, FolderOpen, FileCheck } from "lucide-react";

type Props = {
  initialStudents: StudentData[];
  initialTotal: number;
  initialCompleted: number;
  initialIncomplete: number;
  initialPages: number;
  courseList: string[];
};

const TextInputCell = ({ initialValue, onSave, placeholder, type = "text" }: any) => {
  const [val, setVal] = useState(initialValue || "");
  
  useEffect(() => {
    setVal(initialValue || "");
  }, [initialValue]);

  return (
    <input 
      type={type}
      className={`p-1.5 text-xs border border-slate-300 hover:border-indigo-400 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 rounded bg-white transition-all outline-none ${type === 'date' ? 'w-[125px]' : 'w-24'}`}
      placeholder={placeholder}
      value={val}
      onChange={(e) => setVal(e.target.value)}
      onBlur={() => {
        if (val !== (initialValue || "")) {
          onSave(val);
        }
      }}
    />
  );
};

export default function StudentsClient({ initialStudents, initialTotal, initialCompleted, initialIncomplete, initialPages, courseList }: Props) {
  const [students, setStudents] = useState<StudentData[]>(initialStudents);
  const [total, setTotal] = useState(initialTotal);
  const [completed, setCompleted] = useState(initialCompleted);
  const [incomplete, setIncomplete] = useState(initialIncomplete);
  const [totalPages, setTotalPages] = useState(initialPages);
  
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState("B01");
  const [course, setCourse] = useState("all");
  const [search, setSearch] = useState("");
  const [uploadStudentModal, setUploadStudentModal] = useState<StudentData | null>(null);
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const isFirstRender = useRef(true);

  // Derive course list for selected category
  const filteredCourses = courseList.filter(c => {
    if (category === 'B01') return c.includes('B01');
    if (category === 'B') return c.includes('B') && !c.includes('B01');
    if (category === 'C1') return c.includes('C1') || c.includes('C');
    if (category === 'A1') return c.includes('A1');
    if (category === 'A') return c.includes('A') && !c.includes('A1') && !c.includes('A2');
    return true;
  });

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    
    const timer = setTimeout(async () => {
      setLoading(true);
      const res = await getStudents(page, 50, course, search, category);
      setStudents(res.data);
      setTotal(res.totalRecords);
      setCompleted(res.completedRecords || 0);
      setIncomplete(res.incompleteRecords || 0);
      setTotalPages(res.totalPages);
      setPage(res.currentPage);
      setLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [page, course, search, category]);

  const [isPending, startTransition] = useTransition();

  const handleUpdate = async (maDK: string, field: string, value: any) => {
    // Optimistic UI update
    setStudents(prev => prev.map(s => s.MaDK === maDK ? { ...s, [field]: value } : s));
    
    startTransition(async () => {
      await updateStudentField(maDK, field, value);
    });
  };

  const [uploadingField, setUploadingField] = useState<string | null>(null);

  const handleFileUpload = async (maDK: string, field: string, file: File) => {
    setUploadingField(`${maDK}_${field}`);
    try {
      const student = students.find(s => s.MaDK === maDK);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("objectId", `HV_${student?.CCCD || maDK}`);
      formData.append("docType", field);
      formData.append("courseCode", student?.MaKhoa || "Chua_xep_khoa");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.success && data.webViewLink) {
        const currentUrls = student?.[field as keyof StudentData] as string || "";
        const updatedValue = currentUrls && currentUrls.trim() !== '' ? currentUrls + "," + data.webViewLink : data.webViewLink;
        await handleUpdate(maDK, field, updatedValue);
      } else {
        alert(`Upload thất bại: ` + data.error);
      }
    } catch (error) {
      alert("Lỗi upload: " + error);
    } finally {
      setUploadingField(null);
    }
  };

  const handleRemoveFile = async (maDK: string, field: string, urlToRemove: string) => {
    if (!confirm("Bạn có chắc muốn gỡ bỏ file này?")) return;
    try {
      const currentStudent = students.find(s => s.MaDK === maDK);
      if (!currentStudent) return;
      const currentUrls = currentStudent[field as keyof StudentData] as string || "";
      const urls = currentUrls.split(',').filter(u => u !== urlToRemove);
      const updatedValue = urls.length > 0 ? urls.join(',') : null;
      await handleUpdate(maDK, field, updatedValue);
    } catch (error) {
      alert("Lỗi xóa file: " + error);
    }
  };

  const [bulkProgress, setBulkProgress] = useState<{current: number, total: number, message: string} | null>(null);

  const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    if (!course) {
      alert("Vui lòng chọn 1 Khóa cụ thể ở menu thả xuống trước khi upload tự động!");
      return;
    }

    setBulkProgress({ current: 0, total: files.length, message: "Đang phân tích..." });
    let successCount = 0;
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setBulkProgress({ current: i + 1, total: files.length, message: `Đang xử lý: ${file.name}` });
      
      const match = file.name.match(/(\d{12})_(X|PL|KT|DD|CT|MP|CB|D)\./i);
      if (!match) continue;

      const cccd = match[1];
      const type = match[2].toUpperCase();
      
      const student = students.find(s => s.CCCD === cccd && s.MaKhoa === course);
      if (!student) continue;

      let field = "";
      if (type === "X") field = "KT_XangDau";
      else if (type === "PL") field = "DT_LT_PhapLuat";
      else if (type === "KT") field = "DT_LT_KyThuat";
      else if (type === "DD") field = "DT_LT_DaoDuc";
      else if (type === "CT") field = "DT_LT_CauTao";
      else if (type === "MP") field = "DT_LT_MoPhong";
      else if (type === "CB") field = "DT_Cabin";
      else if (type === "D") field = "DT_DAT";
      
      if (!field) continue;

      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("objectId", `HV_${student.CCCD || student.MaDK}`);
        formData.append("docType", field);
        formData.append("courseCode", course);

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        if (data.success && data.webViewLink) {
          const currentUrls = student[field as keyof StudentData] as string || "";
          const updatedValue = currentUrls && currentUrls.trim() !== '' ? currentUrls + "," + data.webViewLink : data.webViewLink;
          await handleUpdate(student.MaDK, field, updatedValue);
          successCount++;
        }
      } catch (err) {
        console.error("Lỗi bulk upload file:", file.name, err);
      }
    }
    
    setBulkProgress(null);
    alert(`Đã upload tự động thành công ${successCount}/${files.length} file.`);
  };

  const isAuto = ['B01', 'B', 'C1'].includes(category);
  const isMoto = ['A1', 'A'].includes(category);

  const renderUploadCell = (student: StudentData, field: string) => {
    const value = student[field as keyof StudentData] as string | null;
    const isUploading = uploadingField === `${student.MaDK}_${field}`;
    const urls = (value && value !== '') ? value.split(',') : [];
    const isCompleted = urls.length > 0;
    
    return (
      <div className={`w-full h-full flex items-center justify-center`} key={field}>
        {isUploading ? (
          <Loader2 className="w-5 h-5 animate-spin text-indigo-500 mx-auto" />
        ) : isCompleted ? (
          <div className="flex flex-wrap items-center justify-center gap-2">
            {urls.map((url, i) => (
              <div key={i} className="flex items-center bg-emerald-100 text-emerald-700 rounded-full pl-2 pr-1 py-1 group shadow-sm border border-emerald-200">
                <button 
                  onClick={() => setPreviewUrl(url)} 
                  title={`Xem file ${i+1}`} 
                  className="hover:text-emerald-900 transition-colors flex items-center gap-1 text-xs font-semibold"
                >
                  <Eye className="w-4 h-4" /> {urls.length > 1 ? i + 1 : ''}
                </button>
                <button 
                  onClick={() => handleRemoveFile(student.MaDK, field, url)} 
                  title={`Xóa file ${i+1}`} 
                  className="ml-1 text-rose-500 hover:text-rose-700 transition-colors opacity-0 group-hover:opacity-100 w-0 group-hover:w-5 overflow-hidden flex items-center justify-center"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            <label className="cursor-pointer text-indigo-500 hover:text-indigo-700 transition-colors p-1.5 bg-indigo-50 hover:bg-indigo-100 rounded-full border border-indigo-100" title="Upload thêm file">
              <Upload className="w-4 h-4" />
              <input type="file" className="hidden" onChange={(e) => {
                if (e.target.files && e.target.files[0]) handleFileUpload(student.MaDK, field, e.target.files[0]);
              }} />
            </label>
          </div>
        ) : (
          <label className="cursor-pointer inline-flex flex-col items-center justify-center p-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-600 transition-all text-slate-400 w-full max-w-[100px]">
            <FileUp className="w-4 h-4 mb-1" />
            <span className="text-[10px] font-medium">Upload</span>
            <input type="file" className="hidden" onChange={(e) => {
              if (e.target.files && e.target.files[0]) handleFileUpload(student.MaDK, field, e.target.files[0]);
            }} />
          </label>
        )}
      </div>
    );
  };

  return (
    <Card className="bg-white shadow-md border-slate-200 overflow-hidden">
      <CardHeader className="bg-slate-50/80 border-b border-slate-100 pb-4 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
            <div className="p-1.5 bg-blue-100 rounded-md">
              <User className="h-5 w-5 text-blue-700" />
            </div>
            Danh sách Học viên ({total})
            <span className="ml-4 px-2 py-1 bg-green-100 text-green-700 text-xs rounded font-semibold">Hoàn thiện: {completed}</span>
            <span className="ml-2 px-2 py-1 bg-slate-200 text-slate-600 text-xs rounded font-semibold">Chưa HT: {incomplete}</span>
          </CardTitle>
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-auto">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select
                value={category}
                onChange={(e) => { 
                  setCategory(e.target.value); 
                  setCourse(""); 
                  setPage(1); 
                }}
                className="pl-9 pr-8 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white w-full font-medium"
              >
                <option value="B">Hạng B</option>
                <option value="B01">Hạng B01</option>
                <option value="C1">Hạng C1</option>
                <option value="A1">Hạng A1</option>
                <option value="A">Hạng A</option>
              </select>
            </div>
          <div className="relative w-full sm:w-auto">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select
              value={course}
              onChange={(e) => { setCourse(e.target.value); setPage(1); }}
              className="pl-9 pr-8 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white w-full font-medium max-w-[200px]"
            >
              <option value="all">Tất cả Khóa</option>
              {filteredCourses.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="relative w-full sm:w-auto flex flex-col sm:flex-row items-center gap-2">
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Tìm Tên, CCCD, Mã ĐK..." 
                className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-64 font-medium"
              />
            </div>
            {course !== "all" && course !== "" && (
              <label className="cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors shadow-sm whitespace-nowrap" title="Chọn nhiều file để tự động nhận diện và upload cho cả Khóa">
                <Upload className="w-4 h-4" />
                <span>Upload Khóa</span>
                <input 
                  type="file" 
                  multiple 
                  className="hidden" 
                  onChange={handleBulkUpload} 
                />
              </label>
            )}
          </div>
        </div>
        </div>
      </CardHeader>
      
      {bulkProgress && (
        <div className="bg-indigo-50 border-b border-indigo-100 p-3 px-4 flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-3">
            <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
            <span className="text-sm font-semibold text-indigo-800">
              {bulkProgress.message}
            </span>
          </div>
          <div className="text-xs font-bold text-indigo-600 bg-white px-2 py-1 rounded-full border border-indigo-200">
            {bulkProgress.current} / {bulkProgress.total}
          </div>
        </div>
      )}
      
      <CardContent className="p-0 relative">
        {loading && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        )}
        <div className="overflow-auto min-h-[400px] max-h-[calc(100vh-250px)] w-full border border-slate-200 rounded-lg relative">
          <table className="w-full text-left text-sm text-slate-600 whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-700 font-extrabold uppercase text-xs border-b border-slate-200 sticky top-0 z-10">
              <tr>
                <th rowSpan={isAuto ? 2 : 1} className="px-4 py-4 min-w-[200px] border-r border-slate-200">Thông tin học viên</th>
                <th rowSpan={isAuto ? 2 : 1} className="px-4 py-4 border-r-2 border-slate-300">Khóa</th>
                
                {isAuto && (
                  <>
                    <th rowSpan={2} className="px-4 py-4 text-center min-w-[150px] border-r-2 border-slate-300 bg-indigo-50/30">Hồ sơ đính kèm</th>
                    <th colSpan={4} className="px-4 py-2 text-center border-r-2 border-slate-300 border-b border-slate-200 bg-amber-50/30">Hợp Đồng Đào Tạo</th>
                    <th colSpan={5} className="px-4 py-2 text-center border-b border-slate-200 bg-emerald-50/30">Cấp Giấy HTKH</th>
                  </>
                )}

                {isMoto && (
                  <>
                    <th className="px-4 py-4 text-center">Hợp đồng</th>
                    <th className="px-4 py-4 text-center">Quyết định</th>
                    <th className="px-4 py-4 text-center">Giáo án</th>
                    <th className="px-4 py-4 text-center bg-indigo-50">Trạng thái</th>
                    <th className="px-4 py-4 text-center bg-slate-100">Sát hạch</th>
                  </>
                )}
              </tr>
              {isAuto && (
                <tr>
                  {/* Hợp đồng đào tạo */}
                  <th className="px-2 py-2 text-center border-r border-slate-100 bg-amber-50/10">Số HĐ</th>
                  <th className="px-2 py-2 text-center border-r border-slate-100 bg-amber-50/10">Ngày ký HĐ</th>
                  <th className="px-2 py-2 text-center border-r border-slate-100 bg-amber-50/10">Số TLHĐ</th>
                  <th className="px-2 py-2 text-center border-r-2 border-slate-300 bg-amber-50/10">Ngày ký TLHĐ</th>
                  {/* Cấp giấy HTKH */}
                  <th className="px-2 py-2 text-center border-r border-slate-100 bg-emerald-50/10">Ngày Tốt Nghiệp</th>
                  <th className="px-2 py-2 text-center border-r border-slate-100 bg-emerald-50/10">Ngày Sát Hạch</th>
                  <th className="px-2 py-2 text-center border-r border-slate-100 bg-emerald-50/10">Số hiệu GPLX</th>
                  <th className="px-2 py-2 text-center border-r border-slate-100 bg-emerald-50/10">Số vào sổ</th>
                  <th className="px-2 py-2 text-center bg-emerald-50/10">Số QĐ cấp</th>
                </tr>
              )}
            </thead>
            <tbody className="divide-y divide-slate-100">
              {students.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-slate-500">
                    Không tìm thấy dữ liệu phù hợp.
                  </td>
                </tr>
              ) : (
                students.map((student, idx) => {
                  const autoCheckAll = (
                    student.KT_XangDau && student.KT_XangDau !== '' && 
                    student.DT_LT_PhapLuat && student.DT_LT_PhapLuat !== '' && 
                    student.DT_LT_KyThuat && student.DT_LT_KyThuat !== '' && 
                    student.DT_LT_DaoDuc && student.DT_LT_DaoDuc !== '' && 
                    student.DT_LT_CauTao && student.DT_LT_CauTao !== '' && 
                    student.DT_LT_MoPhong && student.DT_LT_MoPhong !== '' && 
                    student.DT_Cabin && student.DT_Cabin !== '' && 
                    student.DT_DAT && student.DT_DAT !== ''
                  );
                  
                  const motoCheckAll = (student.HS_HopDong === 1 && student.HS_KyTen === 1 && student.HS_DiemDanhLT === 1);
                  const isCompleted = isAuto ? autoCheckAll : motoCheckAll;

                  return (
                    <tr key={student.MaDK || idx} className="hover:bg-indigo-50/50 transition-colors bg-white">
                      <td className="px-4 py-3 border-r border-slate-100">
                        <div className={`font-bold ${isCompleted ? 'text-green-600' : 'text-slate-900'}`}>{student.HoTen}</div>
                        <div className="text-slate-500 text-xs mt-0.5">{student.NgaySinh} | {student.CCCD}</div>
                        <div className="text-slate-400 text-xs mt-0.5">{student.MaDK}</div>
                      </td>
                      <td className="px-4 py-3 font-semibold text-indigo-700 text-xs border-r-2 border-slate-300">
                        {student.MaKhoa || '-'}
                      </td>
                      
                      {isAuto && (
                        <>
                          <td className="px-2 py-3 text-center border-r-2 border-slate-300 bg-indigo-50/10">
                            {(() => {
                              const uploadCount = [student.KT_XangDau, student.DT_LT_PhapLuat, student.DT_LT_KyThuat, student.DT_LT_DaoDuc, student.DT_LT_CauTao, student.DT_LT_MoPhong, student.DT_Cabin, student.DT_DAT].filter(Boolean).length;
                              const isFull = uploadCount === 8;
                              const isEmpty = uploadCount === 0;
                              const btnClass = isFull 
                                ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200" 
                                : isEmpty 
                                ? "bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200" 
                                : "bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200";
                              const badgeClass = isFull ? "text-emerald-700" : isEmpty ? "text-slate-700" : "text-amber-700";
                              
                              return (
                                <button
                                  onClick={() => setUploadStudentModal(student)}
                                  className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 font-medium text-xs rounded-full transition-colors border w-fit mx-auto whitespace-nowrap flex-shrink-0 ${btnClass}`}
                                >
                                  <FolderOpen className="w-3.5 h-3.5 flex-none" />
                                  <span className="flex-none">Quản lý</span>
                                  <span className={`bg-white px-1.5 py-0.5 rounded-full text-[10px] shadow-sm font-bold ml-1 min-w-[32px] text-center flex-none ${badgeClass}`}>
                                    {uploadCount}/8
                                  </span>
                                </button>
                              );
                            })()}
                          </td>
                          <td className="px-2 py-3 text-center border-r border-slate-100 bg-amber-50/5"><TextInputCell initialValue={student.SoHopDong_Oto} onSave={(v: any) => handleUpdate(student.MaDK, 'SoHopDong_Oto', v)} placeholder="Số HĐ" /></td>
                          <td className="px-2 py-3 text-center border-r border-slate-100 bg-amber-50/5"><TextInputCell type="date" initialValue={student.NgayKyHD_Oto} onSave={(v: any) => handleUpdate(student.MaDK, 'NgayKyHD_Oto', v)} /></td>
                          <td className="px-2 py-3 text-center border-r border-slate-100 bg-amber-50/5"><TextInputCell initialValue={student.SoTLHD_Oto} onSave={(v: any) => handleUpdate(student.MaDK, 'SoTLHD_Oto', v)} placeholder="Số TLHĐ" /></td>
                          <td className="px-2 py-3 text-center border-r-2 border-slate-300 bg-amber-50/5"><TextInputCell type="date" initialValue={student.NgayKyTLHD_Oto} onSave={(v: any) => handleUpdate(student.MaDK, 'NgayKyTLHD_Oto', v)} /></td>
                          <td className="px-2 py-3 text-center border-r border-slate-100 bg-emerald-50/5"><TextInputCell type="date" initialValue={student.NgayThiDat_TN} onSave={(v: any) => handleUpdate(student.MaDK, 'NgayThiDat_TN', v)} /></td>
                          <td className="px-2 py-3 text-center border-r border-slate-100 bg-emerald-50/5"><TextInputCell type="date" initialValue={student.NgayThiDat_SH} onSave={(v: any) => handleUpdate(student.MaDK, 'NgayThiDat_SH', v)} /></td>
                          <td className="px-2 py-3 text-center border-r border-slate-100 bg-emerald-50/5"><TextInputCell initialValue={student.SoHieu_GPLX} onSave={(v: any) => handleUpdate(student.MaDK, 'SoHieu_GPLX', v)} placeholder="Số hiệu" /></td>
                          <td className="px-2 py-3 text-center border-r border-slate-100 bg-emerald-50/5"><TextInputCell initialValue={student.SoVaoSo_GPLX} onSave={(v: any) => handleUpdate(student.MaDK, 'SoVaoSo_GPLX', v)} placeholder="Số vào sổ" /></td>
                          <td className="px-2 py-3 text-center bg-emerald-50/5"><TextInputCell initialValue={student.SoQDCap_GPLX} onSave={(v: any) => handleUpdate(student.MaDK, 'SoQDCap_GPLX', v)} placeholder="Số QĐ" /></td>
                        </>
                      )}

                      {isMoto && (
                        <>
                          <td className="px-4 py-3 text-center">
                            <input type="checkbox" checked={student.HS_HopDong === 1} onChange={(e) => handleUpdate(student.MaDK, 'HS_HopDong', e.target.checked ? 1 : null)} className="w-4 h-4 text-indigo-600 rounded cursor-pointer transition-transform hover:scale-110" />
                          </td>
                          <td className="px-4 py-3 text-center">
                            <input type="checkbox" checked={student.HS_KyTen === 1} onChange={(e) => handleUpdate(student.MaDK, 'HS_KyTen', e.target.checked ? 1 : null)} className="w-4 h-4 text-indigo-600 rounded cursor-pointer transition-transform hover:scale-110" />
                          </td>
                          <td className="px-4 py-3 text-center">
                            <input type="checkbox" checked={student.HS_DiemDanhLT === 1} onChange={(e) => handleUpdate(student.MaDK, 'HS_DiemDanhLT', e.target.checked ? 1 : null)} className="w-4 h-4 text-indigo-600 rounded cursor-pointer transition-transform hover:scale-110" />
                          </td>
                          <td className="px-4 py-3 text-center bg-indigo-50/50">
                            {motoCheckAll ? <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold whitespace-nowrap animate-pulse">Hoàn thiện</span> : <span className="text-slate-400 text-xs">-</span>}
                          </td>
                          <td className="px-4 py-3 text-center bg-slate-50">
                            <select 
                              disabled={!motoCheckAll}
                              value={student.SH_KetQua || ''}
                              onChange={(e) => handleUpdate(student.MaDK, 'SH_KetQua', e.target.value)}
                              className={`w-20 px-2 py-1 text-xs border rounded font-medium ${motoCheckAll ? 'border-amber-400 bg-white text-amber-700 shadow-[0_0_8px_rgba(251,191,36,0.4)]' : 'border-slate-300 bg-slate-100 cursor-not-allowed text-slate-400'}`}
                            >
                              <option value="">- Chọn -</option>
                              <option value="Đậu">Đậu</option>
                              <option value="Rớt">Rớt</option>
                              <option value="Vắng">Vắng</option>
                            </select>
                          </td>
                        </>
                      )}
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
        
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50">
            <span className="text-sm text-slate-600 font-medium">Trang {page} / {totalPages}</span>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 text-sm font-bold border border-slate-300 rounded-md bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-50">Trước</button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1 text-sm font-bold border border-slate-300 rounded-md bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-50">Sau</button>
            </div>
          </div>
        )}
      </CardContent>
      
      {/* File Preview Modal */}
      {previewUrl && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 md:p-8 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-6xl shadow-2xl flex flex-col h-[90vh] overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                  <FileCheck className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-lg">Xem tài liệu</h3>
              </div>
              <button onClick={() => setPreviewUrl(null)} className="p-1 hover:bg-slate-100 rounded-full transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 bg-slate-100 p-2 overflow-hidden flex items-center justify-center">
              {previewUrl.includes('drive.google.com') ? <iframe src={previewUrl.replace('/view?usp=drivesdk', '/preview').replace('/view?usp=sharing', '/preview')} className="w-full h-full border-0 rounded" /> : previewUrl.toLowerCase().match(/\.(jpeg|jpg|gif|png|webp)$/) ? <img src={previewUrl} className="max-w-full max-h-full object-contain rounded" alt="Preview" /> : <iframe src={`https://docs.google.com/viewer?url=${encodeURIComponent(previewUrl)}&embedded=true`} className="w-full h-full border-0 rounded" />}
            </div>
          </div>
        </div>
      )}

      {uploadStudentModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                  <FileCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Hồ sơ đính kèm</h2>
                  <p className="text-sm font-medium text-slate-500">Học viên: <span className="text-slate-700 font-bold">{uploadStudentModal.HoTen}</span> - Ngày sinh: {uploadStudentModal.NgaySinh} - CCCD: {uploadStudentModal.CCCD} - Khóa: {uploadStudentModal.MaKhoa}</p>
                </div>
              </div>
              <button onClick={() => setUploadStudentModal(null)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 overflow-y-auto bg-slate-50/30">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { key: 'KT_XangDau', label: 'Xăng dầu' },
                  { key: 'DT_LT_PhapLuat', label: 'Lý thuyết: Pháp Luật' },
                  { key: 'DT_LT_KyThuat', label: 'Lý thuyết: Kỹ Thuật' },
                  { key: 'DT_LT_DaoDuc', label: 'Lý thuyết: Đạo Đức' },
                  { key: 'DT_LT_CauTao', label: 'Lý thuyết: Cấu Tạo' },
                  { key: 'DT_LT_MoPhong', label: 'Lý thuyết: Mô Phỏng' },
                  { key: 'DT_Cabin', label: 'Cabin' },
                  { key: 'DT_DAT', label: 'DAT' }
                ].map(item => (
                  <div key={item.key} className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col items-center gap-3 hover:border-indigo-300 transition-colors shadow-sm relative group overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-slate-200 to-transparent group-hover:via-indigo-300 transition-all"></div>
                    <h3 className="font-semibold text-sm text-slate-700 text-center">{item.label}</h3>
                    <div className="w-full flex items-center justify-center min-h-[60px]">
                       {renderUploadCell(students.find(s => s.MaDK === uploadStudentModal.MaDK) || uploadStudentModal, item.key)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button onClick={() => setUploadStudentModal(null)} className="px-6 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors font-medium text-sm">Đóng</button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
