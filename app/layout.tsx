import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { UserProvider } from "@/components/auth/UserContext";
import { MobileTabBar } from "@/components/ui/mobile-tab-bar";
import { AlertCountProvider } from "@/components/ui/alert-count-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});




export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AlertCountProvider>
          <UserProvider>
            <AuthGuard>
              {children}
            </AuthGuard>
          </UserProvider>
          <MobileTabBar />
        </AlertCountProvider>
      </body>
    </html>
  );
}
