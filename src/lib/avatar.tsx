import { createAvatar } from "@dicebear/core";
import { openPeeps, initials } from "@dicebear/collection";

interface Props {
    seed: string;
    variant: "openPeeps" | "initials"
}

export const generateAvatarUrl = ({seed, variant}: Props) => {
    let avatar;

    if (variant === "openPeeps") {
        avatar = createAvatar(openPeeps, {seed});
    } else {
        avatar = createAvatar(initials, {seed, fontWeight:500, fontSize: 42})
    }
    return avatar.toDataUri();
}