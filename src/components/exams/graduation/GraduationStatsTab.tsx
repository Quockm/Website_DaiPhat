"use client";

import React, { useState, useEffect } from "react";
import { BarChart3, Users, CheckCircle2, XCircle } from "lucide-react";
import { getGraduationStudents } from "@/actions/graduation/graduation.actions";

export function GraduationStatsTab() {
  const [stats, setStats] = useState({
    total: 0,
    eligible: 0,
    passed: 0,
    failed: 0,
  });

  const loadData = async () => {
    const res = await getGraduationStudents();
    if (res.success && res.data) {
      const students = res.data;
      setStats({
        total: students.length,
        eligible: students.filter((s: any) => s.has_5_pdf_lt && s.has_file_dat && s.has_file_mp).length,
        passed: students.filter((s: any) => s.kq_final === 'ĐẠT').length,
        failed: students.filter((s: any) => s.kq_final === 'RỚT').length,
      });
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
        <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
          <BarChart3 className="w-5 h-5" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">Thống kê Tốt nghiệp</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-blue-100 text-blue-600 rounded-full">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Tổng Học Viên</p>
            <h3 className="text-2xl font-bold text-slate-800">{stats.total}</h3>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-indigo-100 text-indigo-600 rounded-full">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Đủ điều kiện thi</p>
            <h3 className="text-2xl font-bold text-slate-800">{stats.eligible}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-emerald-100 text-emerald-600 rounded-full">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Thi Đạt</p>
            <h3 className="text-2xl font-bold text-slate-800">{stats.passed}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-rose-100 text-rose-600 rounded-full">
            <XCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Thi Rớt</p>
            <h3 className="text-2xl font-bold text-slate-800">{stats.failed}</h3>
          </div>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-64 flex items-center justify-center">
        <p className="text-slate-400">Biểu đồ thống kê chi tiết (Chưa có dữ liệu)</p>
      </div>
    </div>
  );
}
