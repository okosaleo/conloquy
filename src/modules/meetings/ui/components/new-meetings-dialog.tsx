import  ResponsiveDialog  from "@/components/responsive-dialog"

interface NewAgentDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}
export default function NewMeetingDialog({open, onOpenChange}: NewAgentDialogProps) {
  return (
    <ResponsiveDialog 
    title="New Meeting"
    description="Create a new meeting"
    open={open}
    onOpenChange={onOpenChange}
     >
todo
    </ResponsiveDialog>
  )
}
