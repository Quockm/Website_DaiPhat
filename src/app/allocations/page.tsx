import { Suspense } from "react";
import { getCourses } from "@/actions/courses";
import AllocationsClient from "@/components/allocations/AllocationsClient";

export const dynamic = 'force-dynamic';

export default async function AllocationsPage() {
  const allCourses = await getCourses();
  
  // Filter active courses
  const courses = allCourses.filter(c => c.status !== 'Đã bế giảng' && c.status !== 'Chưa khai giảng');
  
  return (
    <div className="w-full py-6 space-y-6">
      <Suspense fallback={<div>Loading...</div>}>
        <AllocationsClient courses={courses} />
      </Suspense>
    </div>
  );
}
