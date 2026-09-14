"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Search, Filter, CalendarDays, Edit } from "lucide-react";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";

// The course type expected from the Server Action
type Course = {
  id: string;
  name: string;
  gv: number;
  xe: number;
  hv: number;
  soHocVienDaNhap?: number;
  khaiGiang: string;
  beGiang: string;
  satHach: string;
  status: string;
  type: string;
  lt: { bd: string; kt: string };
  sh: { bd: string; kt: string };
  cb?: { bd: string; kt: string };
  dat?: { bd: string; kt: string };
  trungTam: string;
};

export default function CoursesClient({ 
  initialCourses,
  title = "Tiến độ Đào tạo",
  description = "Bảng theo dõi tổng hợp chi tiết lịch trình và phân bổ thời gian.",
  hideHeader = false
}: { 
  initialCourses: Course[],
  title?: string,
  description?: string,
  hideHeader?: boolean
}) {
  const [activeTab, setActiveTab] = useState("OTO");
  const [showCompleted, setShowCompleted] = useState(false);
  const [trungTamFilter, setTrungTamFilter] = useState("Đại Phát");
  
  const todayRef = useRef<HTMLTableCellElement>(null);

  const [viewDate, setViewDate] = useState(new Date());
  const currentMonth = viewDate.getMonth();
  const currentYear = viewDate.getFullYear();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const today = new Date();
  const isCurrentMonth = today.getMonth() === currentMonth && today.getFullYear() === currentYear;
  const todayDate = today.getDate();

  useEffect(() => {
    // Only scroll automatically on initial mount
    if (isCurrentMonth && todayRef.current) {
      setTimeout(() => {
        todayRef.current?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }, 300);
    }
  }, []); // Run once on mount

  const handlePrevMonth = () => {
    setViewDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const handleToday = () => {
    setViewDate(new Date());
    setTimeout(() => {
      todayRef.current?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }, 100);
  };

  const parseDate = (dateStr: string) => {
    if (!dateStr || dateStr === '-') return null;
    if (dateStr.includes('-')) {
      const parts = dateStr.split('-');
      if (parts.length !== 3) return null;
      // Handle both YYYY-MM-DD and DD-MM-YYYY
      if (parseInt(parts[0]) > 1000) {
        return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      } else {
        return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
      }
    }
    const parts = dateStr.split('/');
    if (parts.length !== 3) return null;
    return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
  };

  const isOto = activeTab === "OTO";
  // Filter the real data from SQL server based on the type AND require students AND match trungTam
  let courses = initialCourses.filter(c => c.type?.toUpperCase() === activeTab.toUpperCase() && (c.soHocVienDaNhap || 0) > 0 && c.trungTam === trungTamFilter);
  
  // Dynamically calculate status based on beGiang
  courses = courses.map(c => {
    const bgDate = parseDate(c.beGiang)?.getTime();
    const isCompleted = bgDate && bgDate < today.getTime();
    if (isCompleted) {
      return { ...c, status: 'Đã bế giảng' };
    }
    return c;
  });

  if (!showCompleted) {
    courses = courses.filter(c => c.status !== 'Đã bế giảng');
  }

  return (
    <div className={hideHeader ? "" : "space-y-6"}>
      {!hideHeader && (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">{title}</h1>
            <p className="text-slate-600 mt-2 text-base font-medium">{description}</p>
          </div>
          <div className="flex gap-2 items-center">
            <select
              value={trungTamFilter}
              onChange={e => setTrungTamFilter(e.target.value)}
              className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-center rounded-lg font-medium shadow-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
            >
              <option value="Đại Phát">Đại Phát</option>
              <option value="Tiến Thành">Tiến Thành</option>
            </select>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex justify-between items-end mb-2">
        <div className="flex gap-2">
          <button 
            onClick={() => setActiveTab("OTO")}
            className={`px-6 py-2.5 font-bold rounded-t-lg transition-colors border-t border-l border-r ${activeTab === 'OTO' ? 'bg-white text-indigo-700 border-indigo-200 shadow-[0_-4px_0_0_#4f46e5]' : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'}`}
          >
            🚗 ĐÀO TẠO Ô TÔ ({initialCourses.filter(c => {
              if (c.type?.toUpperCase() !== 'OTO' || c.trungTam !== trungTamFilter) return false;
              if (showCompleted) return true;
              const bgDate = parseDate(c.beGiang)?.getTime();
              return !(bgDate && bgDate < today.getTime() || c.status === 'Đã bế giảng');
            }).length})
          </button>
          <button 
            onClick={() => setActiveTab("MOTO")}
            className={`px-6 py-2.5 font-bold rounded-t-lg transition-colors border-t border-l border-r ${activeTab === 'MOTO' ? 'bg-white text-indigo-700 border-indigo-200 shadow-[0_-4px_0_0_#4f46e5]' : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'}`}
          >
            🏍️ ĐÀO TẠO MÔ TÔ ({initialCourses.filter(c => {
              if (c.type?.toUpperCase() !== 'MOTO' || c.trungTam !== trungTamFilter) return false;
              if (showCompleted) return true;
              const bgDate = parseDate(c.beGiang)?.getTime();
              return !(bgDate && bgDate < today.getTime() || c.status === 'Đã bế giảng');
            }).length})
          </button>
        </div>
        
        <label className="flex items-center gap-2 text-sm text-slate-600 mb-2 font-medium cursor-pointer hover:text-slate-900">
          <input 
            type="checkbox" 
            checked={showCompleted}
            onChange={(e) => setShowCompleted(e.target.checked)}
            className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
          />
          Hiển thị khóa đã bế giảng
        </label>
      </div>

      <Card className="bg-white shadow-md border-slate-200 overflow-hidden rounded-tl-none">
        <CardHeader className="bg-slate-50/80 border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
            <div className="p-1.5 bg-blue-100 rounded-md">
              <CalendarDays className="h-5 w-5 text-blue-700" />
            </div>
            Bảng Điều Độ Tổng Hợp {isOto ? "(Ô Tô)" : "(Mô Tô)"}
          </CardTitle>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowCompleted(!showCompleted)}
              className={`flex items-center gap-2 border px-4 py-2 rounded-lg text-sm font-bold transition-colors shadow-sm ${showCompleted ? 'bg-slate-700 text-white border-slate-700' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'}`}
            >
              {showCompleted ? '👁️ Đang hiện Khóa cũ' : '🙈 Đang ẩn Khóa cũ'}
            </button>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Tìm mã/tên khóa..." 
                className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-64 font-medium"
              />
            </div>
            <button className="flex items-center gap-2 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-bold transition-colors shadow-sm">
              <Filter className="w-4 h-4" />
              Lọc
            </button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto custom-scrollbar pb-2" style={{ maxWidth: '100vw' }}>
            <table className="w-full text-left text-sm text-slate-600 min-w-max border-collapse">
              <thead className="bg-slate-50 text-slate-700 font-extrabold uppercase text-xs border-b border-slate-200">
                <tr>
                  <th rowSpan={2} className="px-4 py-3 border-r border-slate-200 sticky left-0 bg-slate-50 z-10 shadow-[1px_0_0_0_#e2e8f0]">Mã Khóa</th>
                  {isOto && <th rowSpan={2} className="px-4 py-3 border-r border-slate-200 text-center">SL Xe</th>}
                  <th rowSpan={2} className="px-4 py-3 border-r border-slate-200 text-center">SL HV</th>
                  <th rowSpan={2} className="px-4 py-3 border-r border-slate-200 text-center text-indigo-700">SL GV</th>
                  <th rowSpan={2} className="px-4 py-3 border-r border-slate-200">Khai Giảng</th>
                  <th colSpan={2} className="px-4 py-2 border-r border-slate-200 text-center bg-green-50 text-green-800">Lý Thuyết</th>
                  <th colSpan={2} className="px-4 py-2 border-r border-slate-200 text-center bg-amber-50 text-amber-800">Thực Hành (Sa Hình)</th>
                  {isOto && (
                    <>
                      <th colSpan={2} className="px-4 py-2 border-r border-slate-200 text-center bg-orange-50 text-orange-800">Cabin</th>
                      <th colSpan={2} className="px-4 py-2 border-r border-slate-200 text-center bg-blue-50 text-blue-800">DAT</th>
                    </>
                  )}
                  <th rowSpan={2} className="px-4 py-3 border-r border-slate-200">Bế Giảng</th>
                  <th rowSpan={2} className="px-4 py-3 border-r border-slate-200">Sát Hạch</th>
                  <th colSpan={daysInMonth} className="px-4 py-1 text-center bg-slate-100 border-b border-slate-200">
                    <div className="flex items-center justify-center gap-4">
                      <button onClick={handlePrevMonth} className="px-2 py-1 rounded bg-slate-200 hover:bg-slate-300 text-slate-600 font-bold shadow-sm">&larr;</button>
                      <span className="cursor-pointer hover:underline text-sm" onClick={handleToday}>Tháng {currentMonth + 1}/{currentYear}</span>
                      <button onClick={handleNextMonth} className="px-2 py-1 rounded bg-slate-200 hover:bg-slate-300 text-slate-600 font-bold shadow-sm">&rarr;</button>
                    </div>
                  </th>
                </tr>
                <tr>
                  <th className="px-3 py-2 border-r border-slate-200 bg-green-50 text-center">BĐ</th><th className="px-3 py-2 border-r border-slate-200 bg-green-50 text-center">KT</th>
                  <th className="px-3 py-2 border-r border-slate-200 bg-amber-50 text-center">BĐ</th><th className="px-3 py-2 border-r border-slate-200 bg-amber-50 text-center">KT</th>
                  {isOto && (
                    <>
                      <th className="px-3 py-2 border-r border-slate-200 bg-orange-50 text-center">BĐ</th><th className="px-3 py-2 border-r border-slate-200 bg-orange-50 text-center">KT</th>
                      <th className="px-3 py-2 border-r border-slate-200 bg-blue-50 text-center">BĐ</th><th className="px-3 py-2 border-r border-slate-200 bg-blue-50 text-center">KT</th>
                    </>
                  )}
                  {days.map(d => (
                    <th 
                      key={d} 
                      ref={isCurrentMonth && d === todayDate ? todayRef : null}
                      className={`px-2 py-2 text-center w-8 ${isCurrentMonth && d === todayDate ? 'bg-red-600 text-white font-black shadow-[inset_0_0_8px_rgba(0,0,0,0.3)] border-r border-red-700' : 'bg-slate-100 border-r border-slate-200'}`}
                    >
                      {d}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {courses.length === 0 ? (
                  <tr>
                    <td colSpan={20} className="px-4 py-8 text-center text-slate-500 font-medium">
                      Chưa có dữ liệu khóa học nào từ Hệ thống.
                    </td>
                  </tr>
                ) : courses.map((course) => {
                  const isCompleted = course.status === 'Đã bế giảng';
                  let statusClass = 'bg-indigo-100 text-indigo-700 border-indigo-200';
                  const stat = course.status.toLowerCase();
                  if (isCompleted) {
                    statusClass = 'bg-slate-100 text-slate-500 border-slate-200';
                  } else if (stat.includes('lý thuyết')) {
                    statusClass = 'bg-green-100 text-green-700 border-green-200';
                  } else if (stat.includes('sa hình')) {
                    statusClass = 'bg-amber-100 text-amber-700 border-amber-200';
                  } else if (stat.includes('cabin')) {
                    statusClass = 'bg-orange-100 text-orange-700 border-orange-200';
                  } else if (stat.includes('dat')) {
                    statusClass = 'bg-blue-100 text-blue-700 border-blue-200';
                  } else if (stat.includes('chưa khai giảng') || stat === 'lên kế hoạch') {
                    statusClass = 'bg-slate-100 text-slate-700 border-slate-300';
                  }
                  
                  return (
                  <tr key={course.id} className={`hover:bg-slate-50 transition-colors group ${isCompleted ? 'bg-slate-50 opacity-60 grayscale' : 'bg-white'}`}>
                    <td className={`px-4 py-2 border-r border-slate-200 sticky left-0 z-10 shadow-[1px_0_0_0_#e2e8f0] group-hover:bg-slate-50 ${isCompleted ? 'bg-slate-50' : 'bg-white'}`}>
                      <div className="flex flex-col gap-1 items-start">
                        <Link href={`/courses/${course.id}`} className="hover:underline flex items-center gap-1 font-bold text-indigo-700">
                          {course.id} <Edit className="w-3 h-3 text-slate-400" />
                        </Link>
                        <span className={`px-1.5 py-0.5 rounded text-xs font-bold border whitespace-nowrap ${statusClass}`}>
                          {course.status}
                        </span>
                      </div>
                    </td>
                    {isOto && <td className="px-4 py-3 text-center font-bold text-red-600 border-r border-slate-200">{course.xe}</td>}
                    <td className="px-4 py-3 text-center font-bold text-slate-800 border-r border-slate-200">{course.hv}</td>
                    <td className="px-4 py-3 text-center font-bold text-indigo-600 border-r border-slate-200 bg-indigo-50/50">{course.gv}</td>
                    <td className="px-4 py-3 font-semibold border-r border-slate-200">{course.khaiGiang}</td>
                    
                    <td className="px-3 py-3 border-r border-slate-200 text-center text-xs">{course.lt.bd}</td>
                    <td className="px-3 py-3 border-r border-slate-200 text-center text-xs">{course.lt.kt}</td>
                    
                    <td className="px-3 py-3 border-r border-slate-200 text-center text-xs">{course.sh.bd}</td>
                    <td className="px-3 py-3 border-r border-slate-200 text-center text-xs">{course.sh.kt}</td>
                    
                    {isOto && (
                      <>
                        <td className="px-3 py-3 border-r border-slate-200 text-center text-xs">{course.cb?.bd || '-'}</td>
                        <td className="px-3 py-3 border-r border-slate-200 text-center text-xs">{course.cb?.kt || '-'}</td>
                        
                        <td className="px-3 py-3 border-r border-slate-200 text-center text-xs">{course.dat?.bd || '-'}</td>
                        <td className="px-3 py-3 border-r border-slate-200 text-center text-xs">{course.dat?.kt || '-'}</td>
                      </>
                    )}
                    
                    <td className="px-4 py-3 font-semibold border-r border-slate-200"><span className="bg-slate-100 px-2 py-1 rounded">🎓 {course.beGiang}</span></td>
                    <td className="px-4 py-3 font-semibold border-r border-slate-200 text-red-600">{course.satHach}</td>
                    
                    {/* Gantt Cells Logic */}
                    {days.map(d => {
                      const currentLoopDate = new Date(currentYear, currentMonth, d).getTime();
                      
                      const kgDate = parseDate(course.khaiGiang)?.getTime();
                      const bgDate = parseDate(course.beGiang)?.getTime();
                      
                      const ltBd = parseDate(course.lt.bd)?.getTime();
                      const ltKt = parseDate(course.lt.kt)?.getTime();
                      
                      const shBd = parseDate(course.sh.bd)?.getTime();
                      const shKt = parseDate(course.sh.kt)?.getTime();
                      
                      const cbBd = course.cb?.bd ? parseDate(course.cb.bd)?.getTime() : undefined;
                      const cbKt = course.cb?.kt ? parseDate(course.cb.kt)?.getTime() : undefined;
                      
                      const datBd = course.dat?.bd ? parseDate(course.dat.bd)?.getTime() : undefined;
                      const datKt = course.dat?.kt ? parseDate(course.dat.kt)?.getTime() : undefined;

                      let activeColor = '';
                      let isActive = false;
                      
                      if (isCompleted) {
                         if (kgDate && bgDate && currentLoopDate >= kgDate && currentLoopDate <= bgDate) {
                            isActive = true;
                            activeColor = 'bg-slate-300';
                         }
                      } else {
                         if (ltBd && ltKt && currentLoopDate >= ltBd && currentLoopDate <= ltKt) {
                            isActive = true;
                            activeColor = 'bg-green-400';
                         } else if (shBd && shKt && currentLoopDate >= shBd && currentLoopDate <= shKt) {
                            isActive = true;
                            activeColor = 'bg-amber-400';
                         } else if (cbBd && cbKt && currentLoopDate >= cbBd && currentLoopDate <= cbKt) {
                            isActive = true;
                            activeColor = 'bg-orange-400';
                         } else if (datBd && datKt && currentLoopDate >= datBd && currentLoopDate <= datKt) {
                            isActive = true;
                            activeColor = 'bg-blue-400';
                         } else if (kgDate && bgDate && currentLoopDate >= kgDate && currentLoopDate <= bgDate) {
                            isActive = true;
                            activeColor = 'bg-indigo-300/60';
                         }
                      }
                      
                      return (
                        <td key={d} className={`border-r border-slate-200 p-0 min-w-[24px] relative ${isActive ? activeColor : ''} ${isCurrentMonth && d === todayDate ? 'border-x-[2px] border-x-red-500 z-10' : ''}`}>
                          {isCurrentMonth && d === todayDate && (
                            <div className="absolute inset-0 bg-red-500/10 pointer-events-none mix-blend-multiply"></div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
