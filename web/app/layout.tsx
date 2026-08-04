import type { Metadata, Viewport } from "next";
import "./globals.css";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";

export const metadata: Metadata = {
  title: "Workout Hub",
  description: "Zero-friction target sheets and set logging for the gym.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Workout Hub",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#09090b",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-zinc-950 font-sans">
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
