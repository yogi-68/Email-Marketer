import type { Metadata } from "next";
import "./globals.css";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "EmailMarketer - AI-Powered Email Marketing SaaS",
  description: "Send email campaigns with AI-powered Send Time Optimization. 35% higher open rates at 1/30th the cost of traditional ESPs. Built on AWS SES.",
  keywords: "email marketing, SaaS, AWS SES, send time optimization, AI email, bulk email, marketing automation",
  authors: [{ name: "EmailMarketer Team" }],
  openGraph: {
    title: "EmailMarketer - AI-Powered Email Marketing",
    description: "35% higher open rates with ML-driven Send Time Optimization",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Navigation />
        <main style={{ paddingTop: '80px' }}>
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
