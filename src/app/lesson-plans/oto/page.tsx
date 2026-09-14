import LessonPlansClient from "./LessonPlansClient";
import { getCoursesWithCategory } from "@/actions/students";

export const revalidate = 0;

export default async function OtoLessonPlansPage() {
  const courses = await getCoursesWithCategory();

  return <LessonPlansClient courses={courses} />;
}
