"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useState } from "react";
import { updateZaloConfig, refreshZaloToken, checkZaloConnection, checkZaloTemplate } from "@/actions/zalo";
import { Save, RefreshCw, Key, Link as LinkIcon, Settings, Activity, FileCheck } from "lucide-react";

export default function ConfigClient({ initialConfig }: { initialConfig: any }) {
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [checking, setChecking] = useState(false);
  
  const [config, setConfig] = useState({
    AppID: initialConfig?.AppID || "",
    SecretKey: initialConfig?.SecretKey || "",
    AccessToken: initialConfig?.AccessToken || "",
    RefreshToken: initialConfig?.RefreshToken || "",
    TemplateID_Moto: initialConfig?.TemplateID_Moto || "",
    TemplateID_Oto: initialConfig?.TemplateID_Oto || "",
    TemplateID_Oto_Stage2: initialConfig?.TemplateID_Oto_Stage2 || "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfig({ ...config, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setLoading(true);
    const res = await updateZaloConfig(config);
    setLoading(false);
    if (res.success) {
      alert("Lưu cấu hình thành công!");
    } else {
      alert("Lỗi: " + res.error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    const res = await refreshZaloToken();
    setRefreshing(false);
    if (res.success) {
      alert("Đã lấy Access Token mới thành công! Tải lại trang để xem token mới.");
      window.location.reload();
    } else {
      alert("Lỗi Refresh Token: " + res.error);
    }
  };

  const handleCheckConnection = async () => {
    if (!config.AccessToken) {
      alert("Vui lòng nhập Access Token trước khi kiểm tra!");
      return;
    }
    
    setChecking(true);
    let messages: string[] = [];
    let hasError = false;

    // 1. Kiểm tra kết nối Zalo OA
    const resConn = await checkZaloConnection(config.AccessToken);
    if (resConn.success) {
      messages.push(`✅ OA: ${resConn.message}`);
    } else {
      messages.push(`❌ OA: ${resConn.error}`);
      hasError = true;
    }

    // 2. Kiểm tra Mẫu MOTO
    if (config.TemplateID_Moto) {
      const resMoto = await checkZaloTemplate(config.TemplateID_Moto, config.AccessToken);
      if (resMoto.success) messages.push(`✅ MOTO: ${resMoto.message}`);
      else { messages.push(`❌ MOTO: ${resMoto.error}`); hasError = true; }
    }

    // 3. Kiểm tra Mẫu OTO GĐ1
    if (config.TemplateID_Oto) {
      const resOto1 = await checkZaloTemplate(config.TemplateID_Oto, config.AccessToken);
      if (resOto1.success) messages.push(`✅ OTO GĐ1: ${resOto1.message}`);
      else { messages.push(`❌ OTO GĐ1: ${resOto1.error}`); hasError = true; }
    }

    // 4. Kiểm tra Mẫu OTO GĐ2
    if (config.TemplateID_Oto_Stage2) {
      const resOto2 = await checkZaloTemplate(config.TemplateID_Oto_Stage2, config.AccessToken);
      if (resOto2.success) messages.push(`✅ OTO GĐ2: ${resOto2.message}`);
      else { messages.push(`❌ OTO GĐ2: ${resOto2.error}`); hasError = true; }
    }

    // 5. Nếu không có lỗi, tự động lưu
    if (!hasError) {
      messages.push("\nĐang lưu cấu hình...");
      const resSave = await updateZaloConfig(config);
      if (resSave.success) {
        messages.push("✅ Đã lưu toàn bộ cấu hình thành công!");
      } else {
        messages.push(`❌ Lỗi lưu cấu hình: ${resSave.error}`);
      }
    } else {
      messages.push("\n⚠️ Có lỗi xảy ra trong quá trình kiểm tra. Vui lòng khắc phục trước khi lưu.");
    }

    setChecking(false);
    alert(messages.join('\n'));
  };

  const handleCheckTemplate = async (templateId: string) => {
    if (!templateId) {
      alert("Vui lòng nhập ID Mẫu trước khi kiểm tra!");
      return;
    }
    if (!config.AccessToken) {
      alert("Vui lòng nhập Access Token trước khi kiểm tra!");
      return;
    }
    setChecking(true);
    const res = await checkZaloTemplate(templateId, config.AccessToken);
    setChecking(false);
    if (res.success) {
      alert(res.message);
    } else {
      alert(res.error);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
          <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg">
            <Settings className="w-6 h-6" />
          </div>
          Cấu hình Cổng Zalo OA
        </h1>
        <p className="text-slate-600 mt-2 text-base font-medium">Thiết lập kết nối với Zalo ZNS để gửi thông báo tự động.</p>
      </div>

      <Card className="shadow-md border-slate-200">
        <CardHeader className="bg-slate-50 border-b border-slate-100">
          <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Key className="w-5 h-5 text-indigo-600" />
            Thông số Xác thực & Token
          </CardTitle>
          <CardDescription>Bạn có thể lấy các thông số này tại Zalo Developer (ứng dụng Zalo Mini App / Zalo OA).</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">App ID</label>
              <input 
                name="AppID" value={config.AppID} onChange={handleChange} 
                className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono text-sm" 
                placeholder="VD: 19827391823719"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Secret Key</label>
              <input 
                type="password" name="SecretKey" value={config.SecretKey} onChange={handleChange} 
                className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono text-sm" 
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-semibold text-slate-700 flex justify-between">
                <span>Refresh Token (Cần để lấy Access Token tự động)</span>
              </label>
              <input 
                name="RefreshToken" value={config.RefreshToken} onChange={handleChange} 
                className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono text-sm" 
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-semibold text-slate-700 flex justify-between">
                <span>Access Token (Dùng để gọi API, sống trong 24h)</span>
                {initialConfig?.LastRefresh && <span className="text-indigo-600 font-medium">Làm mới lần cuối: {new Date(initialConfig.LastRefresh).toLocaleString('vi-VN')}</span>}
              </label>
              <div className="flex gap-2">
                <input 
                  name="AccessToken" value={config.AccessToken} onChange={handleChange} 
                  className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono text-sm" 
                />
                <button 
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="shrink-0 px-4 py-2 bg-indigo-100 text-indigo-700 font-bold rounded-lg flex items-center gap-2 hover:bg-indigo-200 transition-colors"
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
                  Lấy Token Mới
                </button>
                <button 
                  onClick={handleCheckConnection}
                  disabled={checking}
                  className="shrink-0 px-4 py-2 bg-emerald-100 text-emerald-700 font-bold rounded-lg flex items-center gap-2 hover:bg-emerald-200 transition-colors"
                >
                  <Activity className={`w-4 h-4 ${checking ? "animate-pulse" : ""}`} />
                  Kiểm tra kết nối
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-md border-slate-200">
        <CardHeader className="bg-slate-50 border-b border-slate-100">
          <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <LinkIcon className="w-5 h-5 text-indigo-600" />
            Cấu hình Mẫu ZNS (Template ID)
          </CardTitle>
          <CardDescription>Điền ID của các Mẫu ZNS đã được Zalo duyệt tương ứng cho từng loại khóa học.</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Mẫu dành cho MOTO (VD: 587059)</label>
              <div className="flex gap-2">
                <input 
                  name="TemplateID_Moto" value={config.TemplateID_Moto} onChange={handleChange} 
                  className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono text-sm" 
                />
                <button 
                  onClick={() => handleCheckTemplate(config.TemplateID_Moto)}
                  disabled={checking}
                  className="shrink-0 px-3 py-2 bg-slate-100 text-slate-700 font-bold rounded-lg flex items-center gap-1 hover:bg-slate-200 transition-colors"
                  title="Kiểm tra ID Mẫu"
                >
                  <FileCheck className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Mẫu dành cho OTO - GĐ1 (Lý thuyết)</label>
              <div className="flex gap-2">
                <input 
                  name="TemplateID_Oto" value={config.TemplateID_Oto} onChange={handleChange} 
                  className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono text-sm" 
                />
                <button 
                  onClick={() => handleCheckTemplate(config.TemplateID_Oto)}
                  disabled={checking}
                  className="shrink-0 px-3 py-2 bg-slate-100 text-slate-700 font-bold rounded-lg flex items-center gap-1 hover:bg-slate-200 transition-colors"
                  title="Kiểm tra ID Mẫu"
                >
                  <FileCheck className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Mẫu dành cho OTO - GĐ2 (Thực hành)</label>
              <div className="flex gap-2">
                <input 
                  name="TemplateID_Oto_Stage2" value={config.TemplateID_Oto_Stage2} onChange={handleChange} 
                  className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono text-sm" 
                />
                <button 
                  onClick={() => handleCheckTemplate(config.TemplateID_Oto_Stage2)}
                  disabled={checking}
                  className="shrink-0 px-3 py-2 bg-slate-100 text-slate-700 font-bold rounded-lg flex items-center gap-1 hover:bg-slate-200 transition-colors"
                  title="Kiểm tra ID Mẫu"
                >
                  <FileCheck className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <button 
          onClick={handleSave} 
          disabled={loading}
          className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-colors"
        >
          <Save className="w-5 h-5" />
          {loading ? "Đang lưu..." : "Lưu Cấu Hình"}
        </button>
      </div>
    </div>
  );
}
