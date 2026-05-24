import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title:
    "Vintage DTP | Urdu & Kashmiri Paper Formatting",

  description:
    "Professional Urdu and Kashmiri paper formatting service for schools, teachers, and coaching centers.",

  keywords: [
    "Urdu papers",
    "Kashmiri papers",
    "DTP",
    "Question papers",
    "Exam papers",
  ],

  authors: [
    {
      name: "Vintage DTP",
    },
  ],

  openGraph: {
    title:
      "Vintage DTP",

    description:
      "Professional Urdu and Kashmiri paper formatting service.",

    type: "website",

    url:
      "https://dtp-gules.vercel.app",
  },

  twitter: {
    card:
      "summary_large_image",

    title:
      "Vintage DTP",

    description:
      "Professional Urdu and Kashmiri paper formatting service.",
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
