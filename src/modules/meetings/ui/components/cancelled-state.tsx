import { EmptyState } from "@/components/empty-state";


export default function CancelledState() {
  return (
    <div className="bg-white rounded-lg px-4 py-5 flex flex-col gap-y-8 items-center justify-center">
        <EmptyState title="Meeting cancelled" description="This meeting has been cancelled" />
        <div className="flex flex-col-reverse lg:flex-row lg:justify-center items-center gap-2 w-full"> 
             
        </div>
    </div>
  )
}
