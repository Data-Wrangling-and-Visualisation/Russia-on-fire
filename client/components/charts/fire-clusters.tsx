"use client"

import { useEffect, useRef, useState } from "react"
import * as d3 from "d3"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

interface FireClustersProps {
  yearFilter?: number
}

export default function FireClusters({ yearFilter }: FireClustersProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError(null)
      try {
        // Fetch region stats
        const regionResponse = await fetch(`/api/fires?endpoint=stats/regions`)
        if (!regionResponse.ok) {
          throw new Error(`HTTP error! status: ${regionResponse.status}`)
        }
        const regionData = await regionResponse.json()

        // If we have a year filter, we need to fetch data for that specific year
        if (yearFilter) {
          // This endpoint doesn't exist yet - you'll need to add it to your backend
          // For now, we'll just use the region data
          setData(regionData)
        } else {
          setData(regionData)
        }
      } catch (error) {
        console.error("Error fetching cluster data:", error)
        setError(error instanceof Error ? error.message : "Failed to load cluster data")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [yearFilter])

  useEffect(() => {
    if (!data.length || !svgRef.current) return

    // Clear previous chart
    d3.select(svgRef.current).selectAll("*").remove()

    // Set up dimensions
    const width = svgRef.current.clientWidth
    const height = svgRef.current.clientHeight

    // Create SVG
    const svg = d3.select(svgRef.current)

    // Process data for bubble chart
    const processedData = {
      children: data.map((d) => ({
        name: d.region_name,
        value: d.count,
        area: d.total_area,
      })),
    }

    // Create a color scale
    const color = d3
      .scaleLinear<string>()
      .domain([0, d3.max(data, (d) => d.count) as number])
      .range(["#fde68a", "#ef4444"])

    // Create a pack layout
    const pack = d3.pack().size([width, height]).padding(3)

    // Create hierarchy
    const root = d3.hierarchy(processedData).sum((d: any) => d.value)

    // Generate the pack layout
    const nodes = pack(root)
      .descendants()
      .filter((d) => d.depth === 1)

    // Create a tooltip
    const tooltip = d3
      .select("body")
      .append("div")
      .style("position", "absolute")
      .style("background", "rgba(0, 0, 0, 0.7)")
      .style("color", "white")
      .style("padding", "8px")
      .style("border-radius", "4px")
      .style("font-size", "12px")
      .style("pointer-events", "none")
      .style("opacity", 0)

    // Add circles
    svg
      .selectAll("circle")
      .data(nodes)
      .join("circle")
      .attr("cx", (d) => d.x)
      .attr("cy", (d) => d.y)
      .attr("r", (d) => d.r)
      .attr("fill", (d: any) => color(d.data.value))
      .attr("stroke", "#ffffff")
      .attr("stroke-width", 1)
      .style("cursor", "pointer")
      .on("mouseover", function (event, d: any) {
        d3.select(this).attr("stroke-width", 2)
        tooltip
          .style("opacity", 1)
          .html(`
            <div>
              <strong>${d.data.name}</strong><br/>
              Fires: ${d.data.value.toLocaleString()}<br/>
              Area: ${d.data.area.toLocaleString()} ha
            </div>
          `)
          .style("left", `${event.pageX + 10}px`)
          .style("top", `${event.pageY - 28}px`)
      })
      .on("mouseout", function () {
        d3.select(this).attr("stroke-width", 1)
        tooltip.style("opacity", 0)
      })

    // Add labels for larger bubbles
    svg
      .selectAll("text")
      .data(nodes.filter((d) => d.r > 30))
      .join("text")
      .attr("x", (d) => d.x)
      .attr("y", (d) => d.y)
      .attr("text-anchor", "middle")
      .attr("dy", "0.3em")
      .text((d: any) => d.data.name.substring(0, d.r / 4))
      .style("font-size", (d) => `${Math.min(d.r / 5, 12)}px`)
      .style("fill", "white")
      .style("pointer-events", "none")

    // Clean up
    return () => {
      tooltip.remove()
    }
  }, [data])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Fire Clusters by Region</CardTitle>
          <CardDescription>Loading cluster data...</CardDescription>
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
          <CardTitle>Fire Clusters by Region</CardTitle>
          <CardDescription className="text-red-500">Error: {error}</CardDescription>
        </CardHeader>
        <CardContent className="h-[400px] flex items-center justify-center">
          <p>Failed to load cluster data. Please try again later.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fire Clusters by Region</CardTitle>
        <CardDescription>
          Bubble size represents the number of fires in each region
          {yearFilter ? ` for ${yearFilter}` : ""}
        </CardDescription>
      </CardHeader>
      <CardContent className="h-[400px]">
        <svg ref={svgRef} width="100%" height="100%"></svg>
      </CardContent>
    </Card>
  )
}
