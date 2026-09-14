import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Car, GraduationCap, Briefcase, Activity } from "lucide-react";
import DashboardTable from "@/components/DashboardTable";
import { getCourses, getCurrentCapacity, getDashboardStats } from "@/actions/courses";

// Revalidate every 60 seconds (ISR) instead of force-dynamic to reduce DB load
export const revalidate = 60;

export default async function Dashboard() {
  const initialCourses = await getCourses();
  const currentCapacity = await getCurrentCapacity();
  const currentMotoCapacity = await getCurrentCapacity('Đại Phát', 'MOTO');
  const stats = await getDashboardStats();
  
  const activeCourses = initialCourses.filter(c => c.status !== 'Đã bế giảng' && c.status !== 'Chưa khai giảng' && c.status !== 'Lên kế hoạch');
  const totalStudents = initialCourses.reduce((sum, c) => sum + (Number(c.soHocVienDaNhap) || 0), 0);
  const allocatedCars = activeCourses.reduce((sum, c) => sum + (Number(c.xe) || 0), 0);
  const allocatedTeachers = activeCourses.reduce((sum, c) => sum + (Number(c.gv) || 0), 0);
  
  const unallocatedCars = Math.max(0, stats.totalCars - allocatedCars);
  const unallocatedTeachers = Math.max(0, stats.totalTeachers - allocatedTeachers);
  
  const maxCapacity = 1000;
  const capacityPercentage = Math.round((currentCapacity / maxCapacity) * 100);

  const maxMotoCapacity = 726;
  const capacityMotoPercentage = Math.round((currentMotoCapacity / maxMotoCapacity) * 100);

  return (
    <div className="space-y-6">
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Tổng quan</h1>
          <p className="text-slate-600 mt-2 text-base font-medium">Theo dõi toàn bộ hoạt động của trung tâm đào tạo.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex items-center gap-3 text-sm font-medium bg-white border border-slate-200 px-5 py-3 rounded-full shadow-sm">
            <Activity className="w-5 h-5 text-blue-600" />
            <span className="text-slate-600 hidden sm:inline-block">Lưu lượng OTO:</span>
            <span className="font-bold text-slate-800">{currentCapacity} <span className="text-slate-400 font-normal">/ {maxCapacity}</span></span>
            <div className="h-2 w-20 sm:w-24 bg-slate-100 rounded-full overflow-hidden ml-2">
              <div 
                className={`h-full rounded-full ${capacityPercentage > 90 ? 'bg-red-500' : capacityPercentage > 75 ? 'bg-orange-500' : 'bg-green-500'}`} 
                style={{ width: `${Math.min(capacityPercentage, 100)}%` }}
              ></div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 text-sm font-medium bg-white border border-slate-200 px-5 py-3 rounded-full shadow-sm">
            <Activity className="w-5 h-5 text-purple-600" />
            <span className="text-slate-600 hidden sm:inline-block">Lưu lượng MOTO:</span>
            <span className="font-bold text-slate-800">{currentMotoCapacity} <span className="text-slate-400 font-normal">/ {maxMotoCapacity}</span></span>
            <div className="h-2 w-20 sm:w-24 bg-slate-100 rounded-full overflow-hidden ml-2">
              <div 
                className={`h-full rounded-full ${capacityMotoPercentage > 90 ? 'bg-red-500' : capacityMotoPercentage > 75 ? 'bg-orange-500' : 'bg-purple-500'}`} 
                style={{ width: `${Math.min(capacityMotoPercentage, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-white shadow-md border-slate-200 overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-4 bg-slate-50/80 border-b border-slate-100">
            <CardTitle className="text-sm font-bold text-slate-700 uppercase tracking-wider">Khóa Đang Mở</CardTitle>
            <div className="p-2 bg-blue-100 rounded-lg">
              <GraduationCap className="h-5 w-5 text-blue-700" />
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="text-3xl font-extrabold text-slate-800">{activeCourses.length}</div>
            <p className="text-sm font-medium text-slate-500 mt-1">
              Khóa học đang hoạt động
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-white shadow-md border-slate-200 overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-4 bg-slate-50/80 border-b border-slate-100">
            <CardTitle className="text-sm font-bold text-slate-700 uppercase tracking-wider">Tổng Học Viên</CardTitle>
            <div className="p-2 bg-green-100 rounded-lg">
              <Users className="h-5 w-5 text-green-700" />
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="text-3xl font-extrabold text-slate-800">{totalStudents}</div>
            <p className="text-sm font-medium text-slate-500 mt-1">
              Học viên đã đào tạo
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-md border-slate-200 overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-4 bg-slate-50/80 border-b border-slate-100">
            <CardTitle className="text-sm font-bold text-slate-700 uppercase tracking-wider">Xe Phân Bổ</CardTitle>
            <div className="p-2 bg-orange-100 rounded-lg">
              <Car className="h-5 w-5 text-orange-700" />
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="text-3xl font-extrabold text-slate-800">{allocatedCars}</div>
            <p className="text-sm font-medium text-slate-500 mt-1">
              Chưa phân bổ: <span className="font-bold text-orange-600">{unallocatedCars} xe</span>
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-md border-slate-200 overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-4 bg-slate-50/80 border-b border-slate-100">
            <CardTitle className="text-sm font-bold text-slate-700 uppercase tracking-wider">GV Phân Bổ</CardTitle>
            <div className="p-2 bg-purple-100 rounded-lg">
              <Briefcase className="h-5 w-5 text-purple-700" />
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="text-3xl font-extrabold text-slate-800">{allocatedTeachers}</div>
            <p className="text-sm font-medium text-slate-500 mt-1">
              Chưa phân bổ: <span className="font-bold text-purple-600">{unallocatedTeachers} GV</span>
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-1 lg:col-span-7">
          <DashboardTable initialCourses={initialCourses} />
        </div>
      </div>
    </div>
  );
}
