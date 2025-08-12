import type { Metadata } from "next";
import { Raleway } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

// Components
import Navbar from "@/components/home/Navbar";
import Footer from "@/components/home/Footer";
import { Toaster } from "@/components/ui/sonner";
 

const raleway = Raleway({
  variable: "--font-raleway",
  subsets: ["latin"],
});

const sarlotte = localFont({
  src: [
    {
      path: "../fonts/Sarlotte.otf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../fonts/Sarlotte-Bold.otf",
      weight: "700",
      style: "normal",
    },
    {
      path: "../fonts/Sarlotte-BoldItalic.otf",
      weight: "700",
      style: "italic",
    },
    {
      path: "../fonts/SarlotteItalic.otf",
      weight: "400",
      style: "italic",
    },
    {
      path: "../fonts/Sarlotte-Regular.otf",
      weight: "400",
      style: "normal",
    },
  ],
  variable: "--font-sarlotte",
});

export const metadata: Metadata = {
  title: "De-Sign Plus",
  description: "De-Sign Plus",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${raleway.variable} ${sarlotte.variable} antialiased`}>
        <Navbar />
        {children}
        <Footer />
        <Toaster />
      </body>
    </html>
  );
}
