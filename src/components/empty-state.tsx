"use client"
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

interface Props {
    title: string;
    description: string;
    lottie?: string;
};

export const EmptyState = ({
    title,
    description,
    lottie = "/robot.lottie"
}: Props) => {
    return (
        <div className="flex flex-col items-center justify-center "> 
             <DotLottieReact
        src={lottie}
        className='w-[420px] h-[200px]'
        loop
        autoplay
      />
                <div className="flex flex-col gap-y-2 max-w-md mx-auto text-center ">
                    <h6 className="text-lg font-medium">{title}</h6>
                    <p className="md:text-sm text-xs text-center text-muted-foreground">{description}</p>
                </div>
        </div>
    )
}