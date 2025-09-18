import Image from "next/image";

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div>
         <div className=" flex lg:flex-row flex-col gap-4">
              <div className="relative lg:w-1/2 w-full lg:h-[110vh] h-[40vh]">
              <Image src="/signImage.jpg" alt="Sign In Image" fill className="object-cover  " />
            
              </div>
              {children}
              
           </div> 
    </div>
  );
}
