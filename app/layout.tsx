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
  title: "Vintage DTP | Urdu & Kashmiri Paper Formatting",

  description:
    "Get professional Urdu and Kashmiri question papers formatted accurately and delivered within 1 day for schools, teachers, and coaching centers.",

  openGraph: {
    title: "Vintage DTP | Urdu & Kashmiri Paper Formatting",
    description:
      "Professional Urdu and Kashmiri question paper formatting with 1 day delivery for schools, teachers, and coaching centers.",
    url: "https://dtp-gules.vercel.app",
    siteName: "Vintage DTP",
    images: [
      {
        url: "/opengraph-image.jpg",
        width: 1200,
        height: 630,
        alt: "Vintage DTP Urdu and Kashmiri Paper Formatting",
      },
    ],
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "Vintage DTP | Urdu & Kashmiri Paper Formatting",
    description:
      "Professional Urdu and Kashmiri question paper formatting with 1 day delivery.",
    images: ["/opengraph-image.jpg"],
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
