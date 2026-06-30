"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
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
  Users
} from "lucide-react";

type SubItem = {
  name: string;
  href: string;
  implemented?: boolean;
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
    name: "Nguồn lực", 
    icon: Briefcase,
    subItems: [
      {
        name: "Giáo viên",
        href: "/teachers",
        implemented: true
      },
      {
        name: "Phương tiện",
        href: "/cars",
        implemented: true
      },
      {
        name: "Lưu trữ",
        href: "/archive",
        implemented: false
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
      { name: "Quản lý học phí", href: "/accounting/fees", implemented: false },
      { name: "Quản lý công nợ", href: "/accounting/debts", implemented: false },
      { name: "Lệ phí SH", href: "/accounting/exam-fees", implemented: false },
    ]
  },
  { 
    name: "Đào tạo", 
    icon: GraduationCap,
    subItems: [
      { name: "Tiến độ đào tạo", href: "/courses", implemented: true },
      { name: "Phân công Xe & GV", href: "/allocations", implemented: false },
      { name: "Theo dõi HV", href: "/students", implemented: true },
    ]
  },
  { 
    name: "Sổ sách", 
    icon: Library,
    subItems: [
      { name: "Quyết định", href: "/records/decisions", implemented: false },
      { name: "Công văn", href: "/records/documents", implemented: false },
      { name: "Giáo án (Sổ TD)", href: "/lesson-plans", implemented: true },
      { name: "Hợp đồng ĐT", href: "/records/contracts", implemented: false },
      { name: "Quản lý Sổ Sách", href: "/records/management", implemented: false },
    ]
  },
  { 
    name: "Quản lý kỳ thi", 
    icon: PencilLine,
    subItems: [
      { name: "Lịch thi", href: "/exams/schedule", implemented: false },
      { name: "Tốt nghiệp", href: "/exams/graduation", implemented: false },
      { name: "Sát hạch", href: "/exams/testing", implemented: false },
      { name: "Phân giờ xe", href: "/exams/car-scheduling", implemented: false },
    ]
  },
  { 
    name: "Nhân sự", 
    icon: Users,
    subItems: [
      { name: "Danh sách nhân viên", href: "/hr/staff-list", implemented: false },
      { name: "Thông tin nhân viên", href: "/hr/staff-info", implemented: false },
    ]
  },
  { name: "Cấu hình", href: "/settings", icon: Settings },
];

function NavGroup({ item, pathname }: { item: NavItem; pathname: string }) {
  // Check if any subItem is active
  const isActiveGroup = item.subItems?.some(sub => pathname.startsWith(sub.href)) || false;
  
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
        className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
          isActive
            ? "bg-indigo-600 text-white shadow-md shadow-indigo-900/20"
            : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
        }`}
      >
        <Icon className={`h-5 w-5 ${isActive ? "text-white" : "text-slate-500"}`} />
        {item.name}
      </Link>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-all w-full ${
          isActiveGroup && !isOpen
            ? "bg-slate-800 text-white"
            : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
        }`}
      >
        <div className="flex items-center gap-3">
          <Icon className={`h-5 w-5 ${isActiveGroup && !isOpen ? "text-indigo-400" : "text-slate-500"}`} />
          {item.name}
        </div>
        {isOpen ? <ChevronDown className="h-4 w-4 text-slate-500" /> : <ChevronRight className="h-4 w-4 text-slate-500" />}
      </button>
      
      {isOpen && (
        <div className="ml-4 pl-3 border-l border-slate-700/50 flex flex-col gap-1 mt-1">
          {item.subItems.map((sub) => {
            const isSubActive = pathname.startsWith(sub.href);
            return (
              <Link
                key={sub.name}
                href={sub.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all ${
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

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-screen w-full flex-col bg-slate-900 text-slate-300 shadow-xl">
      <div className="flex h-16 items-center justify-center border-b border-slate-800 px-6 shrink-0">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <div className="bg-indigo-600 p-1.5 rounded-lg">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          Đại Phát
        </h1>
      </div>
      <div className="flex-1 overflow-y-auto py-6 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
        <nav className="flex flex-col gap-2 px-4">
          {navItems.map((item) => (
            <NavGroup key={item.name} item={item} pathname={pathname} />
          ))}
        </nav>
      </div>
      <div className="border-t border-slate-800 p-4 shrink-0">
        <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-400 transition-all hover:bg-slate-800 hover:text-red-400">
          <LogOut className="h-5 w-5" />
          Đăng xuất
        </button>
      </div>
    </div>
  );
}
