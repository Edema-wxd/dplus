import Navbar from "@/components/home/Navbar";
import Footer from "@/components/home/Footer";
import { Toaster } from "@/components/ui/sonner";
import { CartProvider } from "@/context/cart-context";

export default function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <CartProvider>
      <Navbar />
      {children}
      <Footer />
      <Toaster richColors />
    </CartProvider>
  );
}
