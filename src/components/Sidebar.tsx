"use client";

import { hasPermission } from "@/lib/permissions";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import Image from "next/image";
import logoImage from "../../public/logodp.png";
import {
  LayoutDashboard,
  CalendarDays,
  GraduationCap,
  Settings,
  LogOut,
  PencilLine,
  UserPlus,
  Briefcase,
  CircleDollarSign,
  Library,
  ChevronDown,
  ChevronRight,
  Circle,
  Users,
  MessageSquare,
  FolderOpen,
  UserMinus,
  Car
} from "lucide-react";

type SubItem = {
  name: string;
  href: string;
  implemented?: boolean;
  exactMatchOnly?: boolean;
};

type NavItem = {
  name: string;
  href?: string;
  icon: any;
  subItems?: SubItem[];
};

const navItems: NavItem[] = [
  { name: "Tổng quan", href: "/", icon: LayoutDashboard },
  { name: "Lịch biểu", href: "/calendar", icon: CalendarDays },
  { 
    name: "Giáo viên", 
    icon: Briefcase,
    subItems: [
      {
        name: "Danh sách giáo viên",
        href: "/teachers",
        implemented: true,
        exactMatchOnly: true
      },
      {
        name: "Bàn giao",
        href: "/teachers/handover",
        implemented: true
      },
      {
        name: "Lưu trữ Giáo viên",
        href: "/archive?tab=teachers",
        implemented: true
      }
    ]
  },
  { 
    name: "Phương tiện", 
    icon: Car,
    subItems: [
      {
        name: "Danh sách phương tiện",
        href: "/cars",
        implemented: true,
        exactMatchOnly: true
      },
      {
        name: "Danh sách DAT",
        href: "/cars/dat",
        implemented: true
      },
      {
        name: "Bàn giao",
        href: "/cars/handover",
        implemented: true
      },
      {
        name: "Lưu trữ Phương tiện",
        href: "/archive?tab=cars",
        implemented: true
      }
    ]
  },
  { 
    name: "Tuyển sinh", 
    icon: UserPlus,
    subItems: [
      { name: "Tạo khóa", href: "/admissions/create", implemented: true },
      { name: "Tuyển sinh Moto", href: "/admissions/moto", implemented: true },
      { name: "Tuyển sinh Oto", href: "/admissions/oto", implemented: true },
      { name: "Danh sách đã tạo", href: "/admissions/list", implemented: true },
      { name: "Danh Sách Chờ Duyệt", href: "/admissions/approval", implemented: true },
    ]
  },
  { 
    name: "Kế toán", 
    icon: CircleDollarSign,
    subItems: [
      { name: "Quản lý thu chi", href: "/accounting/transactions", implemented: true },
      { name: "Quản lý học phí", href: "/accounting/fees", implemented: true },
      { name: "Quản lý công nợ", href: "/accounting/debts", implemented: true },
      { name: "Hồ sơ Thuế", href: "/accounting/taxes", implemented: true },
      { name: "Thanh toán Hợp đồng Xe", href: "/accounting/car-payments", implemented: true },
      { name: "Chi phí cố định", href: "/accounting/fixed-costs", implemented: true },
      { name: "Thanh toán nội bộ", href: "/accounting/internal-payments", implemented: true },
    ]
  },
  { 
    name: "Đào tạo", 
    icon: GraduationCap,
    subItems: [
      { name: "Tiến độ đào tạo", href: "/courses", implemented: true },
      { name: "Phân công Xe & GV", href: "/allocations", implemented: true },
      { name: "Theo dõi HV", href: "/students", implemented: true },
    ]
  },
  { 
    name: "Zalo OA", 
    icon: MessageSquare,
    subItems: [
      { name: "Chiến dịch ZNS Moto", href: "/zalo-oa/moto", implemented: true },
      { name: "Chiến dịch ZNS Oto", href: "/zalo-oa/oto", implemented: true },
      { name: "Cấu hình API", href: "/zalo-oa/config", implemented: true },
      { name: "Lịch sử & Báo cáo", href: "/zalo-oa/history", implemented: true },
      { name: "Hàng đợi (GĐ2)", href: "/zalo-oa/oto-queue", implemented: true },
    ]
  },
  { 
    name: "Sổ sách", 
    icon: Library,
    subItems: [
      { name: "Quyết định khóa", href: "/records/decisions", implemented: true },
      { name: "Công văn chung", href: "/records/documents", implemented: true },
      { name: "Giáo án MOTO", href: "/lesson-plans/moto", implemented: true },
      { name: "Giáo án OTO", href: "/lesson-plans/oto", implemented: true },
      { name: "Hợp đồng ĐT", href: "/records/contracts", implemented: true },
      { name: "Quản lý Sổ Sách", href: "/records/logbook", implemented: true },
    ]
  },
  { 
    name: "Vắng Rớt", 
    icon: UserMinus,
    subItems: [
      { name: "VR TN", href: "/absent/graduation", implemented: true },
      { name: "VR SH", href: "/absent/testing", implemented: true },
      { name: "Quản lý ngăn xếp", href: "/absent/storage", implemented: true },
    ]
  },
  { 
    name: "Tốt nghiệp", 
    icon: GraduationCap,
    subItems: [
      { name: "Upload dữ liệu", href: "/exams/graduation/upload", implemented: true },
      { name: "Xét điều kiện dự thi", href: "/exams/graduation/eligibility", implemented: true },
      { name: "Danh sách dự thi", href: "/exams/graduation/students", implemented: true },
      { name: "Cập nhật điểm thi", href: "/exams/graduation/scores", implemented: true },
      { name: "Thống kê kết quả", href: "/exams/graduation/stats", implemented: true },
      { name: "In ấn chứng chỉ", href: "/exams/graduation/print", implemented: true },
    ]
  },
  { 
    name: "Sát hạch", 
    icon: PencilLine,
    subItems: [
      { name: "Upload dữ liệu", href: "/exams/testing/upload", implemented: true },
      { name: "Quản lý học viên", href: "/exams/testing/students", implemented: true },
      { name: "Quản lý mã QR", href: "/exams/testing/qr", implemented: true },
      { name: "Tick thanh toán", href: "/exams/testing/payments", implemented: true },
      { name: "Lịch sử quét", href: "/exams/testing/checkin", implemented: true },
      { name: "In hồ sơ & Thẻ", href: "/exams/testing/print", implemented: true },
      { name: "Thống kê kết quả", href: "/exams/testing/stats", implemented: true },
    ]
  },
  { 
    name: "Quản lý kỳ thi", 
    icon: CalendarDays,
    subItems: [
      { name: "Lịch thi", href: "/exams/schedule", implemented: true },
      { name: "Lịch ktra xe", href: "/exams/car-inspection", implemented: true },
    ]
  },
  { 
    name: "Nhân sự", 
    icon: Users,
    subItems: [
      { name: "Danh sách nhân sự", href: "/hr/staff-list", implemented: true },
      { name: "Cấu hình Lương", href: "/hr/salary-config", implemented: true },
      { name: "Bảng Lương", href: "/hr/payroll", implemented: true },
      { name: "Danh sách bàn giao", href: "/hr/handover", implemented: true },
      { name: "Thông tin nhân sự", href: "/hr/staff-info", implemented: true },
    ]
  },
  { name: "Cấu hình", href: "/settings", icon: Settings },
];

