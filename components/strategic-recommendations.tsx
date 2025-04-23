"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { BusinessInfo } from "@/types/business-info"
import { CheckCircle2, AlertCircle, Calendar, FileText, Star } from "lucide-react"

interface StrategicRecommendationsProps {
  businessInfo: BusinessInfo
}

export function StrategicRecommendations({ businessInfo }: StrategicRecommendationsProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Strategic Recommendations</CardTitle>
          <CardDescription>Actionable insights to improve your local search visibility</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="content">
            <TabsList className="grid grid-cols-2 md:grid-cols-4 mb-4">
              <TabsTrigger value="content">Content Strategy</TabsTrigger>
              <TabsTrigger value="citations">Citations & NAP</TabsTrigger>
              <TabsTrigger value="reviews">Review Strategy</TabsTrigger>
              <TabsTrigger value="monitoring">Ongoing Monitoring</TabsTrigger>
            </TabsList>

            <TabsContent value="content" className="space-y-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                <div>
                  <h4 className="font-medium">Geographic Content Gap</h4>
                  <p className="text-sm text-muted-foreground">
                    Your rankings are weakest in the northeastern quadrant of your service area, which includes the
                    high-value neighborhoods of Oakwood and Pine Hills.
                  </p>
                </div>
              </div>

              <div className="pl-8 space-y-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Create Location-Specific Landing Pages</h4>
                    <p className="text-sm text-muted-foreground">
                      Develop dedicated landing pages for Oakwood and Pine Hills neighborhoods, including:
                    </p>
                    <ul className="list-disc pl-5 mt-2 text-sm">
                      <li>Neighborhood-specific service descriptions</li>
                      <li>Local landmarks and reference points</li>
                      <li>Case studies or testimonials from customers in these areas</li>
                      <li>Area-specific offers or promotions</li>
                    </ul>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Optimize Existing Content</h4>
                    <p className="text-sm text-muted-foreground">
                      Update your website's main service pages to include more references to the northeastern
                      neighborhoods:
                    </p>
                    <ul className="list-disc pl-5 mt-2 text-sm">
                      <li>Add neighborhood names to H2 and H3 headings</li>
                      <li>Include neighborhood names in image alt text and file names</li>
                      <li>Create an interactive service area map highlighting all neighborhoods</li>
                    </ul>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Create Local Blog Content</h4>
                    <p className="text-sm text-muted-foreground">
                      Publish blog posts specifically addressing common issues in the northeastern neighborhoods:
                    </p>
                    <ul className="list-disc pl-5 mt-2 text-sm">
                      <li>"Common Plumbing Issues in Older Oakwood Homes"</li>
                      <li>"Pine Hills Homeowner's Guide to Water Heater Maintenance"</li>
                      <li>"How Oakwood's Water Quality Affects Your Plumbing"</li>
                    </ul>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="citations" className="space-y-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                <div>
                  <h4 className="font-medium">Citation Inconsistency</h4>
                  <p className="text-sm text-muted-foreground">
                    Analysis shows inconsistent business information across directories, particularly for northeastern
                    service areas.
                  </p>
                </div>
              </div>

              <div className="pl-8 space-y-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Citation Audit and Cleanup</h4>
                    <p className="text-sm text-muted-foreground">Conduct a comprehensive citation audit focusing on:</p>
                    <ul className="list-disc pl-5 mt-2 text-sm">
                      <li>Consistent NAP (Name, Address, Phone) information across all platforms</li>
                      <li>Update service area descriptions to explicitly mention northeastern neighborhoods</li>
                      <li>Fix the 7 inconsistent citations identified in our analysis</li>
                    </ul>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Local Citation Building</h4>
                    <p className="text-sm text-muted-foreground">
                      Create new citations specifically targeting the northeastern quadrant:
                    </p>
                    <ul className="list-disc pl-5 mt-2 text-sm">
                      <li>Local chamber of commerce listings for Oakwood and Pine Hills</li>
                      <li>Neighborhood-specific business directories</li>
                      <li>Local community websites and neighborhood associations</li>
                    </ul>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Google Business Profile Optimization</h4>
                    <p className="text-sm text-muted-foreground">
                      Update your Google Business Profile to better target the northeastern areas:
                    </p>
                    <ul className="list-disc pl-5 mt-2 text-sm">
                      <li>Add all northeastern neighborhoods to your service area</li>
                      <li>Create Google Posts highlighting work completed in these neighborhoods</li>
                      <li>Add photos with geo-location data from jobs in these areas</li>
                    </ul>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="reviews" className="space-y-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                <div>
                  <h4 className="font-medium">Review Distribution Imbalance</h4>
                  <p className="text-sm text-muted-foreground">
                    Only 15% of your reviews mention northeastern neighborhoods, despite this area representing 30% of
                    your service radius.
                  </p>
                </div>
              </div>

              <div className="pl-8 space-y-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Targeted Review Acquisition</h4>
                    <p className="text-sm text-muted-foreground">
                      Implement a focused review strategy for northeastern customers:
                    </p>
                    <ul className="list-disc pl-5 mt-2 text-sm">
                      <li>Prioritize review requests for all northeastern customers</li>
                      <li>Offer small incentives (discount on next service) for leaving detailed reviews</li>
                      <li>Create custom review request templates mentioning the customer's neighborhood</li>
                    </ul>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Review Response Strategy</h4>
                    <p className="text-sm text-muted-foreground">
                      Enhance your review responses to emphasize geographic coverage:
                    </p>
                    <ul className="list-disc pl-5 mt-2 text-sm">
                      <li>Always mention the neighborhood in your response</li>
                      <li>Thank customers for choosing you in their specific area</li>
                      <li>Highlight your commitment to serving their neighborhood</li>
                    </ul>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Review Highlighting</h4>
                    <p className="text-sm text-muted-foreground">Showcase northeastern reviews more prominently:</p>
                    <ul className="list-disc pl-5 mt-2 text-sm">
                      <li>Feature testimonials from northeastern customers on your homepage</li>
                      <li>Create a dedicated testimonials section on neighborhood-specific landing pages</li>
                      <li>Share positive northeastern reviews on social media with neighborhood hashtags</li>
                    </ul>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="monitoring" className="space-y-4">
              <div className="flex items-start space-x-3">
                <Calendar className="h-5 w-5 text-blue-500 mt-0.5" />
                <div>
                  <h4 className="font-medium">Recommended Monitoring Schedule</h4>
                  <p className="text-sm text-muted-foreground">
                    Implement a structured monitoring program to track your progress and identify new opportunities.
                  </p>
                </div>
              </div>

              <div className="pl-8 space-y-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Weekly Monitoring</h4>
                    <ul className="list-disc pl-5 mt-2 text-sm">
                      <li>Track rankings for primary keywords in the northeastern quadrant</li>
                      <li>Monitor competitor activity in target neighborhoods</li>
                      <li>Review and respond to all new customer reviews</li>
                    </ul>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Monthly Analysis</h4>
                    <ul className="list-disc pl-5 mt-2 text-sm">
                      <li>Run full GeoGrid scans for all tracked keywords</li>
                      <li>Compare month-over-month ranking changes</li>
                      <li>Analyze the impact of implemented recommendations</li>
                      <li>Adjust strategy based on performance data</li>
                    </ul>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Quarterly Strategy Review</h4>
                    <ul className="list-disc pl-5 mt-2 text-sm">
                      <li>Comprehensive review of all GeoGrid data</li>
                      <li>Evaluate ROI of local SEO efforts by neighborhood</li>
                      <li>Identify new opportunity areas</li>
                      <li>Update content and citation strategy</li>
                    </ul>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <FileText className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Reporting Integration</h4>
                    <p className="text-sm text-muted-foreground">
                      Connect your GeoGrid data with other analytics platforms:
                    </p>
                    <ul className="list-disc pl-5 mt-2 text-sm">
                      <li>Integrate with Google Analytics to correlate rankings with website traffic</li>
                      <li>Connect with CRM to track leads by neighborhood</li>
                      <li>Create custom Google Data Studio dashboard for comprehensive reporting</li>
                    </ul>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Implementation Priority Matrix</CardTitle>
          <CardDescription>Prioritized action items based on impact and effort</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border rounded-md p-4 bg-green-50">
              <h4 className="font-medium text-green-700 mb-2 flex items-center">
                <Star className="h-4 w-4 mr-1" /> High Impact, Low Effort
              </h4>
              <ul className="list-disc pl-5 space-y-2 text-sm">
                <li>Update Google Business Profile service area to include northeastern neighborhoods</li>
                <li>Create custom review request templates for northeastern customers</li>
                <li>Fix the 7 inconsistent citations identified in our analysis</li>
                <li>Add neighborhood names to existing H2 and H3 headings</li>
              </ul>
            </div>

            <div className="border rounded-md p-4 bg-blue-50">
              <h4 className="font-medium text-blue-700 mb-2 flex items-center">
                <Star className="h-4 w-4 mr-1" /> High Impact, High Effort
              </h4>
              <ul className="list-disc pl-5 space-y-2 text-sm">
                <li>Create dedicated landing pages for Oakwood and Pine Hills neighborhoods</li>
                <li>Develop neighborhood-specific blog content (minimum 5 articles)</li>
                <li>Build new citations on neighborhood-specific platforms</li>
                <li>Implement comprehensive review acquisition strategy</li>
              </ul>
            </div>

            <div className="border rounded-md p-4 bg-yellow-50">
              <h4 className="font-medium text-yellow-700 mb-2 flex items-center">
                <Star className="h-4 w-4 mr-1" /> Medium Impact, Low Effort
              </h4>
              <ul className="list-disc pl-5 space-y-2 text-sm">
                <li>Update image alt text to include neighborhood references</li>
                <li>Create Google Posts highlighting work in northeastern areas</li>
                <li>Share positive northeastern reviews on social media</li>
                <li>Implement weekly ranking monitoring for key neighborhoods</li>
              </ul>
            </div>

            <div className="border rounded-md p-4 bg-purple-50">
              <h4 className="font-medium text-purple-700 mb-2 flex items-center">
                <Star className="h-4 w-4 mr-1" /> Long-term Strategy
              </h4>
              <ul className="list-disc pl-5 space-y-2 text-sm">
                <li>Create interactive service area map for website</li>
                <li>Develop neighborhood-specific case studies</li>
                <li>Integrate GeoGrid data with other analytics platforms</li>
                <li>Establish quarterly strategy review process</li>
              </ul>
            </div>
          </div>

          <div className="mt-6">
            <h4 className="font-medium mb-2">Expected Outcomes</h4>
            <p className="text-sm text-muted-foreground">
              By implementing these recommendations with the suggested priority, you can expect:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1 text-sm">
              <li>30-40% improvement in northeastern quadrant rankings within 3 months</li>
              <li>15-20% increase in leads from Oakwood and Pine Hills neighborhoods</li>
              <li>More balanced ranking distribution across your entire service area</li>
              <li>Stronger competitive position against ABC Plumbing in their dominant areas</li>
              <li>Improved conversion rates from organic search traffic</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
