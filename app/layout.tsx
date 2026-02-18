import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "CORUS - OLSHCO Enrollment Portal",
    template: "%s | CORUS",
  },
  description: "OLSHCO's official online portal for enrollment, student records, grades, and college services",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`} style={{ colorScheme: "light" }}>
      <body
        className="min-h-screen bg-white text-foreground antialiased"
      >
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
