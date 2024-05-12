import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Squeeze",
  description: "A fast, privacy-friendly image converter and compressor.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <link href="https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css" rel="stylesheet" />
      </head>
      <body suppressHydrationWarning className="font-sans antialiased text-brand-text bg-gradient-to-br from-brand-bgstart to-brand-bgend min-h-screen overflow-hidden">
        {children}
      </body>
    </html>
  );
}
