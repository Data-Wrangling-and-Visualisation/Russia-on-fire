import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FlameIcon as Fire, AreaChart, Calendar } from "lucide-react"

interface StatsCardsProps {
  yearStats: any[]
  typeStats: any[]
  yearFilter?: number
}

export default function StatsCards({ yearStats, typeStats, yearFilter }: StatsCardsProps) {
  // Filter data by year if yearFilter is provided
  const filteredYearStats = yearFilter ? yearStats.filter((item) => item.year === yearFilter) : yearStats

  // Calculate total fires
  const totalFires = filteredYearStats.reduce((sum, item) => sum + item.count, 0)

  // Calculate total area
  const totalArea = filteredYearStats.reduce((sum, item) => sum + item.total_area, 0)

  // Get most common fire type
  const mostCommonType =
    typeStats.length > 0
      ? typeStats.reduce((prev, current) => (prev.count > current.count ? prev : current))
      : { fire_type: "Unknown", count: 0 }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <Card className="border-2 shadow-md hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xl font-bold">Total Fire Incidents</CardTitle>
          <Fire className="h-8 w-8 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold text-red-600">{totalFires.toLocaleString()}</div>
          <p className="text-base text-muted-foreground mt-2">
            {yearFilter ? `Recorded fire incidents in ${yearFilter}` : "Recorded fire incidents across all years"}
          </p>
        </CardContent>
      </Card>

      <Card className="border-2 shadow-md hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xl font-bold">Total Area Affected</CardTitle>
          <AreaChart className="h-8 w-8 text-orange-500" />
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold text-orange-600">{totalArea.toLocaleString()} ha</div>
          <p className="text-base text-muted-foreground mt-2">
            {yearFilter
              ? `Total hectares of land affected by fires in ${yearFilter}`
              : "Total hectares of land affected by fires"}
          </p>
        </CardContent>
      </Card>

      <Card className="border-2 shadow-md hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xl font-bold">Most Common Fire Type</CardTitle>
          <Calendar className="h-8 w-8 text-yellow-500" />
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold text-yellow-600">{mostCommonType.fire_type || "Unknown"}</div>
          <p className="text-base text-muted-foreground mt-2">
            {mostCommonType.count.toLocaleString()} incidents recorded
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
