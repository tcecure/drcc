import Link from "next/link";
import { ArrowRight, GraduationCap, ShieldCheck } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b bg-background">
      <div className="absolute inset-y-0 right-0 hidden w-1/2 opacity-70 lg:block">
        <div className="absolute inset-8 rounded-lg border bg-background/70 shadow-sm" />
        <div className="absolute top-20 right-28 flex size-28 items-center justify-center rounded-lg border bg-card text-primary shadow-sm">
          <ShieldCheck className="size-12" aria-hidden="true" />
        </div>
        <div className="absolute right-64 bottom-24 flex size-20 items-center justify-center rounded-lg border bg-card text-[oklch(0.46_0.14_195)] shadow-sm">
          <GraduationCap className="size-9" aria-hidden="true" />
        </div>
        <div className="absolute top-32 right-12 h-px w-80 rotate-12 bg-border" />
        <div className="absolute right-20 bottom-40 h-px w-72 -rotate-12 bg-border" />
      </div>
      <div className="mx-auto grid min-h-[620px] w-full max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
        <div className="relative flex flex-col gap-7">
          <h1 className="max-w-4xl text-4xl leading-tight font-semibold text-balance sm:text-6xl">
            Welcome to the Digital Resilience Community Clinic
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
            The Digital Resilience Community Clinic provides accessible
            cybersecurity education, hands-on technical experience, and guided
            security support for students, professionals, small businesses, and
            community organizations.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              href="/request-access"
              className={cn(buttonVariants({ size: "lg" }), "h-11 px-4")}
            >
              Request Access
              <ArrowRight data-icon="inline-end" />
            </Link>
            <Link
              href="/training"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "h-11 px-4",
              )}
            >
              Explore Training
            </Link>
            <Link
              href="/about"
              className={cn(
                buttonVariants({ variant: "ghost", size: "lg" }),
                "h-11 px-4",
              )}
            >
              Learn About the Clinic
            </Link>
          </div>
        </div>
        <div className="relative min-h-72 lg:min-h-[420px]" aria-hidden="true">
          <div className="absolute inset-0 rounded-lg border bg-card shadow-sm" />
          <div className="absolute inset-6 grid grid-cols-2 gap-4">
            {["Education", "Labs", "Support", "Readiness"].map((item) => (
              <div
                key={item}
                className="flex items-end rounded-md border bg-background p-4 text-sm font-medium text-muted-foreground"
              >
                {item}
              </div>
            ))}
          </div>
          <div className="absolute top-1/2 left-1/2 flex size-28 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-lg border bg-primary text-primary-foreground shadow-lg">
            <ShieldCheck className="size-12" />
          </div>
          <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full border border-primary/20" />
          <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full border border-[oklch(0.58_0.105_225/0.25)]" />
        </div>
      </div>
    </section>
  );
}
