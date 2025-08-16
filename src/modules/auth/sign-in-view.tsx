"use client";
import Image from "next/image";
import {z} from "zod";
import { zodResolver } from "@hookform/resolvers/zod"
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormLabel, FormMessage, FormItem } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Loader2, OctagonAlertIcon } from "lucide-react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { useState } from "react";
import { toast } from 'sonner';
import { useRouter } from "next/navigation";


const formSchema = z.object({
  email: z.email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
});

export default function SignInView() {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const [pending, setPending] = useState(false);
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    });


    const onSubmit = (data: z.infer<typeof formSchema>) => {
        setPending(true);
        setError(null);
     authClient.signIn.email({
            email: data.email,
            password: data.password,
            callbackURL: "/",
        },
    {
        onSuccess: () => {
            setPending(false);
            router.push("/");
            toast.success("Welcome Back User",{ description: "Sign in successful!"});
        },
         onError: ({error}) => {
            toast.error(error.message);
            setError(error.message);
            setPending(false)
        }
    },
);
    }

    const onSocial = (provider: "github" | "google") => {
            setPending(true);
            setError(null);
         authClient.signIn.social({
               provider: provider,
               callbackURL: "/",
            },
        {
            onSuccess: () => {
                setPending(false);
            },
             onError: ({error}) => {
                setPending(false);
                toast.error(error.message);
                setError(error.message);
            }
        },
    );
        }
  return (
     <div className="flex flex-col items-center justify-center lg:w-1/2 w-full">
            <div className="flex flex-col items-center justify-center">
                <div className="relative w-58 h-58 ">
              <Image src="/conloquy.png" alt="Conloquy " fill />
              </div>
              <p className="mt-[-77px] text-lg">Welcome back, Sign In to your account.</p>
            </div>
            <div className="lg:w-1/2 lg:p-0 w-full p-6">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="py-6 md:py-8 flex flex-col gap-4" >
                        <div className="flex flex-col gap-3">
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email</FormLabel>
                                        <FormControl>
                                            <Input type="email" placeholder="Enter your email" {...field} className="w-full"/>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Password</FormLabel>
                                        <FormControl>
                                            <Input type="password" placeholder="********" {...field} className="w-full"/>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                        </div>
                        {!!error && (
                            <Alert className="bg-destructive/10 border-none">
                                <OctagonAlertIcon className="h-4 w-4 !text-destructive" />
                                <AlertTitle>{error}</AlertTitle>
                            </Alert>
                        )}
                        <Button disabled={pending} type="submit" className="w-full bg-primary hover:bg-primary/90">
                        {pending ? (
                            <p className="flex items-center justify-center">
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Signing In...
                            </p>) 
                            : ("Sign In")}
                        </Button>
                        <div className="after:border-border relative text-center text-sm after:absolute after:top-1/2 after:inset-0 after:flex after:items-center after:border-t">
                            <span className="bg-card px-2 z-10 relative text-muted-foreground">Or continue with</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <Button 
                             onClick={() => onSocial("google")}
                            disabled={pending} variant="outline" type="button" className="w-full">
                                <Image src="/google.svg" alt="Google" width={20} height={20} className="mr-2" />
                                Google
                            </Button>
                            <Button 
                            onClick={() => onSocial("github")}
                             disabled={pending}
                             variant="outline"
                             type="button" className="w-full">
                                <Image src="/Github.svg" alt="GitHub" width={20} height={20} className="mr-2" />
                                GitHub
                            </Button>
                        </div>
                        <div className="text-center text-sm">
                            Don&apos;t have an account?{" "}<Link href="/sign-up" className="underline underline-offset-4">Sign up </Link></div>
                            <div className="text-muted-foreground *:[a]:hover:text-primary text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4">By clicking continue, you agree to our <a href="#">Terms of Service</a> and <a>Privacy Policy</a></div>
                    </form>
                </Form>
            </div>
        </div>
  )
}
