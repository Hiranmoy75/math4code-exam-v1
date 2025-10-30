import type React from "react"
import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { ReactQueryProviders } from "@/lib/provider/Provider"
import { MathJaxContext } from "better-react-mathjax"

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
}

export const metadata: Metadata = {
  title: "math4code - Online Exam System",
  description: "Premium online exam system for IIT JEE and IIT JAM preparation",
  generator: "Hiranmoy Mandal",
  icons: {
    icon: "/favicon.ico",
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
    <html lang="en" suppressHydrationWarning className="dar">
      <head>
        <meta charSet="utf-8" />
        <meta name="theme-color" content="#ffffff" />
      </head>
      <body className={`font-sans antialiased `}>
        <ReactQueryProviders>
          <MathJaxContext version={3} config={config}>
            {children}
          </MathJaxContext>
          
           </ReactQueryProviders>
        <Analytics />
      </body>
    </html>
  )
}
