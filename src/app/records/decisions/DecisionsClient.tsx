"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FileText, Download, CheckCircle2, Filter, Upload, Trash2, ExternalLink, Loader2 } from "lucide-react";

type Props = {
  courses: string[];
};

type DriveFile = {
  id: string;
  name: string;
  webViewLink: string;
};

const STAGES = [
  {
    id: "stage-1",
    title: "Giai đoạn 1: Chuẩn bị Khai Giảng (Mở khóa)",
    description: "Các biểu mẫu báo cáo và thông báo mở khóa đào tạo gửi Sở GTVT.",
    documents: [
      { id: "Bao_Cao_Mo_Khoa", name: "Báo cáo mở khóa đào tạo", template: "Bao_Cao_Mo_Khoa.docx" },
      { id: "Quyet_Dinh_Mo_Khoa", name: "Quyết định mở khóa", template: "Quyet_Dinh_Mo_Khoa.docx" },
      { id: "Thong_Bao_Chieu_Sinh", name: "Thông báo chiêu sinh", template: "Thong_Bao_Chieu_Sinh.docx" },
    ]
  },
  {
    id: "stage-2",
    title: "Giai đoạn 2: Tổ chức Kỳ thi (Kiểm tra HTKH)",
    description: "Hồ sơ chuẩn bị cho kỳ thi hoàn thành khóa học tại Trung tâm.",
    documents: [
      { id: "11_0_Bia_Quyet_Dinh", name: "11.0 Bìa Quyết định", template: "11_0_Bia_Quyet_Dinh.docx" },
      { id: "11_1_QD_Thanh_Lap_Hoi_Dong", name: "11.1 Quyết định thành lập Hội đồng xét HTKH", template: "11_1_QD_Thanh_Lap_Hoi_Dong.docx" },
      { id: "11_2_QD_Ban_Chuc_Nang", name: "11.2 Quyết định Ban chức năng, phân công", template: "11_2_QD_Ban_Chuc_Nang.docx" },
      { id: "11_4_QD_Cong_Nhan_Du_DK", name: "11.4 Quyết định công nhận đủ điều kiện thi", template: "11_4_QD_Cong_Nhan_Du_DK.docx" },
      { id: "11_5_TB_Ky_Tot_Nghiep", name: "11.5 Thông báo kỳ tốt nghiệp", template: "11_5_TB_Ky_Tot_Nghiep.docx" },
    ]
  },
  {
    id: "stage-3",
    title: "Giai đoạn 3: Kết quả thi & Xét tốt nghiệp",
    description: "Biên bản và quyết định công nhận kết quả sau kỳ thi.",
    documents: [
      { id: "11_3_BB_Hop_Hoi_Dong_Lan_1", name: "11.3 Biên bản họp Hội đồng lần 1", template: "11_3_BB_Hop_Hoi_Dong_Lan_1.docx" },
      { id: "11_6_BB_Hop_Hoi_Dong_Lan_2", name: "11.6 Biên bản họp Hội đồng lần 2", template: "11_6_BB_Hop_Hoi_Dong_Lan_2.docx" },
      { id: "11_7_BB_Tong_Hop_Ket_Qua", name: "11.7 Biên bản tổng hợp kết quả", template: "11_7_BB_Tong_Hop_Ket_Qua.docx" },
      { id: "11_9_QD_Cong_Nhan_Va_Cap_Giay", name: "11.8/11.9 Quyết định công nhận kết quả & cấp giấy", template: "11_9_QD_Cong_Nhan_Va_Cap_Giay.docx" },
    ]
  }
];

