"use client"

import { useState } from "react"
import type { BusinessInfo, RankingData } from "@/types"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { calculateKeywordMetrics } from "@/lib/utils"
import { MapPin, Search, ChevronDown, ChevronUp } from "lucide-react"

interface DashboardSidebarProps {
  businessInfo: BusinessInfo
  selectedKeyword: string
  setSelectedKeyword: (keyword: string) => void
  gridSize: number
  setGridSize: (size: number) => void
  pointDistance: number
  setPointDistance: (distance: number) => void
  visualizationType: string
  setVisualizationType: (type: string) => void
  invertHeatmap: boolean
  setInvertHeatmap: (invert: boolean) => void
  locationInput: string
  setLocationInput: (input: string) => void
  onLocationUpdate: () => void
  activeTab: string
  setActiveTab: (tab: string) => void
  visualizationSupported: boolean
  rankingData?: RankingData
}

export function DashboardSidebar({
  businessInfo,
  selectedKeyword,
  setSelectedKeyword,
  gridSize,
  setGridSize,
  pointDistance,
  setPointDistance,
  visualizationType,
  setVisualizationType,
  invertHeatmap,
  setInvertHeatmap,
  locationInput,
  setLocationInput,
  onLocationUpdate,
  activeTab,
  setActiveTab,
  visualizationSupported,
  rankingData,
}: DashboardSidebarProps) {
  const [expandedSections, setExpandedSections] = useState({
    business: true,
    keywords: true,
    gridSettings: activeTab === "map",
  })

  // Toggle section expansion
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections({
      ...expandedSections,
      [section]: !expandedSections[section],
    })
  }

  // Get metrics for the selected keyword
  const selectedKeywordMetrics = rankingData && rankingData[selectedKeyword]
    ? calculateKeywordMetrics(rankingData[selectedKeyword])
    : null

  return (
    <aside className="w-80 bg-white border-r border-slate-200 overflow-y-auto flex-shrink-0">
      <div className="p-5">
        {/* Business Info Section */}
        <div className="mb-6">
          <button
            onClick={() => toggleSection("business")}
            className="flex items-center justify-between w-full text-left font-medium text-blue-900 mb-3 transition-colors hover:text-primary"
          >
            <span className="text-base">Business Information</span>
            {expandedSections.business ? (
              <ChevronUp className="h-4 w-4 text-primary" />
            ) : (
              <ChevronDown className="h-4 w-4 text-primary" />
            )}
          </button>

          {expandedSections.business && (
            <div className="lv-card p-0 animate-slide-up">
              <div className="lv-gradient-header p-4">
                <h3 className="font-medium text-white text-lg">{businessInfo.name}</h3>
                <p className="text-sm text-white/80">{typeof businessInfo.location === 'string' ? businessInfo.location : 'Location not set'}</p>
                    </div>
              <div className="p-4">
                  <div className="flex items-center space-x-2 text-sm">
                  <span className="lv-badge lv-badge-primary">{businessInfo.category}</span>
                  <span className="lv-badge lv-badge-secondary">
                      {businessInfo.businessType === "physical" ? "Physical Location" : "Service Area Business"}
                    </span>
                  </div>
                </div>
            </div>
          )}
        </div>

        {/* Keywords Section */}
        <div className="mb-6">
          <button
            onClick={() => toggleSection("keywords")}
            className="flex items-center justify-between w-full text-left font-medium text-blue-900 mb-3 transition-colors hover:text-primary"
          >
            <span className="text-base">Keywords</span>
            {expandedSections.keywords ? (
              <ChevronUp className="h-4 w-4 text-primary" />
            ) : (
              <ChevronDown className="h-4 w-4 text-primary" />
            )}
          </button>

          {expandedSections.keywords && (
            <div className="space-y-3 animate-slide-up">
              {businessInfo.keywords.map((keyword) => {
                const metrics = rankingData && rankingData[keyword] ? calculateKeywordMetrics(rankingData[keyword]) : null

                return (
                  <button
                    key={keyword}
                    onClick={() => setSelectedKeyword(keyword)}
                    className={`w-full text-left p-4 rounded-xl transition-all ${
                      selectedKeyword === keyword
                        ? "bg-primary/5 border-l-4 border-primary shadow-sm"
                        : "bg-white hover:bg-blue-50/50 border-l-4 border-transparent"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className={`font-medium ${selectedKeyword === keyword ? "text-primary" : "text-blue-900"}`}>{keyword}</span>
                      {metrics && (
                        <span
                          className={`lv-badge ${
                            typeof metrics.averageRanking === 'number' ? (
                              metrics.averageRanking <= 3
                                ? "lv-badge-success"
                                : metrics.averageRanking <= 7
                                ? "bg-green-100 text-green-800"
                                  : metrics.averageRanking <= 10
                                    ? "lv-badge-warning"
                                    : "lv-badge-danger"
                            ) : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          Avg: {typeof metrics.averageRanking === 'number' ? metrics.averageRanking.toFixed(1) : '0'}
                        </span>
                      )}
                    </div>

                    {metrics && (
                      <div className="mt-3">
                        <div className="lv-progress-bar">
                          <div className="flex h-full">
                            <div className="lv-progress-bar-fill bg-blue-500" style={{ width: `${metrics && metrics.totalRankings > 0 ? (metrics.topThreeCount / metrics.totalRankings) * 100 : 0}%` }} />
                            <div className="lv-progress-bar-fill bg-cyan-500" style={{ width: `${metrics && metrics.totalRankings > 0 ? ((metrics.topTenCount - metrics.topThreeCount) / metrics.totalRankings) * 100 : 0}%` }} />
                            <div className="lv-progress-bar-fill bg-red-500" style={{ width: `${metrics && metrics.totalRankings > 0 ? (metrics.notRankedCount / metrics.totalRankings) * 100 : 0}%` }} />
                          </div>
                        </div>
                        <div className="flex justify-between mt-2 text-xs text-slate-600">
                          <span>Top 3: {metrics && metrics.totalRankings > 0 ? ((metrics.topThreeCount / metrics.totalRankings) * 100).toFixed(0) : '0'}%</span>
                          <span>4-10: {metrics && metrics.totalRankings > 0 ? ((metrics.topTenCount - metrics.topThreeCount) / metrics.totalRankings) * 100 : 0}%</span>
                          <span>10+: {metrics && metrics.totalRankings > 0 ? ((metrics.notRankedCount / metrics.totalRankings) * 100).toFixed(0) : '0'}%</span>
                        </div>
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Grid Settings Section - Only show for map view */}
        {activeTab === "map" && (
          <div className="mb-6">
            <button
              onClick={() => toggleSection("gridSettings")}
              className="flex items-center justify-between w-full text-left font-medium text-blue-900 mb-3 transition-colors hover:text-primary"
            >
              <span className="text-base">Grid Settings</span>
              {expandedSections.gridSettings ? (
                <ChevronUp className="h-4 w-4 text-primary" />
              ) : (
                <ChevronDown className="h-4 w-4 text-primary" />
              )}
            </button>

            {expandedSections.gridSettings && (
              <div className="lv-card p-5 animate-slide-up">
              <div className="space-y-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-blue-900">Location</label>
                  <div className="flex space-x-2">
                      <input
                      value={locationInput}
                      onChange={(e) => setLocationInput(e.target.value)}
                        placeholder="Enter address or coordinates"
                        className="lv-input"
                    />
                      <button onClick={onLocationUpdate} className="lv-button py-2 px-2">
                      <Search className="h-4 w-4" />
                      </button>
                  </div>
                </div>

                  <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                      <label className="text-sm font-medium text-blue-900">Grid Size</label>
                      <input
                        type="number"
                        min={3}
                        max={15}
                    value={gridSize}
                        onChange={(e) => setGridSize(Number(e.target.value))}
                        className="lv-input"
                      />
                      <p className="text-xs text-slate-500">Number of points per side</p>
                </div>

                <div className="space-y-2">
                      <label className="text-sm font-medium text-blue-900">Distance (km)</label>
                  <input
                        type="number"
                        min={0.5}
                        max={50}
                        step={0.5}
                    value={pointDistance}
                        onChange={(e) => setPointDistance(Number(e.target.value))}
                        className="lv-input"
                      />
                      <p className="text-xs text-slate-500">Distance between points</p>
                    </div>
                  </div>

                  {visualizationSupported && activeTab === "map" && (
                    <div className="space-y-2 mt-2">
                      <label className="text-sm font-medium text-blue-900">Visualization Type</label>
                      <div className="lv-tab-list">
                        <button
                          onClick={() => setVisualizationType("markers")}
                          className={`lv-tab ${visualizationType === "markers" ? "data-[state=active]" : ""}`}
                        >
                          Markers
                        </button>
                        <button
                          onClick={() => setVisualizationType("heatmap")}
                          className={`lv-tab ${visualizationType === "heatmap" ? "data-[state=active]" : ""}`}
                        >
                          Heatmap
                        </button>
                  </div>
                </div>
                  )}

                  {visualizationType === "heatmap" && (
                    <div className="flex items-center space-x-2 mt-2">
                      <input
                        type="checkbox"
                        id="invert-heatmap"
                        checked={invertHeatmap}
                        onChange={(e) => setInvertHeatmap(e.target.checked)}
                        className="rounded text-primary focus:ring-primary"
                      />
                      <label htmlFor="invert-heatmap" className="text-sm text-slate-700">
                        Invert heatmap (lower = better)
                      </label>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Selected Keyword Metrics */}
        {selectedKeywordMetrics && (
          <div className="mb-6 animate-slide-up">
            <h3 className="font-medium text-blue-900 mb-3 text-base flex items-center">
              <div className="w-2 h-2 rounded-full bg-primary mr-2"></div>
              Metrics for &quot;{selectedKeyword}&quot;
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="lv-stat-card">
                <p className="text-xs text-slate-500 mb-1">Average Position</p>
                <p className="text-2xl font-bold text-primary">{selectedKeywordMetrics.averageRanking.toFixed(1)}</p>
              </div>
              <div className="lv-stat-card">
                <p className="text-xs text-slate-500 mb-1">Visibility</p>
                <p className="text-2xl font-bold text-secondary">{selectedKeywordMetrics.visibilityScore.toFixed(1)}%</p>
                </div>
              <div className="lv-stat-card">
                <p className="text-xs text-slate-500 mb-1">Top 3 Positions</p>
                <div className="flex items-end justify-between">
                  <p className="text-2xl font-bold text-blue-600">{selectedKeywordMetrics.topThreeCount}</p>
                  <p className="text-xs text-blue-600">{selectedKeywordMetrics.totalRankings > 0 ? ((selectedKeywordMetrics.topThreeCount / selectedKeywordMetrics.totalRankings) * 100).toFixed(0) : 0}%</p>
                </div>
              </div>
              <div className="lv-stat-card">
                <p className="text-xs text-slate-500 mb-1">Top 10 Positions</p>
                <div className="flex items-end justify-between">
                  <p className="text-2xl font-bold text-cyan-600">{selectedKeywordMetrics.topTenCount}</p>
                  <p className="text-xs text-cyan-600">{selectedKeywordMetrics.totalRankings > 0 ? ((selectedKeywordMetrics.topTenCount / selectedKeywordMetrics.totalRankings) * 100).toFixed(0) : 0}%</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab Selection - Only visible on mobile */}
        <div className="lg:hidden mt-6">
          <h3 className="font-medium text-blue-900 mb-3 text-base flex items-center">
            <div className="w-2 h-2 rounded-full bg-primary mr-2"></div>
            View Options
          </h3>
          <div className="lv-tab-list">
            <button
              onClick={() => setActiveTab("map")}
              className={`lv-tab ${activeTab === "map" ? "data-[state=active]" : ""}`}
            >
              Map View
            </button>
            <button
              onClick={() => setActiveTab("detail")}
              className={`lv-tab ${activeTab === "detail" ? "data-[state=active]" : ""}`}
            >
              Detailed View
            </button>
          </div>
        </div>
      </div>
    </aside>
  )
}
