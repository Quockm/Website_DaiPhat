"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Upload, Trash2, ExternalLink, Loader2, Search, Calendar, FileBadge } from "lucide-react";

type DriveFile = {
  id: string;
  name: string;
  webViewLink: string;
  createdTime: string;
};

export default function DocumentsClient() {
  const [congVanFiles, setCongVanFiles] = useState<DriveFile[]>([]);
  const [quyetDinhFiles, setQuyetDinhFiles] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadingType, setUploadingType] = useState<"cong_van" | "quyet_dinh" | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  const congVanRef = useRef<HTMLInputElement>(null);
  const quyetDinhRef = useRef<HTMLInputElement>(null);

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/documents/files`);
      const data = await res.json();
      setCongVanFiles(data.congVanFiles || []);
      setQuyetDinhFiles(data.quyetDinhFiles || []);
    } catch (err) {
      console.error(err);
      alert("Lỗi: Không thể tải danh sách tài liệu");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleUploadClick = (type: "cong_van" | "quyet_dinh") => {
    if (type === "cong_van") {
      congVanRef.current?.click();
    } else {
      quyetDinhRef.current?.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: "cong_van" | "quyet_dinh") => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    setUploadingType(type);
    
    const formData = new FormData();
    for (let i = 0; i < e.target.files.length; i++) {
      formData.append("file", e.target.files[i]);
    }
    formData.append("docType", type);

    try {
      const res = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        fetchFiles();
      } else {
        alert("Lỗi: " + (data.error || "Tải lên thất bại"));
      }
    } catch (err) {
      alert("Lỗi kết nối khi tải lên");
    }
    
    setUploadingType(null);
    if (type === "cong_van" && congVanRef.current) congVanRef.current.value = "";
    if (type === "quyet_dinh" && quyetDinhRef.current) quyetDinhRef.current.value = "";
  };

  const handleDelete = async (fileId: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa tài liệu này khỏi Google Drive không?")) return;
    
    try {
      const res = await fetch(`/api/documents/delete?fileId=${fileId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setCongVanFiles(prev => prev.filter(f => f.id !== fileId));
        setQuyetDinhFiles(prev => prev.filter(f => f.id !== fileId));
      } else {
        alert("Lỗi: " + (data.error || "Xóa thất bại"));
      }
    } catch (err) {
      alert("Lỗi kết nối khi xóa");
    }
  };

  const filteredCongVan = congVanFiles.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredQuyetDinh = quyetDinhFiles.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN', { 
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    }).format(date);
  };

  const renderFileCard = (file: DriveFile, type: "cong_van" | "quyet_dinh") => {
    const isCV = type === 'cong_van';
    return (
      <div 
        key={file.id} 
        className="group bg-white rounded-xl border border-slate-200 p-4 flex flex-col h-full hover:border-slate-300 hover:shadow-md transition-all"
      >
        <div className="flex items-start gap-3">
          <div className={`p-2.5 rounded-lg ${isCV ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'}`}>
            <FileText className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-slate-700 text-sm leading-tight line-clamp-2" title={file.name}>
              {file.name}
            </h4>
            <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-500">
              <Calendar className="w-3 h-3" />
              <span>{formatDate(file.createdTime)}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100">
          <a 
            href={file.webViewLink} 
            target="_blank" 
            rel="noreferrer"
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" /> Mở tài liệu
          </a>
          <button 
            onClick={() => handleDelete(file.id)}
            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
            title="Xóa tài liệu"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <input 
        type="file" 
        className="hidden" 
        ref={congVanRef} 
        onChange={(e) => handleFileChange(e, "cong_van")} 
        multiple 
        accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg" 
      />
      <input 
        type="file" 
        className="hidden" 
        ref={quyetDinhRef} 
        onChange={(e) => handleFileChange(e, "quyet_dinh")} 
        multiple 
        accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg" 
      />
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">Công văn, Quyết định chung</h1>
          <p className="text-slate-500 mt-1 text-sm">Quản lý và lưu trữ các công văn, quyết định chung của trung tâm trên Google Drive.</p>
        </div>
      </div>

      <Card className="bg-white shadow-sm border-slate-200">
        <CardContent className="p-4 sm:p-6 bg-slate-50 rounded-lg flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm tài liệu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-sm"
            />
          </div>
          <div className="text-sm font-semibold text-slate-600 bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm">
            Tổng cộng: <span className="text-indigo-600">{filteredCongVan.length + filteredQuyetDinh.length}</span> tài liệu
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Cột Công văn */}
          <div className="space-y-5">
            <div className="flex justify-between items-center bg-gradient-to-r from-blue-600 to-indigo-600 p-5 rounded-2xl shadow-lg shadow-blue-500/20 text-white">
              <div className="flex items-center gap-3 font-bold text-lg">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <FileBadge className="w-6 h-6" />
                </div>
                <h2>Công Văn Chung ({filteredCongVan.length})</h2>
              </div>
              <button 
                onClick={() => handleUploadClick("cong_van")}
                disabled={uploadingType !== null}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white text-blue-700 text-sm rounded-xl font-bold hover:bg-blue-50 hover:scale-105 active:scale-95 transition-all shadow-sm disabled:opacity-50 disabled:pointer-events-none"
              >
                {uploadingType === "cong_van" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {uploadingType === "cong_van" ? "Đang tải lên..." : "Tải lên CV"}
              </button>
            </div>
            
            {filteredCongVan.length === 0 ? (
              <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-white/50 backdrop-blur-sm">
                <p className="text-slate-500 font-medium">Chưa có công văn nào</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {filteredCongVan.map(f => renderFileCard(f, 'cong_van'))}
              </div>
            )}
          </div>

          {/* Cột Quyết định */}
          <div className="space-y-5">
            <div className="flex justify-between items-center bg-gradient-to-r from-emerald-500 to-teal-600 p-5 rounded-2xl shadow-lg shadow-emerald-500/20 text-white">
              <div className="flex items-center gap-3 font-bold text-lg">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <FileBadge className="w-6 h-6" />
                </div>
                <h2>Quyết Định Chung ({filteredQuyetDinh.length})</h2>
              </div>
              <button 
                onClick={() => handleUploadClick("quyet_dinh")}
                disabled={uploadingType !== null}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white text-emerald-700 text-sm rounded-xl font-bold hover:bg-emerald-50 hover:scale-105 active:scale-95 transition-all shadow-sm disabled:opacity-50 disabled:pointer-events-none"
              >
                {uploadingType === "quyet_dinh" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {uploadingType === "quyet_dinh" ? "Đang tải lên..." : "Tải lên QĐ"}
              </button>
            </div>
            
            {filteredQuyetDinh.length === 0 ? (
              <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-white/50 backdrop-blur-sm">
                <p className="text-slate-500 font-medium">Chưa có quyết định chung nào</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {filteredQuyetDinh.map(f => renderFileCard(f, 'quyet_dinh'))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
