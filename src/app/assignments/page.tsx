import { getAssignmentData } from "@/actions/assignments";
import AssignmentsClient from "./AssignmentsClient";

export const dynamic = 'force-dynamic';

export default async function AssignmentsPage() {
  const { courses, teachers, cars } = await getAssignmentData();

  return (
    <AssignmentsClient 
      initialCourses={courses}
      initialTeachers={teachers}
      initialCars={cars}
    />
  );
}
