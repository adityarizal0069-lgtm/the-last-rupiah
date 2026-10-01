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
  metadataBase: new URL("https://lastrupiah.com"),
  title: {
    default: "The Last Rupiah — Simple Expense Tracker",
    template: "%s | The Last Rupiah",
  },
  description:
    "The Last Rupiah is a simple and thoughtful expense tracker for managing expenses, income, and personal finances.",
  applicationName: "The Last Rupiah",
  openGraph: {
    title: "The Last Rupiah — Simple Expense Tracker",
    description:
      "A simple and thoughtful way to track expenses, income, and personal finances.",
    url: "https://lastrupiah.com",
    siteName: "The Last Rupiah",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "The Last Rupiah — Simple Expense Tracker",
    description:
      "A simple and thoughtful way to track expenses, income, and personal finances.",
  },
  robots: {
    index: true,
    follow: true,
  },
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