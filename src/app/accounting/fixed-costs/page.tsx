import { getFixedCosts } from "@/actions/fixed-costs";
import FixedCostsClient from "./FixedCostsClient";

export default async function FixedCostsPage() {
  const initialCosts = await getFixedCosts();
  
  return (
    <div className="w-full">
      <FixedCostsClient initialCosts={initialCosts} />
    </div>
  );
}
