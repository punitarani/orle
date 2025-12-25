import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { CommandSearch } from "@/components/layout/command-search";
import {
  GithubLink,
  HeaderSidebarTrigger,
} from "@/components/layout/header-actions";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Providers } from "@/components/providers";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export const metadata: Metadata = {
  title: "orle.dev - Developer Tools",
  description:
    "100+ developer tools that run entirely in your browser. No data leaves your machine.",
  keywords: [
    "developer tools",
    "base64",
    "json",
    "uuid",
    "hash",
    "encode",
    "decode",
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const defaultSidebarOpen = true;

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} font-sans antialiased`}
      >
        <Providers>
          <SidebarProvider defaultOpen={defaultSidebarOpen}>
            <AppSidebar />
            <SidebarInset>
              <header className="sticky top-0 z-10 flex h-14 items-center gap-2 border-b bg-gradient-to-b from-background/95 via-background/80 to-background/60 px-4 backdrop-blur">
                <HeaderSidebarTrigger />
                <Link
                  href="/"
                  className="flex items-center gap-2 text-sm font-semibold sm:hidden"
                >
                  <Image
                    src="/logo.png"
                    alt="orle.dev logo"
                    width={24}
                    height={24}
                    className="size-6 rounded-md"
                  />
                  <span>orle.dev</span>
                </Link>
                <div className="flex-1">
                  <CommandSearch />
                </div>
                <GithubLink />
                <ThemeToggle />
              </header>
              <main className="flex-1 p-6">{children}</main>
            </SidebarInset>
          </SidebarProvider>
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}
