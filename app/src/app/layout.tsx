import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import 'react-toastify/dist/ReactToastify.css'
import '@solana/wallet-adapter-react-ui/styles.css'
import { Navbar } from "@/components/navbar";
import AppWalletProvider from "@/components/AppWalletProvider";
import { ToastContainer } from 'react-toastify'
import { ReactQueryProvider } from "./providers";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Solana Chat - Discord-like Communities on Solana",
  description: "Build real-time communities on Solana with wallet-native identity, token-gated channels, and programmable moderation.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}

      ><ReactQueryProvider>
        <AppWalletProvider>
          <Navbar />
          {children}
          <ToastContainer
                position="bottom-center"
                autoClose={5000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="dark"
              />

              
        </AppWalletProvider>
        </ReactQueryProvider>

      </body>
    </html>
  );
}
