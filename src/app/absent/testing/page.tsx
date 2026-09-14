import { AbsentInventoryTab } from "@/components/absent/AbsentInventoryTab";

export default function AbsentTestingPage() {
  return (
    <div className="p-6 w-full min-h-screen bg-slate-50">
      <AbsentInventoryTab type="SH" title="Sát Hạch" />
    </div>
  );
}
