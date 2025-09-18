"use client"
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

interface Props {
    title: string;
    description: string;
};

export const LoadingState = ({
    title,
    description
}: Props) => {
    return (
        <div className="py-4 px-8 flex flex-1 items-center justify-center bg-white">
            <div className="flex flex-col items-center justify-center gap-y-6 p-4 rounded-lg">
               <DotLottieReact
        src="/loading.lottie"
        className='w-[350px] h-[100px]'
        loop
        autoplay
      />
                <div className="flex flex-col gap-y-2 text-center">
                    <h6 className="text-lg font-medium">{title}</h6>
                    <p className="text-sm">{description}</p>
                </div>
            </div>
        </div>
    )
}