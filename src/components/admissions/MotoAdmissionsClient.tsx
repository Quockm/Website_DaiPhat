"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { addStudent, getCourseDetailsForAdmissions } from "@/actions/admissions";
import { Loader2, User } from "lucide-react";
import { useRouter } from "next/navigation";
import DauMoiManagerDialog from "./DauMoiManagerDialog";
import { getDauMois, DauMoi } from "@/actions/daumoi";

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

export default function MotoAdmissionsClient({ initialCourses }: { initialCourses: any[] }) {
  const [selectedCourse, setSelectedCourse] = useState("");
  const [courseDetails, setCourseDetails] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [trungTamFilter, setTrungTamFilter] = useState("Đại Phát");
  const [daumois, setDaumois] = useState<DauMoi[]>([]);
  
  const router = useRouter();

  const fetchDauMoiList = async () => {
    const list = await getDauMois();
    setDaumois(list);
  };

  useEffect(() => {
    fetchDauMoiList();
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      const loadDetails = async () => {
        setLoading(true);
        const res = await getCourseDetailsForAdmissions(selectedCourse);
        setCourseDetails(res);
        setLoading(false);
      };
      loadDetails();
    } else {
      setCourseDetails(null);
    }
  }, [selectedCourse]);

  const selectedCourseData = initialCourses.find(c => c.id === selectedCourse);
  const filteredCourses = initialCourses.filter(c => c.trungTam === trungTamFilter);

  return (
    <div className="p-6 w-full">
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Tuyển sinh Mô tô
          </h1>
          <p className="text-slate-500">
            Nhập hồ sơ học viên mới vào các khóa học Mô tô chưa đủ chỉ tiêu. 
          </p>
        </div>
        <div className="flex flex-col items-end gap-3">
          <DauMoiManagerDialog onUpdate={fetchDauMoiList} />
          <Select value={trungTamFilter} onValueChange={(val) => {
            setTrungTamFilter(val);
            setSelectedCourse(""); // Clear selected course when switching center
          }}>
            <SelectTrigger className="w-[180px] bg-white">
              <SelectValue placeholder="Chọn Trung tâm" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Đại Phát">Trung tâm Đại Phát</SelectItem>
              <SelectItem value="Tiến Thành">Trung tâm Tiến Thành</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-col gap-6">
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
                    <div className="text-slate-500 mb-1">Giáo viên được phân công:</div>
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
                <div className="text-sm text-slate-500">
                  <p>Vui lòng tiến hành nhập hồ sơ học viên ở bảng bên dưới.</p>
                  <p className="mt-2">Hồ sơ sẽ được ghi nhận trực tiếp vào khóa học này.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Bottom Section: Data Entry Block */}
        <div className="mt-4">
          {!selectedCourse ? (
            <div className="flex items-center justify-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 p-12 text-center text-slate-500 h-64">
              Vui lòng chọn khóa đào tạo ở trên để hiển thị danh sách và nhập hồ sơ.
            </div>
          ) : (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-slate-800">2. Dữ liệu nhập hồ sơ</h2>
              
              <Card className="shadow-sm border-slate-200 overflow-hidden">
                <div className="bg-slate-800 p-4 text-white flex justify-between items-center">
                  <div className="font-medium text-lg flex items-center gap-2">
                    <User className="w-5 h-5 text-slate-300" />
                    Danh Sách Học Viên Khóa {selectedCourseData.id}
                  </div>
                  <div className="bg-slate-700 px-3 py-1 rounded-full text-sm font-medium">
                    Tổng: {courseDetails?.students?.length || 0}
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <div className="min-w-[1300px]">
                    {/* Header */}
                    <div className="flex items-center gap-3 bg-slate-100 p-3 text-xs font-semibold text-slate-600 border-b border-slate-200">
                      <div className="w-10 flex-shrink-0 text-center">STT</div>
                      <div className="flex-1 flex items-center gap-3">
                        <div className="w-[180px]">Họ tên *</div>
                        <div className="w-[120px]">Ngày sinh *</div>
                        <div className="w-[120px]">SĐT *</div>
                        <div className="w-[140px]">CCCD *</div>
                        <div className="w-[150px]">Người nộp</div>
                        <div className="w-[110px]">Tiền thu</div>
                        <div className="w-[110px]">Còn nợ</div>
                        <div className="w-[120px]">Hình thức chuyển</div>
                        <div className="w-[80px]">Thao tác</div>
                      </div>
                    </div>
                    
                    {/* Rows */}
                    <div className="divide-y divide-slate-100 bg-white">
                      {loading ? (
                        <div className="p-12 text-center text-slate-400 flex flex-col items-center">
                          <Loader2 className="h-6 w-6 animate-spin mb-2" />
                          Đang tải dữ liệu...
                        </div>
                      ) : (
                        <>
                          {/* Already added students */}
                          {courseDetails?.students?.map((student: any, index: number) => (
                            <div key={student.id} className="p-3 flex items-start gap-3 bg-slate-50 transition-colors">
                              <div className="w-10 flex-shrink-0 flex items-center justify-center pt-1.5">
                                <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-600 font-medium text-xs flex items-center justify-center">
                                  {index + 1}
                                </span>
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-3 py-1 text-sm text-slate-900">
                                  <div className="w-[180px] font-medium">{student.hoTen}</div>
                                  <div className="w-[120px]">{student.ngaySinh}</div>
                                  <div className="w-[120px]">{student.soDienThoai}</div>
                                  <div className="w-[140px]">{student.cccd}</div>
                                  <div className="w-[150px] text-xs">{student.nguoiNop || '-'}</div>
                                  <div className="w-[110px] font-medium text-emerald-600">{student.tienThu ? student.tienThu.toLocaleString('en-US') : '-'}</div>
                                  <div className="w-[110px] font-medium text-red-600">{student.conNo ? student.conNo.toLocaleString('en-US') : '0'}</div>
                                  <div className="w-[120px]">{student.hinhThucThu || '-'}</div>
                                  <div className="w-[80px]">
                                    <span className="text-xs text-indigo-600 font-medium px-2 py-1 bg-indigo-50 rounded">Đã lưu</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                          
                          {/* Empty Slots for new entry (show 5 slots) */}
                          {Array.from({ length: 5 }).map((_, index) => (
                            <div key={`empty-${index}`} className="p-3 flex items-start gap-3 hover:bg-slate-50/50 transition-colors">
                              <div className="w-10 flex-shrink-0 flex items-center justify-center pt-1.5">
                                <span className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-600 font-medium text-xs flex items-center justify-center">
                                  +
                                </span>
                              </div>
                              <div className="flex-1">
                                <EmptySlotForm 
                                  maKhoa={selectedCourse} 
                                  feeNorm={courseDetails?.feeNorms?.[selectedCourseData.hangXe] || 0}
                                  onSuccess={() => {
                                    getCourseDetailsForAdmissions(selectedCourse).then(setCourseDetails);
                                    router.refresh();
                                  }} 
                                  daumoiList={daumois}
                                />
                              </div>
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptySlotForm({ maKhoa, feeNorm, onSuccess, daumoiList }: any) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    hoTen: '', ngaySinh: '', cccd: '', soDienThoai: '', nguoiNop: '', tienThu: '', hinhThucThu: ''
  });

  const parsedTienThu = parseInt(formData.tienThu.replace(/\D/g, '')) || 0;
  const conNo = feeNorm - parsedTienThu;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.hoTen || !formData.ngaySinh || !formData.cccd || !formData.soDienThoai) {
      alert("Vui lòng nhập đầy đủ thông tin bắt buộc!");
      return;
    }
    setLoading(true);
    const res = await addStudent({
      maKhoa,
      ...formData,
      tienThu: parsedTienThu.toString(),
      daNop: parsedTienThu,
      conNo: conNo
    });
    setLoading(false);
    if (res.success) {
      setFormData({ hoTen: '', ngaySinh: '', cccd: '', soDienThoai: '', nguoiNop: '', tienThu: '', hinhThucThu: '' });
      onSuccess();
    } else {
      alert("Lỗi: " + res.error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-3 items-center">
      <Input placeholder="Họ tên" value={formData.hoTen} onChange={e => setFormData({...formData, hoTen: e.target.value})} className="w-[180px] h-9 text-sm" />
      <Input type="date" value={formData.ngaySinh} onChange={e => setFormData({...formData, ngaySinh: e.target.value})} className="w-[120px] h-9 text-sm" />
      <Input placeholder="SĐT" value={formData.soDienThoai} onChange={e => setFormData({...formData, soDienThoai: e.target.value})} className="w-[120px] h-9 text-sm" />
      <Input placeholder="CCCD" value={formData.cccd} onChange={e => setFormData({...formData, cccd: e.target.value})} className="w-[140px] h-9 text-sm" />
      <div className="w-[150px]">
        <Input 
          placeholder="Người nộp" 
          value={formData.nguoiNop} 
          onChange={e => setFormData(p => ({...p, nguoiNop: e.target.value}))} 
          className="h-9 text-xs" 
          list={`daumoi-list-${maKhoa}`}
        />
        <datalist id={`daumoi-list-${maKhoa}`}>
          {daumoiList?.map((dm: DauMoi) => (
            <option key={dm.id} value={dm.hoTen} />
          ))}
        </datalist>
      </div>
      <Input placeholder="Tiền thu" value={formData.tienThu} onChange={e => setFormData({...formData, tienThu: e.target.value})} className="w-[110px] h-9 text-sm" />
      <div className="w-[110px] text-sm font-medium text-red-500">{conNo > 0 ? conNo.toLocaleString('en-US') : 0}</div>
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
