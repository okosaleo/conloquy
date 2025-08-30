import Link from "next/link"
import Image from "next/image";
import {
    CallControls,
    SpeakerLayout,
} from "@stream-io/video-react-sdk"
interface Props {
    onLeave: () => void;
    meetingName: string;
}

export default function CallActive({onLeave, meetingName}: Props) {
  return (
    <div className="flex flex-col justify-between p-4 h-full text-white">
        <div className="bg-[#101213] rounded-full p-4 flex items-center gap-4">
            <Link href="/" className="relative flex items-center justify-center p-1 bg-white/10 rounded-full w-fit">
             <Image src="/C.png" alt="Logo" className="object-cover rounded-full" fill/>
            </Link>
            <h4 className="text-base">{meetingName}</h4>
        </div>
        <SpeakerLayout />
        <div className="bg-[#101213] rounded-full px-4">
            <CallControls onLeave={onLeave} />
        </div>
    </div>
  )
}
