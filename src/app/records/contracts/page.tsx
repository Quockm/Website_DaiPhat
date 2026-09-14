import ContractsClient from "./ContractsClient";
import { getCoursesForContracts } from "@/actions/contracts";

export const revalidate = 0;

export default async function ContractsPage() {
  const courses = await getCoursesForContracts();

  return <ContractsClient courses={courses} />;
}
