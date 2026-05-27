import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Badminton Deals | Săn sale đồ cầu lông",
  description: "Cập nhật liên tục các deal vợt, giày, quần áo cầu lông từ nhiều nguồn uy tín.",
};

import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SessionExpiredModal from "@/components/SessionExpiredModal";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body>
        <ThemeProvider>
          <AuthProvider>
            <Header />
            <main className="container" style={{ minHeight: 'calc(100vh - 70px - 200px)' }}>
              {children}
            </main>
            <Footer />
            <SessionExpiredModal />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
