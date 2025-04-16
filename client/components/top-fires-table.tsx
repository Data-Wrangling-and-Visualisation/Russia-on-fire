"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function TopFiresTable() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [limit, setLimit] = useState(10)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch(`/api/fires?endpoint=stats/top-fires&limit=${limit}`)
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data = await response.json()
        setData(data)
      } catch (error) {
        console.error("Error fetching top fires data:", error)
        setError(error instanceof Error ? error.message : "Failed to load top fires data")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [limit])

  const handleShowMore = () => {
    setLimit((prev) => prev + 10)
  }

  if (loading && !data.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Largest Recorded Fires</CardTitle>
          <CardDescription>Loading data...</CardDescription>
        </CardHeader>
        <CardContent className="h-[400px] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Largest Recorded Fires</CardTitle>
          <CardDescription className="text-red-500">Error: {error}</CardDescription>
        </CardHeader>
        <CardContent className="h-[400px] flex items-center justify-center">
          <p>Failed to load data. Please try again later.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Largest Recorded Fires</CardTitle>
        <CardDescription>The most extensive fires in the dataset by total area affected</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Rank</TableHead>
                <TableHead>Region</TableHead>
                <TableHead>Year</TableHead>
                <TableHead className="text-right">Area (ha)</TableHead>
                <TableHead className="text-right">Coordinates</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((fire, index) => (
                <TableRow key={fire.fire_id}>
                  <TableCell className="font-medium">{index + 1}</TableCell>
                  <TableCell>{fire.region_name}</TableCell>
                  <TableCell>{fire.year}</TableCell>
                  <TableCell className="text-right">{fire.area_total.toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    {fire.latitude.toFixed(4)}, {fire.longitude.toFixed(4)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {loading && data.length > 0 && (
          <div className="flex justify-center mt-4">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}

        {!loading && (
          <div className="flex justify-center mt-4">
            <Button variant="outline" onClick={handleShowMore}>
              Show More
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
