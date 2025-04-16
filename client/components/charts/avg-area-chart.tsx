"use client"

import { useEffect, useRef, useState } from "react"
import * as d3 from "d3"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

export default function AvgAreaChart() {
  const svgRef = useRef<SVGSVGElement>(null)
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch(`/api/fires?endpoint=stats/average-area-per-fire`)
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data = await response.json()
        setData(data)
      } catch (error) {
        console.error("Error fetching average area data:", error)
        setError(error instanceof Error ? error.message : "Failed to load average area data")
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

    // Sort data by average area in descending order and take top 15
    const sortedData = [...data].sort((a, b) => b.avg_area - a.avg_area).slice(0, 15)

    // Set up dimensions
    const margin = { top: 30, right: 30, bottom: 90, left: 80 }
    const width = svgRef.current.clientWidth - margin.left - margin.right
    const height = 500 - margin.top - margin.bottom

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
      .domain(sortedData.map((d) => d.region_name))
      .range([0, width])
      .padding(0.2)

    const y = d3
      .scaleLinear()
      .domain([0, (d3.max(sortedData, (d) => d.avg_area) as number) * 1.1])
      .nice()
      .range([height, 0])

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
    svg
      .append("g")
      .call(d3.axisLeft(y).tickFormat((d) => `${d3.format(",.0f")(d as number)} ha`))
      .selectAll("text")
      .style("font-size", "10px")

    // Add Y axis label
    svg
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2)
      .attr("y", -margin.left + 15)
      .style("text-anchor", "middle")
      .style("font-size", "12px")
      .text("Average Area per Fire (ha)")

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

    // Create a gradient for the bars
    const defs = svg.append("defs")
    const gradient = defs
      .append("linearGradient")
      .attr("id", "bar-gradient")
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "0%")
      .attr("y2", "100%")

    gradient.append("stop").attr("offset", "0%").attr("stop-color", "#ef4444")

    gradient.append("stop").attr("offset", "100%").attr("stop-color", "#f97316")

    // Add bars
    svg
      .selectAll(".bar")
      .data(sortedData)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", (d) => x(d.region_name) as number)
      .attr("y", (d) => y(d.avg_area))
      .attr("width", x.bandwidth())
      .attr("height", (d) => height - y(d.avg_area))
      .attr("fill", "url(#bar-gradient)")
      .attr("rx", 4) // Rounded corners
      .on("mouseover", function (event, d) {
        d3.select(this).attr("opacity", 0.8).style("cursor", "pointer")

        tooltip
          .style("opacity", 1)
          .html(`
            <div>
              <strong>${d.region_name}</strong><br/>
              <strong>Average Area:</strong> ${d.avg_area.toLocaleString()} ha per fire
            </div>
          `)
          .style("left", `${event.pageX + 10}px`)
          .style("top", `${event.pageY - 28}px`)
      })
      .on("mouseout", function () {
        d3.select(this).attr("opacity", 1)

        tooltip.style("opacity", 0)
      })

    // Add value labels on top of bars
    svg
      .selectAll(".label")
      .data(sortedData)
      .enter()
      .append("text")
      .attr("class", "label")
      .attr("x", (d) => (x(d.region_name) as number) + x.bandwidth() / 2)
      .attr("y", (d) => y(d.avg_area) - 5)
      .attr("text-anchor", "middle")
      .style("font-size", "10px")
      .style("fill", "#333")
      .text((d) => d3.format(",.0f")(d.avg_area))

    // Clean up
    return () => {
      tooltip.remove()
    }
  }, [data])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Average Area per Fire by Region</CardTitle>
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
          <CardTitle>Average Area per Fire by Region</CardTitle>
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
        <CardTitle>Average Area per Fire by Region</CardTitle>
        <CardDescription>Regions with the largest average fire size (top 15)</CardDescription>
      </CardHeader>
      <CardContent>
        <svg ref={svgRef} width="100%" height="500"></svg>
      </CardContent>
    </Card>
  )
}
