import { getPendingApprovalCourses } from "@/actions/admissions";
import ApprovalListClient from "@/components/admissions/ApprovalListClient";

export default async function ApprovalListPage() {
  const courses = await getPendingApprovalCourses();
  return <ApprovalListClient initialCourses={courses} />;
}
