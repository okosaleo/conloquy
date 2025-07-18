"use client"
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";


export default function Home() {
  const { 
        data: session, 
    } = authClient.useSession() 
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const onSubmit = () => {
    authClient.signUp.email({
      email,
      name,
      password
    },  {
        onRequest: (ctx) => {
            //show loading
        },
        onSuccess: (ctx) => {
            window.alert("Success")
        },
        onError: (ctx) => {
            // display the error message
            window.alert(ctx.error.message);
        },
  });
}

if (session) {
  return (
    <div className="flex flex-col p-4 gap-y-4">
      <p>Logged on as {session.user.name}</p>
      <Button onClick={() => authClient.signOut()}>
        Sign Out
      </Button>
    </div>
  )
}

  return (
    <div className="text-4xl font-bold mt-20 text-center">
      <Input placeholder="name" value={name} onChange={(e) => setName(e.target.value)} />
       <Input placeholder="email" value={email} onChange={(e) => setEmail(e.target.value)}/>
      <Input placeholder="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}/>
      <Button onClick={onSubmit}>
        Create User
      </Button>
    </div>
  );
}
