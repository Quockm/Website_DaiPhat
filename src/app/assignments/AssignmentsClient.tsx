'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { ArrowLeft, Search, Users, Car, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { useState, useTransition } from "react";
import { AssignmentCourse, AssignmentTeacher, AssignmentCar, saveAssignment } from "@/actions/assignments";

export default function AssignmentsClient({
  initialCourses,
  initialTeachers,
  initialCars
}: {
  initialCourses: AssignmentCourse[];
  initialTeachers: AssignmentTeacher[];
  initialCars: AssignmentCar[];
}) {
  const [courses] = useState(initialCourses);
  const [teachers, setTeachers] = useState(initialTeachers);
  const [cars, setCars] = useState(initialCars);
  
  const [selectedCourse, setSelectedCourse] = useState<AssignmentCourse | null>(courses[0] || null);
  const [courseSearch, setCourseSearch] = useState("");
  const [teacherSearch, setTeacherSearch] = useState("");
  const [carSearch, setCarSearch] = useState("");
  const [trungTamFilter, setTrungTamFilter] = useState("Đại Phát");
  
  const [isPending, startTransition] = useTransition();
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Local state for checkboxes
  const [selectedTeacherIds, setSelectedTeacherIds] = useState<string[]>([]);
  const [selectedCarIds, setSelectedCarIds] = useState<string[]>([]);

  // When a course is selected, initialize the checkboxes based on their 'khoas' array
  const handleSelectCourse = (course: AssignmentCourse) => {
    setSelectedCourse(course);
    setSaveSuccess(false);
    
    const assignedTIds = teachers.filter(t => t.khoas.includes(course.id)).map(t => t.id);
    setSelectedTeacherIds(assignedTIds);
    
    const assignedCIds = cars.filter(c => c.khoas.includes(course.id)).map(c => c.id);
    setSelectedCarIds(assignedCIds);
  };

  // On mount, initialize the first course if available
  useState(() => {
    if (selectedCourse) {
      handleSelectCourse(selectedCourse);
    }
  });

  const toggleTeacher = (id: string) => {
    setSelectedTeacherIds(prev => 
      prev.includes(id) ? prev.filter(tid => tid !== id) : [...prev, id]
    );
    setSaveSuccess(false);
  };

  const toggleCar = (id: string) => {
    setSelectedCarIds(prev => 
      prev.includes(id) ? prev.filter(cid => cid !== id) : [...prev, id]
    );
    setSaveSuccess(false);
  };

  const handleSave = () => {
    if (!selectedCourse) return;
    
    startTransition(async () => {
      try {
        await saveAssignment(selectedCourse.id, selectedTeacherIds, selectedCarIds);
        
        // Update local state to reflect new assignments
        setTeachers(prev => prev.map(t => {
          let newKhoas = [...t.khoas];
          const isSelected = selectedTeacherIds.includes(t.id);
          const hasCourse = newKhoas.includes(selectedCourse.id);
          if (isSelected && !hasCourse) newKhoas.push(selectedCourse.id);
          else if (!isSelected && hasCourse) newKhoas = newKhoas.filter(k => k !== selectedCourse.id);
          return { ...t, khoas: newKhoas };
        }));
        
        setCars(prev => prev.map(c => {
          let newKhoas = [...c.khoas];
          const isSelected = selectedCarIds.includes(c.id);
          const hasCourse = newKhoas.includes(selectedCourse.id);
          if (isSelected && !hasCourse) newKhoas.push(selectedCourse.id);
          else if (!isSelected && hasCourse) newKhoas = newKhoas.filter(k => k !== selectedCourse.id);
          return { ...c, khoas: newKhoas };
        }));

        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } catch (e) {
        console.error("Save failed", e);
        alert("Lỗi khi lưu phân công!");
      }
    });
  };

  const filteredCourses = courses.filter(c => 
    (c.trungTam === trungTamFilter) &&
    (c.id.toLowerCase().includes(courseSearch.toLowerCase()) || 
    c.name.toLowerCase().includes(courseSearch.toLowerCase()))
  );
  
  const filteredTeachers = teachers.filter(t => {
    if (t.trungTam !== trungTamFilter) return false;
    
    // Only show if NOT assigned elsewhere OR if already assigned to this specific course
    const isAssignedElsewhere = t.khoas.some(k => k !== selectedCourse?.id);
    if (isAssignedElsewhere && !selectedTeacherIds.includes(t.id)) return false;

    return t.name.toLowerCase().includes(teacherSearch.toLowerCase()) || 
           t.id.toLowerCase().includes(teacherSearch.toLowerCase());
  });
  
  const filteredCars = cars.filter(c => {
    if (c.trungTam !== trungTamFilter) return false;
    
    // Only show if NOT assigned elsewhere OR if already assigned to this specific course
    const isAssignedElsewhere = c.khoas.some(k => k !== selectedCourse?.id);
    if (isAssignedElsewhere && !selectedCarIds.includes(c.id)) return false;

    return c.id.toLowerCase().includes(carSearch.toLowerCase());
  });

  return (
    <div className="space-y-6 h-[calc(100vh-120px)] flex flex-col">
      <div className="flex items-center justify-between">
        <div className="flex items-start gap-4">
          <Link href="/courses" className="mt-1 flex-shrink-0 p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-600">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Phân Công Nguồn Lực</h1>
            <p className="text-slate-600 mt-2 text-base font-medium">Gán Giáo viên và Xe tập lái cho các khóa học.</p>
          </div>
        </div>
        
        <select
          value={trungTamFilter}
          onChange={(e) => { 
            setTrungTamFilter(e.target.value); 
            const firstFilteredCourse = courses.find(c => c.trungTam === e.target.value);
            if (firstFilteredCourse) handleSelectCourse(firstFilteredCourse);
            else setSelectedCourse(null);
          }}
          className="px-4 py-2 border border-slate-300 rounded-xl text-sm font-bold bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
        >
          <option value="Đại Phát">Trung tâm Đại Phát</option>
          <option value="Tiến Thành">Trung tâm Tiến Thành</option>
        </select>
      </div>

      <div className="flex gap-6 flex-1 min-h-0">
        {/* Left Column: Courses */}
        <Card className="w-1/3 bg-white shadow-sm border-slate-200 flex flex-col">
          <CardHeader className="bg-slate-50/80 border-b border-slate-100 py-4 shrink-0">
            <CardTitle className="text-sm font-bold text-slate-700 uppercase">1. Chọn Khóa Học</CardTitle>
            <div className="relative mt-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Tìm mã/tên khóa..." 
                className="pl-9 pr-4 py-2 w-full border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" 
                value={courseSearch}
                onChange={e => setCourseSearch(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="p-4 overflow-y-auto custom-scrollbar flex-1 space-y-2">
            {filteredCourses.length === 0 ? (
               <div className="text-center text-slate-500 py-4 text-sm font-medium">Không tìm thấy khóa học</div>
            ) : filteredCourses.map(course => {
              const countT = teachers.filter(t => t.khoas.includes(course.id)).length;
              const countC = cars.filter(c => c.khoas.includes(course.id)).length;
              return (
                <div 
                  key={course.id} 
                  onClick={() => handleSelectCourse(course)}
                  className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${selectedCourse?.id === course.id ? 'border-indigo-600 bg-indigo-50 shadow-sm' : 'border-slate-100 hover:border-indigo-300'}`}
                >
                  <div className="font-extrabold text-slate-800 text-sm">[{course.id}]</div>
                  <div className="font-semibold text-slate-600 text-sm mt-1">{course.name}</div>
                  <div className="flex justify-between items-center mt-2 text-xs font-bold border-t border-slate-200 pt-2">
                    <span className="text-slate-500">Hạng: {course.type}</span>
                    <span className="text-red-600">HV: {course.hv}</span>
                    <span className="text-indigo-600">GV: {countT}</span>
                    <span className="text-orange-600">Xe: {countC}</span>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Right Column: Assignment Details */}
        <Card className="flex-1 bg-white shadow-sm border-slate-200 flex flex-col">
          <CardHeader className="bg-slate-50/80 border-b border-slate-100 py-4 shrink-0 flex flex-row justify-between items-center">
            <CardTitle className="text-sm font-bold text-slate-700 uppercase">
              2. Chi Tiết Phân Công: {selectedCourse ? selectedCourse.name : 'Chưa chọn'}
            </CardTitle>
            <button 
              onClick={handleSave}
              disabled={isPending || !selectedCourse}
              className={`px-6 py-2 rounded-lg font-bold transition-colors shadow-sm flex items-center gap-2 ${saveSuccess ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 disabled:cursor-not-allowed'}`}
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              {saveSuccess ? 'Đã Lưu Thành Công!' : 'Lưu Phân Công'}
            </button>
          </CardHeader>
          <CardContent className="p-0 flex-1 flex min-h-0">
            {/* Teachers List */}
            <div className="w-1/2 border-r border-slate-200 flex flex-col">
              <div className="bg-blue-50 text-blue-800 font-bold p-3 border-b border-slate-200 flex justify-between items-center">
                <span className="flex items-center gap-2"><Users className="w-4 h-4" /> GIÁO VIÊN</span>
                <span className="bg-white px-2 py-0.5 rounded-full text-xs shadow-sm">{selectedTeacherIds.length} Đã chọn</span>
              </div>
              <div className="p-3 border-b border-slate-200 shrink-0">
                <input 
                  type="text" 
                  placeholder="Tìm GV..." 
                  className="w-full px-3 py-1.5 border border-slate-300 rounded text-sm focus:outline-none focus:border-indigo-500" 
                  value={teacherSearch}
                  onChange={e => setTeacherSearch(e.target.value)}
                />
              </div>
              <div className="overflow-y-auto custom-scrollbar flex-1 p-2 space-y-1">
                {filteredTeachers.map(gv => {
                  const isChecked = selectedTeacherIds.includes(gv.id);
                  const isAssignedElsewhere = gv.khoas.some(k => k !== selectedCourse?.id);
                  return (
                    <label key={gv.id} className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${isChecked ? 'bg-indigo-50 border-indigo-200 shadow-sm' : 'hover:bg-slate-50 border-transparent hover:border-slate-200'}`}>
                      <input 
                        type="checkbox" 
                        checked={isChecked}
                        onChange={() => toggleTeacher(gv.id)}
                        disabled={!selectedCourse}
                        className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600" 
                      />
                      <div className="flex-1">
                        <div className="font-bold text-slate-800 flex justify-between">
                          <span>{gv.name}</span>
                          <span className="text-xs font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{gv.type}</span>
                        </div>
                        {isAssignedElsewhere && !isChecked && (
                           <div className="text-xs font-semibold text-amber-600 mt-1">Đang dạy: {gv.khoas.join(', ')}</div>
                        )}
                        {isChecked && (
                           <div className="text-xs font-bold text-indigo-600 mt-1">Sẽ dạy: {[...new Set([...gv.khoas, selectedCourse?.id])].filter(Boolean).join(', ')}</div>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Cars List */}
            <div className="w-1/2 flex flex-col bg-slate-50">
              <div className="bg-orange-50 text-orange-800 font-bold p-3 border-b border-slate-200 flex justify-between items-center">
                <span className="flex items-center gap-2"><Car className="w-4 h-4" /> XE TẬP LÁI</span>
                <span className="bg-white px-2 py-0.5 rounded-full text-xs shadow-sm">{selectedCarIds.length} Đã chọn</span>
              </div>
              <div className="p-3 border-b border-slate-200 shrink-0 bg-white">
                <input 
                  type="text" 
                  placeholder="Tìm Xe..." 
                  className="w-full px-3 py-1.5 border border-slate-300 rounded text-sm focus:outline-none focus:border-indigo-500" 
                  value={carSearch}
                  onChange={e => setCarSearch(e.target.value)}
                />
              </div>
              <div className="overflow-y-auto custom-scrollbar flex-1 p-2 space-y-1">
                {filteredCars.map(xe => {
                  const isChecked = selectedCarIds.includes(xe.id);
                  const isAssignedElsewhere = xe.khoas.some(k => k !== selectedCourse?.id);
                  return (
                    <label key={xe.id} className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all shadow-sm ${isChecked ? 'bg-orange-50 border-orange-200' : 'bg-white border-slate-200 hover:border-orange-300'}`}>
                      <input 
                        type="checkbox" 
                        checked={isChecked}
                        onChange={() => toggleCar(xe.id)}
                        disabled={!selectedCourse}
                        className="mt-1 h-4 w-4 rounded border-slate-300 text-orange-600 focus:ring-orange-600" 
                      />
                      <div className="flex-1">
                        <div className="font-extrabold text-red-700 text-sm flex justify-between">
                          <span>{xe.id}</span>
                          <span className="text-xs font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{xe.type}</span>
                        </div>
                        {isAssignedElsewhere && !isChecked && (
                           <div className="text-xs font-semibold text-amber-600 mt-1">Đang gắn: {xe.khoas.join(', ')}</div>
                        )}
                        {isChecked && (
                           <div className="text-xs font-bold text-orange-600 mt-1">Sẽ gắn: {[...new Set([...xe.khoas, selectedCourse?.id])].filter(Boolean).join(', ')}</div>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          </CardContent>
          {selectedCourse && (
            <div className="p-3 bg-amber-50 border-t border-amber-200 flex items-center gap-2 text-sm font-bold text-amber-800">
              <AlertCircle className="w-4 h-4" /> Khóa {selectedCourse.id} có {selectedCourse.hv} học viên. Đã chọn {selectedTeacherIds.length} GV và {selectedCarIds.length} Xe.
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
