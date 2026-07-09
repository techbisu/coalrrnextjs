import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Coalrr | Eastern Coalfields Limited",
  description: "Modern Next.js scaffold optimized for AI-powered development with Z.ai. Built with TypeScript, Tailwind CSS, and shadcn/ui.",
  keywords: ["Z.ai", "Next.js", "TypeScript", "Tailwind CSS", "shadcn/ui", "AI development", "React"],
  authors: [{ name: "Z.ai Team" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "Coalrr | Eastern Coalfields Limited",
    description: "AI-powered development with modern React stack",
    url: "https://chat.z.ai",
    siteName: "Z.ai",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Coalrr | Eastern Coalfields Limited",
    description: "AI-powered development with modern React stack",
  },
};

import { getMessages, getLocale } from "next-intl/server";
import { LanguageProvider } from "@/localization/providers/LanguageProvider";
import { QueryProvider } from "@/providers/QueryProvider";
import { AuthProvider } from "@/authorization/providers/AuthProvider";
import { UiStateProvider } from "@/providers/UiStateProvider";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const messages = await getMessages();
  const locale = await getLocale();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <QueryProvider>
          <AuthProvider>
            <UiStateProvider>
              <LanguageProvider messages={messages} locale={locale}>
                {children}
                <Toaster />
              </LanguageProvider>
            </UiStateProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
