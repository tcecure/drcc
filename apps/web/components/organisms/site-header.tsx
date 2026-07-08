import Link from "next/link";

import { Logo } from "@/components/atoms/logo";
import { ThemeToggle } from "@/components/atoms/theme-toggle";
import { MainNav } from "@/components/molecules/main-nav";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex min-h-20 w-full max-w-6xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <Logo />
          <div className="lg:hidden">
            <ThemeToggle />
          </div>
        </div>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <MainNav />
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className={cn(buttonVariants({ variant: "ghost" }))}
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className={cn(buttonVariants({ variant: "outline" }))}
            >
              Sign up
            </Link>
            <Link
              href="/request-access"
              className={cn(buttonVariants({ variant: "default" }))}
            >
              Request access
            </Link>
            <div className="hidden lg:block">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
