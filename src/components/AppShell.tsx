"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import { Menu } from "lucide-react";
import { usePathname } from "next/navigation";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const pathname = usePathname();

  if (pathname?.includes('/print/')) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 overflow-hidden">
      {/* Sidebar with CSS transition for width */}
      <div 
        className={`relative overflow-hidden transition-all duration-300 ease-in-out shrink-0 bg-slate-900 ${
          isSidebarOpen ? "w-64" : "w-0"
        }`}
      >
        <div className="w-64 h-full">
          <Sidebar />
        </div>
      </div>
      
      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen min-w-0 bg-slate-50">
        <header className="bg-white border-b h-16 flex items-center px-4 md:px-8 shadow-sm shrink-0">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 mr-4 hover:bg-slate-100 rounded-md transition-colors text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            title={isSidebarOpen ? "Thu gọn menu" : "Mở menu"}
          >
            <Menu className="w-6 h-6" />
          </button>
          
          <h2 className="text-xl font-semibold text-slate-800 truncate">Hệ thống Quản lý</h2>
          
          <div className="ml-auto flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-end hidden sm:flex">
                <span className="text-sm font-semibold text-slate-700">Admin</span>
                <span className="text-xs text-slate-500">Đại Phát</span>
              </div>
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold border border-indigo-200">
                A
              </div>
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-auto p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
