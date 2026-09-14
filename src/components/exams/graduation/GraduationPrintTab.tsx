"use client";

import React from "react";
import { Printer, FileBadge2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function GraduationPrintTab() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
        <div className="p-2 bg-pink-100 text-pink-600 rounded-lg">
          <Printer className="w-5 h-5" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">In Ấn Chứng Chỉ Tốt Nghiệp</h2>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center w-full">
        <FileBadge2 className="w-16 h-16 text-pink-300 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-slate-800 mb-2">Chức năng đang được phát triển</h3>
        <p className="text-slate-500 mb-6">
          Hệ thống đang được tích hợp module tạo file PDF tự động cho Chứng Chỉ Tốt Nghiệp sơ cấp nghề dựa trên kết quả thi ĐẠT.
        </p>
        <Button className="bg-pink-600 hover:bg-pink-700" disabled>
          <Printer className="w-4 h-4 mr-2" /> In Hàng Loạt (Sắp ra mắt)
        </Button>
      </div>
    </div>
  );
}
