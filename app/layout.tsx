import type { Metadata } from "next";
import { Rubik } from "next/font/google";
import "./globals.css";

const rubik = Rubik({
  subsets: ["hebrew", "latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "תדר-ישר-אל",
  description: "Teder-Yeshar-El",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl">
      <body
        className={`${rubik.className} min-h-[100dvh] overflow-x-hidden bg-black antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
