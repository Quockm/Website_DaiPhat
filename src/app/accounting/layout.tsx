"use client";

import React from "react";
import { usePathname } from "next/navigation";

export default function AccountingLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Bỏ qua thẻ bao bọc (wrapper) đối với trang nhập mã xác thực
  if (pathname === "/accounting/auth") {
    return <>{children}</>;
  }

  return (
    <div className="w-full">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 min-h-[85vh] p-4 sm:p-6 relative">
        {children}
      </div>
    </div>
  );
}
