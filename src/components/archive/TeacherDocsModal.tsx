"use client";

import { useEffect, useState } from "react";
import { X, Upload, FileText, CheckCircle2, Loader2, ExternalLink, Trash2 } from "lucide-react";
import { getTeacherDocs, saveTeacherDoc, deleteTeacherDoc, TeacherDocRecord } from "@/actions/archive";
import { updateTeacherAvatar } from "@/actions/teachers";

interface TeacherDocsModalProps {
  isOpen: boolean;
  onClose: () => void;
  teacher: any | null;
  onUpdate?: () => void;
}

const DOC_TYPES = [
  "CCCD",
  "GPLX",
  "Bằng tốt nghiệp",
  "NVSP",
  "GVTH",
  "Sơ yếu lý lịch",
  "Đơn xin việc",
  "Giấy khám sức khỏe",
];

export default function TeacherDocsModal({ isOpen, onClose, teacher, onUpdate }: TeacherDocsModalProps) {
  const [docs, setDocs] = useState<TeacherDocRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingType, setUploadingType] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && teacher) {
      setLoading(true);
      setAvatarUrl(teacher.Avatar);
      getTeacherDocs(teacher.Id).then((res) => {
        setDocs(res);
        setLoading(false);
      });
    }
  }, [isOpen, teacher]);

  if (!isOpen || !teacher) return null;

  const handleUpload = async (docType: string, file: File) => {
    setUploadingType(docType);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("objectId", `GV_${teacher.HoTen}`);
      formData.append("docType", docType);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.success && data.webViewLink) {
        // Save to DB
        await saveTeacherDoc(teacher.Id, docType, data.webViewLink);
        
        // Refresh docs
        const updatedDocs = await getTeacherDocs(teacher.Id);
        setDocs(updatedDocs);
        if (onUpdate) onUpdate();
      } else {
        alert("Upload thất bại: " + data.error);
      }
    } catch (error) {
      console.error(error);
      alert("Lỗi upload file");
    } finally {
      setUploadingType(null);
    }
  };

  const handleDelete = async (docId: number) => {
    if (!confirm("Bạn có chắc chắn muốn xóa file này?")) return;
    try {
      setLoading(true);
      await deleteTeacherDoc(docId);
      const updatedDocs = await getTeacherDocs(teacher.Id);
      setDocs(updatedDocs);
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error(error);
      alert("Lỗi khi xóa file");
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (file: File) => {
    setUploadingType("Avatar");
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("objectId", `GV_${teacher.HoTen}`);
      formData.append("docType", "Avatar");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      const avatarFinalUrl = data.thumbnailLink || data.webViewLink || data.webContentLink;
      if (data.success && avatarFinalUrl) { // Use thumbnail for displaying images to bypass Drive cross-origin issues
        // Save to DB
        await updateTeacherAvatar(teacher.Id, avatarFinalUrl);
        setAvatarUrl(avatarFinalUrl);
      } else {
        alert("Upload thất bại: " + data.error);
      }
    } catch (error) {
      console.error(error);
      alert("Lỗi upload file");
    } finally {
      setUploadingType(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 border-b flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-4">
            <div className="relative group">
              {avatarUrl ? (
                <img src={avatarUrl.includes('drive.google.com') ? `/api/proxy-image?url=${encodeURIComponent(avatarUrl)}` : avatarUrl} alt="Avatar" className="w-12 h-12 rounded-full object-cover border border-slate-200" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-black text-lg">
                  {teacher.HoTen.charAt(0)}
                </div>
              )}
              <label 
                className={`absolute inset-0 bg-black/50 text-white rounded-full flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity ${uploadingType === "Avatar" ? "opacity-100" : ""}`}
                title="Thay đổi ảnh đại diện"
              >
                {uploadingType === "Avatar" ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                <input 
                  type="file" 
                  className="hidden" 
                  accept=".png,.jpg,.jpeg"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleAvatarUpload(e.target.files[0]);
                    }
                  }}
                  disabled={uploadingType === "Avatar"}
                />
              </label>
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Hồ sơ Giáo viên</h2>
              <p className="text-sm text-slate-500">{teacher.HoTen} - {teacher.CCCD || "Chưa cập nhật CCCD"}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
            </div>
          ) : (
            <div className="space-y-3">
              {DOC_TYPES.map((type) => {
                const categoryDocs = docs.filter(d => d.LoaiHoSo === type);
                const isUploading = uploadingType === type;

                return (
                  <div key={type} className="flex flex-col p-3 border rounded-lg hover:border-indigo-300 transition-colors bg-white gap-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${categoryDocs.length > 0 ? 'bg-green-100' : 'bg-slate-100'}`}>
                          <FileText className={`w-5 h-5 ${categoryDocs.length > 0 ? 'text-green-600' : 'text-slate-400'}`} />
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-slate-800">{type}</p>
                          <p className="text-xs text-slate-500">
                            {categoryDocs.length > 0 ? `Đã có ${categoryDocs.length} file` : "Chưa có file"}
                          </p>
                        </div>
                      </div>

                      <div className="relative">
                        <input 
                          type="file" 
                          id={`file-${type}`}
                          className="hidden" 
                          accept=".pdf,.png,.jpg,.jpeg"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              handleUpload(type, e.target.files[0]);
                            }
                          }}
                          disabled={isUploading}
                        />
                        <label 
                          htmlFor={`file-${type}`}
                          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer border
                            bg-indigo-600 border-indigo-600 text-white hover:bg-indigo-700
                            ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
                          `}
                        >
                          {isUploading ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <><Upload className="w-3.5 h-3.5" /> Thêm File</>
                          )}
                        </label>
                      </div>
                    </div>

                    {categoryDocs.length > 0 && (
                      <div className="flex flex-col gap-2 mt-2 ml-12">
                        {categoryDocs.map((doc, idx) => (
                          <div key={doc.Id} className="flex items-center justify-between bg-slate-50 p-2 rounded-md border border-slate-100">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-400">#{idx + 1}</span>
                              <span className="text-xs text-slate-600">Tải lên: {new Date(doc.UploadedAt).toLocaleDateString('vi-VN')}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <a 
                                href={doc.FileUrl} 
                                target="_blank" 
                                rel="noreferrer"
                                className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-indigo-700 bg-indigo-100 hover:bg-indigo-200 rounded transition-colors"
                              >
                                <ExternalLink className="w-3 h-3" /> Xem
                              </a>
                              <button 
                                onClick={() => handleDelete(doc.Id)}
                                className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded transition-colors"
                              >
                                <Trash2 className="w-3 h-3" /> Xóa
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
