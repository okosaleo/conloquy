import Image from "next/image";


export default function SignUpView() {
  return (
    <div className="flex flex-col items-center justify-center lg:w-1/2 w-full lg:h-screen h-fit">
        <div className="flex flex-col items-center justify-center">
            <div className="relative w-58 h-58">
          <Image src="/conloquy.png" alt="Conloquy " fill />
          </div>
          <p className="mt-[-77px] md:text-lg text-sm">Sign up to begin an immersive experience with AI</p>
        </div>
        <div></div>
    </div>
  )
}
