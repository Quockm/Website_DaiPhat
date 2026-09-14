import { getZaloQueue } from "@/actions/zalo";
import QueueClient from "./QueueClient";

export default async function OtoQueuePage() {
  const queue = await getZaloQueue();
  
  return (
    <div className="p-8 pb-20">
      <QueueClient initialQueue={queue} />
    </div>
  );
}
