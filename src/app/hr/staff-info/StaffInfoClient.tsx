"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, UserCircle2, Briefcase, Car, FileCheck, CheckCircle2, FileText, Link as LinkIcon } from "lucide-react";
import { TeacherData, updateTeacher } from "@/actions/teachers";
import { CarData, assignCarToTeacher } from "@/actions/cars";
import Link from "next/link";

type Props = {
  initialTeachers: TeacherData[];
  initialCars: CarData[];
};

export default function StaffInfoClient({ initialTeachers, initialCars }: Props) {
  const [teachers, setTeachers] = useState<TeacherData[]>(initialTeachers);
  const [cars, setCars] = useState<CarData[]>(initialCars);
  
  const [search, setSearch] = useState("");
  const [selectedTeacherId, setSelectedTeacherId] = useState<number | null>(null);
  
  const [selectedCarToAdd, setSelectedCarToAdd] = useState<string>("");
  const [carSearchQuery, setCarSearchQuery] = useState("");
  const [showCarDropdown, setShowCarDropdown] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);

  const filteredTeachers = teachers.filter(t => 
    t.HoTen.toLowerCase().includes(search.toLowerCase()) || 
    (t.CCCD && t.CCCD.includes(search)) ||
    (t.SDT && t.SDT.includes(search))
  ).sort((a, b) => {
    if (a.NhanSuXacNhanGV && !b.NhanSuXacNhanGV) return -1;
    if (!a.NhanSuXacNhanGV && b.NhanSuXacNhanGV) return 1;
    return a.HoTen.localeCompare(b.HoTen);
  });

  const selectedTeacher = teachers.find(t => t.Id === selectedTeacherId);
  const teacherCars = cars.filter(c => c.GiaoVienId === selectedTeacherId);

  const handleUpdateHRDocs = async (field: keyof TeacherData, value: boolean) => {
    if (!selectedTeacherId) return;
    
    // Optimistic update
    setTeachers(prev => prev.map(t => t.Id === selectedTeacherId ? { ...t, [field]: value } : t));
    
    const res = await updateTeacher(selectedTeacherId, { [field]: value });
    if (!res.success) {
      alert("Lỗi khi cập nhật: " + res.error);
      // Revert in a real app, here we might just reload
    }
  };

  const handleAssignCar = async () => {
    if (!selectedTeacher || !selectedCarToAdd) return;
    
    setIsAssigning(true);
    const carId = parseInt(selectedCarToAdd);
    
    const res = await assignCarToTeacher(carId, selectedTeacher.Id, selectedTeacher.HoTen);
    if (res.success) {
      // Update local state
      setCars(prev => prev.map(c => {
        if (c.Id === carId) {
          return { ...c, GiaoVienId: selectedTeacher.Id, ChuXe: selectedTeacher.HoTen };
        }
        return c;
      }));
      setSelectedCarToAdd("");
      setCarSearchQuery("");
    } else {
      alert("Lỗi khi gán xe: " + res.error);
    }
    setIsAssigning(false);
  };

  return (
    <div className="flex h-[calc(100vh-140px)] gap-6">
      {/* Left Sidebar: Teacher List */}
      <Card className="w-80 flex flex-col shrink-0 bg-white shadow-sm border-slate-200">
        <div className="p-4 border-b border-slate-100">
          <h2 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
            <UserCircle2 className="w-5 h-5 text-indigo-600" />
            Danh sách Nhân sự
          </h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Tìm tên, CCCD..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin scrollbar-thumb-slate-200">
          {filteredTeachers.map(teacher => (
            <button
              key={teacher.Id}
              onClick={() => setSelectedTeacherId(teacher.Id)}
              className={`w-full text-left p-3 rounded-lg transition-colors flex items-start gap-3 relative ${
                selectedTeacherId === teacher.Id 
                  ? 'bg-indigo-50 border border-indigo-100' 
                  : teacher.NhanSuXacNhanGV 
                    ? 'bg-emerald-50/50 hover:bg-emerald-50 border border-transparent' 
                    : 'hover:bg-slate-50 border border-transparent'
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                selectedTeacherId === teacher.Id 
                  ? 'bg-indigo-600 text-white' 
                  : teacher.NhanSuXacNhanGV 
                    ? 'bg-emerald-500 text-white' 
                    : 'bg-slate-200 text-slate-600'
              }`}>
                {teacher.HoTen.charAt(0)}
              </div>
              
              <div className="overflow-hidden flex-1">
                <div className={`font-semibold text-sm truncate flex items-center gap-1.5 ${
                  selectedTeacherId === teacher.Id 
                    ? 'text-indigo-900' 
                    : teacher.NhanSuXacNhanGV 
                      ? 'text-emerald-800' 
                      : 'text-slate-700'
                }`}>
                  {teacher.HoTen}
                  {teacher.NhanSuXacNhanGV && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
                </div>
                <div className="text-xs text-slate-500 truncate mt-0.5">{teacher.CCCD || 'Chưa có CCCD'}</div>
              </div>
            </button>
          ))}
          {filteredTeachers.length === 0 && (
            <div className="text-center p-4 text-slate-500 text-sm">Không tìm thấy nhân sự.</div>
          )}
        </div>
      </Card>

      {/* Right Content: Teacher Details */}
      <div className="flex-1 overflow-y-auto pr-2">
        {selectedTeacher ? (
          <div className="space-y-6">
            {/* Header Info */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex justify-between items-start">
              <div className="flex gap-4 items-center">
                <div className="w-16 h-16 bg-indigo-100 text-indigo-700 rounded-2xl flex items-center justify-center text-2xl font-bold">
                  {selectedTeacher.HoTen.charAt(0)}
                </div>
                <div>
                  <h1 className="text-2xl font-extrabold text-slate-800">{selectedTeacher.HoTen}</h1>
                  <div className="text-slate-500 mt-1 flex gap-4 text-sm font-medium">
                    <span>CCCD: {selectedTeacher.CCCD || '-'}</span>
                    <span>SĐT: {selectedTeacher.SDT || '-'}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col items-end gap-2">
                <div className="text-sm font-semibold bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg border border-blue-100 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Đã Upload: {selectedTeacher.UploadedDocs || 0} / 9
                </div>
                <Link 
                  href={`/archive?tab=staff&search=${selectedTeacher.CCCD || selectedTeacher.HoTen}&action=upload`}
                  className="flex items-center gap-1.5 hover:underline text-indigo-600 text-sm font-medium"
                >
                  Đến kho lưu trữ
                  <LinkIcon className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {selectedTeacher.LoaiNhanSu === 'Giáo viên' ? (
                <>
                  {/* Handover Info (Giáo viên only) */}
                  <Card className="bg-white shadow-sm border-slate-200">
                    <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-3">
                      <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-700">
                        <Briefcase className="w-4 h-4 text-emerald-600" />
                        Hồ sơ Đào tạo bàn giao
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                      <div className="grid grid-cols-2 gap-y-3 gap-x-4">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className={`w-5 h-5 ${selectedTeacher.BanGiaoCCCD ? 'text-emerald-500' : 'text-slate-300'}`} />
                          <span className="text-sm text-slate-600">CCCD</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className={`w-5 h-5 ${selectedTeacher.BanGiaoGPLX ? 'text-emerald-500' : 'text-slate-300'}`} />
                          <span className="text-sm text-slate-600">GPLX (ĐT)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className={`w-5 h-5 ${selectedTeacher.BanGiaoBangTN ? 'text-emerald-500' : 'text-slate-300'}`} />
                          <span className="text-sm text-slate-600">Bằng TN</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className={`w-5 h-5 ${selectedTeacher.BanGiaoNVSP ? 'text-emerald-500' : 'text-slate-300'}`} />
                          <span className="text-sm text-slate-600">Nghiệp vụ SP</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className={`w-5 h-5 ${selectedTeacher.BanGiaoGVTH ? 'text-emerald-500' : 'text-slate-300'}`} />
                          <span className="text-sm text-slate-600">Giáo viên TH</span>
                        </div>
                      </div>
                      
                      {selectedTeacher.NgayBanGiaoGV && (
                        <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500 font-medium flex justify-between">
                          <span>Thời gian bàn giao:</span>
                          <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">{selectedTeacher.NgayBanGiaoGV}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* HR Info (Giáo viên) */}
                  <Card className="bg-indigo-50/30 shadow-sm border-indigo-100">
                    <CardHeader className="bg-indigo-50/50 border-b border-indigo-100 pb-3">
                      <CardTitle className="text-sm font-bold flex items-center gap-2 text-indigo-800">
                        <FileCheck className="w-4 h-4" />
                        Hồ sơ Nhân sự thu thập
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                      <div className="space-y-4">
                        <label className="flex items-center justify-between cursor-pointer group">
                          <span className="text-sm font-medium text-slate-700 group-hover:text-indigo-700">Đơn xin việc</span>
                          <input 
                            type="checkbox" 
                            checked={!!selectedTeacher.DonXinViec_HR} 
                            onChange={(e) => handleUpdateHRDocs('DonXinViec_HR', e.target.checked)}
                            className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          />
                        </label>
                        <label className="flex items-center justify-between cursor-pointer group">
                          <span className="text-sm font-medium text-slate-700 group-hover:text-indigo-700">Sơ yếu lý lịch</span>
                          <input 
                            type="checkbox" 
                            checked={!!selectedTeacher.SoYeuLyLich_HR} 
                            onChange={(e) => handleUpdateHRDocs('SoYeuLyLich_HR', e.target.checked)}
                            className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          />
                        </label>
                        <label className="flex items-center justify-between cursor-pointer group">
                          <span className="text-sm font-medium text-slate-700 group-hover:text-indigo-700">Hợp đồng lao động</span>
                          <input 
                            type="checkbox" 
                            checked={!!selectedTeacher.HopDongLaoDong_HR} 
                            onChange={(e) => handleUpdateHRDocs('HopDongLaoDong_HR', e.target.checked)}
                            className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          />
                        </label>
                        <label className="flex items-center justify-between cursor-pointer group">
                          <span className="text-sm font-medium text-slate-700 group-hover:text-indigo-700">Giấy khám sức khoẻ</span>
                          <input 
                            type="checkbox" 
                            checked={!!selectedTeacher.GiayKhamSucKhoe_HR} 
                            onChange={(e) => handleUpdateHRDocs('GiayKhamSucKhoe_HR', e.target.checked)}
                            className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          />
                        </label>
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : (
                /* HR Info (Nhân viên / Nhân sự) */
                <Card className="bg-indigo-50/30 shadow-sm border-indigo-100 xl:col-span-2">
                  <CardHeader className="bg-indigo-50/50 border-b border-indigo-100 pb-3">
                    <CardTitle className="text-sm font-bold flex items-center gap-2 text-indigo-800">
                      <FileCheck className="w-4 h-4" />
                      Bộ hồ sơ lưu trữ (Dành cho Nhân viên)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 max-w-lg">
                    <div className="space-y-4">
                      <label className="flex items-center justify-between cursor-pointer group">
                        <span className="text-sm font-medium text-slate-700 group-hover:text-indigo-700">Đơn xin việc</span>
                        <input 
                          type="checkbox" 
                          checked={!!selectedTeacher.DonXinViec_HR} 
                          onChange={(e) => handleUpdateHRDocs('DonXinViec_HR', e.target.checked)}
                          className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                      </label>
                      <label className="flex items-center justify-between cursor-pointer group">
                        <span className="text-sm font-medium text-slate-700 group-hover:text-indigo-700">Sơ yếu lý lịch</span>
                        <input 
                          type="checkbox" 
                          checked={!!selectedTeacher.SoYeuLyLich_HR} 
                          onChange={(e) => handleUpdateHRDocs('SoYeuLyLich_HR', e.target.checked)}
                          className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                      </label>
                      <label className="flex items-center justify-between cursor-pointer group">
                        <span className="text-sm font-medium text-slate-700 group-hover:text-indigo-700">Hợp đồng lao động</span>
                        <input 
                          type="checkbox" 
                          checked={!!selectedTeacher.HopDongLaoDong_HR} 
                          onChange={(e) => handleUpdateHRDocs('HopDongLaoDong_HR', e.target.checked)}
                          className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                      </label>
                      <label className="flex items-center justify-between cursor-pointer group">
                        <span className="text-sm font-medium text-slate-700 group-hover:text-indigo-700">Bằng tốt nghiệp</span>
                        <input 
                          type="checkbox" 
                          checked={!!selectedTeacher.BangTotNghiep_HR} 
                          onChange={(e) => handleUpdateHRDocs('BangTotNghiep_HR', e.target.checked)}
                          className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                      </label>
                      <label className="flex items-center justify-between cursor-pointer group">
                        <span className="text-sm font-medium text-slate-700 group-hover:text-indigo-700">Giấy khám sức khoẻ</span>
                        <input 
                          type="checkbox" 
                          checked={!!selectedTeacher.GiayKhamSucKhoe_HR} 
                          onChange={(e) => handleUpdateHRDocs('GiayKhamSucKhoe_HR', e.target.checked)}
                          className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                      </label>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Vehicle Management */}
            <Card className="bg-white shadow-sm border-slate-200">
              <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-700">
                  <Car className="w-4 h-4 text-orange-500" />
                  Xe sở hữu / Liên kết
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                {teacherCars.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-6">
                    {teacherCars.map(car => (
                      <div key={car.Id} className="flex items-center gap-3 p-3 border border-orange-200 bg-orange-50/50 rounded-lg">
                        <div className="w-10 h-10 bg-white rounded-md border border-orange-100 flex items-center justify-center">
                          <Car className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                          <div className="font-bold text-orange-900">{car.BienSo}</div>
                          <div className="text-xs text-orange-600/80 font-medium">{car.HangXe || 'Không rõ hãng'}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-slate-500 text-sm italic mb-6">Nhân sự này chưa có xe nào.</div>
                )}

                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mt-6">
                  <h4 className="text-base font-black text-slate-900 mb-3">Thêm xe cho nhân sự</h4>
                  <div className="flex gap-2 relative">
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        placeholder="Tìm biển số, chủ xe..."
                        value={carSearchQuery}
                        onChange={(e) => {
                          setCarSearchQuery(e.target.value);
                          setShowCarDropdown(e.target.value.trim().length > 0);
                          if (!e.target.value) setSelectedCarToAdd("");
                        }}
                        onFocus={(e) => {
                          if (e.target.value.trim().length > 0) setShowCarDropdown(true);
                        }}
                        onBlur={() => setTimeout(() => setShowCarDropdown(false), 200)}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      {showCarDropdown && carSearchQuery.trim().length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-lg z-50">
                          {cars.filter(c => 
                            c.BienSo.toLowerCase().includes(carSearchQuery.toLowerCase()) || 
                            (c.ChuXe && c.ChuXe.toLowerCase().includes(carSearchQuery.toLowerCase()))
                          ).slice(0, 50).map(c => {
                            const isAssigned = c.GiaoVienId != null;
                            const hasOwnerName = !!c.ChuXe;
                            
                            const label = isAssigned 
                              ? `${c.BienSo} (Đã gán cho: ${c.ChuXe})` 
                              : hasOwnerName
                                ? `[CHƯA KHỚP] ${c.BienSo} (Tên trên xe: ${c.ChuXe})`
                                : `${c.BienSo} (Chưa gán)`;
                                
                            const style = (!isAssigned && hasOwnerName) 
                              ? "bg-slate-800 text-white font-bold hover:bg-slate-700" 
                              : "text-slate-700 hover:bg-slate-50";

                            return (
                              <div 
                                key={c.Id} 
                                className={`px-3 py-2 text-sm cursor-pointer border-b border-slate-100 last:border-0 ${style}`}
                                onClick={() => {
                                  setSelectedCarToAdd(c.Id.toString());
                                  setCarSearchQuery(label);
                                  setShowCarDropdown(false);
                                }}
                              >
                                {label}
                              </div>
                            );
                          })}
                          {cars.filter(c => 
                            c.BienSo.toLowerCase().includes(carSearchQuery.toLowerCase()) || 
                            (c.ChuXe && c.ChuXe.toLowerCase().includes(carSearchQuery.toLowerCase()))
                          ).length === 0 && (
                            <div className="px-3 py-2 text-sm text-slate-500 text-center">Không tìm thấy xe phù hợp</div>
                          )}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={handleAssignCar}
                      disabled={!selectedCarToAdd || isAssigning}
                      className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-2"
                    >
                      {isAssigning ? 'Đang xử lý...' : 'Thêm xe'}
                    </button>
                  </div>
                  {selectedCarToAdd && cars.find(c => c.Id === parseInt(selectedCarToAdd))?.GiaoVienId && (
                    <p className="text-xs text-amber-600 mt-2 font-medium">
                      ⚠️ Lưu ý: Xe này đã được gán cho người khác. Nếu bạn tiếp tục, hệ thống sẽ chuyển đổi quyền sở hữu sang nhân sự này.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-400">
            <UserCircle2 className="w-16 h-16 text-slate-200 mb-4" />
            <p className="font-medium">Chọn một nhân sự bên trái để xem thông tin</p>
          </div>
        )}
      </div>
    </div>
  );
}
