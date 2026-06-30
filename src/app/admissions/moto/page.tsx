import { getCoursesForAdmissions } from "@/actions/admissions";
import MotoAdmissionsClient from "@/components/admissions/MotoAdmissionsClient";

export default async function MotoAdmissionsPage() {
  const courses = await getCoursesForAdmissions('MOTO');
  return <MotoAdmissionsClient initialCourses={courses} />;
}
