"use client"

import { useEffect, useRef } from "react"
import * as d3 from "d3"

interface RegionBarChartProps {
  data: any[]
}

export default function RegionBarChart({ data }: RegionBarChartProps) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!data || data.length === 0 || !svgRef.current) return

    // Sort data by count in descending order and take top 15
    const sortedData = [...data].sort((a, b) => b.count - a.count).slice(0, 15)

    // Clear previous chart
    d3.select(svgRef.current).selectAll("*").remove()

    // Set up dimensions
    const margin = { top: 20, right: 30, bottom: 90, left: 60 }
    const width = svgRef.current.clientWidth - margin.left - margin.right
    const height = svgRef.current.clientHeight - margin.top - margin.bottom

    // Create SVG
    const svg = d3.select(svgRef.current).append("g").attr("transform", `translate(${margin.left},${margin.top})`)

    // Set up scales
    const x = d3
      .scaleBand()
      .domain(sortedData.map((d) => d.region_name))
      .range([0, width])
      .padding(0.2)

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(sortedData, (d) => d.count) as number])
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
      .style("font-size", "12px")

    // Add Y axis
    svg.append("g").call(d3.axisLeft(y)).selectAll("text").style("font-size", "12px")

    // Add Y axis label
    svg
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", -margin.left + 15)
      .attr("x", -height / 2)
      .attr("text-anchor", "middle")
      .text("Number of Fires")
      .style("font-size", "14px")

    // Add bars
    svg
      .selectAll(".bar")
      .data(sortedData)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", (d) => x(d.region_name) as number)
      .attr("width", x.bandwidth())
      .attr("y", (d) => y(d.count))
      .attr("height", (d) => height - y(d.count))
      .attr("fill", "#ef4444")
      .attr("opacity", 0.8)

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

    svg
      .selectAll(".bar")
      .on("mouseover", function (event, d) {
        d3.select(this).attr("opacity", 1)
        tooltip
          .style("opacity", 1)
          .html(`
            <div>
              <strong>${d.region_name}</strong><br/>
              Fires: ${d.count.toLocaleString()}<br/>
              Area: ${d.total_area.toLocaleString()} ha
            </div>
          `)
          .style("left", `${event.pageX + 10}px`)
          .style("top", `${event.pageY - 28}px`)
      })
      .on("mouseout", function () {
        d3.select(this).attr("opacity", 0.8)
        tooltip.style("opacity", 0)
      })

    // Clean up
    return () => {
      tooltip.remove()
    }
  }, [data])

  return <svg ref={svgRef} width="100%" height="100%"></svg>
}
