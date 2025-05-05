import type React from "react"
import "@/app/globals.css"
import { Nunito } from "next/font/google"
import { MainNav } from "@/components/main-nav"

const nunito = Nunito({ subsets: ["latin"] })

export const metadata = {
  title: "GeoGrid - Local SEO Analysis",
  description: "Analyze local SEO with GeoGrid search technology",
  icons: {
    icon: "/geogrid-logo.png",
  },
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={nunito.className}>
        <div className="min-h-screen flex flex-col">
          <MainNav />
          <main className="flex-1">{children}</main>
        </div>
      </body>
    </html>
  )
}


import './globals.css'