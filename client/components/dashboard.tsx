"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertTriangle, Loader2 } from "lucide-react"
import dynamic from "next/dynamic"
import { useEffect, useState } from "react"
import AvgAreaChart from "./charts/avg-area-chart"
import FireClusters from "./charts/fire-clusters"
import FireDurationChart from "./charts/fire-duration-chart"
import FireTimeline from "./charts/fire-timeline"
import FireTypeDonutChart from "./charts/fire-type-donut-chart"
import MonthYearHeatmap from "./charts/month-year-heatmap"
import MonthlyTrendChart from "./charts/monthly-trend-chart"
import RegionBarChart from "./charts/region-bar-chart"
import RegionYearHeatmap from "./charts/region-year-heatmap"
import YearLineChart from "./charts/year-line-chart"
import DashboardHeader from "./dashboard-header"
import StatsCards from "./stats-cards"
import TopFiresTable from "./top-fires-table"

// Import FireMap dynamically to avoid SSR issues
const FireMap = dynamic(() => import("./fire-map"), {
  ssr: false,
  loading: () => (
    <div className="h-[600px] w-full flex items-center justify-center bg-gray-100 rounded-lg">
      <div className="flex flex-col items-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-2" />
        <p className="text-lg">Loading map component...</p>
      </div>
    </div>
  ),
})

