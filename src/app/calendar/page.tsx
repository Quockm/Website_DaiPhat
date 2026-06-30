import CalendarView from "@/components/CalendarView";
import { getCourses } from "@/actions/courses";

export default async function CalendarPage() {
  const initialCourses = await getCourses();
  return (
    <CalendarView initialCourses={initialCourses} />
  );
}
