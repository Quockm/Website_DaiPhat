"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getCourseFeeDetails, toggleStudentFeeApproval, getDailyStudents, bulkApproveStudentFees } from "@/actions/fees";
import { Loader2, Users, DollarSign, Wallet, Banknote, ChevronDown, ChevronRight, BarChart3, List, Check, X } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function FeeManagementClient({ courses, globalStats }: { courses: any[], globalStats: any[] }) {
  const [selectedCourse, setSelectedCourse] = useState("");
  const [details, setDetails] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [expandedMoi, setExpandedMoi] = useState<Record<string, boolean>>({});
  
  const [dailyReportDate, setDailyReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [dailyReportData, setDailyReportData] = useState<any>(null);
  const [loadingDaily, setLoadingDaily] = useState(false);
  const [dailyReportTeacher, setDailyReportTeacher] = useState("all");
  const [teacherPopupParams, setTeacherPopupParams] = useState<{giaoVien: string, khoa: string, hinhThucThu: string, isMoto: boolean} | null>(null);
  const [dailyVehicleType, setDailyVehicleType] = useState<"moto" | "oto">("moto");

  const [filterMonth, setFilterMonth] = useState("all");
  const [filterHang, setFilterHang] = useState("all");

  const availableMonths = Array.from(new Set(courses.map(c => {
    if (!c.khaiGiang || c.khaiGiang === '-') return '';
    const parts = c.khaiGiang.split('/');
    if (parts.length >= 2) return `${parts[1]}/${parts[2]}`;
    const dashParts = c.khaiGiang.split('-');
    if (dashParts.length >= 2 && dashParts[0].length === 4) return `${dashParts[1]}/${dashParts[0]}`;
    return '';
  }).filter(Boolean)));

  const availableHangs = Array.from(new Set(courses.map(c => c.hangXe).filter(Boolean)));

  const filteredCourses = courses.filter(c => {
    if (filterHang !== 'all' && c.hangXe !== filterHang) return false;
    if (filterMonth !== 'all') {
      if (!c.khaiGiang || c.khaiGiang === '-') return false;
      const parts = c.khaiGiang.split('/');
      let cMonth = '';
      if (parts.length >= 2) {
        cMonth = `${parts[1]}/${parts[2]}`;
      } else {
        const dashParts = c.khaiGiang.split('-');
        if (dashParts.length >= 2 && dashParts[0].length === 4) cMonth = `${dashParts[1]}/${dashParts[0]}`;
      }
      if (cMonth !== filterMonth) return false;
    }
    return true;
  });

  const filteredStats = filteredCourses.reduce((acc, c) => {
    acc.totalStudents += c.soHocVien || 0;
    acc.totalExpected += c.tongTienThu || 0;
    acc.totalPaid += c.tongDaNop || 0;
    acc.totalDebt += c.tongConNo || 0;
    return acc;
  }, { totalStudents: 0, totalExpected: 0, totalPaid: 0, totalDebt: 0 });

  const handleDailyToggleApproval = async (maDk: string, currentStatus: boolean, isMoto: boolean, nguoiDuyet?: string) => {
    const newStatus = !currentStatus;
    const newData = { ...dailyReportData };
    const list = isMoto ? newData.moto : newData.oto;
    const index = list.findIndex((s: any) => s.maDk === maDk);
    if (index > -1) {
      list[index].trangThaiDuyet = newStatus;
      if (newStatus && nguoiDuyet) list[index].nguoiDuyet = nguoiDuyet;
      else list[index].nguoiDuyet = null;
      setDailyReportData(newData);
    }
    await toggleStudentFeeApproval(maDk, newStatus, nguoiDuyet);
  };

  const handleBulkApprove = async (groupKeyParams: {giaoVien: string, khoa: string, hinhThucThu: string, isMoto: boolean}, nguoiDuyet: string) => {
    const sourceGroup = groupKeyParams.isMoto ? groupedMoto : groupedOto;
    const studentsToApprove = sourceGroup.find(g => g.giaoVien === groupKeyParams.giaoVien && g.khoa === groupKeyParams.khoa && g.hinhThucThu === groupKeyParams.hinhThucThu)?.students
      .filter((s: any) => !s.trangThaiDuyet && s.daNop > 0) || [];
    
    if (studentsToApprove.length === 0) return;
    
    const maDks = studentsToApprove.map((s: any) => s.maDk);
    
    // Optimistic update
    const newData = { ...dailyReportData };
    const list = groupKeyParams.isMoto ? newData.moto : newData.oto;
    list.forEach((s: any) => {
      if (maDks.includes(s.maDk)) {
        s.trangThaiDuyet = true;
        s.nguoiDuyet = nguoiDuyet;
      }
    });
    setDailyReportData(newData);
    
    await bulkApproveStudentFees(maDks, nguoiDuyet);
  };

  const globalTotal = globalStats.reduce((acc, stat) => {
    acc.soHocVien += stat.soHocVien || 0;
    acc.tongTienThu += Number(stat.tongTienThu) || 0;
    acc.tongDaNop += Number(stat.tongDaNop) || 0;
    acc.tongConNo += Number(stat.tongConNo) || 0;
    return acc;
  }, { soHocVien: 0, tongTienThu: 0, tongDaNop: 0, tongConNo: 0 });

  useEffect(() => {
    if (selectedCourse) {
      setLoading(true);
      getCourseFeeDetails(selectedCourse).then(res => {
        setDetails(res);
        setLoading(false);
        setExpandedMoi({});
      });
    } else {
      setDetails(null);
    }
  }, [selectedCourse]);

  const toggleMoi = (dmName: string) => {
    setExpandedMoi(prev => ({...prev, [dmName]: !prev[dmName]}));
  };

  const handleToggleApproval = async (maDk: string, currentStatus: boolean, dmName: string, nguoiDuyet?: string) => {
    const newStatus = !currentStatus;
    const updatedDetails = { ...details };
    const dmIndex = updatedDetails.byDauMoi.findIndex((dm: any) => dm.dauMoiName === dmName);
    if (dmIndex > -1) {
      const stIndex = updatedDetails.byDauMoi[dmIndex].students.findIndex((s: any) => s.maDk === maDk);
      if (stIndex > -1) {
        updatedDetails.byDauMoi[dmIndex].students[stIndex].trangThaiDuyet = newStatus;
        if (newStatus && nguoiDuyet) {
          updatedDetails.byDauMoi[dmIndex].students[stIndex].nguoiDuyet = nguoiDuyet;
        } else {
          updatedDetails.byDauMoi[dmIndex].students[stIndex].nguoiDuyet = null;
        }
        setDetails(updatedDetails);
      }
    }
    await toggleStudentFeeApproval(maDk, newStatus, nguoiDuyet);
  };

  useEffect(() => {
    const fetchDaily = async () => {
      setLoadingDaily(true);
      const data = await getDailyStudents(dailyReportDate);
      setDailyReportData(data);
      setDailyReportTeacher("all");
      setLoadingDaily(false);
    };
    fetchDaily();
  }, [dailyReportDate]);

  let availableTeachers: string[] = [];
  let filteredMoto: any[] = [];
  let filteredOto: any[] = [];
  let motoTotal = 0;
  let otoTotal = 0;
  let pendingMotoTotal = 0;
  let pendingOtoTotal = 0;
  let byDauMoiDaily: any[] = [];
  let groupedMoto: any[] = [];
  let groupedOto: any[] = [];

  const groupStudentsByTeacher = (students: any[], isMoto: boolean) => {
    const grouped = students.reduce((acc: any, s: any) => {
      const khoa = s.tenKhoa || s.maKhoa;
      const key = `${s.giaoVien}-${khoa}-${s.hinhThucThu}`;
      if (!acc[key]) {
        acc[key] = { 
          giaoVien: s.giaoVien, 
          khoa: khoa,
          hinhThucThu: s.hinhThucThu,
          totalStudents: 0, 
          totalDaDuyet: 0, 
          totalChoDuyet: 0, 
          students: [], 
          isMoto 
        };
      }
      acc[key].totalStudents++;
      if (s.trangThaiDuyet) {
        acc[key].totalDaDuyet += s.daNop;
      } else {
        if (s.daNop > 0) acc[key].totalChoDuyet += s.daNop;
      }
      acc[key].students.push(s);
      return acc;
    }, {});
    return Object.values(grouped).sort((a: any, b: any) => {
      if (a.giaoVien === b.giaoVien) return b.totalStudents - a.totalStudents;
      return a.giaoVien.localeCompare(b.giaoVien);
    });
  };

  if (dailyReportData) {
    const allStudents = [...dailyReportData.moto, ...dailyReportData.oto];
    availableTeachers = Array.from(new Set(allStudents.map(s => s.giaoVien).filter(Boolean)));
    
    filteredMoto = dailyReportData.moto.filter((s: any) => dailyReportTeacher === "all" || s.giaoVien === dailyReportTeacher);
    filteredOto = dailyReportData.oto.filter((s: any) => dailyReportTeacher === "all" || s.giaoVien === dailyReportTeacher);
    
    motoTotal = filteredMoto.reduce((sum, s) => s.trangThaiDuyet ? sum + s.daNop : sum, 0);
    otoTotal = filteredOto.reduce((sum, s) => s.trangThaiDuyet ? sum + s.daNop : sum, 0);
    pendingMotoTotal = filteredMoto.reduce((sum, s) => (!s.trangThaiDuyet && s.daNop > 0) ? sum + s.daNop : sum, 0);
    pendingOtoTotal = filteredOto.reduce((sum, s) => (!s.trangThaiDuyet && s.daNop > 0) ? sum + s.daNop : sum, 0);

    const allFiltered = [...filteredMoto, ...filteredOto];
    const grouped = allFiltered.reduce((acc: any, s: any) => {
      const key = `${s.nguoiNop}-${s.maKhoa}-${s.hinhThucThu}`;
      if (!acc[key]) {
        acc[key] = {
          nguoiNop: s.nguoiNop,
          khoa: s.tenKhoa || s.maKhoa,
          hinhThucThu: s.hinhThucThu,
          tongHocVien: 0,
          tongTien: 0
        };
      }
      acc[key].tongHocVien += 1;
      acc[key].tongTien += (s.daNop || 0);
      return acc;
    }, {});
    byDauMoiDaily = Object.values(grouped);
    
    groupedMoto = groupStudentsByTeacher(filteredMoto, true);
    groupedOto = groupStudentsByTeacher(filteredOto, false);
  }

  let popupData: any = null;
  if (teacherPopupParams) {
    const sourceGroup = teacherPopupParams.isMoto ? groupedMoto : groupedOto;
    popupData = sourceGroup.find((g: any) => g.giaoVien === teacherPopupParams.giaoVien && g.khoa === teacherPopupParams.khoa && g.hinhThucThu === teacherPopupParams.hinhThucThu);
  }

  const currentGrouped = dailyVehicleType === "moto" ? groupedMoto : groupedOto;
  const currentTotal = dailyVehicleType === "moto" ? motoTotal : otoTotal;
  const currentPendingTotal = dailyVehicleType === "moto" ? pendingMotoTotal : pendingOtoTotal;
  const currentTotalStudents = currentGrouped.reduce((sum, g) => sum + g.totalStudents, 0);

  let courseApprovedCount = 0;
  let coursePendingCount = 0;
  if (details) {
    courseApprovedCount = details.byDauMoi.reduce((sum: number, dm: any) => sum + dm.students.filter((s:any) => s.trangThaiDuyet).length, 0);
    coursePendingCount = details.byDauMoi.reduce((sum: number, dm: any) => sum + dm.students.filter((s:any) => !s.trangThaiDuyet && s.daNop > 0).length, 0);
  }

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Quản lý Học phí</h1>
        <p className="text-slate-500 mt-1">Thống kê học phí tổng thể và chi tiết theo khóa học, đầu mối.</p>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" /> Tổng quan Học phí
          </TabsTrigger>
          <TabsTrigger value="daily-report" className="flex items-center gap-2">
            <List className="w-4 h-4" /> Báo cáo Ngày
          </TabsTrigger>
          <TabsTrigger value="course-stats" className="flex items-center gap-2">
            <List className="w-4 h-4" /> Thống kê theo Hạng
          </TabsTrigger>
          <TabsTrigger value="detail" className="flex items-center gap-2">
            <List className="w-4 h-4" /> Chi tiết Thu tiền Khóa
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card className="shadow-sm border-slate-200 overflow-hidden">
            <CardHeader className="bg-white border-b border-slate-100 pb-4">
              <CardTitle className="text-lg">Thống kê theo Hạng</CardTitle>
            </CardHeader>
            <div className="overflow-x-auto bg-white">
              <table className="w-full text-sm text-left whitespace-nowrap">
                <thead className="text-[11px] text-slate-600 uppercase tracking-wider bg-slate-100 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 font-semibold text-left">Hạng Xe</th>
                    <th className="px-6 py-4 font-semibold text-center">Số HV</th>
                    <th className="px-6 py-4 font-semibold text-right">Dự kiến thu</th>
                    <th className="px-6 py-4 font-semibold text-right">Đã thu</th>
                    <th className="px-6 py-4 font-semibold text-right">Còn nợ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {globalStats.map((stat, i) => (
                    <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 font-black text-indigo-700">{stat.hangXe}</td>
                      <td className="px-6 py-4 text-center font-semibold text-slate-600">{stat.soHocVien}</td>
                      <td className="px-6 py-4 text-right font-medium text-slate-700">{Number(stat.tongTienThu).toLocaleString('en-US')} đ</td>
                      <td className="px-6 py-4 text-right font-bold text-emerald-600">{Number(stat.tongDaNop).toLocaleString('en-US')} đ</td>
                      <td className="px-6 py-4 text-right font-bold text-rose-600">{Number(stat.tongConNo).toLocaleString('en-US')} đ</td>
                    </tr>
                  ))}
                  {globalStats.length > 0 && (
                    <tr className="bg-slate-50/50 font-bold border-t border-slate-200 text-[15px]">
                      <td className="px-6 py-4 text-slate-900">TỔNG CỘNG</td>
                      <td className="px-6 py-4 text-center text-slate-900">{globalTotal.soHocVien}</td>
                      <td className="px-6 py-4 text-right text-slate-900">{globalTotal.tongTienThu.toLocaleString('en-US')} đ</td>
                      <td className="px-6 py-4 text-right text-emerald-600">{globalTotal.tongDaNop.toLocaleString('en-US')} đ</td>
                      <td className="px-6 py-4 text-right text-rose-600">{globalTotal.tongConNo.toLocaleString('en-US')} đ</td>
                    </tr>
                  )}
                  {globalStats.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-12 text-center text-slate-500">Chưa có dữ liệu thống kê.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="daily-report" className="space-y-6">
          <Card className="shadow-sm border-slate-200/60 overflow-hidden">
            <CardHeader className="bg-white border-b border-slate-100 pb-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <CardTitle className="text-lg">Báo cáo Duyệt thu theo Ngày</CardTitle>
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-lg border border-slate-200/60">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-2">Giáo viên</span>
                    <Select value={dailyReportTeacher} onValueChange={setDailyReportTeacher}>
                      <SelectTrigger className="w-[180px] h-8 bg-transparent border-0 shadow-none text-sm font-medium focus:ring-0">
                        <SelectValue placeholder="Tất cả" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl shadow-lg border-slate-100">
                        <SelectItem value="all" className="cursor-pointer">Tất cả giáo viên</SelectItem>
                        {availableTeachers.map(t => (
                          <SelectItem key={t} value={t} className="cursor-pointer">{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-lg border border-slate-200/60">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-2">Ngày</span>
                    <input 
                      type="date" 
                      value={dailyReportDate}
                      onChange={(e) => setDailyReportDate(e.target.value)}
                      className="h-8 bg-transparent border-0 text-sm font-medium outline-none cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {loadingDaily ? (
                <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
              ) : dailyReportData ? (
                <div>
                  {/* Vehicle Type Toggle */}
                  <div className="flex bg-slate-100/80 p-1 rounded-xl w-max mb-6 border border-slate-200/60">
                    <button 
                      onClick={() => setDailyVehicleType("moto")}
                      className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${dailyVehicleType === 'moto' ? 'bg-white shadow-sm text-indigo-700' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                      Mô tô (Hạng A)
                    </button>
                    <button 
                      onClick={() => setDailyVehicleType("oto")}
                      className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${dailyVehicleType === 'oto' ? 'bg-white shadow-sm text-emerald-700' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                      Ô tô (Hạng B, C...)
                    </button>
                  </div>

                  {/* Summary Box */}
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-6 rounded-lg mb-6 border bg-slate-50 border-slate-200">
                    <div>
                      <h3 className="font-bold text-xl mb-1 text-slate-800">
                        {dailyVehicleType === 'moto' ? 'Mô tô (Hạng A)' : 'Ô tô (Hạng B, C...)'}
                      </h3>
                      <p className="font-medium text-slate-600">
                        {currentTotalStudents} hồ sơ nhập liệu trong ngày
                      </p>
                    </div>
                    <div className="text-left md:text-right mt-4 md:mt-0 flex gap-6 md:block">
                      <div>
                        <p className="text-xs uppercase tracking-wider font-bold mb-1 text-emerald-600">
                          Đã duyệt thu
                        </p>
                        <p className="text-2xl font-bold text-emerald-700">
                          {currentTotal.toLocaleString('en-US')} đ
                        </p>
                      </div>
                      <div className="md:mt-3">
                        <p className="text-xs uppercase tracking-wider font-bold mb-1 text-amber-600">
                          Chờ duyệt thu
                        </p>
                        <p className="text-xl font-bold text-amber-700">
                          {currentPendingTotal.toLocaleString('en-US')} đ
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Main Table */}
                  <div className="border border-slate-100 rounded-xl overflow-hidden bg-white shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left whitespace-nowrap">
                        <thead className="text-[11px] text-slate-600 uppercase tracking-wider bg-slate-100 border-b border-slate-200">
                          <tr>
                            <th className="px-6 py-4 font-semibold text-left">Giáo viên</th>
                            <th className="px-6 py-4 font-semibold text-left">Khóa</th>
                            <th className="px-6 py-4 font-semibold text-center">Hồ sơ</th>
                            <th className="px-6 py-4 font-semibold text-left">Hình thức TT</th>
                            <th className="px-6 py-4 font-semibold text-right">Đã duyệt</th>
                            <th className="px-6 py-4 font-semibold text-right">Chờ duyệt</th>
                            <th className="px-6 py-4 font-semibold text-center">Thao tác</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {currentGrouped.map((g: any, idx: number) => (
                            <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                              <td className="px-6 py-4 font-bold text-slate-700">{g.giaoVien}</td>
                              <td className="px-6 py-4 font-medium text-slate-600">{g.khoa}</td>
                              <td className="px-6 py-4 text-center">
                                <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold">
                                  {g.totalStudents}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <span className="px-2.5 py-1 bg-slate-50 border border-slate-200/60 text-slate-600 rounded-md text-[11px] font-semibold uppercase">
                                  {g.hinhThucThu}
                                </span>
                              </td>
                              <td className={`px-6 py-4 text-right font-black ${dailyVehicleType === 'moto' ? 'text-indigo-600' : 'text-emerald-600'}`}>
                                {g.totalDaDuyet.toLocaleString('en-US')} đ
                              </td>
                              <td className="px-6 py-4 text-right font-bold text-amber-600">
                                {g.totalChoDuyet.toLocaleString('en-US')} đ
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center justify-center gap-2">
                                  <button
                                    onClick={() => setTeacherPopupParams({ giaoVien: g.giaoVien, khoa: g.khoa, hinhThucThu: g.hinhThucThu, isMoto: dailyVehicleType === 'moto' })}
                                    className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg font-semibold transition-colors"
                                  >
                                    Xem
                                  </button>
                                  {g.totalChoDuyet > 0 && (
                                    <div className="flex gap-1.5">
                                      <button
                                        onClick={() => handleBulkApprove({ giaoVien: g.giaoVien, khoa: g.khoa, hinhThucThu: g.hinhThucThu, isMoto: dailyVehicleType === 'moto' }, 'Trang')}
                                        className="text-[11px] bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-600 hover:text-white px-2 py-1.5 rounded-lg font-bold transition-all flex items-center justify-center gap-1"
                                      >
                                        <Check className="w-3 h-3" />
                                        Trang duyệt
                                      </button>
                                      <button
                                        onClick={() => handleBulkApprove({ giaoVien: g.giaoVien, khoa: g.khoa, hinhThucThu: g.hinhThucThu, isMoto: dailyVehicleType === 'moto' }, 'Mẹ')}
                                        className="text-[11px] bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-600 hover:text-white px-2 py-1.5 rounded-lg font-bold transition-all flex items-center justify-center gap-1"
                                      >
                                        <Check className="w-3 h-3" />
                                        Mẹ duyệt
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                          {currentGrouped.length === 0 && (
                            <tr>
                              <td colSpan={7} className="p-12 text-center text-slate-400">
                                <p className="font-medium">Không có dữ liệu trong ngày này.</p>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
          
          <Dialog open={!!teacherPopupParams} onOpenChange={(open) => !open && setTeacherPopupParams(null)}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-8">
              <DialogHeader className="mb-4">
                <DialogTitle className="text-xl font-bold text-black">
                  Danh sách học viên - Giáo viên: {popupData?.giaoVien}
                </DialogTitle>
                <div className="text-sm text-slate-600 mt-2 flex gap-4">
                  <span><span className="font-medium text-slate-800">Khóa:</span> {popupData?.khoa}</span>
                  <span><span className="font-medium text-slate-800">Hình thức:</span> {popupData?.hinhThucThu}</span>
                </div>
              </DialogHeader>
              <div className="mt-2">
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr className="text-left text-slate-500">
                        <th className="p-3 font-medium">Họ tên</th>
                        <th className="p-3 font-medium">Hạng</th>
                        <th className="p-3 font-medium">Khóa</th>
                        <th className="p-3 font-medium text-right">Đã nộp</th>
                        <th className="p-3 font-medium text-center">Duyệt</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {popupData?.students.map((s: any) => (
                        <tr key={s.maDk} className="hover:bg-slate-50 transition-colors">
                          <td className="p-3 font-medium text-slate-800">{s.hoTen}</td>
                          <td className="p-3"><span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-xs font-bold">{s.hangXe}</span></td>
                          <td className="p-3 text-slate-600">{s.tenKhoa}</td>
                          <td className="p-3 text-right font-medium text-emerald-600">{s.daNop.toLocaleString('en-US')} đ</td>
                          <td className="p-3 text-center">
                            {s.daNop > 0 ? (
                              s.trangThaiDuyet ? (
                                <div className="flex flex-col items-center justify-center gap-1">
                                  <span className="text-xs text-emerald-600 font-medium">Đã duyệt ({s.nguoiDuyet})</span>
                                  <button
                                    onClick={() => handleDailyToggleApproval(s.maDk, true, teacherPopupParams!.isMoto)}
                                    className="text-xs text-slate-500 hover:text-slate-700 underline"
                                  >
                                    Hủy duyệt
                                  </button>
                                </div>
                              ) : (
                                <div className="flex gap-1 justify-center">
                                  <button
                                    onClick={() => handleDailyToggleApproval(s.maDk, false, teacherPopupParams!.isMoto, 'Trang')}
                                    className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded shadow-sm"
                                  >
                                    Trang duyệt
                                  </button>
                                  <button
                                    onClick={() => handleDailyToggleApproval(s.maDk, false, teacherPopupParams!.isMoto, 'Mẹ')}
                                    className="px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded shadow-sm"
                                  >
                                    Mẹ duyệt
                                  </button>
                                </div>
                              )
                            ) : (
                              <span className="text-xs text-slate-400">Chưa nộp</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="course-stats" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-4 mb-6">
            <Card className="shadow-sm border-slate-200 bg-white">
              <div className="p-6">
                <div className="flex flex-col">
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-md w-max mb-3">
                    <Users className="w-5 h-5" />
                  </div>
                  <p className="text-sm font-medium text-slate-500 mb-1">Tổng học viên</p>
                  <p className="text-2xl font-bold text-slate-900">{filteredStats.totalStudents}</p>
                </div>
              </div>
            </Card>
            
            <Card className="shadow-sm border-slate-200 bg-white">
              <div className="p-6">
                <div className="flex flex-col">
                  <div className="p-2 bg-slate-50 text-slate-600 rounded-md w-max mb-3">
                    <Banknote className="w-5 h-5" />
                  </div>
                  <p className="text-sm font-medium text-slate-500 mb-1">Dự kiến thu</p>
                  <p className="text-2xl font-bold text-slate-900">{filteredStats.totalExpected.toLocaleString('en-US')} đ</p>
                </div>
              </div>
            </Card>

            <Card className="shadow-sm border-slate-200 bg-white">
              <div className="p-6">
                <div className="flex flex-col">
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-md w-max mb-3">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <p className="text-sm font-medium text-slate-500 mb-1">Đã thu</p>
                  <p className="text-2xl font-bold text-emerald-600">{filteredStats.totalPaid.toLocaleString('en-US')} đ</p>
                </div>
              </div>
            </Card>

            <Card className="shadow-sm border-slate-200 bg-white">
              <div className="p-6">
                <div className="flex flex-col">
                  <div className="p-2 bg-rose-50 text-rose-600 rounded-md w-max mb-3">
                    <Wallet className="w-5 h-5" />
                  </div>
                  <p className="text-sm font-medium text-slate-500 mb-1">Còn nợ</p>
                  <p className="text-2xl font-bold text-rose-600">{filteredStats.totalDebt.toLocaleString('en-US')} đ</p>
                </div>
              </div>
            </Card>
          </div>

          <Card className="shadow-sm border-slate-200 overflow-hidden bg-white">
            <CardHeader className="bg-white border-b border-slate-100 pb-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <CardTitle className="text-lg">Danh sách Khóa Đào tạo</CardTitle>
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-lg border border-slate-200">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-2">Tháng</span>
                    <Select value={filterMonth} onValueChange={setFilterMonth}>
                      <SelectTrigger className="w-[120px] h-8 bg-transparent border-0 shadow-none text-sm font-medium focus:ring-0">
                        <SelectValue placeholder="Tất cả" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl shadow-lg border-slate-100">
                        <SelectItem value="all" className="cursor-pointer">Tất cả tháng</SelectItem>
                        {availableMonths.map(m => (
                          <SelectItem key={m} value={m} className="cursor-pointer">{m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-lg border border-slate-200">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-2">Hạng</span>
                    <Select value={filterHang} onValueChange={setFilterHang}>
                      <SelectTrigger className="w-[100px] h-8 bg-transparent border-0 shadow-none text-sm font-medium focus:ring-0">
                        <SelectValue placeholder="Tất cả" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl shadow-lg border-slate-100">
                        <SelectItem value="all" className="cursor-pointer">Tất cả</SelectItem>
                        {availableHangs.map(h => (
                          <SelectItem key={h} value={h} className="cursor-pointer">{h}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-sm text-left whitespace-nowrap">
                <thead className="text-[11px] text-slate-600 uppercase tracking-wider bg-slate-100 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 font-semibold text-left">Mã Khóa</th>
                    <th className="px-6 py-4 font-semibold text-left">Tên Khóa</th>
                    <th className="px-6 py-4 font-semibold text-left">Hạng</th>
                    <th className="px-6 py-4 font-semibold text-center">Số HV</th>
                    <th className="px-6 py-4 font-semibold text-right">Dự kiến thu</th>
                    <th className="px-6 py-4 font-semibold text-right">Đã thu</th>
                    <th className="px-6 py-4 font-semibold text-right">Còn nợ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredCourses.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 font-black text-slate-700">{c.id}</td>
                      <td className="px-6 py-4 font-medium text-slate-600">{c.name}</td>
                      <td className="px-6 py-4"><span className="bg-slate-100 px-2.5 py-1 rounded-md text-[11px] font-bold text-slate-600">{c.hangXe}</span></td>
                      <td className="px-6 py-4 text-center font-bold text-slate-600">{c.soHocVien}</td>
                      <td className="px-6 py-4 text-right font-medium text-slate-500">{c.tongTienThu ? c.tongTienThu.toLocaleString('en-US') + ' đ' : '-'}</td>
                      <td className="px-6 py-4 text-right text-emerald-600 font-bold">{c.tongDaNop ? c.tongDaNop.toLocaleString('en-US') + ' đ' : '-'}</td>
                      <td className="px-6 py-4 text-right text-rose-500 font-bold">{c.tongConNo ? c.tongConNo.toLocaleString('en-US') + ' đ' : '-'}</td>
                    </tr>
                  ))}
                  {filteredCourses.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500">Không tìm thấy khóa học phù hợp với bộ lọc.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="detail" className="space-y-6">
          <Card>
            <CardHeader className="bg-slate-50 border-b border-slate-100">
              <CardTitle className="text-lg">Chọn Khóa Đào Tạo</CardTitle>
            </CardHeader>
        <CardContent className="pt-6">
          <div className="max-w-md">
            <Select value={selectedCourse} onValueChange={setSelectedCourse}>
              <SelectTrigger>
                <SelectValue placeholder="-- Chọn khóa học --" />
              </SelectTrigger>
              <SelectContent>
                {courses.map(c => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name} - Hạng {c.hangXe} (KG: {c.khaiGiang})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {details?.course && (
            <div className="mt-4 flex gap-6 text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100 w-fit">
              <div><span className="font-medium text-slate-500">Mã khóa:</span> {details.course.id}</div>
              <div><span className="font-medium text-slate-500">Ngày khai giảng:</span> {details.course.khaiGiang}</div>
              <div><span className="font-medium text-slate-500">Ngày sát hạch:</span> {details.course.satHach || 'Chưa có'}</div>
            </div>
          )}
        </CardContent>
      </Card>

      {loading && (
        <div className="flex flex-col items-center justify-center py-12 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin mb-4" />
          <p>Đang tải dữ liệu học phí...</p>
        </div>
      )}

      {details && !loading && (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="bg-white shadow-sm border-slate-200">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-slate-500">Tổng học viên</p>
                    <p className="text-2xl font-bold">{details.summary.totalStudents}</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-full text-blue-600">
                    <Users className="w-6 h-6" />
                  </div>
                </div>
              </div>
            </Card>
            
            <Card className="bg-white shadow-sm border-slate-200">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-slate-500">Đã duyệt</p>
                    <p className="text-2xl font-bold text-emerald-600">{courseApprovedCount}</p>
                  </div>
                  <div className="p-3 bg-emerald-100 rounded-full text-emerald-600">
                    <Check className="w-6 h-6" />
                  </div>
                </div>
              </div>
            </Card>

            <Card className="bg-white shadow-sm border-slate-200">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-slate-500">Chờ duyệt</p>
                    <p className="text-2xl font-bold text-amber-600">{coursePendingCount}</p>
                  </div>
                  <div className="p-3 bg-amber-100 rounded-full text-amber-600">
                    <Loader2 className="w-6 h-6" />
                  </div>
                </div>
              </div>
            </Card>

            <Card className="bg-white shadow-sm border-slate-200">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-slate-500">Dự kiến thu</p>
                    <p className="text-2xl font-bold text-slate-800">{Number(details.summary.totalExpected).toLocaleString('en-US')} đ</p>
                  </div>
                  <div className="p-3 bg-slate-100 rounded-full text-slate-600">
                    <Banknote className="w-6 h-6" />
                  </div>
                </div>
              </div>
            </Card>

            <Card className="bg-white shadow-sm border-slate-200">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-slate-500">Đã thu</p>
                    <p className="text-2xl font-bold text-emerald-600">{Number(details.summary.totalPaid).toLocaleString('en-US')} đ</p>
                  </div>
                  <div className="p-3 bg-emerald-100 rounded-full text-emerald-600">
                    <DollarSign className="w-6 h-6" />
                  </div>
                </div>
              </div>
            </Card>

            <Card className="bg-white shadow-sm border-slate-200">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-slate-500">Còn nợ</p>
                    <p className="text-2xl font-bold text-red-600">{Number(details.summary.totalDebt).toLocaleString('en-US')} đ</p>
                  </div>
                  <div className="p-3 bg-red-100 rounded-full text-red-600">
                    <Wallet className="w-6 h-6" />
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <Card className="shadow-sm border-slate-200 overflow-hidden">
            <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
              <CardTitle className="text-lg flex justify-between items-center">
                <span>Chi tiết thu tiền theo Đầu mối</span>
              </CardTitle>
            </CardHeader>
            <div className="divide-y divide-slate-100">
              {details.byDauMoi.map((dm: any) => (
                <div key={dm.dauMoiName} className="bg-white">
                  <div 
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 transition-colors"
                    onClick={() => toggleMoi(dm.dauMoiName)}
                  >
                    <div className="flex items-center gap-3">
                      {expandedMoi[dm.dauMoiName] ? <ChevronDown className="w-5 h-5 text-slate-400" /> : <ChevronRight className="w-5 h-5 text-slate-400" />}
                      <div className="font-semibold text-slate-800 text-base">{dm.dauMoiName}</div>
                      <div className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs rounded-full font-medium">
                        {dm.students.length} học viên
                      </div>
                      <div className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-xs rounded-full font-medium flex items-center gap-1">
                        <Check className="w-3 h-3" /> {dm.students.filter((s:any) => s.trangThaiDuyet).length} đã duyệt
                      </div>
                      <div className="px-2 py-0.5 bg-amber-50 text-amber-700 text-xs rounded-full font-medium flex items-center gap-1">
                        <Loader2 className="w-3 h-3" /> {dm.students.filter((s:any) => !s.trangThaiDuyet && s.daNop > 0).length} chờ duyệt
                      </div>
                    </div>
                    <div className="flex items-center gap-6 text-sm">
                      <div className="text-right">
                        <div className="text-slate-500 text-xs">Tổng thu</div>
                        <div className="font-medium">{Number(dm.totalExpected).toLocaleString('en-US')} đ</div>
                      </div>
                      <div className="text-right">
                        <div className="text-slate-500 text-xs">Đã nộp</div>
                        <div className="font-medium text-emerald-600">{Number(dm.totalPaid).toLocaleString('en-US')} đ</div>
                      </div>
                      <div className="text-right w-[100px]">
                        <div className="text-slate-500 text-xs">Còn nợ</div>
                        <div className="font-medium text-red-600">{Number(dm.totalDebt).toLocaleString('en-US')} đ</div>
                      </div>
                    </div>
                  </div>
                  
                  {expandedMoi[dm.dauMoiName] && (
                    <div className="bg-slate-50 p-4 border-t border-slate-100 shadow-inner">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left text-slate-500 border-b border-slate-200">
                            <th className="pb-2 font-medium">Họ tên</th>
                            <th className="pb-2 font-medium text-center">Ngày nhập</th>
                            <th className="pb-2 font-medium text-right">Dự kiến thu</th>
                            <th className="pb-2 font-medium text-right">Đã nộp</th>
                            <th className="pb-2 font-medium text-right">Còn nợ</th>
                            <th className="pb-2 font-medium text-center w-[120px]">Trạng thái</th>
                            <th className="pb-2 font-medium text-center w-[130px]">Thao tác</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {dm.students.map((student: any) => (
                            <tr key={student.maDk} className="hover:bg-white transition-colors">
                              <td className="py-2.5 font-medium text-slate-800">{student.hoTen}</td>
                              <td className="py-2.5 text-center text-slate-500">{student.ngayNhap}</td>
                              <td className="py-2.5 text-right">{Number(student.tienThu).toLocaleString('en-US')} đ</td>
                              <td className={`py-2.5 text-right font-medium ${student.trangThaiDuyet ? 'text-emerald-600' : 'text-slate-600'}`}>{Number(student.daNop).toLocaleString('en-US')} đ</td>
                              <td className="py-2.5 text-right text-red-600 font-medium">{Number(student.conNo).toLocaleString('en-US')} đ</td>
                              <td className="py-2.5 text-center">
                                {student.daNop === 0 ? (
                                  <span className="px-2 py-1 bg-slate-100 text-slate-500 text-xs rounded-full font-medium">Chưa nộp</span>
                                ) : student.trangThaiDuyet ? (
                                  <div className="flex flex-col items-center">
                                    <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs rounded-full font-medium">Đã duyệt</span>
                                    <span className="text-xs text-emerald-600 mt-0.5">({student.nguoiDuyet})</span>
                                  </div>
                                ) : (
                                  <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded-full font-medium">Chờ duyệt</span>
                                )}
                              </td>
                              <td className="py-2.5 text-center">
                                {student.daNop > 0 && (
                                  student.trangThaiDuyet ? (
                                    <button
                                      onClick={() => handleToggleApproval(student.maDk, true, dm.dauMoiName)}
                                      className="flex mx-auto items-center justify-center gap-1.5 w-[90px] py-1.5 text-xs font-semibold rounded-md transition-all bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                      Hủy duyệt
                                    </button>
                                  ) : (
                                    <div className="flex flex-col gap-1 items-center">
                                      <button
                                        onClick={() => handleToggleApproval(student.maDk, false, dm.dauMoiName, 'Trang')}
                                        className="flex items-center justify-center gap-1 w-[90px] py-1 text-xs font-semibold rounded transition-all bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 hover:shadow-md"
                                      >
                                        Trang duyệt
                                      </button>
                                      <button
                                        onClick={() => handleToggleApproval(student.maDk, false, dm.dauMoiName, 'Mẹ')}
                                        className="flex items-center justify-center gap-1 w-[90px] py-1 text-xs font-semibold rounded transition-all bg-purple-600 text-white shadow-sm hover:bg-purple-700 hover:shadow-md"
                                      >
                                        Mẹ duyệt
                                      </button>
                                    </div>
                                  )
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))}
              {details.byDauMoi.length === 0 && (
                <div className="p-8 text-center text-slate-500">
                  Khóa học này chưa có dữ liệu học viên.
                </div>
              )}
              </div>
            </Card>
          </div>
        )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
