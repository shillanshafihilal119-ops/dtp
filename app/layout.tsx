import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ScrollToTop from "./components/scroll-to-top";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://dtp-gules.vercel.app"),

  title:
    "Vintage DTP | Urdu & Kashmiri Question Paper Formatting",

  description:
    "Professional Urdu and Kashmiri question paper formatting with clean PDFs and fast delivery.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <body className="min-h-screen bg-black text-white flex flex-col">

        <ScrollToTop />

        <script src="https://checkout.razorpay.com/v1/checkout.js" />

        <header className="border-b border-yellow-500/20 bg-black/90">

          <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">

            <a
  href="/"
  className="group"
>
  <h1 className="text-2xl font-bold text-yellow-500 transition group-hover:text-yellow-400">
    Vintage DTP
  </h1>

  <p className="text-sm text-gray-400">
    Urdu & Kashmiri Paper Formatting
  </p>
</a>

            <nav className="flex items-center gap-8">

              <a
                href="/"
                className="hover:text-yellow-400 transition"
              >
                Home
              </a>

              <a
                href="/track"
                className="hover:text-yellow-400 transition"
              >
                Track
              </a>

              <a
                href="/admin-login"
                className="bg-yellow-500 text-black px-4 py-2 rounded font-semibold hover:bg-yellow-400 transition"
              >
                Admin Login
              </a>

            </nav>

          </div>

        </header>

        <main className="flex-1 animate-fade-in">
          {children}
        </main>

        <footer className="border-t border-yellow-500/20 py-12">

          <div className="max-w-6xl mx-auto px-6">

            <div className="grid gap-10 md:grid-cols-3">

              <div>
                <h3 className="text-2xl font-bold text-yellow-500 mb-4">
                  Vintage DTP
                </h3>

                <p className="text-gray-300 leading-8">
                  Professional Urdu and Kashmiri question paper formatting service for teachers, schools, and coaching centers.
                </p>
              </div>

              <div>

                <h3 className="text-yellow-500 font-bold mb-4">
                  Quick Links
                </h3>

                <ul className="space-y-3">

                  <li>
                    <a
                      href="/#request-form"
                      className="hover:text-yellow-400 transition"
                    >
                      Submit Request
                    </a>
                  </li>

                  <li>
                    <a
                      href="/track"
                      className="hover:text-yellow-400 transition"
                    >
                      Track Request
                    </a>
                  </li>

                  <li>
                    <a
                      href="https://wa.me/917889410756"
                      target="_blank"
                      className="hover:text-yellow-400 transition"
                    >
                      Contact on WhatsApp
                    </a>
                  </li>

                </ul>

              </div>

              <div>

                <h3 className="text-yellow-500 font-bold mb-4">
                  Contact
                </h3>

                <ul className="space-y-3">

                  <li>
                    <a
                      href="https://wa.me/917889410756"
                      target="_blank"
                      className="hover:text-yellow-400 transition"
                    >
                      WhatsApp: 7889410756
                    </a>
                  </li>

                  <li>
                    <a
                      href="mailto:shillanshafihilal119@gmail.com"
                      className="hover:text-yellow-400 transition"
                    >
                      Email:
                      shillanshafihilal119@gmail.com
                    </a>
                  </li>

                  <li>
                    Delivery: 1 Day
                  </li>

                </ul>

              </div>

            </div>

            <div className="mt-10 border-t border-zinc-800 pt-6">

              <p className="text-center text-sm text-gray-500">
                © 2026 Vintage DTP. All rights reserved.
              </p>

            </div>

          </div>

        </footer>

      </body>
    </html>
  );
}