"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Download, FileText, ImageIcon, Table } from "lucide-react"
import type { BusinessInfo } from "@/types/business-info"

interface ExportReportProps {
  businessInfo: BusinessInfo
}

export function ExportReport({ businessInfo }: ExportReportProps) {
  const [exportOptions, setExportOptions] = useState({
    includeRankingMap: true,
    includeCompetitiveAnalysis: true,
    includeHistoricalData: true,
    includeRecommendations: true,
    format: "pdf" as "pdf" | "csv" | "image",
  })

  const handleExport = () => {
    // In a real implementation, this would generate and download the report
    // For now, we'll just show an alert
    alert(`Exporting report for ${businessInfo.businessName} with options: ${JSON.stringify(exportOptions)}`)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Export Report</CardTitle>
        <CardDescription>Generate a shareable report of your GeoGrid analysis</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium mb-2">Report Sections</h3>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-ranking-map"
                  checked={exportOptions.includeRankingMap}
                  onCheckedChange={(checked) =>
                    setExportOptions({ ...exportOptions, includeRankingMap: checked as boolean })
                  }
                />
                <Label htmlFor="include-ranking-map">Ranking Map Visualization</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-competitive-analysis"
                  checked={exportOptions.includeCompetitiveAnalysis}
                  onCheckedChange={(checked) =>
                    setExportOptions({ ...exportOptions, includeCompetitiveAnalysis: checked as boolean })
                  }
                />
                <Label htmlFor="include-competitive-analysis">Competitive Analysis</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-historical-data"
                  checked={exportOptions.includeHistoricalData}
                  onCheckedChange={(checked) =>
                    setExportOptions({ ...exportOptions, includeHistoricalData: checked as boolean })
                  }
                />
                <Label htmlFor="include-historical-data">Historical Data</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-recommendations"
                  checked={exportOptions.includeRecommendations}
                  onCheckedChange={(checked) =>
                    setExportOptions({ ...exportOptions, includeRecommendations: checked as boolean })
                  }
                />
                <Label htmlFor="include-recommendations">Strategic Recommendations</Label>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium mb-2">Export Format</h3>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant={exportOptions.format === "pdf" ? "default" : "outline"}
                className="flex flex-col items-center justify-center h-20 p-2"
                onClick={() => setExportOptions({ ...exportOptions, format: "pdf" })}
              >
                <FileText className="h-6 w-6 mb-1" />
                <span className="text-xs">PDF Report</span>
              </Button>
              <Button
                variant={exportOptions.format === "csv" ? "default" : "outline"}
                className="flex flex-col items-center justify-center h-20 p-2"
                onClick={() => setExportOptions({ ...exportOptions, format: "csv" })}
              >
                <Table className="h-6 w-6 mb-1" />
                <span className="text-xs">CSV Data</span>
              </Button>
              <Button
                variant={exportOptions.format === "image" ? "default" : "outline"}
                className="flex flex-col items-center justify-center h-20 p-2"
                onClick={() => setExportOptions({ ...exportOptions, format: "image" })}
              >
                <ImageIcon className="h-6 w-6 mb-1" />
                <span className="text-xs">Image</span>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full" onClick={handleExport}>
          <Download className="mr-2 h-4 w-4" />
          Export Report
        </Button>
      </CardFooter>
    </Card>
  )
}
