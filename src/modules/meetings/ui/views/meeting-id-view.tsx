"use client";
import { ErrorState } from "@/components/error-state";
import { LoadingState } from "@/components/loading-state";
import { useTRPC } from "@/trpc/client"
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import MeetingIdViewHeader from "../components/meetings-id-view-header";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useConfirm } from "@/hooks/use-confirm";
import { useState } from "react";
import UpdateMeetingDialog from "../components/update-meetings-dialog";

interface Props {
    meetingId: string
}

export const MeetingIdView = ({ meetingId }: Props) => {
    const trpc = useTRPC();
    const queryClient = useQueryClient();
    const router = useRouter();
    const [UpdateMeetingDialogOpen, setUpdateMeetingDialogOpen] = useState(false);

    const [RemoveConfirmation, confirmRemove] = useConfirm(
        "Are you sure?",
        "The following action will remove this meeting"

    )
    const { data } = useSuspenseQuery(
        trpc.meetings.getOne.queryOptions({ id: meetingId }),
    )

    const removeMeeting = useMutation(
        trpc.meetings.remove.mutationOptions({
            onSuccess: () => {
                queryClient.invalidateQueries(trpc.meetings.getMany.queryOptions({}))

                router.push("/meetings")
            },
            onError: (error) => {
                toast.error(error.message)
            },
        })
    )

    const handleRemoveMeeting = async () => {
        const ok = await confirmRemove();

        if(!ok) return;

        await removeMeeting.mutateAsync({id: meetingId})
    }

    return (
     <>
     <RemoveConfirmation />
     <UpdateMeetingDialog 
     open={UpdateMeetingDialogOpen}
     onOpenChange={setUpdateMeetingDialogOpen}
     initialValues={data}
     />
      <div className="flex-1 py-4 px-4 md:px-8 flex flex-col gap-y-4">
        <MeetingIdViewHeader
        meetingId={meetingId}
        meetingName={data.name}
        onEdit={() => setUpdateMeetingDialogOpen(true)}
        onRemove={handleRemoveMeeting}

         />
        {JSON.stringify(data, null, 2)}
      </div>
     </>
    )
}


export const MeetingsIdViewLoading = () => {
    return (
        <LoadingState title="Loading Meeting" description='Please wait we&apos;re getting your meeting' />
    );
};

export const MeetingsIdViewError = () => {
    return (
        <ErrorState title='Error loading meeting' description='Something went wrong, we are sorry please contact customer support for more info' />
    );
};
