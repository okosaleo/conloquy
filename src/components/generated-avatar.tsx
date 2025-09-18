import { createAvatar } from "@dicebear/core";
import {openPeeps, initials} from '@dicebear/collection'
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { cn } from "@/lib/utils";

interface GeneratedAvatarProps {
    seed:string;
    className?: string;
    variant: "openPeeps" | 'initials';
}
export default function GeneratedAvatar({
    seed,
    className,
    variant
}: GeneratedAvatarProps) {
    let avatar;

    if(variant === 'openPeeps') {
        avatar = createAvatar(openPeeps, {
            seed
        })
    } else {
        avatar = createAvatar(initials, {
            seed,
            fontWeight: 500,
            fontSize: 42,
        })
    }
  return (
    <Avatar className={cn(className)}>
        <AvatarImage src={avatar.toDataUri()} alt="avatar" />
        <AvatarFallback>{seed.charAt(0).toUpperCase()}</AvatarFallback>
    </Avatar>
  )
}
