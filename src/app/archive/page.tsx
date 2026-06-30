"use client";

import { useState, useEffect } from "react";
import { FolderOpen, Search, User, Car } from "lucide-react";
import { getTeachers } from "@/actions/teachers";
import { getCars } from "@/actions/cars";
import TeacherDocsModal from "@/components/archive/TeacherDocsModal";
import CarDocsModal from "@/components/archive/CarDocsModal";

export default function ArchivePage() {
  const [activeTab, setActiveTab] = useState<"teachers" | "cars">("teachers");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryQuery, setCategoryQuery] = useState("all");
  const [docStatus, setDocStatus] = useState("all");
  const [stats, setStats] = useState({ empty: 0, partial: 0, full: 0 });
  
  const [teachers, setTeachers] = useState<any[]>([]);
  const [cars, setCars] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedTeacher, setSelectedTeacher] = useState<any | null>(null);
  const [selectedCar, setSelectedCar] = useState<any | null>(null);

  const loadData = async () => {
    setLoading(true);
    if (activeTab === "teachers") {
      const data = await getTeachers(1, 100, searchQuery, categoryQuery, docStatus);
      setTeachers(data.data);
      setStats({ empty: data.emptyCount || 0, partial: data.partialCount || 0, full: data.fullCount || 0 });
    } else {
      const data = await getCars(1, 100, searchQuery, categoryQuery, "", docStatus);
      setCars(data.data);
      setStats({ empty: data.emptyCount || 0, partial: data.partialCount || 0, full: data.fullCount || 0 });
    }
    setLoading(false);
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      loadData();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [activeTab, searchQuery, categoryQuery, docStatus]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in zoom-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 opacity-60 pointer-events-none"></div>
        <div className="relative z-10">
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-3">
            <div className="p-2.5 bg-indigo-100 rounded-xl">
              <FolderOpen className="w-6 h-6 text-indigo-600" />
            </div>
            Lưu trữ Hồ sơ
          </h1>
          <p className="text-sm text-slate-500 mt-2 font-medium">
            Quản lý và lưu trữ các loại giấy tờ của Giáo viên và Phương tiện (đã liên kết Google Drive)
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {/* Tabs */}
        <div className="flex items-center border-b border-slate-100 bg-slate-50/50 p-2 gap-2">
          <button
            onClick={() => { setActiveTab("teachers"); setSearchQuery(""); setCategoryQuery("all"); }}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${
              activeTab === "teachers"
                ? "bg-white text-indigo-600 shadow-sm border border-slate-200/60"
                : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
            }`}
          >
            <User className="w-4 h-4" />
            Hồ sơ Giáo viên
          </button>
          <button
            onClick={() => { setActiveTab("cars"); setSearchQuery(""); setCategoryQuery("all"); }}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${
              activeTab === "cars"
                ? "bg-white text-blue-600 shadow-sm border border-slate-200/60"
                : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
            }`}
          >
            <Car className="w-4 h-4" />
            Hồ sơ Phương tiện
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="flex flex-col md:flex-row items-center gap-3 mb-6">
            <div className="flex-1 w-full flex items-center gap-3 bg-slate-50 p-2 rounded-xl border border-slate-100 focus-within:border-indigo-300 focus-within:ring-4 focus-within:ring-indigo-50 transition-all">
              <Search className="w-5 h-5 text-slate-400 ml-2" />
              <input
                type="text"
                placeholder={activeTab === "teachers" ? "Tìm tên giáo viên, CCCD..." : "Tìm biển số xe, tên chủ xe..."}
                className="bg-transparent border-none outline-none text-sm w-full font-medium text-slate-700 placeholder:text-slate-400 py-1"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <select
              value={categoryQuery}
              onChange={(e) => setCategoryQuery(e.target.value)}
              className="w-full md:w-auto px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Tất cả hạng</option>
              {activeTab === "teachers" ? (
                <>
                  <option value="GVLT">GV Lý thuyết (GVLT)</option>
                  <option value="B">Hạng B</option>
                  <option value="B2">Hạng B2</option>
                  <option value="C">Hạng C</option>
                  <option value="C1">Hạng C1</option>
                  <option value="D">Hạng D</option>
                  <option value="D2">Hạng D2</option>
                  <option value="Dm">Hạng Dm</option>
                  <option value="E">Hạng E</option>
                </>
              ) : (
                <>
                  <option value="B (STD)">Hạng B (Sàn/Tự động)</option>
                  <option value="C">Hạng C</option>
                  <option value="D">Hạng D</option>
                  <option value="E">Hạng E</option>
                </>
              )}
            </select>
            <select
              value={docStatus}
              onChange={(e) => setDocStatus(e.target.value)}
              className="w-full md:w-auto px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Tất cả tình trạng</option>
              <option value="empty">Chưa có hồ sơ</option>
              <option value="partial">Chưa đủ hồ sơ</option>
              <option value="full">Đủ hồ sơ</option>
            </select>
          </div>

          <div className="flex flex-wrap gap-4 mb-6">
            <div className="bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-slate-300"></div>
              <span className="text-sm font-medium text-slate-600">
                Chưa có HS: <strong className="text-slate-800">{stats.empty}</strong>
              </span>
            </div>
            <div className="bg-amber-50 border border-amber-200 px-4 py-2 rounded-xl flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-400"></div>
              <span className="text-sm font-medium text-amber-700">
                Chưa đủ HS: <strong className="text-amber-900">{stats.partial}</strong>
              </span>
            </div>
            <div className="bg-green-50 border border-green-200 px-4 py-2 rounded-xl flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-sm font-medium text-green-700">
                Đủ HS: <strong className="text-green-900">{stats.full}</strong>
              </span>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-24 bg-slate-100 rounded-xl"></div>
              ))}
            </div>
          ) : activeTab === "teachers" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {teachers.map((teacher) => (
                <div 
                  key={teacher.Id} 
                  onClick={() => setSelectedTeacher(teacher)}
                  className="p-4 rounded-xl border border-slate-200 hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer bg-white group"
                >
                  <div className="flex items-center gap-4">
                    {teacher.Avatar ? (
                      <img src={teacher.Avatar.includes('drive.google.com') ? `/api/proxy-image?url=${encodeURIComponent(teacher.Avatar)}` : teacher.Avatar} alt="Avatar" className="w-12 h-12 rounded-full object-cover border border-slate-200 shadow-sm group-hover:scale-105 transition-transform" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-black text-lg group-hover:scale-110 transition-transform">
                        {teacher.HoTen.charAt(0)}
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <h3 className="font-bold text-slate-800">{teacher.HoTen}</h3>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          (teacher.UploadedDocs || 0) === 8 ? 'bg-green-100 text-green-700' : 
                          (teacher.UploadedDocs || 0) > 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {teacher.UploadedDocs || 0}/8 mục
                        </span>
                      </div>
                      <p className="text-xs font-medium text-slate-500 mt-0.5">CCCD: {teacher.CCCD || "Trống"}</p>
                      <div className="mt-2 text-[10px] font-bold px-2 py-1 bg-slate-100 text-slate-600 rounded inline-block">
                        {teacher.HangGVTH ? `GVTH: ${teacher.HangGVTH}` : "Chưa phân loại"}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {teachers.length === 0 && (
                <div className="col-span-full py-12 text-center text-slate-500">Không tìm thấy giáo viên nào.</div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {cars.map((car) => (
                <div 
                  key={car.Id} 
                  onClick={() => setSelectedCar(car)}
                  className="p-4 rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer bg-white group"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-3 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700 group-hover:scale-110 transition-transform">
                      <Car className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <h3 className="font-black text-slate-800 text-lg tracking-wide leading-none">{car.BienSo}</h3>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          (car.UploadedDocs || 0) === 6 ? 'bg-green-100 text-green-700' : 
                          (car.UploadedDocs || 0) > 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {car.UploadedDocs || 0}/6 mục
                        </span>
                      </div>
                      <p className="text-xs font-medium text-slate-500 mt-1.5">Chủ xe: {car.ChuXe || "Trung tâm"}</p>
                      <div className="mt-2 text-[10px] font-bold px-2 py-1 bg-slate-100 text-slate-600 rounded inline-block">
                        {car.HangXe || "Chưa phân loại"}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {cars.length === 0 && (
                <div className="col-span-full py-12 text-center text-slate-500">Không tìm thấy phương tiện nào.</div>
              )}
            </div>
          )}
        </div>
      </div>

      <TeacherDocsModal 
        isOpen={!!selectedTeacher} 
        onClose={() => setSelectedTeacher(null)} 
        teacher={selectedTeacher}
        onUpdate={loadData}
      />

      <CarDocsModal 
        isOpen={!!selectedCar} 
        onClose={() => setSelectedCar(null)} 
        car={selectedCar}
        onUpdate={loadData}
      />
    </div>
  );
}
