import { Geist, Geist_Mono } from "next/font/google"
import type { Metadata } from "next"
import { headers } from "next/headers"
import Script from "next/script"

import AppKeyboardShortcuts from "@/components/AppKeyboardShortcuts"
import AuthProvider from "@/components/AuthProvider"
import "./globals.css"
import { getSessionUser } from "@/lib/session"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { cn } from "@/lib/utils"
import { UiSoundEffects } from "@/components/UiSoundEffects"
import { isFirefoxLikeUserAgent } from "@/lib/browser"

const geistHeading = Geist({ subsets: ["latin"], variable: "--font-heading" })

const fontSans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
})

const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" })

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ??
      process.env.NEXTAUTH_URL ??
      process.env.PORTLESS_URL ??
      "http://localhost:3000"
  ),
  title: "Xenon",
  description:
    "Xenon is Raycast for GitHub in the web: repo browsing, profiles, command palette, and in-app actions.",
  alternates: {
    types: {
      "text/plain": "/llms.txt",
      "text/markdown": "/llms-full.txt",
      "application/vnd.oai.openapi+json": "/openapi.json",
    },
  },
  robots: {
    follow: true,
    googleBot: {
      follow: true,
      index: true,
    },
    index: true,
  },
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const requestHeaders = await headers()
  const userAgent = requestHeaders.get("user-agent")
  const disableBrowserExtras = isFirefoxLikeUserAgent(userAgent)
  const user = await getSessionUser()

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontSans.variable,
        "font-mono",
        geistMono.variable,
        geistHeading.variable
      )}
    >
      <body>
        <Script
          defer
          src="https://cloud.umami.is/script.js"
          data-website-id="d67f8207-6850-461e-9db7-c1f6d0617387"
        />
        <AuthProvider user={user}>
          <ThemeProvider disableHotkeys={disableBrowserExtras}>
            {!disableBrowserExtras ? <AppKeyboardShortcuts /> : null}
            {!disableBrowserExtras ? <UiSoundEffects /> : null}
            {children}
            <Toaster richColors position="bottom-right" />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
