import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ExpenseProvider } from "@/components/expenses/ExpenseProvider";
import { IncomeProvider } from "@/components/income/IncomeProvider";
import { SyncProvider } from "@/components/sync/SyncProvider";
import Footer from "@/components/layout/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "The Last Rupiah",
  description: "A simple and thoughtful way to track your expenses.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
    >
      <body className="flex min-h-screen flex-col">
        <SyncProvider>
          <ExpenseProvider>
            <IncomeProvider>
              <div className="flex min-h-screen flex-col">
                {children}
                <Footer />
              </div>
            </IncomeProvider>
          </ExpenseProvider>
        </SyncProvider>
      </body>
    </html>
  );
}