function NavGroup({ item, pathname }: { item: NavItem; pathname: string }) {
  // Check if any subItem is active
  const isActiveGroup = item.subItems?.some(sub => pathname === sub.href || pathname.startsWith(sub.href + "/")) || false;
  
  // Auto-expand if active
  const [isOpen, setIsOpen] = useState(isActiveGroup);
  
  useEffect(() => {
    if (isActiveGroup) setIsOpen(true);
  }, [isActiveGroup, pathname]);

  const Icon = item.icon;

  if (!item.subItems) {
    const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href || "");
    return (
      <Link
        href={item.href || "#"}
        className={`flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium transition-all ${
          isActive
            ? "bg-indigo-600 text-white shadow-md shadow-indigo-900/20"
            : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
        }`}
      >
        <Icon className={`h-4 w-4 ${isActive ? "text-white" : "text-slate-500"}`} />
        {item.name}
      </Link>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between rounded-lg px-2 py-2 text-sm font-medium transition-all w-full ${
          isActiveGroup && !isOpen
            ? "bg-slate-800 text-white"
            : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
        }`}
      >
        <div className="flex items-center gap-2">
          <Icon className={`h-4 w-4 ${isActiveGroup && !isOpen ? "text-indigo-400" : "text-slate-500"}`} />
          {item.name}
        </div>
        {isOpen ? <ChevronDown className="h-4 w-4 text-slate-500" /> : <ChevronRight className="h-4 w-4 text-slate-500" />}
      </button>
      
      {isOpen && (
        <div className="ml-4 pl-3 border-l border-slate-700/50 flex flex-col gap-1 mt-1">
          {item.subItems.map((sub) => {
            const isSubActive = sub.exactMatchOnly 
              ? pathname === sub.href 
              : (pathname === sub.href || pathname.startsWith(sub.href + "/"));
            return (
              <Link
                key={sub.name}
                href={sub.href}
                className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-all ${
                  isSubActive
                    ? "bg-indigo-600/10 text-indigo-400 font-semibold"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                }`}
              >
                <div className="flex items-center justify-center w-4 h-4">
                  <Circle className={`h-1.5 w-1.5 fill-current ${isSubActive ? "text-indigo-400" : "text-slate-500"}`} />
                </div>
                <span>{sub.name}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function Sidebar({ userRole = 'Guest' }: { userRole?: string }) {
  const pathname = usePathname();

  const filteredNavItems = navItems.filter(item => hasPermission(userRole, item.name));

  return (
    <div className="flex h-screen w-full flex-col bg-slate-900 text-slate-300 shadow-xl">
      <div className="flex h-16 items-center justify-center border-b border-slate-800 px-6 shrink-0">
        <h1 className="text-xl font-bold text-white flex items-center gap-3">
          <div className="w-10 h-10 overflow-hidden rounded-lg flex items-center justify-center">
            <Image src={logoImage} alt="Logo Đại Phát" className="w-full h-full object-contain p-0.5" />
          </div>
          Đại Phát
        </h1>
      </div>
      <div className="flex-1 overflow-y-auto py-6 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
        <nav className="flex flex-col gap-2 px-4">
          {filteredNavItems.map((item) => (
            <NavGroup key={item.name} item={item} pathname={pathname} />
          ))}
        </nav>
      </div>
      <div className="border-t border-slate-800 p-4 shrink-0">
        <button 
          onClick={async () => {
            await fetch('/api/logout', { method: 'POST' });
            window.location.href = '/login';
          }}
          className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium text-slate-400 transition-all hover:bg-slate-800 hover:text-red-400"
        >
          <LogOut className="h-4 w-4" />
          Đăng xuất
        </button>
      </div>
    </div>
  );
}
