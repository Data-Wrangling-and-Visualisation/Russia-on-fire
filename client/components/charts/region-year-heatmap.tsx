"use client"

import { useEffect, useRef, useState } from "react"
import * as d3 from "d3"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface RegionYearHeatmapProps {
  yearFilter?: number
}

export default function RegionYearHeatmap({ yearFilter }: RegionYearHeatmapProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [metric, setMetric] = useState<"count" | "total_area">("count")

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch(`/api/fires?endpoint=stats/region-year`)
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data = await response.json()
        setData(data)
      } catch (error) {
        console.error("Error fetching region-year data:", error)
        setError(error instanceof Error ? error.message : "Failed to load region-year data")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  useEffect(() => {
    if (!data.length || !svgRef.current) return

    // Clear previous chart
    d3.select(svgRef.current).selectAll("*").remove()

    // Filter data if yearFilter is provided
    const filteredData = yearFilter ? data.filter((d) => d.year === yearFilter) : data

    // Get unique regions and years
    const regions = Array.from(new Set(filteredData.map((d) => d.region_name)))
    const years = Array.from(new Set(filteredData.map((d) => d.year))).sort()

    // Set up dimensions
    const margin = { top: 50, right: 50, bottom: 150, left: 180 }
    const width = svgRef.current.clientWidth - margin.left - margin.right
    const height = Math.max(500, regions.length * 25) - margin.top - margin.bottom

    // Create SVG
    const svg = d3
      .select(svgRef.current)
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`)

    // Create scales
    const x = d3
      .scaleBand()
      .domain(years.map((d) => d.toString()))
      .range([0, width])
      .padding(0.05)

    const y = d3.scaleBand().domain(regions).range([0, height]).padding(0.05)

    // Determine max value for color scale
    const maxValue = d3.max(filteredData, (d) => (metric === "count" ? d.count : d.total_area)) as number

    // Create color scale
    const color = d3
      .scaleSequential()
      .interpolator(d3.interpolateInferno) // More vibrant color scheme
      .domain([0, maxValue])

    // Add X axis
    svg
      .append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .attr("transform", "translate(-10,0)rotate(-45)")
      .style("text-anchor", "end")
      .style("font-size", "10px")

    // Add Y axis
    svg.append("g").call(d3.axisLeft(y)).selectAll("text").style("font-size", "10px")

    // Add title
    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", -20)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .style("font-weight", "bold")
      .text(`Fire ${metric === "count" ? "Incidents" : "Area"} by Region and Year`)

    // Create tooltip
    const tooltip = d3
      .select("body")
      .append("div")
      .style("position", "absolute")
      .style("background", "rgba(0, 0, 0, 0.8)")
      .style("color", "white")
      .style("padding", "10px")
      .style("border-radius", "5px")
      .style("font-size", "12px")
      .style("pointer-events", "none")
      .style("opacity", 0)
      .style("z-index", 1000)

    // Add cells
    svg
      .selectAll()
      .data(filteredData)
      .enter()
      .append("rect")
      .attr("x", (d) => x(d.year.toString()) as number)
      .attr("y", (d) => y(d.region_name) as number)
      .attr("width", x.bandwidth())
      .attr("height", y.bandwidth())
      .style("fill", (d) => {
        const value = metric === "count" ? d.count : d.total_area
        return value > 0 ? color(value) : "#f8f9fa"
      })
      .style("stroke", "white")
      .style("stroke-width", 0.5)
      .on("mouseover", function (event, d) {
        d3.select(this).style("stroke", "black").style("stroke-width", 2).style("cursor", "pointer")

        tooltip
          .style("opacity", 1)
          .html(`
            <div>
              <strong>${d.region_name}</strong><br/>
              <strong>Year:</strong> ${d.year}<br/>
              <strong>Fires:</strong> ${d.count.toLocaleString()}<br/>
              <strong>Area:</strong> ${d.total_area.toLocaleString()} ha
            </div>
          `)
          .style("left", `${event.pageX + 10}px`)
          .style("top", `${event.pageY - 28}px`)
      })
      .on("mouseout", function () {
        d3.select(this).style("stroke", "white").style("stroke-width", 0.5)

        tooltip.style("opacity", 0)
      })

    // Add legend
    const legendWidth = 20
    const legendHeight = height / 2
    const legendX = width + 20
    const legendY = height / 4

    // Create gradient for legend
    const defs = svg.append("defs")
    const gradient = defs
      .append("linearGradient")
      .attr("id", "legend-gradient")
      .attr("x1", "0%")
      .attr("y1", "100%")
      .attr("x2", "0%")
      .attr("y2", "0%")

    // Add color stops
    const numStops = 10
    for (let i = 0; i < numStops; i++) {
      const offset = i / (numStops - 1)
      gradient
        .append("stop")
        .attr("offset", `${offset * 100}%`)
        .attr("stop-color", color(maxValue * offset))
    }

    // Add legend rectangle
    svg
      .append("rect")
      .attr("x", legendX)
      .attr("y", legendY)
      .attr("width", legendWidth)
      .attr("height", legendHeight)
      .style("fill", "url(#legend-gradient)")

    // Add legend axis
    const legendScale = d3.scaleLinear().domain([0, maxValue]).range([legendHeight, 0])

    const legendAxis = d3
      .axisRight(legendScale)
      .ticks(5)
      .tickFormat((d) => {
        if (metric === "count") {
          return d3.format(",")(d as number)
        } else {
          return d3.format(",.0f")(d as number) + " ha"
        }
      })

    svg
      .append("g")
      .attr("transform", `translate(${legendX + legendWidth}, ${legendY})`)
      .call(legendAxis)

    // Add legend title
    svg
      .append("text")
      .attr("transform", "rotate(90)")
      .attr("x", legendY + legendHeight / 2)
      .attr("y", -legendX - legendWidth - 35)
      .style("text-anchor", "middle")
      .style("font-size", "12px")
      .text(metric === "count" ? "Number of Fires" : "Total Area (ha)")

    // Clean up
    return () => {
      tooltip.remove()
    }
  }, [data, yearFilter, metric])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Region-Year Fire Distribution</CardTitle>
          <CardDescription>Loading data...</CardDescription>
        </CardHeader>
        <CardContent className="h-[500px] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Region-Year Fire Distribution</CardTitle>
          <CardDescription className="text-red-500">Error: {error}</CardDescription>
        </CardHeader>
        <CardContent className="h-[500px] flex items-center justify-center">
          <p>Failed to load data. Please try again later.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div>
            <CardTitle>Region-Year Fire Distribution</CardTitle>
            <CardDescription>
              Heatmap showing fire {metric === "count" ? "incidents" : "area"} by region and year
              {yearFilter ? ` (Filtered to ${yearFilter})` : ""}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant={metric === "count" ? "default" : "outline"} size="sm" onClick={() => setMetric("count")}>
              Fire Count
            </Button>
            <Button
              variant={metric === "total_area" ? "default" : "outline"}
              size="sm"
              onClick={() => setMetric("total_area")}
            >
              Fire Area
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <div className="min-w-[800px]">
          <svg ref={svgRef} width="100%" height="100%"></svg>
        </div>
      </CardContent>
    </Card>
  )
}
