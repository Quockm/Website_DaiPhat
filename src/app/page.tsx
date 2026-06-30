import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Car, GraduationCap, CalendarCheck } from "lucide-react";
import DashboardTable from "@/components/DashboardTable";
import { getCourses } from "@/actions/courses";

export const dynamic = 'force-dynamic';

export default async function Dashboard() {
  const initialCourses = await getCourses();
  
  const activeCourses = initialCourses.filter(c => c.status !== 'Đã bế giảng' && c.status !== 'Chưa khai giảng' && c.status !== 'Lên kế hoạch');
  const totalStudents = activeCourses.reduce((sum, c) => sum + (Number(c.hv) || 0), 0);
  const totalCars = activeCourses.reduce((sum, c) => sum + (Number(c.xe) || 0), 0);

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Tổng quan</h1>
        <p className="text-slate-600 mt-2 text-base font-medium">Theo dõi toàn bộ hoạt động của trung tâm đào tạo.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-white shadow-md border-slate-200 overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold text-slate-600 uppercase">Khóa Đang Mở</CardTitle>
            <div className="p-2 bg-blue-100 rounded-lg">
              <GraduationCap className="h-5 w-5 text-blue-700" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-3xl font-extrabold text-slate-800">{activeCourses.length}</div>
            <p className="text-sm font-medium text-blue-600 mt-1 flex items-center">
              Khóa học đang hoạt động
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-white shadow-sm border-slate-200 hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold text-slate-600 uppercase">Tổng Học Viên Đang Học</CardTitle>
            <div className="p-2 bg-green-100 rounded-lg">
              <Users className="h-5 w-5 text-green-700" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-3xl font-extrabold text-slate-800">{totalStudents}</div>
            <p className="text-sm font-medium text-slate-500 mt-1 flex items-center">
              Tổng số lượng học viên
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm border-slate-200 hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold text-slate-600 uppercase">Xe Đang Hoạt Động</CardTitle>
            <div className="p-2 bg-orange-100 rounded-lg">
              <Car className="h-5 w-5 text-orange-700" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-3xl font-extrabold text-slate-800">{totalCars}</div>
            <p className="text-sm font-medium text-orange-600 mt-1">
              Xe đang phân bổ cho các khóa
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-md border-slate-200 overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-4 bg-slate-50/80 border-b border-slate-100">
            <CardTitle className="text-sm font-bold text-slate-700 uppercase tracking-wider">Lịch sắp tới</CardTitle>
            <div className="p-2 bg-purple-100 rounded-lg">
              <CalendarCheck className="h-5 w-5 text-purple-700" />
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="text-3xl font-extrabold text-slate-800">{initialCourses.filter(c => c.status === 'Chưa khai giảng').length}</div>
            <p className="text-sm font-medium text-purple-600 mt-1">
              Khóa chờ khai giảng
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
