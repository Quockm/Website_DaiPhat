"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, ChevronLeft, ChevronRight, FileCheck, CheckCircle2, Car, Briefcase } from "lucide-react";
import { getCars, updateCar, CarData } from "@/actions/cars";
import { getTeachers, updateTeacher, TeacherData } from "@/actions/teachers";
import { getPendingHandoversCount } from "@/actions/handover";

type Props = {
  initialCars: CarData[];
  initialCarTotal: number;
  initialCarPages: number;
  initialTeachers: TeacherData[];
  initialTeacherTotal: number;
  initialTeacherPages: number;
};

export default function HrHandoverClient({ 
  initialCars, initialCarTotal, initialCarPages,
  initialTeachers, initialTeacherTotal, initialTeacherPages 
}: Props) {
  const [activeTab, setActiveTab] = useState<"cars" | "teachers">("cars");
  
  const [cars, setCars] = useState<CarData[]>(initialCars);
  const [carTotal, setCarTotal] = useState(initialCarTotal);
  const [carPages, setCarPages] = useState(initialCarPages);
  const [carPage, setCarPage] = useState(1);
  const [carSearch, setCarSearch] = useState("");
  
  const [teachers, setTeachers] = useState<TeacherData[]>(initialTeachers);
  const [teacherTotal, setTeacherTotal] = useState(initialTeacherTotal);
  const [teacherPages, setTeacherPages] = useState(initialTeacherPages);
  const [teacherPage, setTeacherPage] = useState(1);
  const [teacherSearch, setTeacherSearch] = useState("");
  
  const [pendingCarsCount, setPendingCarsCount] = useState(0);
  const [pendingTeachersCount, setPendingTeachersCount] = useState(0);
  
  const [loading, setLoading] = useState(false);
  const isFirstRenderCar = useRef(true);
  const isFirstRenderTeacher = useRef(true);

  // Fetch pending counts
  const fetchCounts = async () => {
    const res = await getPendingHandoversCount();
    if (res.success && res.data) {
      setPendingCarsCount(res.data.cars);
      setPendingTeachersCount(res.data.teachers);
    }
  };

  useEffect(() => {
    fetchCounts();
  }, []);

  // Effect for Cars
  useEffect(() => {
    if (isFirstRenderCar.current) {
      isFirstRenderCar.current = false;
      return;
    }
    
    if (activeTab !== "cars") return;

    const timer = setTimeout(async () => {
      setLoading(true);
      const res = await getCars(carPage, 50, carSearch, "all", "handover");
      setCars(res.data);
      setCarTotal(res.totalRecords);
      setCarPages(res.totalPages);
      setCarPage(res.currentPage);
      setLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [carPage, carSearch, activeTab]);

  // Effect for Teachers
  useEffect(() => {
    if (isFirstRenderTeacher.current) {
      isFirstRenderTeacher.current = false;
      return;
    }
    
    if (activeTab !== "teachers") return;

    const timer = setTimeout(async () => {
      setLoading(true);
      const res = await getTeachers(teacherPage, 50, teacherSearch, "all", "all", "Đại Phát", "Giáo viên", true);
      setTeachers(res.data);
      setTeacherTotal(res.totalRecords);
      setTeacherPages(res.totalPages);
      setTeacherPage(res.currentPage);
      setLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [teacherPage, teacherSearch, activeTab]);

  const handleUpdateCar = async (id: number, field: keyof CarData, value: any) => {
    setCars(prev => prev.map(c => c.Id === id ? { ...c, [field]: value } : c));
    
    const res = await updateCar(id, { [field]: value });
    if (!res.success) {
      alert("Lỗi khi cập nhật: " + res.error);
      const freshRes = await getCars(carPage, 50, carSearch, "all", "handover");
      setCars(freshRes.data);
    } else {
      fetchCounts();
    }
  };

  const handleUpdateTeacher = async (id: number, field: keyof TeacherData, value: any) => {
    setTeachers(prev => prev.map(t => t.Id === id ? { ...t, [field]: value } : t));
    
    const res = await updateTeacher(id, { [field]: value });
    if (!res.success) {
      alert("Lỗi khi cập nhật: " + res.error);
      const freshRes = await getTeachers(teacherPage, 50, teacherSearch, "all", "all", "Đại Phát", "Giáo viên", true);
      setTeachers(freshRes.data);
    } else {
      fetchCounts();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Danh sách Bàn giao</h1>
          <p className="text-slate-500 text-sm mt-1">Phòng Nhân sự xác nhận hồ sơ nhận từ phòng Đào tạo</p>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="flex space-x-2 bg-slate-200/50 p-1.5 rounded-lg w-max">
        <button
          onClick={() => setActiveTab("cars")}
          className={`relative flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-semibold transition-all ${
            activeTab === "cars" 
              ? "bg-white text-indigo-700 shadow-sm" 
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-200"
          }`}
        >
          <Car className="w-4 h-4" />
          Phương tiện
          {pendingCarsCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {pendingCarsCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("teachers")}
          className={`relative flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-semibold transition-all ${
            activeTab === "teachers" 
              ? "bg-white text-indigo-700 shadow-sm" 
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-200"
          }`}
        >
          <Briefcase className="w-4 h-4" />
          Giáo viên
          {pendingTeachersCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {pendingTeachersCount}
            </span>
          )}
        </button>
      </div>

      <Card className="bg-white shadow-md border-slate-200 overflow-hidden relative">
        <CardHeader className="bg-slate-50/80 border-b border-slate-100 pb-4 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <div className="p-1.5 bg-green-100 rounded-md">
                <FileCheck className="h-5 w-5 text-green-700" />
              </div>
              Danh sách Bàn giao {activeTab === "cars" ? "Phương tiện" : "Giáo viên"} ({activeTab === "cars" ? carTotal : teacherTotal})
            </CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                value={activeTab === "cars" ? carSearch : teacherSearch}
                onChange={(e) => {
                  if (activeTab === "cars") { setCarSearch(e.target.value); setCarPage(1); }
                  else { setTeacherSearch(e.target.value); setTeacherPage(1); }
                }}
                placeholder={activeTab === "cars" ? "Tìm biển số, chủ xe..." : "Tìm tên, CCCD..."} 
                className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full font-medium"
              />
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0 relative">
          {loading && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          )}
          
          <div className="overflow-x-auto min-h-[400px]">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-extrabold uppercase text-xs border-b border-slate-200">
                {activeTab === "cars" ? (
                  <>
                    <tr>
                      <th className="px-4 py-4 w-12 text-center">STT</th>
                      <th className="px-4 py-4">Biển số</th>
                      <th className="px-4 py-4">Chủ xe</th>
                      <th className="px-4 py-4 text-center">Trạng thái Bàn giao</th>
                      <th className="px-4 py-4 text-center" colSpan={4}>04 Hạng Mục (Từ Đào Tạo)</th>
                      <th className="px-4 py-4 text-center">Hợp đồng thuê xe</th>
                      <th className="px-4 py-4 text-center">Xác nhận ĐK MST</th>
                    </tr>
                    <tr className="bg-slate-50/50 text-[11px] text-slate-500 border-b border-slate-200">
                      <th colSpan={4}></th>
                      <th className="px-2 py-2 text-center font-semibold">CCCD</th>
                      <th className="px-2 py-2 text-center font-semibold">Cà vẹt</th>
                      <th className="px-2 py-2 text-center font-semibold">Ngân hàng</th>
                      <th className="px-2 py-2 text-center font-semibold">ĐK</th>
                      <th colSpan={2}></th>
                    </tr>
                  </>
                ) : (
                  <tr>
                    <th className="px-4 py-4 w-12 text-center">STT</th>
                    <th className="px-4 py-4">Giáo viên</th>
                    <th className="px-4 py-4 text-center">Trạng thái Bàn giao</th>
                    <th className="px-4 py-4 text-center">Xác nhận Đủ</th>
                  </tr>
                )}
              </thead>
              <tbody className="divide-y divide-slate-200">
                {activeTab === "cars" && cars.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">Chưa có hồ sơ bàn giao xe nào.</td></tr>
                )}
                {activeTab === "teachers" && teachers.length === 0 && (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-500">Chưa có hồ sơ bàn giao giáo viên nào.</td></tr>
                )}
                
                {activeTab === "cars" && cars.map((car, idx) => {
                  const isCompleted = car.DangKyMST;
                  return (
                    <tr 
                      key={car.Id} 
                      className={`transition-colors ${isCompleted ? 'bg-green-50/80 hover:bg-green-100/80' : 'bg-white hover:bg-slate-50'}`}
                    >
                      <td className="px-4 py-3 text-center font-semibold text-slate-500">{(carPage - 1) * 50 + idx + 1}</td>
                      <td className="px-4 py-3 font-bold text-indigo-700">{car.BienSo}</td>
                      <td className="px-4 py-3 font-medium text-slate-700">{car.ChuXe || '-'}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="px-2 py-1 text-xs font-bold rounded bg-emerald-100 text-emerald-700">
                          {car.TrangThaiBanGiao}
                        </span>
                        {car.NgayBanGiao && (
                          <div className="text-[10px] text-emerald-600 mt-1 font-medium">{car.NgayBanGiao}</div>
                        )}
                      </td>
                      <td className="px-2 py-3 text-center">
                        <input 
                          type="checkbox" 
                          checked={!!car.BanGiaoCCCD_Xe} 
                          onChange={(e) => handleUpdateCar(car.Id, 'BanGiaoCCCD_Xe', e.target.checked)}
                          className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                        />
                      </td>
                      <td className="px-2 py-3 text-center">
                        <input 
                          type="checkbox" 
                          checked={!!car.BanGiaoCaVet} 
                          onChange={(e) => handleUpdateCar(car.Id, 'BanGiaoCaVet', e.target.checked)}
                          className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                        />
                      </td>
                      <td className="px-2 py-3 text-center">
                        <input 
                          type="checkbox" 
                          checked={!!car.BanGiaoNganHang} 
                          onChange={(e) => handleUpdateCar(car.Id, 'BanGiaoNganHang', e.target.checked)}
                          className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                        />
                      </td>
                      <td className="px-2 py-3 text-center border-r border-slate-100">
                        <input 
                          type="checkbox" 
                          checked={!!car.BanGiaoDangKiem} 
                          onChange={(e) => handleUpdateCar(car.Id, 'BanGiaoDangKiem', e.target.checked)}
                          className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                        />
                      </td>
                      <td className="px-4 py-3 text-center flex items-center justify-center gap-2">
                        <input 
                          type="checkbox" 
                          checked={!!car.HopDongThueXe} 
                          onChange={(e) => handleUpdateCar(car.Id, 'HopDongThueXe', e.target.checked)}
                          className="w-5 h-5 text-green-600 rounded border-slate-300 focus:ring-green-500 cursor-pointer"
                        />
                        {car.HopDongThueXe && <CheckCircle2 className="w-5 h-5 text-green-600" />}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <input 
                            type="checkbox" 
                            checked={!!car.DangKyMST} 
                            onChange={(e) => handleUpdateCar(car.Id, 'DangKyMST', e.target.checked)}
                            className="w-5 h-5 text-green-600 rounded border-slate-300 focus:ring-green-500 cursor-pointer"
                          />
                          {isCompleted && <CheckCircle2 className="w-5 h-5 text-green-600" />}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                
                {activeTab === "teachers" && teachers.map((teacher, idx) => {
                  const isCompleted = teacher.NhanSuXacNhanGV;
                  return (
                    <tr 
                      key={teacher.Id} 
                      className={`transition-colors ${isCompleted ? 'bg-green-50/80 hover:bg-green-100/80' : 'bg-white hover:bg-slate-50'}`}
                    >
                      <td className="px-4 py-3 text-center font-semibold text-slate-500">{(teacherPage - 1) * 50 + idx + 1}</td>
                      <td className="px-4 py-3 font-bold text-indigo-700">
                        {teacher.HoTen}
                        <div className="text-xs font-normal text-slate-500 mt-0.5">{teacher.CCCD} - {teacher.SDT}</div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="px-2 py-1 text-xs font-bold rounded bg-emerald-100 text-emerald-700">
                          {teacher.TrangThaiBanGiaoGV}
                        </span>
                        {teacher.NgayBanGiaoGV && (
                          <div className="text-[10px] text-emerald-600 mt-1 font-medium">{teacher.NgayBanGiaoGV}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center flex items-center justify-center gap-2">
                        <input 
                          type="checkbox" 
                          checked={!!teacher.NhanSuXacNhanGV} 
                          onChange={(e) => handleUpdateTeacher(teacher.Id, 'NhanSuXacNhanGV', e.target.checked)}
                          className="w-5 h-5 text-green-600 rounded border-slate-300 focus:ring-green-500 cursor-pointer"
                        />
                        {isCompleted && <CheckCircle2 className="w-5 h-5 text-green-600" />}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {(activeTab === "cars" ? carPages : teacherPages) > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50">
              <span className="text-sm text-slate-500 font-medium">
                Trang {activeTab === "cars" ? carPage : teacherPage} / {activeTab === "cars" ? carPages : teacherPages}
              </span>
              <div className="flex gap-2">
                <button 
                  onClick={() => activeTab === "cars" ? setCarPage(p => Math.max(1, p - 1)) : setTeacherPage(p => Math.max(1, p - 1))}
                  disabled={(activeTab === "cars" ? carPage : teacherPage) === 1}
                  className="p-1 border border-slate-300 rounded hover:bg-white disabled:opacity-50 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5 text-slate-600" />
                </button>
                <button 
                  onClick={() => activeTab === "cars" ? setCarPage(p => Math.min(carPages, p + 1)) : setTeacherPage(p => Math.min(teacherPages, p + 1))}
                  disabled={(activeTab === "cars" ? carPage : teacherPage) === (activeTab === "cars" ? carPages : teacherPages)}
                  className="p-1 border border-slate-300 rounded hover:bg-white disabled:opacity-50 transition-colors"
                >
                  <ChevronRight className="w-5 h-5 text-slate-600" />
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
