"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Car, Users, Save, AlertCircle, Plus, Trash2, X, Search, CheckCircle2 } from "lucide-react";
import { updateCourseAllocations, getAllocationsData } from "@/actions/allocations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AllocationsClient({ courses }: { courses: any[] }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialCourseId = searchParams.get("courseId") || "";
  
  const [selectedCourseId, setSelectedCourseId] = useState(initialCourseId);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  
  const [availableTeachers, setAvailableTeachers] = useState<any[]>([]);
  const [availableCars, setAvailableCars] = useState<any[]>([]);
  
  const [assignedTeachers, setAssignedTeachers] = useState<any[]>([]);
  const [assignedCars, setAssignedCars] = useState<any[]>([]);

  const [searchCar, setSearchCar] = useState("");
  const [searchTeacher, setSearchTeacher] = useState("");

  const [showCarModal, setShowCarModal] = useState(false);
  const [showTeacherModal, setShowTeacherModal] = useState(false);

  const selectedCourse = courses.find(c => c.id === selectedCourseId);

  useEffect(() => {
    if (!selectedCourse) return;
    
    const loadData = async () => {
      setLoading(true);
      setMessage({ text: "", type: "" });
      const res = await getAllocationsData(selectedCourse.id, selectedCourse.hangXe, selectedCourse.TrungTam);
      if (res.success) {
        setAssignedTeachers(res.assignedTeachers || []);
        setAssignedCars(res.assignedCars || []);
        setAvailableTeachers(res.availableTeachers || []);
        setAvailableCars(res.availableCars || []);
      } else {
        setMessage({ text: "Lỗi tải dữ liệu: " + res.error, type: "error" });
      }
      setLoading(false);
    };
    
    loadData();
  }, [selectedCourse]);

  const handleAddCar = (car: any) => {
    if (!assignedCars.some(c => c.id === car.BienSo)) {
      setAssignedCars([...assignedCars, { id: car.BienSo, type: car.HangXe, hanPhiDAT: car.HanPhiDAT, hanGpxtl: car.HanGPTL, ...car }]);
    }
    setSearchCar("");
  };

  const handleRemoveCar = (id: string) => {
    setAssignedCars(assignedCars.filter(c => c.id !== id));
  };

  const handleAddTeacher = (teacher: any) => {
    if (!assignedTeachers.some(t => t.id === teacher.Id)) {
      setAssignedTeachers([...assignedTeachers, { id: teacher.Id, name: teacher.HoTen, type: teacher.HangGPLX, hanGplx: teacher.HanGPLX, ...teacher }]);
    }
    setSearchTeacher("");
  };

  const handleRemoveTeacher = (id: string | number) => {
    setAssignedTeachers(assignedTeachers.filter(t => t.id !== id));
  };

  const handleSave = async () => {
    if (!selectedCourse) return;
    
    setSaving(true);
    setMessage({ text: "", type: "" });
    const carIds = assignedCars.map(c => c.id);
    const teacherIds = assignedTeachers.map(t => t.id.toString());
    
    const res = await updateCourseAllocations(selectedCourse.id, carIds, teacherIds);
    if (res.success) {
      setMessage({ text: "Cập nhật phân công thành công!", type: "success" });
      setTimeout(() => setMessage({ text: "", type: "" }), 3000);
    } else {
      setMessage({ text: "Lỗi khi lưu: " + res.error, type: "error" });
    }
    setSaving(false);
  };

  const emptyCars = availableCars.filter(c => !c.ActiveCourseName || c.ActiveCourseName === selectedCourse?.name);
  const emptyTeachers = availableTeachers.filter(t => !t.ActiveCourseName || t.ActiveCourseName === selectedCourse?.name);

  const filteredCars = emptyCars.filter(c => 
    !assignedCars.some(ac => ac.id === c.BienSo) &&
    (c.BienSo.toLowerCase().includes(searchCar.toLowerCase()) || 
    (c.HangXe && c.HangXe.toLowerCase().includes(searchCar.toLowerCase())))
  );

  const filteredTeachers = emptyTeachers.filter(t => 
    !assignedTeachers.some(at => at.id === t.Id) &&
    (t.HoTen.toLowerCase().includes(searchTeacher.toLowerCase()) || 
    (t.HangGPLX && t.HangGPLX.toLowerCase().includes(searchTeacher.toLowerCase())))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Phân Bổ Xe & Giáo Viên</h1>
          <p className="text-slate-600 mt-2 text-base font-medium">Lựa chọn khóa học và sắp xếp nguồn lực đào tạo</p>
        </div>
        {selectedCourse && (
          <button 
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg font-bold transition-colors shadow-sm"
          >
            {saving ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Save className="w-5 h-5" />}
            Lưu Phân Công
          </button>
        )}
      </div>

      {message.text && (
        <div className={`p-4 rounded-lg flex items-center gap-3 font-semibold ${message.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
          {message.type === 'error' ? <AlertCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
          {message.text}
        </div>
      )}

      <Card className="shadow-sm border-slate-200">
        <CardContent className="p-6">
          <label className="block text-sm font-bold text-slate-700 mb-2">Chọn Khóa Học</label>
          <select
            value={selectedCourseId}
            onChange={(e) => {
              setSelectedCourseId(e.target.value);
              // Use history API to update URL without triggering Next.js Suspense fallback jitter
              const newUrl = `/allocations${e.target.value ? `?courseId=${e.target.value}` : ''}`;
              window.history.replaceState(null, '', newUrl);
            }}
            className="w-full max-w-xl px-4 py-3 bg-white border border-slate-300 rounded-lg text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">-- Chọn một khóa học --</option>
            {courses.map(c => (
              <option key={c.id} value={c.id}>
                {c.name} - Hạng {c.hangXe} ({c.status})
              </option>
            ))}
          </select>
        </CardContent>
      </Card>

      {selectedCourse && (
        <div className="grid md:grid-cols-2 gap-6">
          {loading ? (
            <div className="md:col-span-2 py-12 flex justify-center">
              <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Phân công Xe */}
              <Card className="bg-white shadow-md border-slate-200 h-fit">
                <CardHeader className="bg-slate-50/80 border-b border-slate-100 pb-4 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <Car className="h-5 w-5 text-orange-700" />
                    </div>
                    Xe Được Phân Công ({assignedCars.length})
                  </CardTitle>
                  <button 
                    onClick={() => setShowCarModal(true)}
                    className="flex items-center gap-1.5 bg-orange-100 hover:bg-orange-200 text-orange-700 px-3 py-1.5 rounded-md text-xs font-bold transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Thêm Xe
                  </button>
                </CardHeader>
                <CardContent className="pt-4 p-0">
                  <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto custom-scrollbar">
                    {assignedCars.map(car => (
                      <div key={car.id} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors group">
                        <div>
                          <span className="font-extrabold text-red-700 text-lg">{car.id}</span>
                          <div className="text-sm font-semibold text-slate-500">Hạng: {car.type}</div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right text-xs text-slate-500 flex flex-col items-end">
                            <span>Hạn phí DAT: <strong className="text-slate-700">{car.hanPhiDAT || '-'}</strong></span>
                            <span>Hạn GPXTL: <strong className="text-slate-700">{car.hanGpxtl || '-'}</strong></span>
                          </div>
                          <button 
                            onClick={() => handleRemoveCar(car.id)}
                            className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Xóa khỏi khóa"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                    {assignedCars.length === 0 && (
                      <p className="text-slate-500 text-center py-8 font-medium">Chưa có xe nào được phân công.</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Phân công Giáo viên */}
              <Card className="bg-white shadow-md border-slate-200 h-fit">
                <CardHeader className="bg-slate-50/80 border-b border-slate-100 pb-4 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Users className="h-5 w-5 text-green-700" />
                    </div>
                    Giáo viên Phân Công ({assignedTeachers.length})
                  </CardTitle>
                  <button 
                    onClick={() => setShowTeacherModal(true)}
                    className="flex items-center gap-1.5 bg-green-100 hover:bg-green-200 text-green-700 px-3 py-1.5 rounded-md text-xs font-bold transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Thêm GV
                  </button>
                </CardHeader>
                <CardContent className="pt-4 p-0">
                  <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto custom-scrollbar">
                    {assignedTeachers.map(teacher => (
                      <div key={teacher.id} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors group">
                        <div>
                          <span className="font-bold text-slate-800 text-base">{teacher.name}</span>
                          <div className="text-sm font-semibold text-slate-500">Hạng: {teacher.type}</div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right text-xs text-slate-500">
                            Hạn GPLX: <strong className="text-slate-700">{teacher.hanGplx || '-'}</strong>
                          </div>
                          <button 
                            onClick={() => handleRemoveTeacher(teacher.id)}
                            className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Xóa khỏi khóa"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                    {assignedTeachers.length === 0 && (
                      <p className="text-slate-500 text-center py-8 font-medium">Chưa có giáo viên nào được phân công.</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}

      {/* Modal Thêm Xe */}
      {showCarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <div className="p-1.5 bg-orange-100 rounded-md"><Car className="w-4 h-4 text-orange-600" /></div>
                Chọn Xe Trống Cần Thêm
              </h3>
              <button onClick={() => setShowCarModal(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 border-b border-slate-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Tìm theo biển số..." 
                  value={searchCar}
                  onChange={e => setSearchCar(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-md border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                />
              </div>
            </div>
            <div className="overflow-y-auto flex-1 p-2 custom-scrollbar space-y-1">
              {filteredCars.map(car => (
                <div key={car.BienSo} className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-lg border border-transparent hover:border-slate-100">
                  <div>
                    <span className="font-bold text-slate-800">{car.BienSo}</span>
                    <span className="text-xs text-orange-600 font-semibold ml-2">Hạng {car.HangXe}</span>
                  </div>
                  <button onClick={() => handleAddCar(car)} className="px-3 py-1.5 bg-orange-50 hover:bg-orange-600 text-orange-600 hover:text-white rounded text-xs font-bold transition-colors">
                    Thêm
                  </button>
                </div>
              ))}
              {filteredCars.length === 0 && (
                <div className="py-8 text-center text-sm text-slate-500">Không có xe trống nào phù hợp</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Thêm GV */}
      {showTeacherModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <div className="p-1.5 bg-green-100 rounded-md"><Users className="w-4 h-4 text-green-600" /></div>
                Chọn Giáo Viên Trống
              </h3>
              <button onClick={() => setShowTeacherModal(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 border-b border-slate-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Tìm theo tên..." 
                  value={searchTeacher}
                  onChange={e => setSearchTeacher(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-md border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/50"
                />
              </div>
            </div>
            <div className="overflow-y-auto flex-1 p-2 custom-scrollbar space-y-1">
              {filteredTeachers.map(teacher => (
                <div key={teacher.Id} className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-lg border border-transparent hover:border-slate-100">
                  <div>
                    <span className="font-bold text-slate-800">{teacher.HoTen}</span>
                    <span className="text-xs text-green-600 font-semibold ml-2">Hạng {teacher.HangGPLX}</span>
                  </div>
                  <button onClick={() => handleAddTeacher(teacher)} className="px-3 py-1.5 bg-green-50 hover:bg-green-600 text-green-600 hover:text-white rounded text-xs font-bold transition-colors">
                    Thêm
                  </button>
                </div>
              ))}
              {filteredTeachers.length === 0 && (
                <div className="py-8 text-center text-sm text-slate-500">Không có giáo viên trống nào phù hợp</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
