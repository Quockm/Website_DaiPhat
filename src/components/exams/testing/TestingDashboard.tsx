"use client";

import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { UploadDataTab } from "./UploadDataTab";
import { ManageStudentsTab } from "./ManageStudentsTab";
import { QRManagementTab } from "./QRManagementTab";
import { PaymentTickTab } from "./PaymentTickTab";
import { ScoresTab } from "./ScoresTab";
import { CheckinTab } from "./CheckinTab";
import { PrintExportTab } from "./PrintExportTab";
import { StatsTab } from "./StatsTab";

export default function TestingDashboard() {
  const [activeTab, setActiveTab] = useState("data");

  return (
    <div className="p-6 w-full">
      <div className="mb-6 flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">ĐẠI PHÁT ADMIN</h1>
          <p className="text-slate-500 font-medium mt-1">Hệ thống Quản lý Tổ chức Thi Sát hạch</p>
        </div>
        <div className="flex gap-3">
          <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-sm font-semibold rounded-full flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            DB: Connected
          </span>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="flex gap-2 justify-start bg-transparent mb-6 h-auto p-1 bg-slate-200/50 rounded-xl inline-flex">
          <TabsTrigger value="data" className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm text-slate-600 rounded-lg px-6 py-2.5 font-semibold transition-all">Dữ liệu & Cấu hình</TabsTrigger>
          <TabsTrigger value="operations" className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm text-slate-600 rounded-lg px-6 py-2.5 font-semibold transition-all">Tổ chức Thi</TabsTrigger>
          <TabsTrigger value="students" className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm text-slate-600 rounded-lg px-6 py-2.5 font-semibold transition-all">Học viên & Điểm thi</TabsTrigger>
          <TabsTrigger value="reports" className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm text-slate-600 rounded-lg px-6 py-2.5 font-semibold transition-all">Báo cáo & In ấn</TabsTrigger>
        </TabsList>

        <Card className="border-0 shadow-xl bg-white/70 backdrop-blur-xl ring-1 ring-slate-900/5 rounded-2xl overflow-hidden min-h-[600px]">
          <CardContent className="p-6">
            <TabsContent value="data" className="mt-0 outline-none space-y-12">
              <UploadDataTab />
              <div className="border-t border-slate-200 pt-8"><QRManagementTab /></div>
            </TabsContent>
            
            <TabsContent value="operations" className="mt-0 outline-none space-y-12">
              <CheckinTab />
              <div className="border-t border-slate-200 pt-8"><PaymentTickTab /></div>
            </TabsContent>
            
            <TabsContent value="students" className="mt-0 outline-none space-y-12">
              <ManageStudentsTab />
              <div className="border-t border-slate-200 pt-8"><ScoresTab /></div>
            </TabsContent>
            
            <TabsContent value="reports" className="mt-0 outline-none space-y-12">
              <PrintExportTab />
              <div className="border-t border-slate-200 pt-8"><StatsTab /></div>
            </TabsContent>
          </CardContent>
        </Card>
      </Tabs>
    </div>
  );
}
