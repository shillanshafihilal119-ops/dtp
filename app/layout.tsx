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
  "Vintage DTP | Urdu & Kashmiri Question Paper Formatting",

description:
  "Get Urdu and Kashmiri question papers professionally formatted with accurate layout, clean PDF delivery, and fast 1 day turnaround for teachers and schools.",

  openGraph: {
   title:
  "Vintage DTP | Urdu & Kashmiri Question Paper Formatting",
  description:
  "Professional Urdu and Kashmiri question paper formatting with clean PDFs, trusted service, and fast 1 day delivery.",
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
