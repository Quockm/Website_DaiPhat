import CalendarView from "@/components/CalendarView";
import { getCourses } from "@/actions/courses";
import { getExamSchedules } from "@/actions/exam-schedules.actions";
import { getDats } from "@/actions/cars";

export default async function CalendarPage() {
  const initialCourses = await getCourses();
  const schedulesRes = await getExamSchedules();
  const initialSchedules = schedulesRes.success ? (schedulesRes.data || []) : [];
  
  const datRes = await getDats(1, 1000);
  const initialDats = datRes.data || [];
  
  return (
    <CalendarView initialCourses={initialCourses} initialSchedules={initialSchedules} initialDats={initialDats} />
  );
}
