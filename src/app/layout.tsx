import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { I18nProvider } from "@/lib/i18n";
import { ThemeProvider } from "@/lib/theme-context";

export const metadata: Metadata = {
  title: "Tbilisi Care",
  description: "A civic platform where good deeds earn real rewards.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FFFFFF" },
    { media: "(prefers-color-scheme: dark)", color: "#0B1426" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ka" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <I18nProvider>
            <AuthProvider>{children}</AuthProvider>
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
