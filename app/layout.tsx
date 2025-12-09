import type React from "react"
import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { ReactQueryProviders } from "@/lib/provider/Provider"
import { ThemeProvider } from "@/components/theme-provider"
import { MathJaxContext } from "better-react-mathjax"
import { Toaster as SonnerToaster } from "sonner"
import { Toaster } from "@/components/ui/toaster"
import AIMentor from "@/components/landing/AIMentor"
import { RewardInitializerWrapper } from "@/components/RewardInitializerWrapper"


const geist = Geist({
  subsets: ["latin"],
  display: "swap", // Prevents invisible text during font load
  preload: true,
  variable: "--font-geist",
})
const geistMono = Geist_Mono({
  subsets: ["latin"],
  display: "swap",
  preload: true,
  variable: "--font-geist-mono",
})

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
}

export const metadata: Metadata = {
  metadataBase: new URL("https://www.math4code.com"),
  title: {
    default: "Math4Code - Master IIT JEE & JAM with Expert Online Courses",
    template: "%s | Math4Code",
  },
  description: "Premium online exam system for IIT JEE and IIT JAM preparation. Expert-curated courses, practice tests, and personalized learning paths to ace your exams.",
  keywords: ["IIT JEE", "IIT JAM", "online courses", "exam preparation", "mathematics", "physics", "chemistry", "test series"],
  authors: [{ name: "Hiranmoy Mandal" }],
  creator: "Hiranmoy Mandal",
  publisher: "Math4Code",
  generator: "Next.js",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Math4Code",
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://www.math4code.com",
    title: "Math4Code - Master IIT JEE & JAM",
    description: "Expert-curated courses and test series for IIT JEE and JAM preparation",
    siteName: "Math4Code",
  },
  twitter: {
    card: "summary_large_image",
    title: "Math4Code - Master IIT JEE & JAM",
    description: "Expert-curated courses and test series for IIT JEE and JAM preparation",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
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
              <RewardInitializerWrapper />
            </MathJaxContext>
            <SonnerToaster richColors position="top-center" />
            <Toaster />
          </ThemeProvider>
        </ReactQueryProviders>
        <Analytics />
      </body>
    </html>
  )
}
