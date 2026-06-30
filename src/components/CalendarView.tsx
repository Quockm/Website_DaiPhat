"use client";

import { useState } from "react";
import { X } from "lucide-react";

type Course = {
  id: string;
  name: string;
  hangXe?: string;
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

export default function CalendarView({ initialCourses }: { initialCourses: Course[] }) {
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<{ course: Course, phase: string } | null>(null);
  
  const currentMonth = viewDate.getMonth();
  const currentYear = viewDate.getFullYear();
  
  const handlePrevMonth = () => setViewDate(new Date(currentYear, currentMonth - 1, 1));
  const handleNextMonth = () => setViewDate(new Date(currentYear, currentMonth + 1, 1));
  const handleToday = () => setViewDate(new Date());

  // Calendar logic
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Sunday
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const today = new Date();
  
  const parseDate = (dateStr: string) => {
    if (!dateStr || dateStr === '-') return null;
    const normalized = dateStr.replace(/-/g, '/');
    const parts = normalized.split('/');
    
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        // YYYY/MM/DD
        return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      }
      // DD/MM/YYYY
      return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    }
    
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) return d;
    return null;
  };

  const getStatusColor = (status: string) => {
    const s = status?.toLowerCase() || '';
    if (s.includes('chờ') || s.includes('sắp')) return 'bg-amber-100 text-amber-800 border-amber-300';
    if (s.includes('đang') || s.includes('đào tạo') || s.includes('học')) return 'bg-blue-100 text-blue-800 border-blue-300';
    if (s.includes('thi') || s.includes('sát hạch')) return 'bg-purple-100 text-purple-800 border-purple-300';
    if (s.includes('bế giảng') || s.includes('xong')) return 'bg-slate-100 text-slate-800 border-slate-300';
    return 'bg-slate-100 text-slate-800 border-slate-300';
  };

  const getEventsForDay = (day: number) => {
    const currentLoopDate = new Date(currentYear, currentMonth, day).getTime();
    let events: { course: Course; phase: string; color: string; statusText?: string }[] = [];

    initialCourses.forEach(course => {
      const kg = parseDate(course.khaiGiang)?.getTime();
      const bg = parseDate(course.beGiang)?.getTime();
      const thi = parseDate(course.satHach)?.getTime();
      const tn = parseDate((course as any).totNghiep)?.getTime();
      
      const isMoto = course.type === 'MOTO' || course.hangXe === 'A1' || course.hangXe === 'A';
      const hasDetailedPhases = !isMoto && course.lt?.bd && course.lt.bd !== '-';
      
      let dayPhases: { text: string; type: string }[] = [];

      if (kg === currentLoopDate) {
        dayPhases.push({ text: 'Khai giảng', type: 'kg' });
      }

      if (bg === currentLoopDate) {
        if (course.status === 'Đã bế giảng' || !hasDetailedPhases) {
          dayPhases.push({ text: 'Bế giảng', type: 'bg' });
        }
      }

      if (thi === currentLoopDate) {
        dayPhases.push({ text: 'Sát hạch', type: 'thi' });
      }

      if (tn === currentLoopDate) {
        dayPhases.push({ text: 'Tốt nghiệp', type: 'tn' });
      }

      if (hasDetailedPhases) {
        const ltBd = parseDate(course.lt?.bd)?.getTime();
        const ltKt = parseDate(course.lt?.kt)?.getTime();
        const shBd = parseDate(course.sh?.bd)?.getTime();
        const shKt = parseDate(course.sh?.kt)?.getTime();
        const cbBd = parseDate(course.cb?.bd)?.getTime();
        const cbKt = parseDate(course.cb?.kt)?.getTime();
        const datBd = parseDate(course.dat?.bd)?.getTime();
        const datKt = parseDate(course.dat?.kt)?.getTime();

        if (ltBd === currentLoopDate) dayPhases.push({ text: 'Bắt đầu học LT', type: 'lt' });
        if (ltKt === currentLoopDate) dayPhases.push({ text: 'Kết thúc học LT', type: 'lt' });
        if (shBd === currentLoopDate) dayPhases.push({ text: 'Bắt đầu học SH', type: 'sh' });
        if (shKt === currentLoopDate) dayPhases.push({ text: 'Kết thúc học SH', type: 'sh' });
        if (cbBd === currentLoopDate) dayPhases.push({ text: 'Bắt đầu học CB', type: 'cb' });
        if (cbKt === currentLoopDate) dayPhases.push({ text: 'Kết thúc học CB', type: 'cb' });
        if (datBd === currentLoopDate) dayPhases.push({ text: 'Bắt đầu chạy DAT', type: 'dat' });
        if (datKt === currentLoopDate) dayPhases.push({ text: 'Kết thúc chạy DAT', type: 'dat' });
      }

      if (dayPhases.length > 0) {
        let phaseNames = dayPhases.map(p => p.text);
        const types = dayPhases.map(p => p.type);
        
        let statusText = '';
        const milestones = ['kg', 'bg', 'thi', 'tn'];
        for (const ms of milestones) {
          if (types.includes(ms)) {
            if (ms === 'kg') statusText = 'Khai giảng';
            if (ms === 'bg') statusText = 'Bế giảng';
            if (ms === 'thi') statusText = 'Sát hạch';
            if (ms === 'tn') statusText = 'Tốt nghiệp';
            break;
          }
        }
        
        if (types.length > 1) {
          const milestoneTexts = ['Khai giảng', 'Bế giảng', 'Sát hạch', 'Tốt nghiệp'];
          phaseNames = phaseNames.filter(name => !milestoneTexts.includes(name));
        }

        const combinedText = phaseNames.join(' + ');
        let color = 'bg-slate-100 text-slate-800 border-slate-300';
        
        if (types.includes('thi')) color = 'bg-red-100 text-red-800 border-red-300 ring-1 ring-red-400 shadow-sm';
        else if (types.includes('tn')) color = 'bg-indigo-100 text-indigo-800 border-indigo-300 ring-1 ring-indigo-400 shadow-sm';
        else if (types.includes('dat')) color = 'bg-purple-100 text-purple-800 border-purple-300';
        else if (types.includes('sh')) color = 'bg-emerald-100 text-emerald-800 border-emerald-300';
        else if (types.includes('cb')) color = 'bg-orange-100 text-orange-800 border-orange-300';
        else if (types.includes('lt')) color = 'bg-blue-100 text-blue-800 border-blue-300';
        else if (types.includes('kg')) color = 'bg-amber-100 text-amber-800 border-amber-300 ring-2 ring-amber-400 shadow-sm';
        else if (types.includes('bg')) color = 'bg-slate-100 text-slate-500 border-slate-300 opacity-70 border-dashed border-2';

        events.push({ course, phase: combinedText, color, statusText });
      }
    });

    return events;
  };

  const daysOfWeek = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  const gridCells = [];
  
  // Empty cells for days before the 1st
  for (let i = 0; i < firstDayOfMonth; i++) {
    gridCells.push(<div key={`empty-${i}`} className="min-h-[120px] bg-slate-50 border border-slate-200"></div>);
  }
  
  // Actual days
  for (let d = 1; d <= daysInMonth; d++) {
    const isToday = today.getDate() === d && today.getMonth() === currentMonth && today.getFullYear() === currentYear;
    const events = getEventsForDay(d);
    
    gridCells.push(
      <div key={`day-${d}`} className={`min-h-[140px] border p-1 flex flex-col relative ${isToday ? 'bg-red-50/50 border-red-500 shadow-[inset_0_0_10px_rgba(239,68,68,0.2)] z-10' : 'bg-white border-slate-200'}`}>
        <div className={`text-right text-sm font-bold p-1 ${isToday ? 'text-red-600 flex justify-between items-center' : 'text-slate-600'}`}>
          {isToday && <span className="text-[10px] uppercase tracking-wider text-red-600 font-black ml-1 bg-red-100 px-2 py-0.5 rounded border border-red-200">Hôm nay</span>}
          <span className={isToday ? "bg-red-600 text-white rounded-full w-8 h-8 inline-flex items-center justify-center text-base shadow-sm" : ""}>
            {d}
          </span>
        </div>
        <div className="flex-1 flex flex-col gap-1 mt-1 overflow-y-auto custom-scrollbar">
          {events.map((evt, idx) => {
            const isMilestoneOnly = ['Khai giảng', 'Bế giảng', 'Sát hạch', 'Tốt nghiệp'].includes(evt.phase);
            const isKgOrBg = evt.statusText === 'Khai giảng' || evt.statusText === 'Bế giảng';

            return (
            <div 
              key={`${evt.course.id}-${evt.phase}-${idx}`} 
              onClick={() => setSelectedEvent(evt)}
              className={`relative p-1.5 rounded cursor-pointer transition-all ${evt.color} flex flex-col gap-1 border border-black/10`}
              title={`Nhấp để xem chi tiết Khóa ${evt.course.id}`}
            >
              <div className="flex items-center gap-1.5 relative z-10">
                <span className="bg-white/90 text-slate-900 px-1 py-0.5 rounded text-[10px] font-black uppercase shrink-0 min-w-[28px] text-center border border-black/10">
                  {evt.course.hangXe || evt.course.type}
                </span>
                <span className="truncate font-bold text-[11px] text-slate-900 flex-1">
                  {evt.course.id}
                </span>
                {evt.statusText === 'Khai giảng' && (
                  <span className="relative flex h-2 w-2 ml-auto shrink-0 mt-0.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                )}
                {evt.statusText === 'Bế giảng' && (
                  <span className="relative flex h-2 w-2 ml-auto shrink-0 mt-0.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600"></span>
                  </span>
                )}
              </div>
              <div className="flex flex-col mt-0.5 relative z-10">
                {!isMilestoneOnly && evt.phase && (
                  <span className={`text-[10px] font-bold text-slate-800`}>
                    {evt.phase}
                  </span>
                )}
                {evt.statusText && (
                  <span className={`text-[10px] font-bold text-slate-800 opacity-90 truncate bg-white/40 px-1 rounded inline-block w-fit mt-0.5`}>
                    - {evt.statusText}
                  </span>
                )}
              </div>
            </div>
          )})}
        </div>
      </div>
    );
  }

  // Fill the rest of the grid to complete the last row
  const totalCells = gridCells.length;
  const cellsToAdd = (7 - (totalCells % 7)) % 7;
  for (let i = 0; i < cellsToAdd; i++) {
    gridCells.push(<div key={`empty-end-${i}`} className="min-h-[120px] bg-slate-50 border border-slate-200"></div>);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Lịch biểu Đào tạo</h1>
          <p className="text-slate-600 mt-2 text-base font-medium">Theo dõi tiến trình các khóa học theo từng ngày trong tháng.</p>
        </div>
        <div className="flex items-center gap-4 bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
          <button onClick={handlePrevMonth} className="px-3 py-1.5 rounded hover:bg-slate-100 text-slate-600 font-bold transition-colors">&larr;</button>
          <span className="cursor-pointer hover:underline font-bold text-slate-800 text-lg w-32 text-center" onClick={handleToday}>
            Tháng {currentMonth + 1}/{currentYear}
          </span>
          <button onClick={handleNextMonth} className="px-3 py-1.5 rounded hover:bg-slate-100 text-slate-600 font-bold transition-colors">&rarr;</button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
        {/* Days of week header */}
        <div className="grid grid-cols-7 bg-slate-100 border-b border-slate-200">
          {daysOfWeek.map((day, i) => (
            <div key={day} className={`py-3 text-center text-xs font-extrabold text-slate-600 uppercase tracking-wider ${i === 0 || i === 6 ? 'text-indigo-600 bg-indigo-50/50' : ''}`}>
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar Grid */}
        <div className="grid grid-cols-7 bg-slate-200 gap-px">
          {gridCells}
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col sm:flex-row gap-4 items-center justify-center text-sm flex-wrap">
        <span className="font-bold text-slate-700 mr-2">Màu sắc tiến trình:</span>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-amber-100 border border-amber-300"></div>
          <span className="text-slate-600 font-medium">Khai giảng</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-blue-100 border border-blue-300"></div>
          <span className="text-slate-600 font-medium">Lý thuyết</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-orange-100 border border-orange-300"></div>
          <span className="text-slate-600 font-medium">Cabin</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-emerald-100 border border-emerald-300"></div>
          <span className="text-slate-600 font-medium">Sa Hình (TH)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-purple-100 border border-purple-300"></div>
          <span className="text-slate-600 font-medium">DAT</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-red-100 border border-red-300"></div>
          <span className="text-slate-600 font-medium">Sát hạch</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-slate-100 border-2 border-dashed border-slate-300"></div>
          <span className="text-slate-600 font-medium">Bế giảng</span>
        </div>
      </div>
      {/* Course Detail Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-indigo-600 px-6 py-4 flex justify-between items-center text-white">
              <h3 className="font-bold text-lg">Chi tiết sự kiện</h3>
              <button 
                onClick={() => setSelectedEvent(null)}
                className="p-1 hover:bg-white/20 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-md font-bold text-sm border border-indigo-200">
                  {selectedEvent.course.hangXe || selectedEvent.course.type}
                </span>
                <h4 className="text-xl font-extrabold text-slate-800">{selectedEvent.course.id}</h4>
              </div>
              
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                  <span className="text-slate-500 font-medium text-sm">Sự kiện trên lịch:</span>
                  <span className="font-bold text-slate-800">{selectedEvent.phase}</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                  <span className="text-slate-500 font-medium text-sm">Trạng thái hiện tại:</span>
                  <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">{selectedEvent.course.status}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium text-sm">Số lượng Học viên:</span>
                  <span className="font-bold text-slate-800">{selectedEvent.course.hv} học viên</span>
                </div>
                {selectedEvent.course.type === 'OTO' && (
                  <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                    <span className="text-slate-500 font-medium text-sm">Số lượng Xe phân bổ:</span>
                    <span className="font-bold text-slate-800">{selectedEvent.course.xe} xe</span>
                  </div>
                )}
              </div>
              
              <div className="pt-2">
                <button 
                  onClick={() => setSelectedEvent(null)}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-lg transition-colors border border-slate-300"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
