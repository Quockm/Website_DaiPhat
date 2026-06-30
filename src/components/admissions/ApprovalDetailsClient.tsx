"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle2, Car, Users, UserSquare2, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { updateSubApproval, approveCourse } from "@/actions/admissions";

export default function ApprovalDetailsClient({ 
  data, 
  onClose,
  onDataChange
}: { 
  data: any, 
  onClose?: () => void,
  onDataChange?: (newData: any) => void
}) {
  const { course, cars, teachers, students } = data;
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const handleSubApprove = (type: 'XE' | 'GV' | 'HOSO') => {
    if (!confirm("Xác nhận duyệt danh sách này?")) return;
    
    startTransition(async () => {
      setError("");
      const res = await updateSubApproval(course.id, type);
      if (!res.success) {
        setError(res.error || "Có lỗi xảy ra");
      } else {
        const newData = { ...data };
        if (type === 'XE') newData.course.duyetXe = 1;
        if (type === 'GV') newData.course.duyetGV = 1;
        if (type === 'HOSO') newData.course.duyetHoSo = 1;
        if (onDataChange) onDataChange(newData);
      }
    });
  };

  const handleApproveCourse = () => {
    if (!confirm("Bạn có chắc chắn duyệt mở khóa này?")) return;
    
    startTransition(async () => {
      setError("");
      const res = await approveCourse(course.id);
      if (res.success) {
        if (onClose) onClose();
      } else {
        setError(res.error || "Có lỗi xảy ra");
      }
    });
  };

  const isMoto = ['A', 'A1'].includes(course.hangXe);
  const canApproveCourse = isMoto ? course.duyetHoSo : (course.duyetXe && course.duyetGV && course.duyetHoSo);

  const getCardStyle = (isApproved: boolean) => {
    return isApproved 
      ? "border-green-500 bg-green-50" 
      : "border-slate-200 bg-white";
  };

  const getHeaderStyle = (isApproved: boolean) => {
    return isApproved 
      ? "bg-green-500 border-green-600 text-white" 
      : "bg-slate-50 border-slate-200 text-slate-800";
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6 bg-slate-50/50 min-h-[500px]">
      <div className="flex items-center justify-between">
        <div className="flex items-start gap-4">
          <button onClick={onClose} className="mt-1 flex-shrink-0 p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-600">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Chi tiết duyệt: {course.name}</h1>
            <p className="text-slate-600 mt-2 text-base font-medium">
              Mã khóa: {course.id} | Hạng: {course.hangXe} | Khai giảng: {course.khaiGiang}
            </p>
          </div>
        </div>
        
        <Button 
          size="lg"
          onClick={handleApproveCourse}
          disabled={!canApproveCourse || isPending}
          className={`gap-2 text-white font-bold ${canApproveCourse ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-slate-400 cursor-not-allowed'}`}
        >
          {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
          DUYỆT MỞ KHÓA
        </Button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-lg flex items-center gap-3 border border-red-200">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className={`grid grid-cols-1 ${isMoto ? 'md:grid-cols-1 max-w-2xl mx-auto' : 'md:grid-cols-3'} gap-6`}>
        
        {/* CARS LIST */}
        {!isMoto && (
          <Card className={`shadow-sm transition-all ${getCardStyle(course.duyetXe)}`}>
            <div className={`border-b p-4 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-3 rounded-t-xl ${getHeaderStyle(course.duyetXe)}`}>
              <div className="flex items-center gap-2">
                <Car className="w-5 h-5" />
                <CardTitle className="text-lg m-0">Danh sách Xe ({cars.length})</CardTitle>
              </div>
            {course.duyetXe ? (
              <CheckCircle2 className="w-6 h-6 text-white" />
            ) : (
              <Button size="sm" variant="outline" className="w-full xl:w-auto" onClick={() => handleSubApprove('XE')} disabled={isPending}>
                Duyệt Xe
              </Button>
            )}
          </div>
          <CardContent className="pt-4 h-[500px] overflow-y-auto">
            {cars.length === 0 ? (
              <p className="text-sm text-slate-500 italic">Chưa phân công xe nào.</p>
            ) : (
              <ul className="space-y-2">
                {cars.map((c: any, idx: number) => (
                  <li key={idx} className="p-3 bg-white border border-slate-100 rounded-md shadow-sm">
                    <div className="font-medium text-slate-900">{c.bienSo}</div>
                    <div className="text-xs text-slate-500 mt-1 flex justify-between items-center">
                      <span>{c.hangXe}</span>
                      <span className="font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded">Hạn GTL: {c.hanGPTL || '-'}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        )}

        {/* TEACHERS LIST */}
        {!isMoto && (
          <Card className={`shadow-sm transition-all ${getCardStyle(course.duyetGV)}`}>
            <div className={`border-b p-4 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-3 rounded-t-xl ${getHeaderStyle(course.duyetGV)}`}>
              <div className="flex items-center gap-2">
                <UserSquare2 className="w-5 h-5" />
                <CardTitle className="text-lg m-0">Danh sách Giáo viên ({teachers.length})</CardTitle>
              </div>
            {course.duyetGV ? (
              <CheckCircle2 className="w-6 h-6 text-white" />
            ) : (
              <Button size="sm" variant="outline" className="w-full xl:w-auto" onClick={() => handleSubApprove('GV')} disabled={isPending}>
                Duyệt GV
              </Button>
            )}
          </div>
          <CardContent className="pt-4 h-[500px] overflow-y-auto">
            {teachers.length === 0 ? (
              <p className="text-sm text-slate-500 italic">Chưa phân công giáo viên nào.</p>
            ) : (
              <ul className="space-y-2">
                {teachers.map((t: any, idx: number) => (
                  <li key={idx} className="p-3 bg-white border border-slate-100 rounded-md shadow-sm">
                    <div className="font-medium text-slate-900">{t.hoTen}</div>
                    <div className="text-xs text-slate-500 mt-1 flex justify-between items-center">
                      <span>Hạng: {t.hangGPLX}</span>
                      <span className="font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded">Hạn GPLX: {t.hanGPLX || '-'}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        )}

        {/* STUDENTS LIST */}
        <Card className={`shadow-sm transition-all ${getCardStyle(course.duyetHoSo)}`}>
          <div className={`border-b p-4 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-3 rounded-t-xl ${getHeaderStyle(course.duyetHoSo)}`}>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              <CardTitle className="text-lg m-0">Danh sách Học viên ({students.length})</CardTitle>
            </div>
            {course.duyetHoSo ? (
              <CheckCircle2 className="w-6 h-6 text-white" />
            ) : (
              <Button size="sm" variant="outline" className="w-full xl:w-auto" onClick={() => handleSubApprove('HOSO')} disabled={isPending}>
                Duyệt Hồ sơ
              </Button>
            )}
          </div>
          <CardContent className="pt-4 h-[500px] overflow-y-auto">
             <div className="mb-2 text-sm text-slate-600 font-medium">Tổng số: {students.length} học viên</div>
            {students.length === 0 ? (
              <p className="text-sm text-slate-500 italic">Chưa có học viên nào.</p>
            ) : (
              <ul className="space-y-2">
                {students.map((s: any, idx: number) => (
                  <li key={idx} className="p-3 bg-white border border-slate-100 rounded-md shadow-sm">
                    <div className="font-medium text-slate-900">{s.hoTen}</div>
                    <div className="text-xs text-slate-500 flex justify-between mt-1">
                      <span>CCCD: {s.cccd}</span>
                      <span className="text-indigo-600 font-medium truncate ml-2 max-w-[120px]">{s.nguoiNop}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
