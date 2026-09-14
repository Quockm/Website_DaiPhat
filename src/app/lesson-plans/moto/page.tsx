import MotoLessonPlansClient from "./MotoLessonPlansClient";
import { getCoursesWithCategory } from "@/actions/students";

export const revalidate = 0;

export default async function MotoLessonPlansPage() {
  const courses = await getCoursesWithCategory();

  return <MotoLessonPlansClient courses={courses} />;
}
