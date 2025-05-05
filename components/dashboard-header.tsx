"use client"

import type { BusinessInfo } from "@/types"
import { MapIcon, BarChart2, Users, History, FileText, Star } from "lucide-react"
import { cn } from "@/lib/utils"

interface DashboardHeaderProps {
  businessInfo: BusinessInfo
  activeTab: string
  setActiveTab: (tab: string) => void
}

export function DashboardHeader({ businessInfo, activeTab, setActiveTab }: DashboardHeaderProps) {
  const tabs = [
    { id: "map", label: "Ranking Map", icon: MapIcon },
    { id: "keywords", label: "Keyword Analysis", icon: BarChart2 },
    { id: "competitors", label: "Competitors", icon: Users },
    { id: "historical", label: "Historical Data", icon: History },
    { id: "recommendations", label: "Recommendations", icon: FileText },
  ]

  return (
    <header className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200 sticky top-0 z-10 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between py-4">
          <div className="flex items-center mb-4 md:mb-0 group">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white font-bold text-xl shadow-md mr-4 group-hover:shadow-lg transition-all duration-200">
              <span className="transform group-hover:scale-110 transition-transform duration-200">G</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800 flex items-center">
                {businessInfo.name}
                {businessInfo.rating && (
                  <div className="ml-2 flex items-center text-sm bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                    <Star className="h-3.5 w-3.5 mr-0.5 fill-amber-500 text-amber-500" />
                    <span>{businessInfo.rating}</span>
                  </div>
                )}
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">
                {businessInfo.category && (
                  <span className="font-medium text-slate-600">{businessInfo.category} • </span>
                )}
                {businessInfo.address}
              </p>
            </div>
          </div>

          <nav className="flex overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
            <ul className="flex space-x-2">
              {tabs.map((tab) => (
                <li key={tab.id}>
                  <button
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "flex items-center px-4 py-2 text-sm font-medium rounded-md transition-all duration-200",
                      activeTab === tab.id
                        ? "bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-md hover:shadow-lg"
                        : "text-slate-600 hover:bg-white hover:text-slate-900 hover:shadow-sm"
                    )}
                  >
                    <tab.icon className={cn(
                      "h-4 w-4 mr-2",
                      activeTab === tab.id ? "text-white" : "text-slate-500"
                    )} />
                    {tab.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </header>
  )
}
