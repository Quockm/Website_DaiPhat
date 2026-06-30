"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { addStudent, getCourseDetailsForAdmissions } from "@/actions/admissions";
import { Loader2, User } from "lucide-react";
import { useRouter } from "next/navigation";

type Course = {
  id: string;
  name: string;
  hangXe: string;
  soHocVienDaNhap: number;
  luuLuong: number;
  khaiGiang: string;
  status: string;
  trungTam: string;
};

export default function OtoAdmissionsClient({ initialCourses }: { initialCourses: any[] }) {
  const [selectedCourse, setSelectedCourse] = useState("");
  const [courseDetails, setCourseDetails] = useState<any>(null);
  const [loadingCourse, setLoadingCourse] = useState(false);
  const [trungTamFilter, setTrungTamFilter] = useState("Đại Phát");
  
  const router = useRouter();

  useEffect(() => {
    if (selectedCourse) {
      setLoadingCourse(true);
      getCourseDetailsForAdmissions(selectedCourse).then(res => {
        setCourseDetails(res);
        setLoadingCourse(false);
      });
    } else {
      setCourseDetails(null);
    }
  }, [selectedCourse]);

  const filteredCourses = initialCourses.filter(c => c.trungTam === trungTamFilter);
  const selectedCourseData = initialCourses.find(c => c.id === selectedCourse);
  const rate = selectedCourseData ? (courseDetails?.rates?.[selectedCourseData.hangXe] || 5) : 5;

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Tuyển sinh Ô tô
          </h1>
          <p className="text-slate-500">
            Nhập hồ sơ học viên mới vào các khóa học Ô tô chưa đủ chỉ tiêu. Danh sách học viên được phân bổ theo Chủ Xe và Giáo viên.
          </p>
        </div>
        <Select value={trungTamFilter} onValueChange={(val) => {
          setTrungTamFilter(val);
          setSelectedCourse(""); // Clear selected course when switching center
        }}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Chọn Trung tâm" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Đại Phát">Đại Phát</SelectItem>
            <SelectItem value="Tiến Thành">Tiến Thành</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-6">
        {/* Top Section: Course Info & Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="bg-slate-50">
              <CardTitle className="text-lg">1. Thông tin Khóa Đào Tạo</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                <SelectTrigger>
                  <SelectValue placeholder="-- Chọn khóa học --" />
                </SelectTrigger>
                <SelectContent>
                  {filteredCourses.map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name} - Hạng {c.hangXe} ({c.soHocVienDaNhap}/{c.luuLuong} HV)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {selectedCourseData && (
                <div className="mt-4 p-4 bg-indigo-50/50 rounded-lg text-sm space-y-2 border border-indigo-100">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-slate-500 mb-1">Mã khóa:</div>
                      <div className="font-medium text-slate-900">{selectedCourseData.id}</div>
                    </div>
                    <div>
                      <div className="text-slate-500 mb-1">Ngày khai giảng:</div>
                      <div className="font-medium text-slate-900">{selectedCourseData.khaiGiang}</div>
                    </div>
                  </div>
                  <div className="pt-2 mt-2 border-t border-indigo-200/50">
                    <div className="flex justify-between items-center py-1">
                      <span className="text-slate-500">Số lượng đầu mối:</span>
                      <span className="font-medium text-slate-900">{courseDetails?.cars?.length || 0}</span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-slate-500">Số lượng HS/đầu mối được tuyển:</span>
                      <span className="font-medium text-slate-900">{rate} học viên</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {selectedCourseData && (
            <Card>
              <CardHeader className="bg-slate-50">
                <CardTitle className="text-lg flex justify-between items-center">
                  <span>Tổng quan khóa</span>
                  <span className="text-sm font-normal text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                    Đã nhập {courseDetails?.students?.length || 0} / {selectedCourseData.luuLuong} hồ sơ
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div>
                    <div className="text-slate-500 mb-1 text-sm">Xe được phân công:</div>
                    {courseDetails?.cars?.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {courseDetails.cars.map((car: any) => (
                          <span key={car.bienSo} className="px-2 py-1 bg-white border border-indigo-100 rounded text-xs font-medium text-indigo-700">
                            {car.bienSo} {car.chuXe ? `(${car.chuXe})` : ''}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-slate-400 italic">Chưa phân công xe</div>
                    )}
                  </div>
                  <div className="pt-2 border-t border-slate-100">
                    <div className="text-slate-500 mb-1 text-sm">Giáo viên được phân công:</div>
                    {courseDetails?.teachers?.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {courseDetails.teachers.map((teacher: any) => (
                          <span key={teacher.id} className="px-2 py-1 bg-white border border-indigo-100 rounded text-xs font-medium text-indigo-700">
                            {teacher.name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-slate-400 italic">Chưa phân công giáo viên</div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Bottom Section: Teacher/Car Slots */}
        <div className="mt-4">
          {!selectedCourse ? (
            <div className="flex items-center justify-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 p-12 text-center text-slate-500 h-64">
              Vui lòng chọn khóa đào tạo ở trên để hiển thị danh sách và nhập hồ sơ.
            </div>
          ) : (
            <div className="space-y-8">
              <h2 className="text-xl font-bold text-slate-800">2. Dữ liệu nhập hồ sơ</h2>
              
              {courseDetails?.cars?.map((car: any, index: number) => {
                const teacher = courseDetails.teachers?.[index] || { name: 'Chưa có GV' };
                const studentsInBlock = courseDetails.students.filter((s:any) => s.giaoVien === teacher.name);
                
                return (
                  <CarTeacherBlock 
                    key={car.bienSo + index} 
                    car={car}
                    teacher={teacher} 
                    rate={rate} 
                    students={studentsInBlock} 
                    maKhoa={selectedCourse}
                    onSuccess={() => {
                      getCourseDetailsForAdmissions(selectedCourse).then(setCourseDetails);
                      router.refresh();
                    }}
                  />
                );
              })}
              {courseDetails?.cars?.length === 0 && !loadingCourse && (
                <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-xl border border-slate-200">
                  Khóa học này chưa được phân công xe. Vui lòng phân công xe trước khi tuyển sinh.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CarTeacherBlock({ car, teacher, rate, students, maKhoa, onSuccess }: any) {
  return (
    <Card className="shadow-sm border-slate-200 overflow-hidden">
      <div className="bg-slate-800 p-4 text-white flex justify-between items-center">
        <div className="font-medium text-lg flex items-center gap-2">
          <User className="w-5 h-5 text-slate-300" />
          <span>
            Xe: {car.bienSo} 
            {car.chuXe && <span className="text-yellow-400 font-bold ml-1">(Chủ xe: {car.chuXe})</span>} 
            <span className="ml-2">— GV: {teacher.name}</span>
          </span>
        </div>
        <div className="bg-slate-700 px-3 py-1 rounded-full text-sm font-medium">
          Đã nhập: {students.length} / {rate}
        </div>
      </div>
      <div className="overflow-x-auto">
        <div className="min-w-[1100px]">
          {/* Header */}
          <div className="flex items-center gap-3 bg-slate-100 p-3 text-xs font-semibold text-slate-600 border-b border-slate-200">
            <div className="w-10 flex-shrink-0 text-center">STT</div>
            <div className="flex-1 flex items-center gap-3">
              <div className="w-[180px]">Họ tên *</div>
              <div className="w-[130px]">Ngày sinh *</div>
              <div className="w-[120px]">SĐT *</div>
              <div className="w-[140px]">CCCD *</div>
              <div className="w-[160px]">Người nộp</div>
              <div className="w-[120px]">Tiền thu</div>
              <div className="w-[120px]">Hình thức chuyển</div>
              <div className="w-[80px]">Thao tác</div>
            </div>
          </div>
          
          {/* Rows */}
          <div className="divide-y divide-slate-100 bg-white">
            {Array.from({ length: rate }).map((_, index) => {
              const student = students[index];
              return (
                <div key={index} className={`p-3 flex items-start gap-3 transition-colors ${student ? 'bg-slate-50' : 'hover:bg-slate-50/50'}`}>
                  <div className="w-10 flex-shrink-0 flex items-center justify-center pt-1.5">
                    <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-600 font-medium text-xs flex items-center justify-center">
                      {index + 1}
                    </span>
                  </div>
                  <div className="flex-1">
                    {student ? (
                      <div className="flex items-center gap-3 py-1 text-sm text-slate-900">
                        <div className="w-[180px] font-medium">{student.hoTen}</div>
                        <div className="w-[130px]">{student.ngaySinh}</div>
                        <div className="w-[120px]">{student.soDienThoai}</div>
                        <div className="w-[140px]">{student.cccd}</div>
                        <div className="w-[160px] text-xs">{student.nguoiNop || '-'}</div>
                        <div className="w-[120px] font-medium text-emerald-600">{student.tienThu || '-'}</div>
                        <div className="w-[120px]">{student.hinhThucThu || '-'}</div>
                        <div className="w-[80px]">
                          <span className="text-xs text-indigo-600 font-medium px-2 py-1 bg-indigo-50 rounded">Đã lưu</span>
                        </div>
                      </div>
                    ) : (
                      <EmptySlotForm 
                        maKhoa={maKhoa} 
                        giaoVien={teacher.name} 
                        chuXe={car.chuXe}
                        onSuccess={onSuccess} 
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Card>
  );
}

function EmptySlotForm({ maKhoa, giaoVien, chuXe, onSuccess }: any) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    hoTen: '', ngaySinh: '', cccd: '', soDienThoai: '', nguoiNop: chuXe || '', tienThu: '', hinhThucThu: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.hoTen || !formData.ngaySinh || !formData.cccd || !formData.soDienThoai) {
      alert("Vui lòng nhập đầy đủ thông tin bắt buộc!");
      return;
    }
    setLoading(true);
    const res = await addStudent({
      maKhoa,
      giaoVien,
      ...formData
    });
    setLoading(false);
    if (res.success) {
      setFormData({ hoTen: '', ngaySinh: '', cccd: '', soDienThoai: '', nguoiNop: chuXe || '', tienThu: '', hinhThucThu: '' });
      onSuccess();
    } else {
      alert("Lỗi: " + res.error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-3 items-center">
      <Input placeholder="Họ tên" value={formData.hoTen} onChange={e => setFormData({...formData, hoTen: e.target.value})} className="w-[180px] h-9 text-sm" />
      <Input type="date" value={formData.ngaySinh} onChange={e => setFormData({...formData, ngaySinh: e.target.value})} className="w-[130px] h-9 text-sm" />
      <Input placeholder="SĐT" value={formData.soDienThoai} onChange={e => setFormData({...formData, soDienThoai: e.target.value})} className="w-[120px] h-9 text-sm" />
      <Input placeholder="CCCD" value={formData.cccd} onChange={e => setFormData({...formData, cccd: e.target.value})} className="w-[140px] h-9 text-sm" />
      <Input placeholder="Người nộp" value={formData.nguoiNop} onChange={e => setFormData({...formData, nguoiNop: e.target.value})} className="w-[160px] h-9 text-xs" />
      <Input placeholder="Tiền thu" value={formData.tienThu} onChange={e => setFormData({...formData, tienThu: e.target.value})} className="w-[120px] h-9 text-sm" />
      <Select value={formData.hinhThucThu} onValueChange={(val) => setFormData({...formData, hinhThucThu: val})}>
        <SelectTrigger className="w-[120px] h-9 text-sm">
          <SelectValue placeholder="Chọn" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="Tiền mặt">Tiền mặt</SelectItem>
          <SelectItem value="Chuyển khoản">Chuyển khoản</SelectItem>
        </SelectContent>
      </Select>
      <Button type="submit" size="sm" className="w-[80px] h-9" disabled={loading}>
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Lưu"}
      </Button>
    </form>
  );
}
