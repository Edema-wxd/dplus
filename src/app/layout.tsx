import type { Metadata } from "next";
import { Raleway } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

// Components
import { ThemeProvider } from "@/components/theme-provider";
import JsonLd from "@/components/JsonLd";
import {
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
  organizationSchema,
  websiteSchema,
} from "@/lib/seo";


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
  // Every relative URL in page metadata resolves against this.
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — Corporate Gifting & Branded Merchandise in Nigeria`,
    // Pages supply their own title; this keeps the brand on the end of it.
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "en_NG",
    url: SITE_URL,
    title: `${SITE_NAME} — Corporate Gifting & Branded Merchandise in Nigeria`,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — Corporate Gifting & Branded Merchandise in Nigeria`,
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${raleway.variable} ${sarlotte.variable} antialiased`}>
        <JsonLd data={[organizationSchema(), websiteSchema()]} />
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
