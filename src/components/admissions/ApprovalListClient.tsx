"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { approveCourse, getApprovalDetails, getApprovedCourses } from "@/actions/admissions";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ApprovalDetailsClient from "./ApprovalDetailsClient";

export default function ApprovalListClient({ initialCourses }: { initialCourses: any[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [hangFilter, setHangFilter] = useState("ALL");
  const [submitting, setSubmitting] = useState<string | null>(null);
  
  const [selectedCourseData, setSelectedCourseData] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const [isApprovedModalOpen, setIsApprovedModalOpen] = useState(false);
  const [approvedCourses, setApprovedCourses] = useState<any[]>([]);
  const [loadingApproved, setLoadingApproved] = useState(false);

  const router = useRouter();

  const filtered = initialCourses.filter(c => {
    const matchSearch = (c.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (c.id || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchHang = hangFilter === "ALL" || c.hangXe === hangFilter;
    return matchSearch && matchHang;
  });

  const handleApprove = async (maKhoa: string) => {
    if (!confirm("Bạn có chắc chắn duyệt khóa này? Khóa sẽ được chuyển sang danh sách Đang đào tạo.")) return;
    setSubmitting(maKhoa);
    const res = await approveCourse(maKhoa);
    setSubmitting(null);
    if (res.success) {
      router.refresh();
    } else {
      alert("Lỗi: " + res.error);
    }
  };

  const handleDetailsClick = async (maKhoa: string) => {
    setLoadingDetails(true);
    const data = await getApprovalDetails(maKhoa);
    setSelectedCourseData(data);
    setIsDialogOpen(true);
    setLoadingDetails(false);
  };

  const handleViewApproved = async () => {
    setLoadingApproved(true);
    setIsApprovedModalOpen(true);
    const data = await getApprovedCourses();
    setApprovedCourses(data);
    setLoadingApproved(false);
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Danh Sách Chờ Duyệt
        </h1>
        <p className="text-slate-500">
          Các khóa học đã nhập đủ học viên và đang chờ xét duyệt để bắt đầu khai giảng.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between pb-4 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-4">
            <div className="text-sm font-medium text-amber-800 bg-amber-100 px-4 py-2 rounded-full border border-amber-200">
              Chờ duyệt: {initialCourses.length} khóa
            </div>
            <Button variant="outline" onClick={handleViewApproved} disabled={loadingApproved} className="font-medium text-indigo-700 border-indigo-200 hover:bg-indigo-50">
              {loadingApproved ? "Đang tải..." : "Xem danh sách đã duyệt"}
            </Button>
          </div>
        </CardHeader>
        
        <div className="px-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between pb-4">
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
        </div>
        <CardContent>
          <div className="rounded-md border border-slate-200 overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 font-medium">Mã Khóa</th>
                  <th className="px-4 py-3 font-medium">Hạng Xe</th>
                  <th className="px-4 py-3 font-medium">Trung tâm</th>
                  <th className="px-4 py-3 font-medium">Khai Giảng</th>
                  <th className="px-4 py-3 font-medium">Số Hồ Sơ</th>
                  <th className="px-4 py-3 font-medium">Tiến độ duyệt</th>
                  <th className="px-4 py-3 font-medium text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filtered.map(c => {
                  return (
                    <tr key={c.id} className="hover:bg-slate-50">
                      <td className="px-4 py-4">
                        <div className="font-medium text-slate-900">{c.name}</div>
                        <div className="text-xs text-slate-500">{c.id}</div>
                      </td>
                      <td className="px-4 py-4 font-medium text-indigo-600">Hạng {c.hangXe}</td>
                      <td className="px-4 py-4 text-slate-600">{c.trungTam}</td>
                      <td className="px-4 py-4 text-slate-600">{c.khaiGiang}</td>
                      <td className="px-4 py-4">
                        <span className="font-medium text-slate-900">{c.soHocVienDaNhap}</span>
                        <span className="text-slate-400"> / {c.luuLuong}</span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex gap-1.5 items-center">
                          {['A', 'A1'].includes(c.hangXe) ? (
                            <div title="Hồ sơ" className={`w-3 h-3 rounded-full ${c.duyetHoSo ? 'bg-green-500' : 'bg-slate-300 shadow-inner'}`} />
                          ) : (
                            <>
                              <div title="Xe" className={`w-3 h-3 rounded-full ${c.duyetXe ? 'bg-green-500' : 'bg-slate-300 shadow-inner'}`} />
                              <div title="Giáo viên" className={`w-3 h-3 rounded-full ${c.duyetGV ? 'bg-green-500' : 'bg-slate-300 shadow-inner'}`} />
                              <div title="Hồ sơ" className={`w-3 h-3 rounded-full ${c.duyetHoSo ? 'bg-green-500' : 'bg-slate-300 shadow-inner'}`} />
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <Button 
                          size="sm" 
                          className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"
                          onClick={() => handleDetailsClick(c.id)}
                          disabled={loadingDetails}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Chi tiết Duyệt
                        </Button>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                      Không có khóa học nào đang chờ duyệt.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] overflow-y-auto p-0">
          {selectedCourseData && (
            <ApprovalDetailsClient 
              data={selectedCourseData} 
              onClose={() => {
                setIsDialogOpen(false);
                router.refresh();
              }}
              onDataChange={(newData: any) => {
                setSelectedCourseData(newData);
                router.refresh();
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Modal Danh Sách Đã Duyệt */}
      <Dialog open={isApprovedModalOpen} onOpenChange={setIsApprovedModalOpen}>
        <DialogContent className="max-w-5xl max-h-[85vh] flex flex-col p-6">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-black">Danh sách khóa đã duyệt (Đang đào tạo)</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto pr-2 mt-4">
            {/* OTO Column */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2 border-b pb-2">
                <div className="w-2 h-6 bg-blue-500 rounded-full" />
                Khóa Ô tô
              </h3>
              <div className="space-y-3">
                {approvedCourses.filter(c => c.type === 'OTO').map(c => (
                  <div key={c.id} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                    <div className="font-bold text-slate-900">{c.name}</div>
                    <div className="text-sm text-slate-500 mt-1 flex justify-between">
                      <span className="font-medium text-blue-600">Hạng {c.hangXe}</span>
                      <span>{c.trungTam}</span>
                    </div>
                    <div className="text-xs text-slate-400 mt-1">Khai giảng: {c.khaiGiang}</div>
                  </div>
                ))}
                {approvedCourses.filter(c => c.type === 'OTO').length === 0 && (
                  <div className="text-slate-500 text-sm italic">Không có khóa ô tô nào.</div>
                )}
              </div>
            </div>

            {/* MOTO Column */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2 border-b pb-2">
                <div className="w-2 h-6 bg-green-500 rounded-full" />
                Khóa Mô tô
              </h3>
              <div className="space-y-3">
                {approvedCourses.filter(c => c.type === 'MOTO').map(c => (
                  <div key={c.id} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                    <div className="font-bold text-slate-900">{c.name}</div>
                    <div className="text-sm text-slate-500 mt-1 flex justify-between">
                      <span className="font-medium text-green-600">Hạng {c.hangXe}</span>
                      <span>{c.trungTam}</span>
                    </div>
                    <div className="text-xs text-slate-400 mt-1">Khai giảng: {c.khaiGiang}</div>
                  </div>
                ))}
                {approvedCourses.filter(c => c.type === 'MOTO').length === 0 && (
                  <div className="text-slate-500 text-sm italic">Không có khóa mô tô nào.</div>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
