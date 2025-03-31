import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { VoiceAssistant } from "@/components/voice-assistant"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "HandiConnect - Réseau Social Inclusif",
  description: "Le Premier Réseau Social 100% Inclusif pour les Personnes en Situation de Handicap",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
          <VoiceAssistant />
        </ThemeProvider>
      </body>
    </html>
  )
}



import './globals.css'