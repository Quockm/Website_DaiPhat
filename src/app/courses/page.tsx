import CoursesClient from './CoursesClient';
import { getCourses } from '@/actions/courses';

export const dynamic = 'force-dynamic';

export default async function CoursesPage() {
  const courses = await getCourses();

  return (
    <div className="p-6 h-full overflow-y-auto bg-slate-50">
      <div className="w-full mx-auto space-y-6">
        <CoursesClient 
          initialCourses={courses} 
          title="Quản lý Khóa học" 
          description="Danh sách các khóa đào tạo lái xe và tiến độ tổng hợp." 
        />
      </div>
    </div>
  );
}
