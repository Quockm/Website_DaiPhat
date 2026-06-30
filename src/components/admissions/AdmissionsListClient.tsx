"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, GraduationCap, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { submitCourseForApproval } from "@/actions/admissions";

export default function AdmissionsListClient({ initialCourses }: { initialCourses: any[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [hangFilter, setHangFilter] = useState("ALL");
  const [trungTamFilter, setTrungTamFilter] = useState("Đại Phát");
  const [submitting, setSubmitting] = useState<string | null>(null);
  const router = useRouter();

  const filtered = initialCourses.filter(c => {
    const matchSearch = (c.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (c.id || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchHang = hangFilter === "ALL" || c.hangXe === hangFilter;
    const matchTrungTam = c.trungTam === trungTamFilter;
    return matchSearch && matchHang && matchTrungTam;
  });

  const handleSubmitApproval = async (maKhoa: string) => {
    if (!confirm("Bạn có chắc chắn muốn trình duyệt khóa này?")) return;
    setSubmitting(maKhoa);
    const res = await submitCourseForApproval(maKhoa);
    setSubmitting(null);
    if (res.success) {
      router.refresh();
    } else {
      alert("Lỗi: " + res.error);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Danh sách khóa vừa tạo
        </h1>
        <p className="text-slate-500">
          Các khóa học mới được tạo và đang trong giai đoạn chờ tuyển sinh.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between pb-4">
          <div className="flex gap-4">
            <div className="relative w-72">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
              <Input 
                placeholder="Tìm theo mã khóa, tên khóa..." 
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={trungTamFilter} onValueChange={setTrungTamFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Chọn Trung tâm" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Đại Phát">Đại Phát</SelectItem>
                <SelectItem value="Tiến Thành">Tiến Thành</SelectItem>
              </SelectContent>
            </Select>
            <Select value={hangFilter} onValueChange={setHangFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Hạng xe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tất cả hạng</SelectItem>
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
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-slate-200 overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 font-medium">Mã Khóa</th>
                  <th className="px-4 py-3 font-medium">Hạng Xe</th>
                  <th className="px-4 py-3 font-medium">Khai Giảng</th>
                  <th className="px-4 py-3 font-medium">Trạng Thái</th>
                  <th className="px-4 py-3 font-medium text-center">Tiến Độ Nhập Hồ Sơ</th>
                  <th className="px-4 py-3 font-medium text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filtered.map(c => {
                  const isMoto = ['A1', 'A'].includes(c.hangXe);
                  const isFull = (c.soHocVienDaNhap || 0) >= (c.luuLuong || 1);
                  return (
                    <tr key={c.id} className="hover:bg-slate-50">
                      <td className="px-4 py-4">
                        <div className="font-medium text-slate-900">{c.name}</div>
                        <div className="text-xs text-slate-500">{c.id}</div>
                      </td>
                      <td className="px-4 py-4 font-medium text-indigo-600">Hạng {c.hangXe}</td>
                      <td className="px-4 py-4 text-slate-600">{c.khaiGiang}</td>
                      <td className="px-4 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                          {c.status}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-sm font-medium text-slate-900">
                            {c.soHocVienDaNhap} / {c.luuLuong}
                          </span>
                          <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-indigo-500 rounded-full"
                              style={{ width: `${Math.min(100, (c.soHocVienDaNhap / (c.luuLuong || 1)) * 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right">
                        {isFull ? (
                          <Button 
                            size="sm" 
                            className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                            onClick={() => handleSubmitApproval(c.id)}
                            disabled={submitting === c.id}
                          >
                            <Send className="w-4 h-4" />
                            Gửi Duyệt
                          </Button>
                        ) : (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => router.push(isMoto ? '/admissions/moto' : '/admissions/oto')}
                            className="gap-2"
                          >
                            <GraduationCap className="w-4 h-4" />
                            Nhập HS
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                      Không có khóa học nào đang chờ nhập hồ sơ.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
