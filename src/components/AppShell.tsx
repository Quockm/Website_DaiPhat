"use client";

import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import { Menu, LogOut } from "lucide-react";
import { usePathname } from "next/navigation";
import { SessionPayload } from "@/lib/auth";
import { getPendingHandoversCount } from "@/actions/handover";
import Link from "next/link";

export default function AppShell({ children, user }: { children: React.ReactNode, user?: SessionPayload | null }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const pathname = usePathname();
  const [pendingHandovers, setPendingHandovers] = useState(0);

  // Lấy số lượng hồ sơ chờ duyệt
  useEffect(() => {
    if (user?.role === 'HR' || user?.role === 'Admin') {
      getPendingHandoversCount().then(res => {
        if (res.success && res.data) {
          setPendingHandovers(res.data.total);
        }
      });
    }
  }, [user?.role]);

  // Đóng sidebar khi đổi trang trên mobile
  useEffect(() => {
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  }, [pathname]);

  // Khởi tạo mặc định đóng sidebar trên mobile
  useEffect(() => {
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  }, []);

  if (pathname?.includes('/print/') || pathname === '/login') {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 overflow-hidden">
      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden transition-opacity" 
          onClick={() => setIsSidebarOpen(false)} 
        />
      )}

      {/* Sidebar */}
      <div 
        className={`fixed inset-y-0 left-0 z-50 h-full shrink-0 bg-slate-900 transition-all duration-300 ease-in-out md:static ${
          isSidebarOpen 
            ? "translate-x-0 w-56 shadow-2xl md:shadow-none" 
            : "-translate-x-full w-56 md:translate-x-0 md:w-0"
        } overflow-hidden`}
      >
        <div className="w-56 h-full">
          <Sidebar userRole={user?.role || 'Guest'} />
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
            {user && (
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-end hidden sm:flex">
                  <span className="text-sm font-semibold text-slate-700">{user.fullName}</span>
                  <span className="text-xs text-slate-500">{user.role}</span>
                </div>
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold border border-indigo-200 uppercase">
                  {user.fullName.charAt(0)}
                </div>
                <button
                  onClick={async () => {
                    await fetch('/api/logout', { method: 'POST' });
                    window.location.href = '/login';
                  }}
                  className="ml-2 p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  title="Đăng xuất"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </header>
        <div className="flex-1 overflow-auto p-4 md:p-8 relative">
          {pendingHandovers > 0 && !pathname?.includes('/hr/handover') && (
            <div className="mb-6 bg-indigo-50 border border-indigo-200 p-4 rounded-xl flex items-start sm:items-center justify-between gap-4 shadow-sm animate-in fade-in slide-in-from-top-4">
              <div className="flex items-center gap-3 text-indigo-800">
                <div className="bg-white p-2 rounded-full shadow-sm">
                  <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
                </div>
                <div>
                  <p className="font-semibold">Thông báo mới</p>
                  <p className="text-sm opacity-90 mt-0.5">Bạn có <span className="font-bold">{pendingHandovers}</span> hồ sơ bàn giao mới cần nhân sự xác nhận.</p>
                </div>
              </div>
              <Link 
                href="/hr/handover" 
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shrink-0 shadow-sm"
              >
                Xem ngay
              </Link>
            </div>
          )}
          {children}
        </div>
      </main>
    </div>
  );
}