export default function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [yearFilter, setYearFilter] = useState<number | undefined>(undefined)
  const [years, setYears] = useState<number[]>([])
  const [regionStats, setRegionStats] = useState([])
  const [yearStats, setYearStats] = useState([])
  const [typeStats, setTypeStats] = useState([])
  const [monthStats, setMonthStats] = useState([])
  const [error, setError] = useState<string | null>(null)

  // Fetch all stats data
  const fetchAllStats = async () => {
    setLoading(true)
    setError(null)
    try {
      // Fetch region stats
      const regionResponse = await fetch(`/api/fires?endpoint=stats/regions`)
      if (!regionResponse.ok) {
        throw new Error(`Region stats HTTP error! status: ${regionResponse.status}`)
      }
      const regionData = await regionResponse.json()
      setRegionStats(regionData)

      // Fetch year stats
      const yearResponse = await fetch(`/api/fires?endpoint=stats/years`)
      if (!yearResponse.ok) {
        throw new Error(`Year stats HTTP error! status: ${yearResponse.status}`)
      }
      const yearData = await yearResponse.json()
      setYearStats(yearData)

      // Extract years for the filter
      const yearsList = yearData.map((item: any) => item.year)
      setYears(yearsList.sort((a: number, b: number) => a - b))

      // Fetch fire type stats
      const typeResponse = await fetch(`/api/fires?endpoint=stats/types`)
      if (!typeResponse.ok) {
        throw new Error(`Type stats HTTP error! status: ${typeResponse.status}`)
      }
      const typeData = await typeResponse.json()
      setTypeStats(typeData)

      // Fetch monthly stats
      const monthResponse = await fetch(`/api/fires?endpoint=stats/month-year`)
      if (!monthResponse.ok) {
        throw new Error(`Month stats HTTP error! status: ${monthResponse.status}`)
      }
      const monthData = await monthResponse.json()
      setMonthStats(monthData)
    } catch (error) {
      console.error("Error fetching stats:", error)
      setError(error instanceof Error ? error.message : "Failed to load dashboard data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAllStats()
  }, [])

  // Handle year change from timeline
  const handleYearChange = (year: number) => {
    setYearFilter(year)
  }

  // Handle year filter reset
  const handleResetYearFilter = () => {
    setYearFilter(undefined)
  }

  return (
    <div className="container mx-auto py-4 px-4 lg:px-8 max-w-7xl">
      <DashboardHeader />

      <div className="flex flex-col gap-8">
        {loading ? (
          <div className="flex items-center justify-center h-96">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <span className="ml-3 text-xl">Loading dashboard data...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-96 text-center">
            <div className="text-red-500 mb-6">
              <AlertTriangle className="mx-auto mb-4 h-12 w-12" />
              <h3 className="text-2xl font-semibold">Error Loading Data</h3>
            </div>
            <p className="text-lg text-muted-foreground max-w-xl">{error}</p>
            <p className="text-base mt-6">Please check that your API server is running at http://localhost:8000</p>
            <button
              onClick={() => fetchAllStats()}
              className="mt-6 px-6 py-3 bg-primary text-white rounded-md hover:bg-primary/90 text-lg"
            >
              Try Again
            </button>
          </div>
        ) : (
          <>
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg">
              <div>
                <h2 className="text-2xl font-semibold">Data Overview</h2>
                <p className="text-base text-muted-foreground">
                  {yearFilter ? `Viewing data for ${yearFilter} - ` : "Summary of fire incidents and affected areas - "}
                  <button onClick={handleResetYearFilter} className="text-primary hover:underline font-medium">
                    {yearFilter ? "Reset filter" : "View all years"}
                  </button>
                </p>
              </div>
            </div>

            <StatsCards yearStats={yearStats} typeStats={typeStats} yearFilter={yearFilter} />

            <FireTimeline onYearChange={handleYearChange} />

            <Tabs defaultValue="map" className="w-full">
              <TabsList className="flex flex-wrap h-auto p-1 mb-2">
                <TabsTrigger value="map" className="text-base py-2 px-4">
                  Map View
                </TabsTrigger>
                <TabsTrigger value="clusters" className="text-base py-2 px-4">
                  Clusters
                </TabsTrigger>
                <TabsTrigger value="regions" className="text-base py-2 px-4">
                  By Region
                </TabsTrigger>
                <TabsTrigger value="trends" className="text-base py-2 px-4">
                  Yearly Trends
                </TabsTrigger>
                <TabsTrigger value="monthly" className="text-base py-2 px-4">
                  Monthly Patterns
                </TabsTrigger>
                <TabsTrigger value="types" className="text-base py-2 px-4">
                  Fire Types
                </TabsTrigger>
                <TabsTrigger value="advanced" className="text-base py-2 px-4">
                  Advanced
                </TabsTrigger>
                <TabsTrigger value="top" className="text-base py-2 px-4">
                  Top Fires
                </TabsTrigger>
              </TabsList>

              <TabsContent value="map" className="mt-6">
                <Card className="border-2">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-2xl">Geographic Distribution</CardTitle>
                    <CardDescription className="text-base">
                      Heatmap showing the concentration and intensity of fire incidents in Russia
                      {yearFilter ? ` for ${yearFilter}` : ""}. Toggle the map controls to show top fires and change map
                      type.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <FireMap yearFilter={yearFilter} />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="clusters" className="mt-6">
                <FireClusters yearFilter={yearFilter} />
              </TabsContent>

              <TabsContent value="regions" className="mt-6">
                <Card className="border-2">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-2xl">Fire Incidents by Region</CardTitle>
                    <CardDescription className="text-base">
                      Comparison of fire counts and affected areas across different regions
                      {yearFilter ? ` for ${yearFilter}` : ""}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[600px]">
                      <RegionBarChart data={regionStats} />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="trends" className="mt-6">
                <Card className="border-2">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-2xl">Yearly Fire Trends</CardTitle>
                    <CardDescription className="text-base">
                      Historical trends of fire incidents and affected areas over the years
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[600px]">
                      <YearLineChart data={yearStats} highlightYear={yearFilter} />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="monthly" className="mt-6">
                <div className="grid grid-cols-1 gap-6">
                  <MonthYearHeatmap yearFilter={yearFilter} />
                  <Card className="border-2">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-2xl">Monthly Fire Patterns</CardTitle>
                      <CardDescription className="text-base">
                        Seasonal patterns of fire incidents throughout the year
                        {yearFilter ? ` for ${yearFilter}` : ""}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[600px]">
                        <MonthlyTrendChart data={monthStats} />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="types" className="mt-6">
                <Card className="border-2">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-2xl">Fire Types Distribution</CardTitle>
                    <CardDescription className="text-base">
                      Breakdown of different fire types and their relative frequency
                      {yearFilter ? ` for ${yearFilter}` : ""}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[600px]">
                      <FireTypeDonutChart data={typeStats} />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="advanced" className="mt-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <RegionYearHeatmap yearFilter={yearFilter} />
                  <div className="grid grid-cols-1 gap-6">
                    <AvgAreaChart />
                    <FireDurationChart />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="top" className="mt-6">
                <TopFiresTable />
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>

      <footer className="mt-16 mb-8 text-center text-gray-500 text-sm">
        <p>© 2025 Russia On Fire - Wildfire Data Visualization Dashboard</p>
      </footer>
    </div>
  )
}
