import React from "react";
import ExamFeeImport from "@/components/accounting/ExamFeeImport";

export default function ExamFeesPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Lệ Phí Sát Hạch</h1>
          <p className="text-sm text-slate-500 mt-1">
            Quản lý danh sách thi sát hạch, nạp file và bóc tách mã QR Code.
          </p>
        </div>
      </div>
      
      <ExamFeeImport />
    </div>
  );
}
