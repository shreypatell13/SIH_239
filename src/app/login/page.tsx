"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ShieldCheck,
  User,
  Settings,
  Activity,
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  Loader2,
  Sparkles,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const DEMO_PERSONAS = [
  {
    role: "APPLICANT",
    title: "Applicant Persona",
    name: "Ramesh Kumar Meena",
    email: "ramesh.meena@example.tribal.gov.in",
    password: "Demo@Applicant2026",
    icon: User,
    destination: "/applicant",
    badge: "Student",
    description: "Scheduled Tribe scholar applying for NFST / NOS fellowship",
  },
  {
    role: "VERIFICATION_OFFICER",
    title: "Officer Persona",
    name: "Priya Sharma",
    email: "priya.sharma@tribal.gov.in",
    password: "Demo@Officer2026",
    icon: ShieldCheck,
    destination: "/officer",
    badge: "Human-in-the-Loop",
    description: "Ministry case verification officer reviewing evidence dossiers",
  },
  {
    role: "SCHEME_ADMIN",
    title: "Scheme Administrator",
    name: "Rajesh Verma",
    email: "rajesh.verma@tribal.gov.in",
    password: "Demo@Admin2026",
    icon: Settings,
    destination: "/admin",
    badge: "Scheme Studio",
    description: "Policy manager configuring declarative schemes and rules",
  },
  {
    role: "OPERATIONS_DIRECTOR",
    title: "Operations Director",
    name: "Dr. Sunita Rao",
    email: "sunita.rao@tribal.gov.in",
    password: "Demo@Director2026",
    icon: Activity,
    destination: "/management",
    badge: "Control Tower",
    description: "Executive monitor tracking bottlenecks, SLAs and throughput",
  },
];

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleLogin(
    e?: React.FormEvent,
    customEmail?: string,
    customPass?: string,
    customDest?: string
  ) {
    if (e) e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    const submitEmail = customEmail || email;
    const submitPassword = customPass || password;
    const targetUrl = customDest || callbackUrl;

    if (!submitEmail || !submitPassword) {
      setErrorMessage("Please enter both email and password.");
      setIsLoading(false);
      return;
    }

    try {
      const result = await signIn("credentials", {
        email: submitEmail,
        password: submitPassword,
        redirect: false,
      });

      if (result?.error) {
        setErrorMessage("Invalid credentials. Please verify email and password.");
        setIsLoading(false);
      } else {
        window.location.href = targetUrl;
      }
    } catch {
      setErrorMessage("An unexpected authentication error occurred.");
      setIsLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 py-4">
      {/* Header */}
      <div className="space-y-2 text-center">
        <div className="shadow-xs inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600">
          <ShieldCheck className="h-3.5 w-3.5 text-gov-saffron" />
          <span>Server-Authoritative Authentication &amp; RBAC</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
          Sign In to TribalScholar AI
        </h1>
        <p className="text-sm text-slate-600">
          SIH Problem Statement 26239 &bull; Ministry of Tribal Affairs Scholarship Orchestrator
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Standard Credentials Form */}
        <div className="lg:col-span-5">
          <Card className="shadow-xs border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg">Credentials Login</CardTitle>
              <CardDescription className="text-xs">
                Enter your registered government or applicant credentials
              </CardDescription>
            </CardHeader>
            <form onSubmit={(e) => handleLogin(e)}>
              <CardContent className="space-y-4">
                {errorMessage && (
                  <div className="flex items-center gap-2 rounded-md border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="user@tribal.gov.in"
                      className="w-full rounded-md border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-gov-slate focus:outline-none focus:ring-1 focus:ring-gov-slate"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full rounded-md border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-gov-slate focus:outline-none focus:ring-1 focus:ring-gov-slate"
                    />
                  </div>
                </div>
              </CardContent>

              <CardFooter className="pt-2">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full gap-2 bg-gov-slate hover:bg-slate-800"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>

        {/* Demo Personas Quick Login */}
        <div className="space-y-4 lg:col-span-7">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-gov-saffron" />
              <h2 className="text-sm font-semibold text-slate-800">
                Hackathon Demo Personas (One-Click Login)
              </h2>
            </div>
            <Badge variant="outline" className="text-[11px]">
              Full NextAuth Verification
            </Badge>
          </div>
          <p className="text-xs text-slate-500">
            For demonstration and evaluation purposes, click any persona to authenticate through the
            standard bcrypt + JWT pipeline with their respective authoritative server role.
          </p>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {DEMO_PERSONAS.map((persona) => {
              const Icon = persona.icon;
              return (
                <Card
                  key={persona.role}
                  className="hover:shadow-xs flex flex-col justify-between border-slate-200 transition-all hover:border-gov-saffron"
                >
                  <CardHeader className="p-4 pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-100 text-gov-slate">
                        <Icon className="h-4 w-4" />
                      </div>
                      <Badge variant="secondary" className="text-[10px]">
                        {persona.badge}
                      </Badge>
                    </div>
                    <CardTitle className="mt-2 text-sm font-bold text-slate-900">
                      {persona.name}
                    </CardTitle>
                    <CardDescription className="line-clamp-2 text-[11px] text-slate-500">
                      {persona.description}
                    </CardDescription>
                  </CardHeader>
                  <CardFooter className="p-4 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isLoading}
                      onClick={() =>
                        handleLogin(undefined, persona.email, persona.password, persona.destination)
                      }
                      className="w-full gap-1.5 border-slate-300 text-xs hover:bg-slate-100"
                    >
                      <span>Sign in as {persona.role}</span>
                      <ArrowRight className="h-3 w-3" />
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin text-gov-slate" />
            <span>Loading login portal...</span>
          </div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