export default function DecisionsClient({ courses }: Props) {
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [category, setCategory] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadingDocId, setUploadingDocId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentDocId, setCurrentDocId] = useState<string | null>(null);

  const filteredCourses = courses.filter(c => {
    let matchCategory = true;
    if (category === 'B01') matchCategory = c.includes('B01');
    else if (category === 'B') matchCategory = c.includes('B') && !c.includes('B01');
    else if (category === 'C1') matchCategory = c.includes('C1') || c.includes('C');
    else if (category === 'A1') matchCategory = c.includes('A1');
    else if (category === 'A') matchCategory = c.includes('A') && !c.includes('A1') && !c.includes('A2');
    
    const matchSearch = c.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  const totalDocs = STAGES.reduce((acc, stage) => acc + stage.documents.length, 0);
  const uploadedDocsCount = STAGES.reduce((acc, stage) => {
    return acc + stage.documents.filter(doc => files.some(f => f.name.startsWith(doc.id + "."))).length;
  }, 0);
  const progressPercent = totalDocs === 0 ? 0 : Math.round((uploadedDocsCount / totalDocs) * 100);

  const fetchFiles = async (courseId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/decisions/files?courseId=${encodeURIComponent(courseId)}`);
      const data = await res.json();
      if (data.files) {
        setFiles(data.files);
      } else {
        setFiles([]);
      }
    } catch (err) {
      console.error(err);
      alert("Lỗi: Không thể tải danh sách file");
    }
    setLoading(false);
  };

  useEffect(() => {
    if (selectedCourse) {
      fetchFiles(selectedCourse);
    } else {
      setFiles([]);
    }
  }, [selectedCourse]);

  const handleUploadClick = (docId: string) => {
    setCurrentDocId(docId);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !currentDocId || !selectedCourse) return;
    
    const file = e.target.files[0];
    setUploadingDocId(currentDocId);
    
    const formData = new FormData();
    formData.append("file", file);
    formData.append("courseId", selectedCourse);
    formData.append("docId", currentDocId);
    formData.append("fileName", file.name);

    try {
      const res = await fetch("/api/decisions/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        alert("Đã tải file lên Google Drive thành công");
        fetchFiles(selectedCourse);
      } else {
        alert("Lỗi: " + (data.error || "Tải lên thất bại"));
      }
    } catch (err) {
      alert("Lỗi kết nối khi tải lên");
    }
    
    setUploadingDocId(null);
    setCurrentDocId(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDelete = async (fileId: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa file này khỏi Google Drive không?")) return;
    
    try {
      const res = await fetch(`/api/decisions/delete?fileId=${fileId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        alert("File đã được xóa thành công");
        setFiles(files.filter(f => f.id !== fileId));
      } else {
        alert("Lỗi: " + (data.error || "Xóa thất bại"));
      }
    } catch (err) {
      alert("Lỗi kết nối khi xóa");
    }
  };

  const getUploadedFile = (docId: string) => {
    return files.find(f => f.name.startsWith(docId + "."));
  };

  return (
    <div className="space-y-6">
      <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileChange} accept=".pdf,.doc,.docx,.xls,.xlsx" />
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">Lưu trữ Quyết định (Hồ sơ khóa học)</h1>
          <p className="text-slate-500 mt-1">Quản lý và lưu trữ các biểu mẫu, quyết định đã hoàn thiện lên Google Drive theo Khóa đào tạo.</p>
        </div>
      </div>

      <Card className="bg-white shadow-sm border-slate-200">
        <CardContent className="p-4 sm:p-6 flex flex-col gap-4 bg-slate-50 rounded-lg">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="w-full sm:w-48">
              <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Lọc Hạng</label>
              <select
                value={category}
                onChange={(e) => { setCategory(e.target.value); setSelectedCourse(""); }}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium"
              >
                <option value="">Tất cả hạng</option>
                <option value="B">Hạng B</option>
                <option value="B01">Hạng B01</option>
                <option value="C1">Hạng C1</option>
                <option value="A1">Hạng A1</option>
                <option value="A">Hạng A</option>
              </select>
            </div>

            <div className="w-full sm:w-48">
              <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Tìm Kiếm</label>
              <input
                type="text"
                placeholder="Nhập mã khóa..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setSelectedCourse(""); }}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium"
              />
            </div>

            <div className="flex-1 w-full sm:w-auto">
              <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Chọn Khóa Đào Tạo ({filteredCourses.length})</label>
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm font-medium"
              >
                <option value="">-- Vui lòng chọn Khóa --</option>
                {filteredCourses.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
          
          {selectedCourse && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-2 pt-4 border-t border-slate-200">
              <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-md border border-indigo-200 w-full sm:w-auto">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span className="text-sm font-semibold truncate">Đang quản lý: {selectedCourse}</span>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="text-sm font-medium text-slate-600 whitespace-nowrap">
                  Tiến độ: <span className="font-bold text-slate-800">{uploadedDocsCount}/{totalDocs}</span> tài liệu
                </div>
                <div className="w-full sm:w-48 h-2.5 bg-slate-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 ${progressPercent === 100 ? 'bg-green-500' : 'bg-indigo-500'}`} 
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <div className={`text-xs font-bold w-9 text-right ${progressPercent === 100 ? 'text-green-600' : 'text-indigo-600'}`}>
                  {progressPercent}%
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {!selectedCourse ? (
        <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
          <FileText className="w-12 h-12 text-slate-300 mb-4" />
          <h3 className="text-lg font-semibold text-slate-700">Chưa chọn Khóa đào tạo</h3>
          <p className="text-slate-500 max-w-md mt-2">Vui lòng chọn một khóa học ở menu phía trên để hiển thị hoặc tải lên hồ sơ Quyết định.</p>
        </div>
      ) : loading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {STAGES.map((stage, index) => (
            <div key={stage.id} className="flex flex-col gap-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm shrink-0 border border-indigo-200">
                  {index + 1}
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 leading-tight">{stage.title.split(': ')[1]}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{stage.description}</p>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                {stage.documents.map(doc => {
                  const uploadedFile = getUploadedFile(doc.id);
                  const isUploading = uploadingDocId === doc.id;
                  
                  return (
                    <Card key={doc.id} className={`group hover:border-indigo-300 hover:shadow-md transition-all duration-200 overflow-hidden cursor-default ${uploadedFile ? 'bg-green-50/30 border-green-200' : ''}`}>
                      <CardContent className="p-3 sm:p-4">
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-md transition-colors mt-1 ${uploadedFile ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-500 group-hover:bg-indigo-100 group-hover:text-indigo-600'}`}>
                            {uploadedFile ? <CheckCircle2 className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-semibold text-slate-800 leading-snug">
                              {doc.name}
                            </h4>
                            <div className="flex items-center gap-2 mt-2">
                              {uploadedFile ? (
                                <div className="flex items-center gap-2 w-full">
                                  <a 
                                    href={uploadedFile.webViewLink} 
                                    target="_blank" 
                                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white border border-slate-200 text-slate-700 rounded shadow-sm hover:bg-slate-50 hover:text-indigo-600 transition-colors"
                                  >
                                    <ExternalLink className="w-3.5 h-3.5" /> Xem file
                                  </a>
                                  <button 
                                    onClick={() => handleDelete(uploadedFile.id)}
                                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                    title="Xóa file"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center justify-between w-full">
                                  <button 
                                    onClick={() => handleUploadClick(doc.id)}
                                    disabled={isUploading}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded transition-colors disabled:opacity-50"
                                  >
                                    {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                                    {isUploading ? "Đang tải lên..." : "Tải lên bản chính"}
                                  </button>
                                  <a 
                                    href={`/templates/decisions/${doc.template}`}
                                    download={`${selectedCourse}_${doc.template}`}
                                    className="text-xs text-slate-400 hover:text-indigo-600 flex items-center gap-1 underline underline-offset-2"
                                    title="Tải biểu mẫu trống"
                                  >
                                    <Download className="w-3 h-3" /> Mẫu
                                  </a>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

