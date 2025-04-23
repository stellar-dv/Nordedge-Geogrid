"use client"

import { useState } from "react"
import type { BusinessInfo } from "@/types"
import { BusinessSearch } from "./business-search"
import { Dashboard } from "./dashboard"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export function GeoGridApp() {
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo | null>(null)

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <div className="container mx-auto py-4 px-4">
        <Link href="/">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
      </div>

      {!businessInfo ? (
        <div className="container mx-auto py-6 px-4">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-slate-900 mb-4">New GeoGrid Analysis</h1>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Visualize your local search rankings across your service area with precision and clarity
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <BusinessSearch onBusinessSelect={setBusinessInfo} />
          </div>
        </div>
      ) : (
        <Dashboard businessInfo={businessInfo} />
      )}
    </div>
  )
}
