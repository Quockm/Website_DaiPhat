"use client";

import React, { useState } from "react";

// Mock data for the preview
const daysInMonth = Array.from({ length: 30 }, (_, i) => i + 1);

const mockOto = [
  {
    id: "B2-K105",
    name: "Hạng B2 - Khóa 105",
    students: 45,
    cars: 9,
    phases: [
      { start: 1, end: 5, type: "LT", color: "bg-blue-500" }, // Lý thuyết
      { start: 6, end: 15, type: "SH", color: "bg-green-500" }, // Sa hình
      { start: 16, end: 18, type: "CB", color: "bg-orange-500" }, // Cabin
      { start: 19, end: 28, type: "DAT", color: "bg-purple-500" }, // DAT
    ],
  },
  {
    id: "C-K45",
    name: "Hạng C - Khóa 45",
    students: 30,
    cars: 5,
    phases: [
      { start: 5, end: 10, type: "LT", color: "bg-blue-500" },
      { start: 11, end: 20, type: "SH", color: "bg-green-500" },
      { start: 21, end: 25, type: "CB", color: "bg-orange-500" },
      { start: 26, end: 30, type: "DAT", color: "bg-purple-500" },
    ],
  },
  {
    id: "B1-K80",
    name: "Hạng B1 - Khóa 80",
    students: 20,
    cars: 4,
    phases: [
      { start: 1, end: 3, type: "LT", color: "bg-blue-500" },
      { start: 4, end: 12, type: "SH", color: "bg-green-500" },
    ],
  },
];

const mockMoto = [
  {
    id: "A1-K200",
    name: "Hạng A1 - Khóa 200",
    students: 150,
    cars: 0,
    phases: [
      { start: 15, end: 16, type: "LT", color: "bg-blue-500" },
    ],
  },
  {
    id: "A2-K50",
    name: "Hạng A2 - Khóa 50",
    students: 35,
    cars: 0,
    phases: [
      { start: 2, end: 4, type: "LT", color: "bg-blue-500" },
    ],
  },
];

export default function GanttChart() {
  const [activeTab, setActiveTab] = useState("OTO");
  const currentData = activeTab === "OTO" ? mockOto : mockMoto;

  return (
    <div className="w-full">
      {/* Tabs Layout */}
      <div className="flex items-center gap-2 px-4 pt-4 pb-2 border-b border-slate-200">
        <button 
          onClick={() => setActiveTab("OTO")}
          className={`px-4 py-2 rounded-t-lg font-bold text-sm transition-colors ${activeTab === "OTO" ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
        >
          🚗 Tiến độ Đào tạo Ô tô
        </button>
        <button 
          onClick={() => setActiveTab("MOTO")}
          className={`px-4 py-2 rounded-t-lg font-bold text-sm transition-colors ${activeTab === "MOTO" ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
        >
          🏍️ Tiến độ Đào tạo Mô tô
        </button>
      </div>

      <div className="w-full overflow-x-auto p-4">
        <div className="min-w-[800px]">
          {/* Chú thích màu theo Tab */}
          {activeTab === "OTO" ? (
            <div className="flex items-center gap-6 mb-4 text-sm font-bold text-slate-800">
              <div className="flex items-center gap-2"><span className="w-4 h-4 bg-blue-500 rounded-sm shadow-sm"></span>Lý thuyết</div>
              <div className="flex items-center gap-2"><span className="w-4 h-4 bg-green-500 rounded-sm shadow-sm"></span>Sa hình</div>
              <div className="flex items-center gap-2"><span className="w-4 h-4 bg-orange-500 rounded-sm shadow-sm"></span>Cabin</div>
              <div className="flex items-center gap-2"><span className="w-4 h-4 bg-purple-500 rounded-sm shadow-sm"></span>DAT</div>
            </div>
          ) : (
            <div className="flex items-center gap-6 mb-4 text-sm font-bold text-slate-800">
              <div className="flex items-center gap-2"><span className="w-4 h-4 bg-blue-500 rounded-sm shadow-sm"></span>Đang đào tạo (LT & TH)</div>
            </div>
          )}

          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th className="border-2 border-slate-300 bg-slate-200 p-3 text-left w-56 font-extrabold text-slate-900 uppercase">Khóa học</th>
                <th className="border-2 border-slate-300 bg-slate-200 p-3 text-center w-16 font-extrabold text-slate-900 uppercase">HV</th>
                <th className="border-2 border-slate-300 bg-slate-200 p-3 text-center w-16 font-extrabold text-slate-900 uppercase">Xe</th>
                {daysInMonth.map((day) => (
                  <th key={day} className="border-2 border-slate-300 bg-slate-200 p-1 text-center min-w-[32px] font-bold text-slate-900">
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {currentData.map((course) => (
                <tr key={course.id} className="hover:bg-blue-50 transition-colors">
                  <td className="border-2 border-slate-300 p-3 font-bold text-slate-900 bg-white">
                    <div className="truncate w-52" title={course.name}>{course.name}</div>
                  </td>
                  <td className="border-2 border-slate-300 p-3 text-center text-slate-800 font-bold bg-white">
                    {course.students}
                  </td>
                  <td className="border-2 border-slate-300 p-3 text-center text-slate-800 font-bold bg-white">
                    {course.cars > 0 ? course.cars : "-"}
                  </td>
                  {daysInMonth.map((day) => {
                    const activePhase = course.phases.find((p) => day >= p.start && day <= p.end);
                    return (
                      <td 
                        key={day} 
                        className={`border border-slate-300 p-0 relative group bg-white`}
                      >
                        {activePhase ? (
                          <div className={`w-full h-10 ${activePhase.color} flex items-center justify-center shadow-inner cursor-pointer`}>
                          </div>
                        ) : (
                          <div className="w-full h-10 bg-transparent"></div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
