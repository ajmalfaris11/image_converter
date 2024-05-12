import type { Metadata } from "next";
import { Providers } from './providers';
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
    <html lang="en" suppressHydrationWarning>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <link href="https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css" rel="stylesheet" />
        <script src="https://cdn.jsdelivr.net/npm/exifr/dist/full.umd.js" defer></script>
      </head>
      <body suppressHydrationWarning className="font-sans antialiased text-brand-text bg-gradient-to-br from-brand-bgstart to-brand-bgend min-h-screen overflow-hidden">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
