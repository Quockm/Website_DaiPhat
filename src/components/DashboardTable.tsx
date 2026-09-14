"use client";

import { Edit } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

type Course = {
  id: string;
  name: string;
  xe: number;
  hv: number;
  khaiGiang: string;
  beGiang: string;
  satHach: string;
  status: string;
  type: string;
  lt: { bd: string; kt: string };
  sh: { bd: string; kt: string };
  cb?: { bd: string; kt: string };
  dat?: { bd: string; kt: string };
};

export default function DashboardTable({ initialCourses }: { initialCourses: Course[] }) {
  const [activeTab, setActiveTab] = useState("OTO");

  const isOto = activeTab === "OTO";
  
  const today = new Date();

  const parseDate = (dateStr: string) => {
    if (!dateStr || dateStr === '-') return null;
    if (dateStr.includes('-')) {
      const parts = dateStr.split('-');
      if (parts.length !== 3) return null;
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

  // Filter out 'Đã bế giảng' for Dashboard and by tab type dynamically
  const courses = initialCourses.filter(c => {
     if (c.type?.toUpperCase() !== activeTab.toUpperCase()) return false;
     const bgDate = parseDate(c.beGiang)?.getTime();
     const isCompleted = bgDate && bgDate < today.getTime();
     return !isCompleted && c.status !== 'Đã bế giảng';
  });

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <button 
          onClick={() => setActiveTab("OTO")}
          className={`px-6 py-2.5 font-bold rounded-lg transition-colors border ${activeTab === 'OTO' ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'}`}
        >
          🚗 ĐÀO TẠO Ô TÔ ({initialCourses.filter(c => {
             if (c.type?.toUpperCase() !== 'OTO') return false;
             const bgDate = parseDate(c.beGiang)?.getTime();
             return !(bgDate && bgDate < today.getTime() || c.status === 'Đã bế giảng');
          }).length})
        </button>
        <button 
          onClick={() => setActiveTab("MOTO")}
          className={`px-6 py-2.5 font-bold rounded-lg transition-colors border ${activeTab === 'MOTO' ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'}`}
        >
          🏍️ ĐÀO TẠO MÔ TÔ ({initialCourses.filter(c => {
             if (c.type?.toUpperCase() !== 'MOTO') return false;
             const bgDate = parseDate(c.beGiang)?.getTime();
             return !(bgDate && bgDate < today.getTime() || c.status === 'Đã bế giảng');
          }).length})
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600 min-w-max border-collapse border border-slate-200">
          <thead className="bg-slate-50 text-slate-700 font-extrabold uppercase text-xs border-b border-slate-200">
            <tr>
              <th rowSpan={2} className="px-4 py-3 border-r border-slate-200 bg-slate-50">Mã Khóa</th>
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
              <th rowSpan={2} className="px-4 py-3 border-r border-slate-200 text-center">Trạng thái</th>
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
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {courses.length === 0 ? (
              <tr>
                <td colSpan={15} className="px-4 py-8 text-center text-slate-500 font-medium border border-slate-200">
                  Không có khóa học nào đang diễn ra.
                </td>
              </tr>
            ) : courses.map((course) => {
              const stat = course.status.toLowerCase();
              const inLt = stat.includes('lý thuyết');
              const inSh = stat.includes('sa hình');
              const inCb = stat.includes('cabin');
              const inDat = stat.includes('dat');
              
              let statusClass = 'bg-slate-100 text-slate-700 border-slate-300';
              if (inLt) statusClass = 'bg-green-100 text-green-700 border-green-200';
              if (inSh) statusClass = 'bg-amber-100 text-amber-700 border-amber-200';
              if (inCb) statusClass = 'bg-orange-100 text-orange-700 border-orange-200';
              if (inDat) statusClass = 'bg-blue-100 text-blue-700 border-blue-200';
              
              return (
                <tr key={course.id} className="hover:bg-slate-50 transition-colors bg-white">
                  <td className="px-4 py-3 font-bold text-indigo-700 border-r border-slate-200">
                    <Link href={`/courses/${course.id}`} className="hover:underline flex items-center gap-1">
                      {course.id} <Edit className="w-3 h-3 text-slate-400" />
                    </Link>
                  </td>
                  {isOto && <td className="px-4 py-3 text-center font-bold text-red-600 border-r border-slate-200">{course.xe}</td>}
                  <td className="px-4 py-3 text-center font-bold text-slate-800 border-r border-slate-200">{course.hv}</td>
                  <td className="px-4 py-3 text-center font-bold text-indigo-600 border-r border-slate-200 bg-indigo-50/50">{(course as any).gv || 0}</td>
                  <td className="px-4 py-3 font-semibold border-r border-slate-200">{course.khaiGiang}</td>
                  
                  {/* Highlight current phase cells */}
                  <td className={`px-3 py-3 border-r border-slate-200 text-center text-xs ${inLt ? 'bg-green-400 text-green-950 font-bold' : ''}`}>{course.lt.bd}</td>
                  <td className={`px-3 py-3 border-r border-slate-200 text-center text-xs ${inLt ? 'bg-green-400 text-green-950 font-bold' : ''}`}>{course.lt.kt}</td>
                  
                  <td className={`px-3 py-3 border-r border-slate-200 text-center text-xs ${inSh ? 'bg-amber-400 text-amber-950 font-bold' : ''}`}>{course.sh.bd}</td>
                  <td className={`px-3 py-3 border-r border-slate-200 text-center text-xs ${inSh ? 'bg-amber-400 text-amber-950 font-bold' : ''}`}>{course.sh.kt}</td>
                  
                  {isOto && (
                    <>
                      <td className={`px-3 py-3 border-r border-slate-200 text-center text-xs ${inCb ? 'bg-orange-400 text-orange-950 font-bold' : ''}`}>{course.cb?.bd || '-'}</td>
                      <td className={`px-3 py-3 border-r border-slate-200 text-center text-xs ${inCb ? 'bg-orange-400 text-orange-950 font-bold' : ''}`}>{course.cb?.kt || '-'}</td>
                      
                      <td className={`px-3 py-3 border-r border-slate-200 text-center text-xs ${inDat ? 'bg-blue-400 text-blue-950 font-bold' : ''}`}>{course.dat?.bd || '-'}</td>
                      <td className={`px-3 py-3 border-r border-slate-200 text-center text-xs ${inDat ? 'bg-blue-400 text-blue-950 font-bold' : ''}`}>{course.dat?.kt || '-'}</td>
                    </>
                  )}
                  
                  <td className="px-4 py-3 font-semibold border-r border-slate-200"><span className="bg-slate-100 px-2 py-1 rounded">🎓 {course.beGiang}</span></td>
                  <td className="px-4 py-3 font-semibold border-r border-slate-200 text-red-600">{course.satHach}</td>
                  
                  <td className="px-4 py-3 text-center border-r border-slate-200">
                    <span className={`px-2 py-1 rounded text-xs font-bold border ${statusClass}`}>
                      {course.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
