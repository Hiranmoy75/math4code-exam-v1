import type React from "react"
import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { ReactQueryProviders } from "@/lib/provider/Provider"
import { ThemeProvider } from "@/components/theme-provider"
import { MathJaxContext } from "better-react-mathjax"
import { Toaster } from "sonner"
import AIMentor from "@/components/landing/AIMentor"

const _geist = Geist({
  subsets: ["latin"],
  display: "swap",
  preload: true,
})
const _geistMono = Geist_Mono({
  subsets: ["latin"],
  display: "swap",
  preload: true,
})

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // Disable pinch zoom for app-like feel
  viewportFit: "cover", // Use full screen area including notch
  themeColor: "#ffffff",
}

export const metadata: Metadata = {
  title: "math4code - Online Exam System",
  description: "Premium online exam system for IIT JEE and IIT JAM preparation",
  generator: "Hiranmoy Mandal",
  manifest: "/manifest.json", // Link to manifest
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Math4Code",
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png", // You should add this icon
  },
}

const config = {
  loader: { load: ["input/tex", "output/chtml"] },
  tex: {
    inlineMath: [["$", "$"], ["\\(", "\\)"]],
    displayMath: [["$$", "$$"], ["\\[", "\\]"]],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="antialiased">
      <head>
        <meta charSet="utf-8" />
        <meta name="theme-color" content="#ffffff" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body className={`font-sans antialiased `} suppressHydrationWarning>
        <ReactQueryProviders>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <MathJaxContext version={3} config={config}>
              {children}
              <AIMentor />
            </MathJaxContext>
            <Toaster richColors position="top-center" />
          </ThemeProvider>
        </ReactQueryProviders>
        <Analytics />
      </body>
    </html>
  )
}
