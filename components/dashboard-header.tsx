"use client"

import type { BusinessInfo } from "@/types"
import { MapIcon, BarChart2, Users, History, FileText } from "lucide-react"

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
    <header className="bg-white border-b border-slate-200 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between py-4">
          <div className="flex items-center mb-4 md:mb-0">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 flex items-center justify-center text-white font-bold text-lg mr-3">
              G
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">{businessInfo.name}</h1>
              <p className="text-sm text-slate-500">
                {businessInfo.category} • {businessInfo.address}
              </p>
            </div>
          </div>

          <nav className="flex overflow-x-auto pb-2 md:pb-0">
            <ul className="flex space-x-1">
              {tabs.map((tab) => (
                <li key={tab.id}>
                  <button
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      activeTab === tab.id
                        ? "bg-teal-100 text-teal-800"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    <tab.icon className="h-4 w-4 mr-1.5" />
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
