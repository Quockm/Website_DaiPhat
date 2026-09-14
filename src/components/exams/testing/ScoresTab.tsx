"use client";

import React, { useState, useEffect, useMemo } from "react";
import { GraduationCap, Search, Printer, Bolt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { getExamSchedules } from "@/actions/exam-schedules.actions";

  const isRequired = (ndsh: string, type: 'lt' | 'hinh' | 'duong' | 'gplx', hang: string = "") => {
  if (type === 'gplx') return true;
  if (!ndsh) return true;

  const s = ndsh.toLowerCase();
  const hangLower = hang.toLowerCase();

  let hasLt = false;
  let hasHinh = false;
  let hasDuong = false;

  const isRetake = s.includes('lại') || s.includes('lai');
  if (isRetake) {
    const sClean = s.replace('lại', '').replace('lai', '');
    const checkSubject = (sub: string, singleChar: string) => {
      if (sClean.includes(sub)) return true;
      const regex = new RegExp('(^|[^\\p{L}])' + singleChar + '([^\\p{L}]|$)', 'u');
      return regex.test(sClean);
    };
    
    hasLt = checkSubject('lý thuyết', 'l') || sClean.includes('lt');
    hasHinh = checkSubject('hình', 'h');
    hasDuong = checkSubject('đường', 'đ') || checkSubject('đường', 'd');
  } else {
    hasLt = true;
    hasHinh = true;
    hasDuong = !hangLower.includes('a');
  }

  const subjects: string[] = [];
  if (hasLt) subjects.push('lt');
  if (hasHinh) subjects.push('hinh');
  if (hasDuong) subjects.push('duong');

  if (!subjects.includes(type)) return false;
  if (subjects[0] === type) return false;
  
  return true;
};

export function ScoresTab() {

  const [schedules, setSchedules] = React.useState<any[]>([]);
  const [selectedScheduleId, setSelectedScheduleId] = React.useState("");
  const [students, setStudents] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [schools, setSchools] = React.useState<string[]>([]);
  const [selectedSchool, setSelectedSchool] = React.useState("");




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

  const renderScoreCell = (student: any, type: 'lt' | 'hinh' | 'duong', scoreProp: string) => {
    if (!isRequired(student.ndsh, type, student.hang)) {
      return <div className="text-slate-300 italic text-xs">Miễn</div>;
    }
    const score = student[scoreProp];
    if (score === null || score === undefined || score === '') {
      return <div className="text-slate-400">-</div>;
    }
    return <div className="font-bold">{score}</div>;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <div className="p-2 bg-rose-100 text-rose-600 rounded-lg">
              <GraduationCap className="w-5 h-5" />
            </div>
            Quản Lý Điểm Học Viên
          </h2>
          <Button variant="outline" className="gap-2">
            <Printer className="w-4 h-4" /> In Danh Sách
          </Button>
          <Link href="/point" target="_blank">
            <Button className="gap-2 bg-rose-600 hover:bg-rose-700">
              <Bolt className="w-4 h-4 text-amber-300" /> NHẬP ĐIỂM
            </Button>
          </Link>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <Input 
            className="w-full md:w-60 bg-slate-50 border-slate-200" 
            placeholder="Tìm theo SBD, Tên, CCCD..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
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
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto max-h-[650px] relative">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold sticky top-0">
              <tr>
                <th className="p-4">STT</th>
                <th className="p-4">SBD</th>
                <th className="p-4">Họ Tên (CCCD)</th>
                <th className="p-4">Giáo Viên</th>
                <th className="p-4">Trường</th>
                <th className="p-4">Hạng</th>
                <th className="p-4">Nội dung SH</th>
                <th className="p-4 text-center border-l border-slate-200">Lý Thuyết</th>
                <th className="p-4 text-center">Hình</th>
                <th className="p-4 text-center border-r border-slate-200">Đường</th>
                <th className="p-4 text-center">K.Q Chung</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={11} className="p-10 text-center text-slate-400">Đang tải dữ liệu...</td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={11} className="p-10 text-center text-slate-400">Không tìm thấy dữ liệu.</td>
                </tr>
              ) : (
                filteredStudents.map((student, idx) => (
                  <tr key={student.cccd || idx} className="hover:bg-slate-50">
                    <td className="p-4 font-medium text-slate-500">{student.stt}</td>
                    <td className="p-4 font-bold text-slate-800">{student.sbd}</td>
                    <td className="p-4">
                      <div className="font-bold text-slate-800">{student.name}</div>
                      <div className="text-slate-500 text-xs">CCCD: {student.cccd}</div>
                    </td>
                    <td className="p-4">{student.gv || "-"}</td>
                    <td className="p-4 text-slate-600">{student.school}</td>
                    <td className="p-4 font-bold text-slate-700">{student.hang || "-"}</td>
                    <td className="p-4 font-medium">{student.ndsh || "-"}</td>
                    <td className="p-4 text-center border-l border-slate-100">
                      {renderScoreCell(student, 'lt', 'score_lt')}
                    </td>
                    <td className="p-4 text-center bg-slate-50/50">
                      {renderScoreCell(student, 'hinh', 'score_hinh')}
                    </td>
                    <td className="p-4 text-center border-r border-slate-100">
                      {renderScoreCell(student, 'duong', 'score_duong')}
                    </td>
                    <td className="p-4 text-center">
                      {student.kq_final ? (
                         <span className={`px-2 py-1 rounded-md text-xs font-bold ${
                           student.kq_final === 'ĐẠT' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                         }`}>
                           {student.kq_final}
                         </span>
                      ) : (
                         <span className="text-slate-400 italic text-xs">Đang thi...</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
