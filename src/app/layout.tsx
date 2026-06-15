import type { Metadata } from "next";
import { Raleway } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

// Components
import { ThemeProvider } from "@/components/theme-provider";


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
    <html lang="en" suppressHydrationWarning>
      <body className={`${raleway.variable} ${sarlotte.variable} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
