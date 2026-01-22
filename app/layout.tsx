import type { Metadata } from "next";
import localFont from "next/font/local";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";

const pretendard = localFont({
  variable: "--font-pretendard",
  src: [
    { path: "../public/fonts/Pretendard-Thin.otf", weight: "100", style: "normal" },
    { path: "../public/fonts/Pretendard-ExtraLight.otf", weight: "200", style: "normal" },
    { path: "../public/fonts/Pretendard-Light.otf", weight: "300", style: "normal" },
    { path: "../public/fonts/Pretendard-Regular.otf", weight: "400", style: "normal" },
    { path: "../public/fonts/Pretendard-Medium.otf", weight: "500", style: "normal" },
    { path: "../public/fonts/Pretendard-SemiBold.otf", weight: "600", style: "normal" },
    { path: "../public/fonts/Pretendard-Bold.otf", weight: "700", style: "normal" },
    { path: "../public/fonts/Pretendard-ExtraBold.otf", weight: "800", style: "normal" },
  ],
});

const jetBrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Flow Planner",
  description: "Daily flow planner with bi-weekly calendar and automation board.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${pretendard.variable} ${jetBrainsMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
