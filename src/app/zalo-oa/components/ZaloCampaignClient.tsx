"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { getStudentsForZalo, sendZaloMessage } from "@/actions/zalo";
import { Send, Users, FileText, CheckCircle2, XCircle, Clock } from "lucide-react";

type ZaloCampaignClientProps = {
  campaignType: 'MOTO' | 'OTO';
  courses: any[];
  config: any;
};

export default function ZaloCampaignClient({ campaignType, courses, config }: ZaloCampaignClientProps) {
  const [selectedCourse, setSelectedCourse] = useState("");
  const [students, setStudents] = useState<any[]>([]);
  const [courseInfo, setCourseInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  // Template parameters
  const [params, setParams] = useState({
    dia_diem_hoc: "209 Nguyễn Thị Đành, Xã Tân Thới Hiệp, Thành Phố Hồ Chí Minh",
    dia_diem_thi: "1968/10 Lê Quang Đạo, Ấp 10, Hóc Môn, Hồ Chí Minh",
    ten_san_thi: "Trung tâm SHLX Hóc Môn",
    thoi_gian_tap_trung: "06:30 15/08/2026",
    ngay_ket_thuc_lt: "" // For OTO Stage 2 Auto-schedule
  });

  const handleCourseChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const cid = e.target.value;
    setSelectedCourse(cid);
    if (!cid) {
      setStudents([]);
      setCourseInfo(null);
      return;
    }

    setLoading(true);
    const data = await getStudentsForZalo(cid);
    setLoading(false);

    if (data) {
      setCourseInfo(data.course);
      // Initialize student status
      const stds = data.students.map(s => {
        let status = 'Chờ gửi';
        if (!s.sdt || s.sdt.trim() === '' || s.sdt === '0' || s.sdt === '0.0') {
          status = 'Lỗi: Thiếu SĐT';
        }
        return { ...s, sendStatus: status, errorDetail: '' };
      });
      setStudents(stds);
    }
  };

  const startSending = async () => {
    if (!config || !config.AccessToken) {
      alert("Hệ thống chưa cấu hình Access Token Zalo OA.");
      return;
    }
    const templateId = campaignType === 'MOTO' ? config.TemplateID_Moto : config.TemplateID_Oto;
    if (!templateId) {
      alert("Chưa cấu hình Template ID cho " + campaignType);
      return;
    }

    if (!confirm(`Bạn có chắc chắn muốn gửi ${students.length} tin nhắn ZNS?`)) return;

    setSending(true);
    const newStds = [...students];
    
    for (let i = 0; i < newStds.length; i++) {
      const std = newStds[i];
      if (std.sendStatus.startsWith('Lỗi')) continue; // Skip bad data
      if (std.sendStatus === 'Thành công') continue; // Skip already sent

      std.sendStatus = 'Đang gửi...';
      setStudents([...newStds]); // trigger re-render

      const payloadData = {
        ten_hoc_vien: std.name,
        ten_khoa_hoc: courseInfo.name,
        ngay_khai_giang: courseInfo.khaiGiang,
        dia_diem_hoc: params.dia_diem_hoc,
        hang_dao_tao: courseInfo.hang,
        ngay_be_giang: courseInfo.beGiang,
        ngay_cap_gxn: courseInfo.satHach, // Note: using satHach as cap_gxn like original logic or can be updated
        dia_diem_thi: params.dia_diem_thi,
        thoi_gian_tap_trung: params.thoi_gian_tap_trung,
        ten_san_thi: params.ten_san_thi,
        cccd: std.cccd,
        ngay_sinh: std.dob
      };

      const res = await sendZaloMessage({
        phone: std.sdt,
        template_id: templateId,
        template_data: payloadData,
        campaignType,
        studentName: std.name,
        cccd: std.cccd,
        courseName: courseInfo.name,
        teacherName: std.gv,
        scheduleStage2Date: campaignType === 'OTO' ? params.ngay_ket_thuc_lt : undefined,
        courseType: courseInfo.hang
      });

      std.sendStatus = res.success ? 'Thành công' : 'Thất bại';
      std.errorDetail = res.success ? '' : res.error || res.message;
      setStudents([...newStds]);
    }
    
    setSending(false);
    alert("Hoàn tất chiến dịch gửi tin nhắn!");
  };

  const handleParamChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setParams({ ...params, [e.target.name]: e.target.value });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
          <div className={`p-2 rounded-lg ${campaignType === 'MOTO' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
            <Send className="w-6 h-6" />
          </div>
          Chiến dịch Zalo ZNS {campaignType === 'MOTO' ? 'Mô Tô' : 'Ô Tô'}
        </h1>
        <p className="text-slate-600 mt-2 text-base font-medium">Chọn khóa học và gửi thông báo lịch học/thi qua Zalo tự động.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="shadow-md border-slate-200 lg:col-span-1 h-fit">
          <CardHeader className="bg-slate-50 border-b border-slate-100">
            <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600" />
              Thiết lập chiến dịch
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Chọn khóa học</label>
              <select 
                value={selectedCourse} 
                onChange={handleCourseChange}
                className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 font-medium text-sm"
              >
                <option value="">-- Chọn một khóa học --</option>
                {courses.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.khaiGiang || '?'})</option>
                ))}
              </select>
            </div>
            
            <hr className="border-slate-200" />
            
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-800">Tham số cố định (Dùng cho mẫu)</h3>
              
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Địa điểm học</label>
                <input name="dia_diem_hoc" value={params.dia_diem_hoc} onChange={handleParamChange} className="w-full p-2 border rounded-md text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Địa điểm thi</label>
                <input name="dia_diem_thi" value={params.dia_diem_thi} onChange={handleParamChange} className="w-full p-2 border rounded-md text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Tên sân thi</label>
                <input name="ten_san_thi" value={params.ten_san_thi} onChange={handleParamChange} className="w-full p-2 border rounded-md text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Thời gian tập trung</label>
                <input name="thoi_gian_tap_trung" value={params.thoi_gian_tap_trung} onChange={handleParamChange} className="w-full p-2 border rounded-md text-sm" />
              </div>
              
              {campaignType === 'OTO' && (
                <div className="space-y-1 mt-4 p-3 bg-indigo-50 border border-indigo-100 rounded-lg">
                  <label className="text-xs font-bold text-indigo-800">Ngày kết thúc Lý thuyết (Để tự động gửi Giai đoạn 2)</label>
                  <input 
                    type="datetime-local" 
                    name="ngay_ket_thuc_lt" 
                    value={params.ngay_ket_thuc_lt} 
                    onChange={handleParamChange} 
                    className="w-full p-2 border border-indigo-200 rounded-md text-sm focus:ring-2 focus:ring-indigo-500" 
                  />
                  <p className="text-xs text-indigo-600 mt-1">
                    Sau khi GĐ1 được gửi, học viên sẽ được đưa vào hàng đợi chờ tới giờ này để tự động gửi mẫu GĐ2.
                  </p>
                </div>
              )}
            </div>

            <button 
              onClick={startSending} 
              disabled={sending || students.length === 0}
              className={`w-full py-3 mt-4 text-white font-bold rounded-xl flex justify-center items-center gap-2 shadow-lg transition-colors ${sending || students.length === 0 ? 'bg-slate-400 cursor-not-allowed' : campaignType === 'MOTO' ? 'bg-orange-600 hover:bg-orange-700 shadow-orange-200' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'}`}
            >
              <Send className={`w-5 h-5 ${sending ? 'animate-pulse' : ''}`} />
              {sending ? 'Đang gửi...' : 'Phát hành chiến dịch ZNS'}
            </button>
          </CardContent>
        </Card>

        <Card className="shadow-md border-slate-200 lg:col-span-2">
          <CardHeader className="bg-slate-50 border-b border-slate-100 flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" />
              Danh sách học viên ({students.length})
            </CardTitle>
            <div className="text-sm font-semibold flex gap-4">
              <span className="text-emerald-600">Hợp lệ: {students.filter(s => !s.sendStatus.startsWith('Lỗi')).length}</span>
              <span className="text-rose-600">Lỗi SĐT: {students.filter(s => s.sendStatus.startsWith('Lỗi')).length}</span>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-12 text-center text-slate-500 font-medium">Đang tải dữ liệu học viên...</div>
            ) : students.length === 0 ? (
              <div className="p-12 text-center text-slate-500 font-medium flex flex-col items-center">
                <Users className="w-12 h-12 text-slate-300 mb-3" />
                Vui lòng chọn khóa học để xem danh sách.
              </div>
            ) : (
              <div className="overflow-x-auto h-[600px] overflow-y-auto custom-scrollbar">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-700 uppercase bg-slate-100 sticky top-0 shadow-sm z-10">
                    <tr>
                      <th className="px-4 py-3 font-bold">Họ và Tên</th>
                      <th className="px-4 py-3 font-bold">Giáo Viên</th>
                      <th className="px-4 py-3 font-bold">SĐT</th>
                      <th className="px-4 py-3 font-bold w-48">Trạng thái Gửi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((s, i) => (
                      <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="px-4 py-3 font-medium text-slate-900">
                          {s.name}
                          <div className="text-xs text-slate-500 font-normal">CCCD: {s.cccd}</div>
                        </td>
                        <td className="px-4 py-3 text-slate-600 font-medium">{s.gv}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-md text-xs font-bold ${s.sendStatus.startsWith('Lỗi') ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-700'}`}>
                            {s.sdt || 'Trống'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5 font-bold">
                            {s.sendStatus === 'Thành công' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                            {s.sendStatus === 'Thất bại' && <XCircle className="w-4 h-4 text-rose-500" />}
                            {s.sendStatus.startsWith('Lỗi') && <XCircle className="w-4 h-4 text-rose-500" />}
                            {(s.sendStatus === 'Chờ gửi' || s.sendStatus === 'Đang gửi...') && <Clock className={`w-4 h-4 text-amber-500 ${s.sendStatus === 'Đang gửi...' ? 'animate-spin' : ''}`} />}
                            
                            <span className={
                              s.sendStatus === 'Thành công' ? 'text-emerald-600' : 
                              (s.sendStatus === 'Thất bại' || s.sendStatus.startsWith('Lỗi') ? 'text-rose-600' : 'text-amber-600')
                            }>
                              {s.sendStatus}
                            </span>
                          </div>
                          {s.errorDetail && <div className="text-xs text-rose-500 mt-1">{s.errorDetail}</div>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
