import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import type { Metadata } from "next";
import "./globals.css";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { CommandSearch } from "@/components/layout/command-search";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Providers } from "@/components/providers";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} font-sans antialiased`}
      >
        <Providers>
          <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
              <header className="sticky top-0 z-10 flex h-14 items-center gap-2 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <SidebarTrigger />
                <Separator orientation="vertical" className="h-6" />
                <div className="flex-1">
                  <CommandSearch />
                </div>
                <ThemeToggle />
              </header>
              <main className="flex-1 p-6">{children}</main>
            </SidebarInset>
          </SidebarProvider>
        </Providers>
      </body>
    </html>
  );
}
