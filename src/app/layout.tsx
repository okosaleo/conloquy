import type { Metadata } from "next";
import { Parkinsans } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { TRPCReactProvider } from "@/trpc/client";
import { NuqsAdapter} from "nuqs/adapters/next";

const parkinsans = Parkinsans({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Conloquy",
  description: "Conloquy",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <NuqsAdapter>
    <TRPCReactProvider>
    <html lang="en">
      <body
        className={`${parkinsans.className} antialiased`}
      >
        {children}
        <Toaster richColors position="top-center" />
      </body>
    </html>
    </TRPCReactProvider>
    </NuqsAdapter>
  );
}
