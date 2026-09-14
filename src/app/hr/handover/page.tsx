import { getCars } from "@/actions/cars";
import { getTeachers } from "@/actions/teachers";
import HrHandoverClient from "./HrHandoverClient";

export default async function HrHandoverPage({ searchParams }: { searchParams: Promise<any> }) {
  const resolvedParams = await searchParams;
  // Fetch cars where TrangThaiBanGiao === 'Đã bàn giao'
  const initialCars = await getCars(1, 50, resolvedParams?.q || "", "all", "handover", "all", "Đại Phát", "docs");
  const initialTeachers = await getTeachers(1, 50, resolvedParams?.q || "", "all", "all", "Đại Phát", "Giáo viên", true);
  
  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <HrHandoverClient 
        initialCars={initialCars.data}
        initialCarTotal={initialCars.totalRecords}
        initialCarPages={initialCars.totalPages}
        initialTeachers={initialTeachers.data}
        initialTeacherTotal={initialTeachers.totalRecords}
        initialTeacherPages={initialTeachers.totalPages}
      />
    </div>
  );
}
