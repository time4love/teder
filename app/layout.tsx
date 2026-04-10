import type { Metadata } from "next";
import { Assistant, Frank_Ruhl_Libre } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { ToasterLoader } from "@/components/providers/toaster-loader";
import { SITE_ORIGIN } from "@/lib/site";
import { cn } from "@/lib/utils";

const assistant = Assistant({
  subsets: ["hebrew", "latin"],
  display: "swap",
  variable: "--font-sans",
});

const frankRuhlLibre = Frank_Ruhl_Libre({
  subsets: ["hebrew", "latin"],
  weight: ["400", "700"],
  display: "swap",
  variable: "--font-heading",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_ORIGIN),
  title: {
    template: "%s | תדר-ישר-אל",
    default: "תדר-ישר-אל | עדויות וחשיפות אמת",
  },
  description:
    "ארכיון חשיפות, עדויות ומידע.",
  openGraph: {
    type: "website",
    locale: "he_IL",
    siteName: "תדר-ישר-אל",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="he"
      dir="rtl"
      className={cn(assistant.variable, frankRuhlLibre.variable)}
      suppressHydrationWarning
    >
      <body
        className={cn(
          assistant.className,
          "min-h-[100dvh] overflow-x-hidden antialiased bg-[#F9F9F7] text-zinc-900",
        )}
      >
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <Header />
          <div className="pt-16">{children}</div>
          <ToasterLoader />
        </ThemeProvider>
      </body>
    </html>
  );
}
