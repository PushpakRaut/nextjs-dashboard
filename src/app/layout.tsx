import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import "./globals.css";
import WakeNotice from "@/components/WakeNotice";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Invoice Dashboard",
  description: "Manage customers and invoices",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://api.fontshare.com" />
        <link href="https://api.fontshare.com/v2/css?f[]=general-sans@400,500,600&display=swap" rel="stylesheet" />
      </head>
      <body className={geistMono.variable}>
        {/* Ink pressed into the stock: offsets a shade wall into the letters, noise leaves it uneven */}
        <svg width="0" height="0" aria-hidden="true" style={{ position: "absolute" }}>
          <filter id="press">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="1" seed="4" result="n" />
            <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -0.7 1.15" result="mask" />
            <feComposite in="SourceGraphic" in2="mask" operator="in" result="ink" />
            <feOffset in="SourceAlpha" dx="0.6" dy="0.8" result="off" />
            <feComposite in="SourceAlpha" in2="off" operator="out" result="wall" />
            <feFlood floodColor="black" floodOpacity="0.25" />
            <feComposite in2="wall" operator="in" result="shade" />
            <feMerge><feMergeNode in="ink" /><feMergeNode in="shade" /></feMerge>
          </filter>
        </svg>
        <WakeNotice />
        {children}
      </body>
    </html>
  );
}
