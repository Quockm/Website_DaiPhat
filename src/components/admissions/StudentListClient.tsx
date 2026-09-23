"use client";

import { useState, useEffect } from "react";
import { getStudentsList, StudentFilterParams } from "@/actions/students";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Search, FilterX } from "lucide-react";

export default function StudentListClient() {
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<any[]>([]);
  
  const [filters, setFilters] = useState<StudentFilterParams>({
    hangXe: 'All',
    trungTam: 'All',
    tinhTrang: 'All',
    search: ''
  });
  
  const [searchTemp, setSearchTemp] = useState('');

  const fetchStudents = async (currentFilters: StudentFilterParams) => {
    setLoading(true);
    try {
      const data = await getStudentsList(currentFilters);
      setStudents(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents(filters);
  }, [filters.hangXe, filters.trungTam, filters.tinhTrang]);

  const handleSearch = () => {
    setFilters(prev => ({ ...prev, search: searchTemp }));
    fetchStudents({ ...filters, search: searchTemp });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const clearFilters = () => {
    setSearchTemp('');
    const defaultFilters = { hangXe: 'All', trungTam: 'All', tinhTrang: 'All', search: '' };
    setFilters(defaultFilters);
    fetchStudents(defaultFilters);
  };

  return (
    <div className="space-y-6">
      {/* Filters Area */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap lg:flex-nowrap gap-4 items-end">
        <div className="space-y-1.5 flex-1 min-w-[200px]">
          <label className="text-xs font-medium text-slate-500">Tìm kiếm (Họ tên, CCCD)</label>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Nhập từ khóa..." 
              value={searchTemp}
              onChange={(e) => setSearchTemp(e.target.value)}
              onKeyDown={handleKeyDown}
              className="pl-9 bg-slate-50"
            />
          </div>
        </div>

        <div className="space-y-1.5 w-[140px]">
          <label className="text-xs font-medium text-slate-500">Loại/Hạng</label>
          <Select value={filters.hangXe} onValueChange={(val) => setFilters(p => ({...p, hangXe: val}))}>
            <SelectTrigger className="bg-slate-50">
              <SelectValue placeholder="Tất cả" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">Tất cả</SelectItem>
              <SelectItem value="A1">Hạng A1</SelectItem>
              <SelectItem value="A">Hạng A</SelectItem>
              <SelectItem value="B-TD">Hạng B-TD</SelectItem>
              <SelectItem value="B-SS">Hạng B-SS</SelectItem>
              <SelectItem value="C1">Hạng C1</SelectItem>
              <SelectItem value="C">Hạng C</SelectItem>
              <SelectItem value="D2">Hạng D2</SelectItem>
              <SelectItem value="D">Hạng D</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5 w-[130px]">
          <label className="text-xs font-medium text-slate-500">Trung tâm</label>
          <Select value={filters.trungTam} onValueChange={(val) => setFilters(p => ({...p, trungTam: val}))}>
            <SelectTrigger className="bg-slate-50">
              <SelectValue placeholder="Tất cả" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">Tất cả</SelectItem>
              <SelectItem value="Đại Phát">Đại Phát</SelectItem>
              <SelectItem value="Tiến Thành">Tiến Thành</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5 w-[180px]">
          <label className="text-xs font-medium text-slate-500">Trạng thái khóa</label>
          <Select value={filters.tinhTrang} onValueChange={(val) => setFilters(p => ({...p, tinhTrang: val}))}>
            <SelectTrigger className="bg-slate-50">
              <SelectValue placeholder="Tất cả" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">Tất cả</SelectItem>
              <SelectItem value="Mới tạo">Mới tạo</SelectItem>
              <SelectItem value="Chờ duyệt">Chờ duyệt</SelectItem>
              <SelectItem value="Đã duyệt">Đã duyệt</SelectItem>
              <SelectItem value="Đang đào tạo">Đang đào tạo</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2 ml-auto shrink-0 w-full md:w-auto justify-end mt-2 md:mt-0">
          <Button variant="outline" onClick={clearFilters} className="text-slate-600">
            <FilterX className="w-4 h-4 mr-2" />
            Xóa bộ lọc
          </Button>
          <Button onClick={handleSearch} disabled={loading} className="bg-indigo-600 hover:bg-indigo-700">
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
            Tìm kiếm
          </Button>
        </div>
      </div>

      {/* Table Area */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden flex flex-col h-[calc(100vh-220px)]">
        <div className="overflow-auto flex-1 relative">
          <table className="w-full min-w-[1200px] text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200 sticky top-0 z-20 shadow-sm">
              <tr>
                <th className="px-4 py-3 font-medium sticky left-0 z-30 bg-slate-50 border-r border-slate-200 w-[50px] min-w-[50px]">STT</th>
                <th className="px-4 py-3 font-medium sticky left-[50px] z-30 bg-slate-50 border-r border-slate-200 w-[180px] min-w-[180px]">Họ và tên</th>
                <th className="px-4 py-3 font-medium sticky left-[230px] z-30 bg-slate-50 border-r border-slate-200 w-[110px] min-w-[110px]">Ngày sinh</th>
                <th className="px-4 py-3 font-medium sticky left-[340px] z-30 bg-slate-50 border-r border-slate-200 w-[130px] min-w-[130px]">CCCD</th>
                <th className="px-4 py-3 font-medium">SĐT</th>
                <th className="px-4 py-3 font-medium">Xe</th>
                <th className="px-4 py-3 font-medium">Người nộp</th>
                <th className="px-4 py-3 font-medium">Khóa học</th>
                <th className="px-4 py-3 font-medium">Hạng</th>
                <th className="px-4 py-3 font-medium text-right">Tài chính</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && students.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-slate-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-slate-500">
                    Không tìm thấy học viên nào phù hợp.
                  </td>
                </tr>
              ) : (
                students.map((student, index) => {
                  // Format ngày sinh (y-m-d -> d-m-y hoặc tương tự)
                  let displayNgaySinh = student.ngaySinh || '';
                  displayNgaySinh = displayNgaySinh.replace(/\//g, '-');
                  if (displayNgaySinh.includes('-') && displayNgaySinh.split('-')[0].length === 4) {
                    const parts = displayNgaySinh.split('-');
                    displayNgaySinh = `${parts[2]}-${parts[1]}-${parts[0]}`;
                  }
                  
                  return (
                    <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-400 sticky left-0 z-10 bg-white border-r border-slate-100">{index + 1}</td>
                      <td className="px-4 py-3 font-bold text-slate-900 sticky left-[50px] z-10 bg-white border-r border-slate-100 uppercase">{student.hoTen}</td>
                      <td className="px-4 py-3 text-slate-600 sticky left-[230px] z-10 bg-white border-r border-slate-100">{displayNgaySinh}</td>
                      <td className="px-4 py-3 text-slate-600 sticky left-[340px] z-10 bg-white border-r border-slate-100">{student.cccd}</td>
                      <td className="px-4 py-3 text-slate-600">{student.soDienThoai}</td>
                      <td className="px-4 py-3 text-slate-600">
                        {student.dauMoi && /\d/.test(student.dauMoi) ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                            {student.dauMoi}
                          </span>
                        ) : '-'}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{student.nguoiNop || '-'}</td>
                      <td className="px-4 py-3">
                        <div className="text-slate-900 font-medium truncate max-w-[200px]" title={student.tenKhoa}>
                          {student.tenKhoa || student.maKhoa || '-'}
                        </div>
                        <div className="text-xs text-slate-500">{student.trungTam}</div>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-700">{student.hangXe || '-'}</td>
                      <td className="px-4 py-3 text-right">
                        {student.tienThu > 0 && (
                          <div className="text-xs font-medium text-emerald-600">
                            Thu: {student.tienThu.toLocaleString('en-US')}
                          </div>
                        )}
                        {student.conNo > 0 && (
                          <div className="text-xs font-medium text-red-600">
                            Nợ: {student.conNo.toLocaleString('en-US')}
                          </div>
                        )}
                        {!student.tienThu && !student.conNo && '-'}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
        
        {students.length > 0 && (
          <div className="bg-slate-50 px-4 py-3 border-t border-slate-200 text-xs text-slate-500 flex justify-between items-center">
            <span>Hiển thị {students.length} hồ sơ (giới hạn 500 kết quả mới nhất)</span>
          </div>
        )}
      </div>
    </div>
  );
}
