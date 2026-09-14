import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getTeachers } from "@/actions/teachers";
import { getCars } from "@/actions/cars";
import StaffInfoClient from "./StaffInfoClient";

export const dynamic = "force-dynamic";

export default async function StaffInfoPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  // Fetch ALL teachers (for listing)
  const teachersRes = await getTeachers(1, 1000, "", "all", "all", "Đại Phát", "all", false);
  
  // Fetch ALL cars (for assignment dropdown & viewing)
  const carsRes = await getCars(1, 1000, "", "all", "all", "all", "Đại Phát", "docs");

  return (
    <StaffInfoClient 
      initialTeachers={teachersRes.data}
      initialCars={carsRes.data}
    />
  );
}
