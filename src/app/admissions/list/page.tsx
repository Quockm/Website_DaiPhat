import { getNewlyCreatedCourses } from "@/actions/admissions";
import AdmissionsListClient from "@/components/admissions/AdmissionsListClient";

export default async function AdmissionsListPage() {
  const courses = await getNewlyCreatedCourses();
  return <AdmissionsListClient initialCourses={courses} />;
}
