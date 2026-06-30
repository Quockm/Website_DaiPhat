import { Plus, Download } from "lucide-react";
import StudentsClient from "./StudentsClient";
import { getStudents, getCourseList } from "@/actions/students";

export default async function StudentsPage() {
  const initialData = await getStudents(1, 50, "", "", "B");
  const courseList = await getCourseList();

  return (
    <div className="space-y-6">
      <div className="flex flex-col mb-4">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Hồ sơ Học viên</h1>
        <p className="text-slate-600 mt-2 text-base font-medium">Quản lý thông tin cá nhân và tiến độ của học viên.</p>
      </div>

      <StudentsClient 
        initialStudents={initialData.data} 
        initialTotal={initialData.totalRecords}
        initialCompleted={initialData.completedRecords}
        initialIncomplete={initialData.incompleteRecords}
        initialPages={initialData.totalPages}
        courseList={courseList}
      />
    </div>
  );
}
