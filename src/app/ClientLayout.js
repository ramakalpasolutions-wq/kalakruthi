"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

import Header from "@/components/header/header";
import Footer from "@/components/footer/footer";
import { Toaster } from "react-hot-toast";
import GlobalLoader from "@/components/GlobalLoader";

export default function ClientLayout({ children }) {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1200);
    return () => clearTimeout(timer);
  }, [pathname]);

  return (
    <>
      <Header />
      <Toaster position="top-right" />
      <GlobalLoader loading={loading} />
      <main>{children}</main>
      <Footer />
    </>
  );
}
