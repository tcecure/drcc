import type { Metadata } from "next";

import { ThemeProvider } from "@/components/atoms/theme-provider";
import { SiteShell } from "@/components/templates/site-shell";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://my.digitalrcc.com"),
  title: {
    default: "DigitalRCC Lab Companion",
    template: "%s | DigitalRCC",
  },
  description:
    "DigitalRCC lab companion for student access requests, queue placement, 14-day hands-on lab windows, progress tracking, and digital lab guides.",
  openGraph: {
    title: "DigitalRCC Lab Companion",
    description:
      "Student lab access, queue tracking, guided progress, and digital lab guides.",
    url: "/",
    siteName: "DigitalRCC",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className="h-full antialiased"
    >
      <body className="flex min-h-full flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SiteShell>{children}</SiteShell>
        </ThemeProvider>
      </body>
    </html>
  );
}
