import { getTeachers } from "@/actions/teachers";
import TeacherHandoverClient from "./TeacherHandoverClient";

export default async function TeacherHandoverPage({ searchParams }: { searchParams: Promise<any> }) {
  const resolvedParams = await searchParams;
  const initialTeachers = await getTeachers(1, 50, resolvedParams?.q || "", "all", "all", "Đại Phát", "Giáo viên");
  
  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <TeacherHandoverClient 
        initialTeachers={initialTeachers.data}
        initialTotal={initialTeachers.totalRecords}
        initialPages={initialTeachers.totalPages}
      />
    </div>
  );
}
