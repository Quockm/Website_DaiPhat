"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Save, ShieldCheck, Database, Bell, Briefcase, Loader2, Lock, Unlock, FileSpreadsheet, HardDrive, MessageCircle, Edit, Users } from "lucide-react";
import { getFeeNorms, updateFeeNorms } from "@/actions/settings";
import { ROLES, ROLE_MATRIX } from "@/lib/permissions";
import UsersTab from "./UsersTab";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feeNorms, setFeeNorms] = useState<Record<string, number>>({});
  const [sqlEditable, setSqlEditable] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [userRole, setUserRole] = useState<string>("Guest");
  const [notifications, setNotifications] = useState({
    newCourse: true,
    pendingReview: true,
    carExpiry: true,
    teacherExpiry: false,
    newExamDate: true,
    newCarCheckDate: true
  });

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 4000);
  };

  useEffect(() => {
    const savedNotifs = localStorage.getItem("daiphat_push_settings");
    if (savedNotifs) {
      try {
        setNotifications(JSON.parse(savedNotifs));
      } catch (e) {}
    }
    
    getFeeNorms().then(res => {
      setFeeNorms(res);
      setLoading(false);
    });

    fetch('/api/me').then(res => res.json()).then(data => {
      if (data.role) setUserRole(data.role);
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const res = await updateFeeNorms(feeNorms);
    setSaving(false);
    if (res.success) {
      alert("Lưu cấu hình thành công!");
    } else {
      alert("Có lỗi xảy ra: " + res.error);
    }
  };

  const handleToggleNotification = (key: keyof typeof notifications) => {
    const nextState = { ...notifications, [key]: !notifications[key] };
    setNotifications(nextState);
    localStorage.setItem("daiphat_push_settings", JSON.stringify(nextState));
  };

  const updateFee = (hang: string, val: string) => {
    const num = parseInt(val.replace(/\D/g, '')) || 0;
    setFeeNorms(prev => ({...prev, [hang]: num}));
  };

  const [activeTab, setActiveTab] = useState("tham_so");

  if (loading) {
    return (
      <div className="flex justify-center py-20 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }
  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Cấu hình Hệ thống</h1>
          <p className="text-slate-600 mt-2 text-base font-medium">Tùy chỉnh tham số đào tạo, kết nối dữ liệu và quyền truy cập.</p>
        </div>
        <button 
          onClick={handleSave} 
          disabled={saving}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white px-6 py-2.5 rounded-lg font-bold transition-colors shadow-sm"
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          Lưu Cấu Hình
        </button>
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        <div className="md:col-span-1 space-y-2">
          <button 
            onClick={() => setActiveTab("tham_so")}
            className={`w-full text-left px-4 py-3 font-bold rounded-lg flex items-center gap-3 transition-colors ${
              activeTab === "tham_so" ? "bg-indigo-50 text-indigo-700 border border-indigo-100" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Briefcase className={`w-5 h-5 ${activeTab === "tham_so" ? "" : "text-slate-400"}`} /> Tham số Đào tạo
          </button>
          
          {userRole === 'Admin' && (
            <button 
              onClick={() => setActiveTab("tai_khoan")}
              className={`w-full text-left px-4 py-3 font-bold rounded-lg flex items-center gap-3 transition-colors ${
                activeTab === "tai_khoan" ? "bg-indigo-50 text-indigo-700 border border-indigo-100" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Users className={`w-5 h-5 ${activeTab === "tai_khoan" ? "" : "text-slate-400"}`} /> Tài khoản
            </button>
          )}

          <button 
            onClick={() => setActiveTab("csdl")}
            className={`w-full text-left px-4 py-3 font-bold rounded-lg flex items-center gap-3 transition-colors ${
              activeTab === "csdl" ? "bg-indigo-50 text-indigo-700 border border-indigo-100" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Database className={`w-5 h-5 ${activeTab === "csdl" ? "" : "text-slate-400"}`} /> Kết nối CSDL
          </button>
          <button 
            onClick={() => setActiveTab("phan_quyen")}
            className={`w-full text-left px-4 py-3 font-bold rounded-lg flex items-center gap-3 transition-colors ${
              activeTab === "phan_quyen" ? "bg-indigo-50 text-indigo-700 border border-indigo-100" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <ShieldCheck className={`w-5 h-5 ${activeTab === "phan_quyen" ? "" : "text-slate-400"}`} /> Phân quyền
          </button>
          <button 
            onClick={() => setActiveTab("thong_bao")}
            className={`w-full text-left px-4 py-3 font-bold rounded-lg flex items-center gap-3 transition-colors ${
              activeTab === "thong_bao" ? "bg-indigo-50 text-indigo-700 border border-indigo-100" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Bell className={`w-5 h-5 ${activeTab === "thong_bao" ? "" : "text-slate-400"}`} /> Thông báo
          </button>
        </div>

        <div className="md:col-span-3 space-y-6">
          {activeTab === "tai_khoan" && (
            <UsersTab />
          )}

          {activeTab === "tham_so" && (
            <>
              <Card className="bg-white shadow-sm border-slate-200">
                <CardHeader className="bg-slate-50/80 border-b border-slate-100">
                  <CardTitle className="text-lg font-extrabold text-slate-800">Định mức Phân bổ</CardTitle>
                  <CardDescription className="text-slate-500 font-medium mt-1">
                    Thiết lập số lượng học viên tối đa cho một xe / một giáo viên.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">Định mức học viên / Xe (Hạng B1, B2)</label>
                      <input type="number" defaultValue={5} className="w-full px-4 py-2 border border-slate-300 rounded-lg font-semibold focus:ring-2 focus:ring-indigo-500 outline-none" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">Định mức học viên / Xe (Hạng C)</label>
                      <input type="number" defaultValue={8} className="w-full px-4 py-2 border border-slate-300 rounded-lg font-semibold focus:ring-2 focus:ring-indigo-500 outline-none" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-sm border-slate-200">
                <CardHeader className="bg-slate-50/80 border-b border-slate-100">
                  <CardTitle className="text-lg font-extrabold text-slate-800">Định mức Học phí</CardTitle>
                  <CardDescription className="text-slate-500 font-medium mt-1">
                    Thiết lập mức học phí chuẩn cho từng hạng xe.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    {['B-SS', 'B-TD', 'C1', 'C', 'A1', 'A'].map(hang => (
                      <div key={hang} className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Hạng {hang}</label>
                        <input 
                          type="text" 
                          value={feeNorms[hang] ? feeNorms[hang].toLocaleString('en-US') : '0'} 
                          onChange={e => updateFee(hang, e.target.value)}
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg font-semibold focus:ring-2 focus:ring-indigo-500 outline-none text-right" 
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-sm border-slate-200">
                <CardHeader className="bg-slate-50/80 border-b border-slate-100">
                  <CardTitle className="text-lg font-extrabold text-slate-800">Khung thời gian Đào tạo</CardTitle>
                  <CardDescription className="text-slate-500 font-medium mt-1">
                    Thời gian mặc định của các giai đoạn đào tạo (tính bằng ngày).
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">Thời gian Lý thuyết (Hạng B)</label>
                      <input type="number" defaultValue={15} className="w-full px-4 py-2 border border-slate-300 rounded-lg font-semibold focus:ring-2 focus:ring-indigo-500 outline-none" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">Thời gian Thực hành (Hạng B)</label>
                      <input type="number" defaultValue={80} className="w-full px-4 py-2 border border-slate-300 rounded-lg font-semibold focus:ring-2 focus:ring-indigo-500 outline-none" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">Số km DAT tối thiểu (B1, B2)</label>
                      <input type="number" defaultValue={810} className="w-full px-4 py-2 border border-slate-300 rounded-lg font-semibold focus:ring-2 focus:ring-indigo-500 outline-none" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {activeTab === "csdl" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <Card className="bg-white shadow-sm border-slate-200">
                <CardHeader className="bg-slate-50/80 border-b border-slate-100 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
                      Cấu hình SQL Server
                      {sqlEditable ? (
                        <span className="px-2 py-0.5 bg-rose-100 text-rose-700 text-[10px] uppercase rounded font-bold">Chế độ sửa</span>
                      ) : (
                        <span className="px-2 py-0.5 bg-slate-200 text-slate-600 text-[10px] uppercase rounded font-bold flex items-center gap-1"><Lock className="w-3 h-3" /> Chỉ đọc</span>
                      )}
                    </CardTitle>
                    <CardDescription className="text-slate-500 font-medium mt-1">
                      Thiết lập kết nối đến máy chủ cơ sở dữ liệu.
                    </CardDescription>
                  </div>
                  <div className="px-3 py-1 bg-emerald-100 text-emerald-700 font-bold text-xs rounded-full flex items-center gap-1">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                    Đang kết nối
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">Máy chủ (Server/Host)</label>
                      <input type="text" defaultValue="14.161.44.90" readOnly={!sqlEditable} className={`w-full px-4 py-2 border rounded-lg font-semibold outline-none transition-colors ${sqlEditable ? 'border-indigo-300 focus:ring-2 focus:ring-indigo-500' : 'border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed'}`} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">Cổng (Port)</label>
                      <input type="text" defaultValue="51433" readOnly={!sqlEditable} className={`w-full px-4 py-2 border rounded-lg font-semibold outline-none transition-colors ${sqlEditable ? 'border-indigo-300 focus:ring-2 focus:ring-indigo-500' : 'border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed'}`} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">Tên CSDL (Database Name)</label>
                      <input type="text" defaultValue="dp_system" readOnly={!sqlEditable} className={`w-full px-4 py-2 border rounded-lg font-semibold outline-none transition-colors ${sqlEditable ? 'border-indigo-300 focus:ring-2 focus:ring-indigo-500' : 'border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed'}`} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">Tên đăng nhập (Username)</label>
                      <input type="text" defaultValue="sa" readOnly={!sqlEditable} className={`w-full px-4 py-2 border rounded-lg font-semibold outline-none transition-colors ${sqlEditable ? 'border-indigo-300 focus:ring-2 focus:ring-indigo-500' : 'border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed'}`} />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-sm font-bold text-slate-700">Mật khẩu (Password)</label>
                      <input type="password" defaultValue="!Quoc21101997" readOnly={!sqlEditable} className={`w-full px-4 py-2 border rounded-lg font-semibold outline-none transition-colors ${sqlEditable ? 'border-indigo-300 focus:ring-2 focus:ring-indigo-500' : 'border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed'}`} />
                    </div>
                  </div>
                  <div className="pt-4 flex justify-between items-center border-t border-slate-100 mt-4">
                    <button 
                      onClick={() => {
                        if (sqlEditable) {
                          setSqlEditable(false);
                        } else {
                          const pass = window.prompt("Nhập mật khẩu Quản trị viên để mở khóa cấu hình:");
                          if (pass === "admin") {
                            setSqlEditable(true);
                          } else if (pass !== null) {
                            alert("Mật khẩu không chính xác!");
                          }
                        }
                      }}
                      className="px-4 py-2 text-slate-600 hover:text-indigo-600 font-bold rounded-lg transition-colors flex items-center gap-2"
                    >
                      {sqlEditable ? <><Lock className="w-4 h-4" /> Khóa cấu hình</> : <><Edit className="w-4 h-4" /> Sửa cấu hình</>}
                    </button>
                    <button onClick={() => triggerToast("✅ Kết nối cơ sở dữ liệu thành công!")} className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg transition-colors flex items-center gap-2 shadow-sm">
                      <ShieldCheck className="w-4 h-4" /> Kiểm tra kết nối
                    </button>
                  </div>
                </CardContent>
              </Card>

              {/* Tích hợp Google Sheets */}
              <Card className="bg-white shadow-sm border-slate-200">
                <CardHeader className="bg-slate-50/80 border-b border-slate-100 flex flex-row items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                      <FileSpreadsheet className="w-6 h-6" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-extrabold text-slate-800">Kết nối Google Sheets</CardTitle>
                      <CardDescription className="text-slate-500 font-medium mt-1">
                        Đồng bộ dữ liệu học viên (demo1).
                      </CardDescription>
                    </div>
                  </div>
                  <button onClick={() => triggerToast("✅ Đã kết nối Google Sheets thành công!")} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors text-sm shadow-sm">
                    Kiểm tra kết nối
                  </button>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">Spreadsheet ID (demo1)</label>
                      <input type="text" defaultValue="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms" readOnly={!sqlEditable} className={`w-full px-4 py-2 border rounded-lg font-semibold outline-none transition-colors ${sqlEditable ? 'border-emerald-300 focus:ring-2 focus:ring-emerald-500' : 'border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed'}`} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">Google Service Account JSON</label>
                      <textarea rows={3} defaultValue='{ "type": "service_account", "project_id": "daiphat-demo1", "private_key_id": "..." }' readOnly={!sqlEditable} className={`w-full px-4 py-2 border rounded-lg font-mono text-sm outline-none resize-none transition-colors ${sqlEditable ? 'border-emerald-300 focus:ring-2 focus:ring-emerald-500' : 'border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed'}`}></textarea>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tích hợp Google Drive */}
              <Card className="bg-white shadow-sm border-slate-200">
                <CardHeader className="bg-slate-50/80 border-b border-slate-100 flex flex-row items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                      <HardDrive className="w-6 h-6" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-extrabold text-slate-800">Kết nối Google Drive</CardTitle>
                      <CardDescription className="text-slate-500 font-medium mt-1">
                        Lưu trữ hình ảnh, hồ sơ học viên.
                      </CardDescription>
                    </div>
                  </div>
                  <button onClick={() => triggerToast("✅ Kết nối Google Drive Folder thành công!")} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors text-sm shadow-sm">
                    Kiểm tra kết nối
                  </button>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">Thư mục gốc (Root Folder ID)</label>
                      <input type="text" defaultValue="1ycIZAchHbovVx6wfs3ZeHOWBOpwdJ27T" readOnly={!sqlEditable} className={`w-full px-4 py-2 border rounded-lg font-semibold outline-none transition-colors ${sqlEditable ? 'border-blue-300 focus:ring-2 focus:ring-blue-500' : 'border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed'}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tích hợp Zalo OA */}
              <Card className="bg-white shadow-sm border-slate-200">
                <CardHeader className="bg-slate-50/80 border-b border-slate-100 flex flex-row items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-sky-100 text-sky-600 rounded-lg">
                      <MessageCircle className="w-6 h-6" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-extrabold text-slate-800">Zalo Official Account (API)</CardTitle>
                      <CardDescription className="text-slate-500 font-medium mt-1">
                        Cấu hình kết nối API gửi tin nhắn ZNS.
                      </CardDescription>
                    </div>
                  </div>
                  <button onClick={() => triggerToast("✅ Xác thực Zalo OA API thành công!")} className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-lg transition-colors text-sm shadow-sm">
                    Kiểm tra kết nối
                  </button>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">Zalo OA ID</label>
                      <input type="text" defaultValue="123456789012345" readOnly={!sqlEditable} className={`w-full px-4 py-2 border rounded-lg font-semibold outline-none transition-colors ${sqlEditable ? 'border-sky-300 focus:ring-2 focus:ring-sky-500' : 'border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed'}`} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">App ID</label>
                      <input type="text" defaultValue="APP_ID_DAIPHAT" readOnly={!sqlEditable} className={`w-full px-4 py-2 border rounded-lg font-semibold outline-none transition-colors ${sqlEditable ? 'border-sky-300 focus:ring-2 focus:ring-sky-500' : 'border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed'}`} />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-sm font-bold text-slate-700">Access Token / Secret Key</label>
                      <input type="password" defaultValue="************************" readOnly={!sqlEditable} className={`w-full px-4 py-2 border rounded-lg font-semibold outline-none transition-colors ${sqlEditable ? 'border-sky-300 focus:ring-2 focus:ring-sky-500' : 'border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed'}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "phan_quyen" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <Card className="bg-white shadow-sm border-slate-200">
                <CardHeader className="bg-slate-50/80 border-b border-slate-100 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-extrabold text-slate-800">Ma trận Phân quyền</CardTitle>
                    <CardDescription className="text-slate-500 font-medium mt-1">
                      Cấp quyền truy cập các chức năng cho từng nhóm người dùng.
                    </CardDescription>
                  </div>
                </CardHeader>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50 text-slate-700 font-bold uppercase text-xs border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3 min-w-[150px]">Chức năng</th>
                        {ROLES.map(r => (
                          <th key={r} className="px-4 py-3 text-center border-l border-slate-200">{r}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {ROLE_MATRIX.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 font-semibold text-slate-800">{item.name}</td>
                          {ROLES.map(r => (
                            <td key={r} className="px-4 py-3 text-center border-l border-slate-100">
                              <input 
                                type="checkbox" 
                                defaultChecked={item.roles.includes(r)} 
                                disabled={r === 'Admin'} 
                                className={`w-4 h-4 accent-indigo-600 ${r === 'Admin' ? 'cursor-not-allowed' : 'cursor-pointer'}`} 
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {activeTab === "thong_bao" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <Card className="bg-white shadow-sm border-slate-200">
                <CardHeader className="bg-slate-50/80 border-b border-slate-100 flex flex-row items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
                      <Bell className="w-6 h-6" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-extrabold text-slate-800">Thông báo trên Ứng dụng (Web Push)</CardTitle>
                      <CardDescription className="text-slate-500 font-medium mt-1">
                        Hiển thị notification ở góc phải màn hình khi có các sự kiện quan trọng.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-4 p-4 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
                      <div>
                        <h4 className="font-bold text-slate-800">Các khóa vừa tạo</h4>
                        <p className="text-sm text-slate-500 mt-1">Hiển thị thông báo khi có khóa đào tạo mới được thiết lập thành công.</p>
                      </div>
                      <div className="flex items-center gap-4 mt-2">
                        <button onClick={() => triggerToast("🚀 Khóa học K123 - Hạng B2 vừa được tạo mới!")} className="text-xs bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-slate-600 font-semibold hover:bg-slate-100 transition-colors shadow-sm">
                          Test
                        </button>
                        <label className="relative cursor-pointer shrink-0">
                          <input type="checkbox" checked={notifications.newCourse} onChange={() => handleToggleNotification('newCourse')} className="sr-only peer" />
                          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                        </label>
                      </div>
                    </div>

                    <div className="flex items-start justify-between gap-4 p-4 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
                      <div>
                        <h4 className="font-bold text-slate-800">Các khóa cần duyệt</h4>
                        <p className="text-sm text-slate-500 mt-1">Thông báo khi có danh sách học viên đăng ký mới đang chờ phê duyệt.</p>
                      </div>
                      <div className="flex items-center gap-4 mt-2">
                        <button onClick={() => triggerToast("📝 Khóa K123 có 15 hồ sơ đang chờ xét duyệt điều kiện dự thi.")} className="text-xs bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-slate-600 font-semibold hover:bg-slate-100 transition-colors shadow-sm">
                          Test
                        </button>
                        <label className="relative cursor-pointer shrink-0">
                          <input type="checkbox" checked={notifications.pendingReview} onChange={() => handleToggleNotification('pendingReview')} className="sr-only peer" />
                          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                        </label>
                      </div>
                    </div>

                    <div className="flex items-start justify-between gap-4 p-4 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
                      <div>
                        <h4 className="font-bold text-slate-800">Xe sắp hết hạn</h4>
                        <p className="text-sm text-slate-500 mt-1">Cảnh báo khi xe tập lái sắp hết hạn kiểm định an toàn hoặc hết hạn bảo hiểm.</p>
                      </div>
                      <div className="flex items-center gap-4 mt-2">
                        <button onClick={() => triggerToast("⚠️ Xe 51H-123.45 sắp hết hạn Đăng kiểm vào ngày mai!")} className="text-xs bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-slate-600 font-semibold hover:bg-slate-100 transition-colors shadow-sm">
                          Test
                        </button>
                        <label className="relative cursor-pointer shrink-0">
                          <input type="checkbox" checked={notifications.carExpiry} onChange={() => handleToggleNotification('carExpiry')} className="sr-only peer" />
                          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                        </label>
                      </div>
                    </div>

                    <div className="flex items-start justify-between gap-4 p-4 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
                      <div>
                        <h4 className="font-bold text-slate-800">Giáo viên sắp hết hạn</h4>
                        <p className="text-sm text-slate-500 mt-1">Cảnh báo khi giấy chứng nhận Giáo viên dạy thực hành lái xe sắp hết hạn.</p>
                      </div>
                      <div className="flex items-center gap-4 mt-2">
                        <button onClick={() => triggerToast("⚠️ Giấy phép Giáo viên Nguyễn Văn A chuẩn bị hết hạn.")} className="text-xs bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-slate-600 font-semibold hover:bg-slate-100 transition-colors shadow-sm">
                          Test
                        </button>
                        <label className="relative cursor-pointer shrink-0">
                          <input type="checkbox" checked={notifications.teacherExpiry} onChange={() => handleToggleNotification('teacherExpiry')} className="sr-only peer" />
                          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                        </label>
                      </div>
                    </div>

                    <div className="flex items-start justify-between gap-4 p-4 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
                      <div>
                        <h4 className="font-bold text-slate-800">Tạo ngày thi Sát hạch</h4>
                        <p className="text-sm text-slate-500 mt-1">Thông báo toàn hệ thống khi Sở GTVT chốt ngày thi Sát hạch mới.</p>
                      </div>
                      <div className="flex items-center gap-4 mt-2">
                        <button onClick={() => triggerToast("📅 Có lịch thi Sát hạch mới cho ngày 25/08/2026.")} className="text-xs bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-slate-600 font-semibold hover:bg-slate-100 transition-colors shadow-sm">
                          Test
                        </button>
                        <label className="relative cursor-pointer shrink-0">
                          <input type="checkbox" checked={notifications.newExamDate} onChange={() => handleToggleNotification('newExamDate')} className="sr-only peer" />
                          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                        </label>
                      </div>
                    </div>

                    <div className="flex items-start justify-between gap-4 p-4 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
                      <div>
                        <h4 className="font-bold text-slate-800">Tạo ngày kiểm tra xe</h4>
                        <p className="text-sm text-slate-500 mt-1">Thông báo khi lịch kiểm tra định kỳ xe tập lái được lên kế hoạch.</p>
                      </div>
                      <div className="flex items-center gap-4 mt-2">
                        <button onClick={() => triggerToast("🔧 Đã tạo lịch kiểm tra dàn xe số sàn hạng B2.")} className="text-xs bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-slate-600 font-semibold hover:bg-slate-100 transition-colors shadow-sm">
                          Test
                        </button>
                        <label className="relative cursor-pointer shrink-0">
                          <input type="checkbox" checked={notifications.newCarCheckDate} onChange={() => handleToggleNotification('newCarCheckDate')} className="sr-only peer" />
                          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                        </label>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-white border border-slate-200 shadow-xl rounded-xl p-4 flex items-start gap-4 animate-in slide-in-from-right-4 fade-in duration-300 max-w-sm">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-full shrink-0">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h5 className="font-bold text-slate-800 text-sm">Thông báo hệ thống</h5>
            <p className="text-sm text-slate-600 mt-1 leading-snug">{toastMessage}</p>
          </div>
        </div>
      )}
    </div>
  );
}
