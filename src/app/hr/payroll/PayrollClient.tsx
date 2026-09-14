"use client";

import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { StaffData } from "@/actions/hr";
import { ChamCongData, BangLuongData } from "@/actions/payroll";
import * as Tabs from "@radix-ui/react-tabs";
import { Save, FileSpreadsheet, ChevronLeft, ChevronRight, Calculator } from "lucide-react";

type Props = {
  staffs: StaffData[];
  initialMonth: number;
  initialYear: number;
  initialAttendance: ChamCongData[];
  initialPayroll: BangLuongData[];
};

export default function PayrollClient({ staffs, initialMonth, initialYear, initialAttendance, initialPayroll }: Props) {
  const [month, setMonth] = useState(initialMonth);
  const [year, setYear] = useState(initialYear);
  const [activeTab, setActiveTab] = useState("attendance");
  
  const [attendance, setAttendance] = useState<Record<number, any>>(
    initialAttendance.reduce((acc, curr) => ({ ...acc, [curr.NhanSuId]: JSON.parse(curr.ChiTietNgay || "{}") }), {})
  );

  const daysInMonth = new Date(year, month, 0).getDate();
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const handleDayClick = (staffId: number, day: number) => {
    // Cycle through: empty -> Đ -> N -> P -> K -> TC -> TS
    const current = attendance[staffId]?.[day];
    const sequence = [undefined, 'Đ', 'N', 'P', 'K', 'TC', 'TS'];
    const nextIdx = (sequence.indexOf(current) + 1) % sequence.length;
    
    setAttendance(prev => ({
      ...prev,
      [staffId]: {
        ...(prev[staffId] || {}),
        [day]: sequence[nextIdx]
      }
    }));
  };
  
  // Calculate aggregate
  const getAggregates = (staffId: number) => {
    const data = attendance[staffId] || {};
    let Đ = 0, N = 0, P = 0, K = 0, TC = 0, TS = 0;
    Object.values(data).forEach((val) => {
      if (val === 'Đ') Đ++;
      if (val === 'N') N += 0.5;
      if (val === 'P') P++;
      if (val === 'K') K++;
      if (val === 'TC') TC++;
      if (val === 'TS') TS++;
    });
    return { Đ, N, P, K, TC, TS, tong: Đ + N };
  };

  const handleSaveAttendance = async () => {
    const kyChamCong = `${month.toString().padStart(2, '0')}/${year}`;
    let successCount = 0;
    
    for (const staffIdStr of Object.keys(attendance)) {
      const staffId = parseInt(staffIdStr);
      const agg = getAggregates(staffId);
      const data = {
        chiTietNgay: attendance[staffId],
        TongDiLam: agg.Đ,
        TongNuaNgay: agg.N * 2, // store as 0.5 increment logic if needed, but it's fine
        TongNghiPhep: agg.P,
        TongKhongLuong: agg.K,
        TongTangCa: agg.TC,
        TongThaiSan: agg.TS,
      };
      const res = await import("@/actions/payroll").then(m => m.saveAttendance(kyChamCong, staffId, data));
      if (res.success) successCount++;
    }
    
    alert(`Đã lưu bảng công thành công cho ${successCount} nhân sự!`);
  };
  
  const handleCalculatePayroll = async () => {
    const kyLuong = `${month.toString().padStart(2, '0')}/${year}`;
    let successCount = 0;

    for (const staff of staffs) {
      const agg = getAggregates(staff.Id);
      const luongCB = staff.LuongCoBan || 0;
      const ngayChuan = 26; // TODO: configurable
      const luongTT = (luongCB / ngayChuan) * agg.tong;
      
      const bhxh = staff.TinhTrangBHXH ? luongCB * 0.08 : 0;
      const bhyt = staff.TinhTrangBHXH ? luongCB * 0.015 : 0;
      const bhtn = staff.TinhTrangBHXH ? luongCB * 0.01 : 0;
      
      // Currently allowance values are derived from state (not implemented yet, default to 0)
      const an = 0, dt = 0, xang = 0, hq = 0;
      const thucNhan = luongTT + an + dt + xang + hq - bhxh - bhyt - bhtn;

      const data = {
        LuongCoBan: luongCB,
        NgayCongThucTe: agg.tong,
        LuongThucTe: luongTT,
        KhauTru_BHXH: bhxh,
        KhauTru_BHYT: bhyt,
        KhauTru_BHTN: bhtn,
        ThucNhan: thucNhan
      };

      const res = await import("@/actions/payroll").then(m => m.savePayroll(kyLuong, staff.Id, data));
      if (res.success) successCount++;
    }

    alert(`Đã tính và lưu bảng lương cho ${successCount} nhân sự!`);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <Card className="flex-1 border-0 shadow-xl overflow-hidden flex flex-col">
        <Tabs.Root value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
          <div className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between shrink-0 gap-4">
            <Tabs.List className="flex gap-2">
              <Tabs.Trigger 
                value="attendance" 
                className="px-6 py-2.5 rounded-lg text-sm font-bold border-2 data-[state=active]:bg-indigo-50 data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-700 data-[state=inactive]:border-transparent data-[state=inactive]:text-slate-500 hover:text-indigo-600 transition-colors focus:outline-none"
              >
                BẢNG CHẤM CÔNG
              </Tabs.Trigger>
              <Tabs.Trigger 
                value="payroll" 
                className="px-6 py-2.5 rounded-lg text-sm font-bold border-2 data-[state=active]:bg-emerald-50 data-[state=active]:border-emerald-600 data-[state=active]:text-emerald-700 data-[state=inactive]:border-transparent data-[state=inactive]:text-slate-500 hover:text-emerald-600 transition-colors focus:outline-none"
              >
                BẢNG LƯƠNG TỔNG HỢP
              </Tabs.Trigger>
            </Tabs.List>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-slate-100 rounded-lg p-1 mr-4">
                <button onClick={() => setMonth(m => m === 1 ? 12 : m - 1)} className="p-1 hover:bg-white rounded text-slate-500 hover:text-slate-700"><ChevronLeft className="w-5 h-5" /></button>
                <div className="px-2 font-black text-slate-700 whitespace-nowrap min-w-[100px] text-center">Tháng {month}/{year}</div>
                <button onClick={() => setMonth(m => m === 12 ? 1 : m + 1)} className="p-1 hover:bg-white rounded text-slate-500 hover:text-slate-700"><ChevronRight className="w-5 h-5" /></button>
              </div>
              
              {activeTab === 'attendance' ? (
                <button onClick={handleSaveAttendance} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors shadow-sm">
                  <Save className="w-4 h-4" /> Lưu Bảng Công
                </button>
              ) : (
                <>
                  <button onClick={handleCalculatePayroll} className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white font-semibold rounded-lg hover:bg-slate-900 transition-colors shadow-sm">
                    <Calculator className="w-4 h-4" /> Tính Lương
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors shadow-sm">
                    <FileSpreadsheet className="w-4 h-4" /> Xuất Excel
                  </button>
                </>
              )}
            </div>
          </div>

          <CardContent className="p-0 flex-1 overflow-hidden">
            {/* BẢNG CHẤM CÔNG */}
            <Tabs.Content value="attendance" className="h-full focus:outline-none flex flex-col">
              <div className="bg-indigo-50/50 p-3 border-b border-indigo-100 text-xs font-semibold text-indigo-800 flex gap-6 shrink-0">
                <span><b className="text-indigo-600">Đ:</b> Đi làm cả ngày</span>
                <span><b className="text-amber-600">N:</b> Nửa ngày</span>
                <span><b className="text-blue-600">P:</b> Nghỉ phép</span>
                <span><b className="text-slate-500">K:</b> Không lương</span>
                <span><b className="text-rose-600">TC:</b> Tăng ca</span>
                <span><b className="text-pink-600">TS:</b> Thai sản</span>
                <span className="ml-auto text-slate-500 italic">Nhấp vào ô để thay đổi trạng thái</span>
              </div>
              
              <div className="flex-1 overflow-auto bg-slate-50/30">
                <table className="w-full text-left text-sm text-slate-600 border-collapse">
                  <thead className="bg-white sticky top-0 z-10 text-slate-700 font-extrabold text-xs shadow-sm">
                    <tr>
                      <th className="px-4 py-3 border-b border-r border-slate-200 sticky left-0 bg-white min-w-[200px]">Họ Tên</th>
                      {daysArray.map(day => (
                        <th key={day} className="px-1 py-3 text-center border-b border-r border-slate-200 min-w-[32px]">{day}</th>
                      ))}
                      <th className="px-3 py-3 text-center border-b border-slate-200 bg-indigo-50 text-indigo-700">TỔNG</th>
                    </tr>
                  </thead>
                  <tbody>
                    {staffs.map((staff, idx) => {
                      const agg = getAggregates(staff.Id);
                      return (
                        <tr key={staff.Id} className="border-b border-slate-100 hover:bg-indigo-50/30 bg-white transition-colors">
                          <td className="px-4 py-2 border-r border-slate-200 sticky left-0 bg-white shadow-[1px_0_0_0_#e2e8f0]">
                            <div className="font-bold text-slate-800">{staff.HoTen}</div>
                            <div className="text-[10px] font-semibold text-slate-400 mt-0.5">{staff.LoaiNhanSu} • Lương CB: {staff.LuongCoBan?.toLocaleString() || 0}đ</div>
                          </td>
                          {daysArray.map(day => {
                            const val = attendance[staff.Id]?.[day];
                            return (
                              <td 
                                key={day} 
                                onClick={() => handleDayClick(staff.Id, day)}
                                className="px-1 py-2 text-center border-r border-slate-100 cursor-pointer font-bold text-xs select-none hover:bg-indigo-100"
                              >
                                {val === 'Đ' && <span className="text-indigo-600">Đ</span>}
                                {val === 'N' && <span className="text-amber-600">N</span>}
                                {val === 'P' && <span className="text-blue-600">P</span>}
                                {val === 'K' && <span className="text-slate-400">K</span>}
                                {val === 'TC' && <span className="text-rose-600">TC</span>}
                                {val === 'TS' && <span className="text-pink-600">TS</span>}
                              </td>
                            )
                          })}
                          <td className="px-3 py-2 text-center bg-indigo-50/50 font-black text-indigo-800">
                            {agg.tong}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Tabs.Content>
            
            {/* BẢNG LƯƠNG */}
            <Tabs.Content value="payroll" className="h-full focus:outline-none flex flex-col">
              <div className="flex-1 overflow-auto bg-slate-50/30">
                <table className="w-full text-left text-sm text-slate-600 border-collapse whitespace-nowrap">
                  <thead className="bg-white sticky top-0 z-10 text-slate-700 font-extrabold text-xs shadow-sm">
                    <tr>
                      <th className="px-4 py-3 border-b border-r border-slate-200 sticky left-0 bg-white" rowSpan={2}>Họ Tên</th>
                      <th className="px-4 py-2 border-b border-r border-slate-200 text-center bg-slate-50" colSpan={3}>CÔNG & LƯƠNG CB</th>
                      <th className="px-4 py-2 border-b border-r border-slate-200 text-center bg-blue-50 text-blue-800" colSpan={4}>PHỤ CẤP</th>
                      <th className="px-4 py-2 border-b border-r border-slate-200 text-center bg-amber-50 text-amber-800" colSpan={3}>KHẤU TRỪ (LĐ đóng)</th>
                      <th className="px-4 py-3 border-b border-slate-200 text-right bg-emerald-100 text-emerald-800" rowSpan={2}>THỰC NHẬN</th>
                    </tr>
                    <tr>
                      <th className="px-3 py-2 border-b border-r border-slate-200 text-right bg-slate-50">Lương HĐ</th>
                      <th className="px-3 py-2 border-b border-r border-slate-200 text-center bg-slate-50">Ngày công</th>
                      <th className="px-3 py-2 border-b border-r border-slate-200 text-right bg-slate-50">Lương TT</th>
                      
                      <th className="px-3 py-2 border-b border-r border-slate-200 text-right bg-blue-50/50">Tiền ăn</th>
                      <th className="px-3 py-2 border-b border-r border-slate-200 text-right bg-blue-50/50">Điện thoại</th>
                      <th className="px-3 py-2 border-b border-r border-slate-200 text-right bg-blue-50/50">Xăng xe</th>
                      <th className="px-3 py-2 border-b border-r border-slate-200 text-right bg-blue-50/50">HQCV</th>
                      
                      <th className="px-3 py-2 border-b border-r border-slate-200 text-right bg-amber-50/50">BHXH 8%</th>
                      <th className="px-3 py-2 border-b border-r border-slate-200 text-right bg-amber-50/50">BHYT 1.5%</th>
                      <th className="px-3 py-2 border-b border-r border-slate-200 text-right bg-amber-50/50">BHTN 1%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {staffs.map((staff, idx) => {
                      const agg = getAggregates(staff.Id);
                      const luongCB = staff.LuongCoBan || 0;
                      const ngayChuan = 26; // TODO: configurable
                      const luongTT = (luongCB / ngayChuan) * agg.tong;
                      
                      // Example deductions (in real app, use initialPayroll or state)
                      const bhxh = staff.TinhTrangBHXH ? luongCB * 0.08 : 0;
                      const bhyt = staff.TinhTrangBHXH ? luongCB * 0.015 : 0;
                      const bhtn = staff.TinhTrangBHXH ? luongCB * 0.01 : 0;
                      
                      // Allowances (mocked as 0 for initial view unless set)
                      const an = 0, dt = 0, xang = 0, hq = 0;
                      
                      const thucNhan = luongTT + an + dt + xang + hq - bhxh - bhyt - bhtn;

                      return (
                        <tr key={staff.Id} className="border-b border-slate-100 hover:bg-slate-50 bg-white transition-colors">
                          <td className="px-4 py-2 border-r border-slate-200 sticky left-0 bg-white shadow-[1px_0_0_0_#e2e8f0]">
                            <div className="font-bold text-slate-800">{staff.HoTen}</div>
                            <div className="text-[10px] font-semibold text-slate-400">{staff.LoaiNhanSu}</div>
                          </td>
                          <td className="px-3 py-2 border-r border-slate-200 text-right font-medium">{luongCB.toLocaleString()}</td>
                          <td className="px-3 py-2 border-r border-slate-200 text-center font-bold">{agg.tong}</td>
                          <td className="px-3 py-2 border-r border-slate-200 text-right font-bold text-slate-700">{Math.round(luongTT).toLocaleString()}</td>
                          
                          <td className="px-3 py-2 border-r border-slate-200 text-right text-blue-700"><input type="number" className="w-20 text-right outline-none bg-transparent" placeholder="0" /></td>
                          <td className="px-3 py-2 border-r border-slate-200 text-right text-blue-700"><input type="number" className="w-20 text-right outline-none bg-transparent" placeholder="0" /></td>
                          <td className="px-3 py-2 border-r border-slate-200 text-right text-blue-700"><input type="number" className="w-20 text-right outline-none bg-transparent" placeholder="0" /></td>
                          <td className="px-3 py-2 border-r border-slate-200 text-right text-blue-700"><input type="number" className="w-20 text-right outline-none bg-transparent" placeholder="0" /></td>
                          
                          <td className="px-3 py-2 border-r border-slate-200 text-right text-amber-700">{Math.round(bhxh).toLocaleString()}</td>
                          <td className="px-3 py-2 border-r border-slate-200 text-right text-amber-700">{Math.round(bhyt).toLocaleString()}</td>
                          <td className="px-3 py-2 border-r border-slate-200 text-right text-amber-700">{Math.round(bhtn).toLocaleString()}</td>
                          
                          <td className="px-4 py-2 border-r border-slate-200 text-right font-black text-emerald-700 bg-emerald-50/30">
                            {Math.round(thucNhan).toLocaleString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Tabs.Content>
          </CardContent>
        </Tabs.Root>
      </Card>
    </div>
  );
}
