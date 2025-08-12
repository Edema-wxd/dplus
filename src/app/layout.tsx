import type { Metadata } from "next";
import { Raleway } from "next/font/google";
import "./globals.css";

// Components
import Navbar from "@/components/home/Navbar";
import Footer from "@/components/home/Footer";

const raleway = Raleway({
  variable: "--font-raleway",
  subsets: ["latin"],
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
      <body className={`${raleway.variable} antialiased`}>
        <Navbar />
        {children}
        <Footer />
      </body>
    </html>
  );
}
