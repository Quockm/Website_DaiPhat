import { getCoursesForAdmissions } from "@/actions/admissions";
import OtoAdmissionsClient from "@/components/admissions/OtoAdmissionsClient";

export default async function OtoAdmissionsPage() {
  const courses = await getCoursesForAdmissions('OTO');
  return <OtoAdmissionsClient initialCourses={courses} />;
}
