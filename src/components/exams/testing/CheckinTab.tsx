"use client";

import React, { useState, useEffect, useMemo } from "react";
import { ClipboardCheck, Monitor, Car, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getExamSchedules } from "@/actions/exam-schedules.actions";

export function CheckinTab() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedSchool, setSelectedSchool] = useState("");
  
  const [schedules, setSchedules] = useState<any[]>([]);
  const [selectedScheduleId, setSelectedScheduleId] = useState<string>("");

  useEffect(() => {
    getExamSchedules('SH').then(res => {
      if (res.success && res.data && res.data.length > 0) {
        setSchedules(res.data);
        setSelectedScheduleId(res.data[0].id.toString());
      } else {
        loadData("");
      }
    });
  }, []);

  useEffect(() => {
    if (selectedScheduleId) {
      loadData(selectedScheduleId);
    }
  }, [selectedScheduleId]);

  const loadData = async (scheduleId: string) => {
    setLoading(true);
    try {
      const { getTestingStudents } = await import("@/actions/testing/students.actions");
      const res = await getTestingStudents(scheduleId);
      if (res.success && res.data) {
        setStudents(res.data);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const schools = useMemo(() => Array.from(new Set(students.map(s => s.school).filter(Boolean))), [students]);

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchSchool = selectedSchool ? s.school === selectedSchool : true;
      const term = search.toLowerCase();
      const matchSearch = term === "" || 
        (s.name && s.name.toLowerCase().includes(term)) ||
        (s.sbd && s.sbd.toString().includes(term)) ||
        (s.cccd && s.cccd.toString().includes(term));
      return matchSchool && matchSearch;
    });
  }, [students, search, selectedSchool]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <div className="p-2 bg-cyan-100 text-cyan-600 rounded-lg">
            <ClipboardCheck className="w-5 h-5" />
          </div>
          Check-in Thủ Công & Lịch Sử Quét
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-4">
            <Input className="w-full md:w-64 bg-slate-50 border-slate-200" placeholder="Nhập CCCD hoặc SBD..." />
            <Button className="gap-2 bg-cyan-600 hover:bg-cyan-700"><Monitor className="w-4 h-4" /> Check-in LT</Button>
            <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700"><Car className="w-4 h-4" /> Check-in TH</Button>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input 
                className="pl-9 bg-slate-50 border-slate-200" 
                placeholder="Tìm kiếm SBD, Tên, CCCD..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select 
              className="h-10 px-3 py-2 rounded-md border border-slate-200 bg-white text-sm"
              value={selectedSchool}
              onChange={(e) => setSelectedSchool(e.target.value)}
            >
              <option value="">Tất cả trường</option>
              {schools.map(s => <option key={s as string} value={s as string}>{s as string}</option>)}
            </select>
            <select 
              className="bg-white border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2 outline-none font-medium"
              value={selectedScheduleId}
              onChange={(e) => setSelectedScheduleId(e.target.value)}
            >
              {schedules.map(s => (
                <option key={s.id} value={s.id}>{s.title} ({s.exam_date})</option>
              ))}
            </select>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto max-h-[600px]">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold sticky top-0">
                  <tr>
                    <th className="p-4">STT</th>
                    <th className="p-4">Họ Tên</th>
                    <th className="p-4">SBD</th>
                    <th className="p-4">CCCD</th>
                    <th className="p-4">Nội dung SH</th>
                    <th className="p-4">Trường</th>
                    <th className="p-4">Giáo Viên</th>
                    <th className="p-4">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="p-10 text-center text-slate-400">Đang tải dữ liệu...</td>
                    </tr>
                  ) : filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-10 text-center text-slate-400">Không tìm thấy dữ liệu.</td>
                    </tr>
                  ) : (
                    filteredStudents.map((student, idx) => (
                      <tr key={student.cccd || idx} className="hover:bg-slate-50">
                        <td className="p-4 font-medium text-slate-500">{student.stt}</td>
                        <td className="p-4 font-bold text-slate-800">{student.name}</td>
                        <td className="p-4 font-medium">{student.sbd}</td>
                        <td className="p-4">{student.cccd}</td>
                        <td className="p-4 font-medium">{student.ndsh || "-"}</td>
                        <td className="p-4">{student.school}</td>
                        <td className="p-4">{student.gv || "-"}</td>
                        <td className="p-4">
                          <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-medium">Chưa check-in</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm text-center">
            <h3 className="text-slate-500 font-medium mb-2">Tổng số học viên</h3>
            <div className="text-4xl font-bold text-slate-800">{students.length}</div>
          </div>
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm text-center">
            <h3 className="text-slate-500 font-medium mb-2">Đã Hoàn Thành (DONE)</h3>
            <div className="text-4xl font-bold text-emerald-500">0</div>
          </div>
        </div>
      </div>
    </div>
  );
}
