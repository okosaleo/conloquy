"use client";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import Link from "next/link";
import { useRouter } from "next/navigation";



export default function HomeView() {
    const router = useRouter();
  const {data: session} = authClient.useSession();
  if(!session) { 
    return (
      <div className="flex flex-col p-4 gap-y-4">
        <p>You are not logged in. 🛌 Tips to Recover Faster</p>
        <Button asChild>
          <Link href="/sign-up">Sign Up</Link>
        </Button>
        <Button asChild>
          <Link href="/sign-in">Sign In</Link>
        </Button>
      </div>
    );
  }
  return (
    <div className="flex flex-col p-4 gap-y-4">
      <p>Logged in as {session?.user.name}.</p>
      <Button onClick={() => authClient.signOut({fetchOptions: {onSuccess: () => router.push("/sign-in")}})}>
        Sign Out
      </Button>
    </div>
  );
}
