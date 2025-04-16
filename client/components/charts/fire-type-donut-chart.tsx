"use client"

import { useEffect, useRef } from "react"
import * as d3 from "d3"

interface FireTypeDonutChartProps {
  data: any[]
}

export default function FireTypeDonutChart({ data }: FireTypeDonutChartProps) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!data || data.length === 0 || !svgRef.current) return

    // Clear previous chart
    d3.select(svgRef.current).selectAll("*").remove()

    // Set up dimensions
    const width = svgRef.current.clientWidth
    const height = svgRef.current.clientHeight
    const margin = 40
    const radius = Math.min(width, height) / 2 - margin

    // Create SVG
    const svg = d3
      .select(svgRef.current)
      .append("g")
      .attr("transform", `translate(${width / 2}, ${height / 2})`)

    // Set up color scale
    const color = d3
      .scaleOrdinal()
      .domain(data.map((d) => d.fire_type))
      .range(d3.schemeCategory10)

    // Compute the position of each group on the pie
    const pie = d3
      .pie<any>()
      .sort(null)
      .value((d) => d.count)

    const data_ready = pie(data)

    // Build the pie chart
    const arcGenerator = d3
      .arc<any>()
      .innerRadius(radius * 0.5)
      .outerRadius(radius)

    // Add the arcs
    svg
      .selectAll("path")
      .data(data_ready)
      .join("path")
      .attr("d", arcGenerator)
      .attr("fill", (d) => color(d.data.fire_type) as string)
      .attr("stroke", "white")
      .style("stroke-width", "2px")
      .style("opacity", 0.8)

    // Add labels
    const labelArc = d3
      .arc<any>()
      .innerRadius(radius * 0.8)
      .outerRadius(radius * 0.8)

    // Add tooltip
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

    // Add tooltip interaction
    svg
      .selectAll("path")
      .on("mouseover", function (event, d) {
        d3.select(this).style("opacity", 1)
        tooltip
          .style("opacity", 1)
          .html(`
            <div>
              <strong>${d.data.fire_type}</strong><br/>
              Count: ${d.data.count.toLocaleString()}<br/>
              Area: ${d.data.total_area.toLocaleString()} ha<br/>
              Percentage: ${((d.data.count / data.reduce((sum, item) => sum + item.count, 0)) * 100).toFixed(1)}%
            </div>
          `)
          .style("left", `${event.pageX + 10}px`)
          .style("top", `${event.pageY - 28}px`)
      })
      .on("mouseout", function () {
        d3.select(this).style("opacity", 0.8)
        tooltip.style("opacity", 0)
      })

    // Add legend
    const legend = svg.append("g").attr("transform", `translate(${radius + 20}, ${-radius})`)

    data.forEach((d, i) => {
      const legendRow = legend.append("g").attr("transform", `translate(0, ${i * 20})`)

      legendRow
        .append("rect")
        .attr("width", 10)
        .attr("height", 10)
        .attr("fill", color(d.fire_type) as string)

      legendRow.append("text").attr("x", 15).attr("y", 10).text(d.fire_type).style("font-size", "12px")
    })

    // Clean up
    return () => {
      tooltip.remove()
    }
  }, [data])

  return <svg ref={svgRef} width="100%" height="100%"></svg>
}
