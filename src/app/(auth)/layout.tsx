import Image from "next/image";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div>
         <div className=" flex lg:flex-row flex-col gap-4">
              <div className="relative lg:w-1/2 w-full lg:h-[110vh] h-[40vh]">
              <Image src="/signImage.jpg" alt="Sign In Image" fill className="object-cover  " />
            <div className="z-10 absolute top-4 left-1/2 transform -translate-x-1/2 md:block hidden">
            <Image 
              src="/C.png" 
              alt="Conloquy" 
              width={100} 
              height={100} 
              className="object-cover bg-white rounded-full" 
            />
          </div>
              </div>
              {children}
              
           </div> 
    </div>
  );
}
