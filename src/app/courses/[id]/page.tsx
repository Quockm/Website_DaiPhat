import { getCourseDetails } from "@/actions/courses";
import Link from "next/link";
import { ArrowLeft, Car, Users, Calendar, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = 'force-dynamic';

export default async function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const courseId = decodeURIComponent(resolvedParams.id);
  const details = await getCourseDetails(courseId);

  if (!details || !details.course) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500">
        <AlertCircle className="w-12 h-12 mb-4 text-slate-300" />
        <h2 className="text-xl font-bold">Không tìm thấy khóa học</h2>
        <p className="mb-6">Khóa học {courseId} không tồn tại hoặc đã bị xóa.</p>
        <Link href="/courses" className="text-indigo-600 font-semibold hover:underline">
          &larr; Quay lại danh sách
        </Link>
      </div>
    );
  }

  const { course, teachers, cars, students } = details;

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <Link href="/courses" className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-semibold mb-2 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Quay lại danh sách
          </Link>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-3">
            {course.TenKH} 
            <span className="text-sm px-2 py-1 bg-slate-100 text-slate-500 rounded border font-bold">[{course.MaKH}]</span>
          </h1>
          <p className="text-slate-600 mt-2 text-base font-medium">
            Hạng {course.HangXe} • {students.length} Học viên • Khai giảng: {course.KhaiGiang || 'Chưa rõ'}
          </p>
        </div>
        <Link href={`/allocations?courseId=${course.MaKH}`} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-semibold transition-colors shadow-sm">
          Thay đổi Phân Công &rarr;
        </Link>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Phân công Xe */}
        <Card className="bg-white shadow-md border-slate-200">
          <CardHeader className="bg-slate-50/80 border-b border-slate-100 pb-4 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Car className="h-5 w-5 text-orange-700" />
              </div>
              Xe Được Phân Công ({cars.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 p-0">
            <div className="divide-y divide-slate-100 max-h-[300px] overflow-y-auto custom-scrollbar">
              {cars.map(car => (
                <div key={car.id} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                  <div>
                    <span className="font-extrabold text-red-700 text-lg">{car.id}</span>
                    <div className="text-sm font-semibold text-slate-500">Hạng: {car.type}</div>
                  </div>
                  <div className="text-right text-xs text-slate-500 flex flex-col items-end">
                    <span>Hạn phí DAT: <strong className="text-slate-700">{car.hanPhiDAT}</strong></span>
                    <span>Hạn GPXTL: <strong className="text-slate-700">{car.hanGpxtl}</strong></span>
                  </div>
                </div>
              ))}
              {cars.length === 0 && (
                <p className="text-slate-500 text-center py-8 font-medium">Chưa có xe nào được phân công vào khóa này.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Phân công Giáo viên */}
        <Card className="bg-white shadow-md border-slate-200">
          <CardHeader className="bg-slate-50/80 border-b border-slate-100 pb-4 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <Users className="h-5 w-5 text-green-700" />
              </div>
              Giáo viên Được Phân Công ({teachers.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 p-0">
            <div className="divide-y divide-slate-100 max-h-[300px] overflow-y-auto custom-scrollbar">
              {teachers.map((teacher, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                  <div>
                    <span className="font-bold text-slate-800 text-base">{teacher.name}</span>
                    <div className="text-sm font-semibold text-slate-500">Hạng: {teacher.type}</div>
                  </div>
                  <div className="text-right text-xs text-slate-500">
                    Hạn GPLX: <strong className="text-slate-700">{teacher.hanGplx}</strong>
                  </div>
                </div>
              ))}
              {teachers.length === 0 && (
                <p className="text-slate-500 text-center py-8 font-medium">Chưa có giáo viên nào được phân công vào khóa này.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Danh sách học viên */}
      <Card className="bg-white shadow-md border-slate-200 mt-8">
        <CardHeader className="bg-slate-50/80 border-b border-slate-100 pb-4">
          <CardTitle className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-5 w-5 text-blue-700" />
            </div>
            Danh Sách Học Viên ({students.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto max-h-[500px] overflow-y-auto custom-scrollbar">
            <table className="w-full text-left text-sm text-slate-600 min-w-max">
              <thead className="bg-slate-50 text-slate-700 font-extrabold uppercase text-xs sticky top-0 shadow-sm border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">STT</th>
                  <th className="px-4 py-3">Họ và Tên</th>
                  <th className="px-4 py-3">Ngày Sinh</th>
                  <th className="px-4 py-3">SĐT</th>
                  <th className="px-4 py-3">CCCD</th>
                  <th className="px-4 py-3">Hạng ĐT</th>
                  <th className="px-4 py-3">Mã ĐK</th>
                  <th className="px-4 py-3">Đầu Mối</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((hs, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-400">{i + 1}</td>
                    <td className="px-4 py-3 font-bold text-slate-800">{hs.name}</td>
                    <td className="px-4 py-3 font-medium">{hs.dob}</td>
                    <td className="px-4 py-3 font-medium text-slate-700">{hs.sdt}</td>
                    <td className="px-4 py-3 font-medium text-slate-600">{hs.cccd}</td>
                    <td className="px-4 py-3 font-bold text-indigo-600">{hs.type}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{hs.maDk}</td>
                    <td className="px-4 py-3 font-semibold text-slate-700">{hs.dauMoi}</td>
                  </tr>
                ))}
                {students.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center py-10 text-slate-500 font-medium">Chưa có dữ liệu học viên trong khóa học này.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
