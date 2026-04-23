import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import CONFIG from "@/config/appConfig";
import { Toaster } from "react-hot-toast";
import ErrorModal from "@/components/common/ErrorModal";
import AppThemeProvider from "@/components/common/AppThemeProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: `${CONFIG.appName} — ${CONFIG.titleSuffix}`,
  description: CONFIG.appDescription,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body suppressHydrationWarning className="min-h-full flex flex-col">
        <AppThemeProvider>
          <Toaster position="bottom-right" reverseOrder={false} />
          <ErrorModal />
          {children}
        </AppThemeProvider>
      </body>
    </html>
  );
}
