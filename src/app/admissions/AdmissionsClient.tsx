"use client";

import { useState } from "react";
import { AdmissionCourse, AdmissionStudent } from "@/actions/admissions";
import { Search, UserPlus, Users, GraduationCap, Car, Plus, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdmissionsClient({ initialData }: { initialData: AdmissionCourse[] }) {
  const [courses, setCourses] = useState<AdmissionCourse[]>(initialData);
  const [selectedCategory, setSelectedCategory] = useState<string>("B2");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  // Lọc khoá học theo Hạng
  const filteredCourses = courses.filter(c => c.category === selectedCategory);
  
  const [selectedCourseName, setSelectedCourseName] = useState<string | null>(null);
  
  // Tự động chọn khoá đầu tiên khi đổi hạng
  if (selectedCourseName !== null && !filteredCourses.find(c => c.name === selectedCourseName)) {
    if (filteredCourses.length > 0) {
      setSelectedCourseName(filteredCourses[0].name);
    } else {
      setSelectedCourseName(null);
    }
  } else if (selectedCourseName === null && filteredCourses.length > 0) {
    setSelectedCourseName(filteredCourses[0].name);
  }
  
  const [newStudent, setNewStudent] = useState({
    name: "",
    dob: "",
    phone: "",
    cccd: "",
    hocPhi: 0,
    hinhThuc: ""
  });

  const selectedCourse = courses.find(c => c.name === selectedCourseName);

  const handleEnroll = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse) return;
    if (!newStudent.name.trim()) {
      alert("Vui lòng nhập tên học viên!");
      return;
    }

    const newStt = selectedCourse.students.length > 0 
      ? Math.max(...selectedCourse.students.map(s => s.stt)) + 1 
      : 1;

    let mucPhi = 6000000;
    if (selectedCourse.category === 'C1') mucPhi = 8000000;
    const thieu = mucPhi - (newStudent.hocPhi || 0);

    const student: AdmissionStudent = {
      stt: newStt,
      name: newStudent.name.trim(),
      dob: newStudent.dob,
      phone: newStudent.phone,
      cccd: newStudent.cccd,
      teacher: "Chưa phân bổ",
      ngayNop: new Date().toLocaleDateString('en-GB').replace(/\//g, '-'),
      hocPhi: newStudent.hocPhi || 0,
      mucPhi: mucPhi,
      thieu: thieu,
      hinhThuc: newStudent.hinhThuc,
      ghiChu: ""
    };

    // Update local state for now
    const updatedCourses = courses.map(c => {
      if (c.name === selectedCourse.name) {
        return {
          ...c,
          students: [...c.students, student]
        };
      }
      return c;
    });

    setCourses(updatedCourses);
    setNewStudent({ name: "", dob: "", phone: "", cccd: "", hocPhi: 0, hinhThuc: "" });
    setIsAddModalOpen(false);
    alert("Thêm học viên thành công! (Dữ liệu đang được lưu tạm trên giao diện)");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Tuyển Sinh & Phân Bổ</h1>
          <p className="text-slate-600 mt-2 text-base font-medium">Quản lý nhập liệu học viên theo từng hạng xe.</p>
        </div>
        
        {/* Tabs Hạng Xe */}
        <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
          {['B2', 'B1', 'C1'].map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-6 py-2 text-sm font-bold rounded-md transition-all ${
                selectedCategory === cat 
                  ? 'bg-white text-indigo-700 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Hạng {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Cột 1: Danh sách Khóa Học */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          <Card className="bg-white shadow-sm border-slate-200">
            <CardHeader className="bg-slate-50/80 border-b border-slate-100 pb-4">
              <CardTitle className="text-sm font-bold text-slate-700 uppercase flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-indigo-600" />
                Danh sách Khóa
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 h-[700px] overflow-y-auto custom-scrollbar">
              {filteredCourses.length === 0 && <div className="p-6 text-center text-slate-500">Chưa có khóa học nào.</div>}
              {filteredCourses.map((course, idx) => (
                <div 
                  key={`${course.name}-${idx}`}
                  onClick={() => setSelectedCourseName(course.name)}
                  className={`p-4 border-b border-slate-100 cursor-pointer transition-colors hover:bg-indigo-50 flex flex-col gap-2 ${selectedCourseName === course.name ? 'bg-indigo-50 border-l-4 border-l-indigo-600' : 'border-l-4 border-l-transparent'}`}
                >
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-slate-800 text-sm">{course.name}</h3>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                    <Users className="w-4 h-4" /> {course.students.length} học viên
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Cột 2 & 3: Chi tiết Khóa & Tuyển Sinh */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          {!selectedCourse ? (
            <div className="h-[600px] bg-slate-50 border border-slate-200 border-dashed rounded-xl flex flex-col items-center justify-center text-slate-400">
              <UserPlus className="w-12 h-12 mb-4 text-slate-300" />
              <p className="font-semibold text-lg">Chọn một khóa học ở cột trái để xem danh sách</p>
            </div>
          ) : (
            <>
              {/* Nút Thêm và Danh sách học viên */}
              <Card className="bg-white shadow-sm border-slate-200 flex-1 overflow-hidden flex flex-col">
                <CardHeader className="bg-slate-50/80 border-b border-slate-100 pb-4 flex flex-row justify-between items-center">
                  <CardTitle className="text-sm font-bold text-slate-700 uppercase flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    Danh Sách Học Viên ({selectedCourse.students.length})
                  </CardTitle>
                  <div className="flex items-center gap-3">
                    <div className="relative hidden md:block">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        type="text" 
                        placeholder="Tìm theo tên..." 
                        className="pl-9 pr-4 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-48"
                      />
                    </div>
                    <button 
                      onClick={() => setIsAddModalOpen(true)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors shadow-sm"
                    >
                      <UserPlus className="w-4 h-4" /> Thêm Học Viên
                    </button>
                  </div>
                </CardHeader>
                <CardContent className="p-0 flex-1 overflow-hidden">
                  <div className="overflow-x-auto overflow-y-auto custom-scrollbar h-full max-h-[500px]">
                    <table className="w-full text-left text-sm text-slate-600 whitespace-nowrap">
                      <thead className="bg-slate-50 text-slate-700 font-bold sticky top-0 shadow-sm z-10">
                        <tr>
                          <th className="px-4 py-3 border-b border-slate-200">STT</th>
                          <th className="px-4 py-3 border-b border-slate-200">Ngày nộp</th>
                          <th className="px-4 py-3 border-b border-slate-200">Họ và Tên</th>
                          <th className="px-4 py-3 border-b border-slate-200">Năm sinh</th>
                          <th className="px-4 py-3 border-b border-slate-200">Học phí (VNĐ)</th>
                          <th className="px-4 py-3 border-b border-slate-200">Thiếu (VNĐ)</th>
                          <th className="px-4 py-3 border-b border-slate-200">Hình thức</th>
                          <th className="px-4 py-3 border-b border-slate-200">Giáo viên</th>
                          <th className="px-4 py-3 border-b border-slate-200">Ghi chú</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedCourse.students.length === 0 && (
                          <tr>
                            <td colSpan={9} className="px-4 py-8 text-center text-slate-500 font-medium">Chưa có học viên nào trong khóa này.</td>
                          </tr>
                        )}
                        {selectedCourse.students.map((student, idx) => {
                          let feeColor = "bg-red-100 text-red-700 border-red-200"; // Chưa đóng
                          if (student.hocPhi > 0 && student.thieu > 0) feeColor = "bg-yellow-100 text-yellow-700 border-yellow-200"; // Đóng 1 phần
                          if (student.thieu <= 0 && student.hocPhi > 0) feeColor = "bg-green-100 text-green-700 border-green-200"; // Đóng đủ

                          return (
                            <tr key={idx} className="hover:bg-slate-50 transition-colors">
                              <td className="px-4 py-3 font-semibold">{student.stt}</td>
                              <td className="px-4 py-3">{student.ngayNop || '-'}</td>
                              <td className="px-4 py-3 font-bold text-slate-800">{student.name}</td>
                              <td className="px-4 py-3">{student.dob}</td>
                              <td className="px-4 py-3">
                                <span className={`px-2 py-1 rounded font-bold border ${feeColor}`}>
                                  {student.hocPhi.toLocaleString('vi-VN')}
                                </span>
                              </td>
                              <td className="px-4 py-3 font-bold text-slate-700">
                                {student.thieu > 0 ? student.thieu.toLocaleString('vi-VN') : '-'}
                              </td>
                              <td className="px-4 py-3 text-xs">{student.hinhThuc || '-'}</td>
                              <td className="px-4 py-3">
                                <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded font-medium border border-blue-100 flex items-center w-max gap-1">
                                  <Car className="w-3 h-3" /> {student.teacher || 'Chưa phân bổ'}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-xs max-w-[150px] truncate" title={student.ghiChu}>{student.ghiChu || '-'}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>

      {/* Modal Thêm Học Viên */}
      {isAddModalOpen && selectedCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-600" />
                Thêm Học Viên Mới - {selectedCourse.name}
              </h3>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-red-500 transition-colors p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              <form onSubmit={handleEnroll} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-bold text-slate-700">HỌ VÀ TÊN *</label>
                  <input 
                    type="text" 
                    value={newStudent.name}
                    onChange={e => setNewStudent({...newStudent, name: e.target.value})}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="VD: Nguyễn Văn A"
                    required
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">NĂM SINH</label>
                  <input 
                    type="text" 
                    value={newStudent.dob}
                    onChange={e => setNewStudent({...newStudent, dob: e.target.value})}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="VD: 1990"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">SỐ ĐIỆN THOẠI</label>
                  <input 
                    type="text" 
                    value={newStudent.phone}
                    onChange={e => setNewStudent({...newStudent, phone: e.target.value})}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="090..."
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">HỌC PHÍ ĐÓNG (VNĐ)</label>
                  <input 
                    type="number" 
                    value={newStudent.hocPhi || ''}
                    onChange={e => setNewStudent({...newStudent, hocPhi: Number(e.target.value)})}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="VD: 6000000"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">HÌNH THỨC</label>
                  <select 
                    value={newStudent.hinhThuc || ''}
                    onChange={e => setNewStudent({...newStudent, hinhThuc: e.target.value})}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="">Chọn...</option>
                    <option value="Tiền mặt">Tiền mặt</option>
                    <option value="Chuyển khoản">Chuyển khoản</option>
                  </select>
                </div>
                
                <div className="md:col-span-2 pt-4 border-t border-slate-100 flex justify-end gap-3 mt-2">
                  <button 
                    type="button" 
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-5 py-2 text-sm font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                  >
                    Hủy Bỏ
                  </button>
                  <button 
                    type="submit" 
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Đăng Ký Học Viên
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
