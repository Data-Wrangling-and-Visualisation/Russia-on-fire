"use client"

import { useEffect, useRef } from "react"
import * as d3 from "d3"

interface MonthlyTrendChartProps {
  data: any[]
}

export default function MonthlyTrendChart({ data }: MonthlyTrendChartProps) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!data || data.length === 0 || !svgRef.current) return

    // Sort data by month
    const sortedData = [...data].sort((a, b) => a.month - b.month)

    // Map month numbers to names
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ]

    // Add month names to data
    const enhancedData = sortedData.map((d) => ({
      ...d,
      monthName: monthNames[d.month - 1],
    }))

    // Clear previous chart
    d3.select(svgRef.current).selectAll("*").remove()

    // Set up dimensions
    const margin = { top: 20, right: 80, bottom: 60, left: 60 }
    const width = svgRef.current.clientWidth - margin.left - margin.right
    const height = svgRef.current.clientHeight - margin.top - margin.bottom

    // Create SVG
    const svg = d3.select(svgRef.current).append("g").attr("transform", `translate(${margin.left},${margin.top})`)

    // Set up scales
    const x = d3
      .scaleBand()
      .domain(enhancedData.map((d) => d.monthName))
      .range([0, width])
      .padding(0.2)

    const yCount = d3
      .scaleLinear()
      .domain([0, d3.max(enhancedData, (d) => d.count) as number])
      .nice()
      .range([height, 0])

    const yArea = d3
      .scaleLinear()
      .domain([0, d3.max(enhancedData, (d) => d.total_area) as number])
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

    // Add X axis label
    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", height + margin.bottom - 10)
      .style("text-anchor", "middle")
      .text("Month")
      .style("font-size", "14px")

    // Add Y axis for count
    svg.append("g").call(d3.axisLeft(yCount)).selectAll("text").style("font-size", "12px")

    // Add Y axis label for count
    svg
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", -margin.left + 15)
      .attr("x", -height / 2)
      .attr("text-anchor", "middle")
      .text("Number of Fires")
      .style("font-size", "14px")
      .style("fill", "#ef4444")

    // Add Y axis for area
    svg
      .append("g")
      .attr("transform", `translate(${width}, 0)`)
      .call(d3.axisRight(yArea))
      .selectAll("text")
      .style("font-size", "12px")

    // Add Y axis label for area
    svg
      .append("text")
      .attr("transform", "rotate(90)")
      .attr("y", -width - margin.right + 15)
      .attr("x", height / 2)
      .attr("text-anchor", "middle")
      .text("Total Area (ha)")
      .style("font-size", "14px")
      .style("fill", "#3b82f6")

    // Add bars for count
    svg
      .selectAll(".bar-count")
      .data(enhancedData)
      .enter()
      .append("rect")
      .attr("class", "bar-count")
      .attr("x", (d) => (x(d.monthName) as number) + x.bandwidth() / 4)
      .attr("width", x.bandwidth() / 2)
      .attr("y", (d) => yCount(d.count))
      .attr("height", (d) => height - yCount(d.count))
      .attr("fill", "#ef4444")
      .attr("opacity", 0.8)

    // Create line generator for area
    const lineArea = d3
      .line<any>()
      .x((d) => (x(d.monthName) as number) + x.bandwidth() / 2)
      .y((d) => yArea(d.total_area))
      .curve(d3.curveMonotoneX)

    // Add area line
    svg
      .append("path")
      .datum(enhancedData)
      .attr("fill", "none")
      .attr("stroke", "#3b82f6")
      .attr("stroke-width", 2)
      .attr("d", lineArea)

    // Add dots for area
    svg
      .selectAll(".dot-area")
      .data(enhancedData)
      .enter()
      .append("circle")
      .attr("class", "dot-area")
      .attr("cx", (d) => (x(d.monthName) as number) + x.bandwidth() / 2)
      .attr("cy", (d) => yArea(d.total_area))
      .attr("r", 5)
      .attr("fill", "#3b82f6")

    // Add legend
    const legend = svg.append("g").attr("transform", `translate(${width - 120}, 0)`)

    // Count legend
    legend
      .append("rect")
      .attr("x", 0)
      .attr("y", 5)
      .attr("width", 10)
      .attr("height", 10)
      .attr("fill", "#ef4444")
      .attr("opacity", 0.8)

    legend.append("text").attr("x", 15).attr("y", 15).text("Fire Count").style("font-size", "12px")

    // Area legend
    legend.append("circle").attr("cx", 5).attr("cy", 30).attr("r", 5).attr("fill", "#3b82f6")

    legend.append("text").attr("x", 15).attr("y", 35).text("Area (ha)").style("font-size", "12px")

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

    // Add tooltip interaction for bars
    svg
      .selectAll(".bar-count")
      .on("mouseover", function (event, d) {
        d3.select(this).attr("opacity", 1)
        tooltip
          .style("opacity", 1)
          .html(`
            <div>
              <strong>${d.monthName}</strong><br/>
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

    // Add tooltip interaction for dots
    svg
      .selectAll(".dot-area")
      .on("mouseover", function (event, d) {
        d3.select(this).attr("r", 7)
        tooltip
          .style("opacity", 1)
          .html(`
            <div>
              <strong>${d.monthName}</strong><br/>
              Fires: ${d.count.toLocaleString()}<br/>
              Area: ${d.total_area.toLocaleString()} ha
            </div>
          `)
          .style("left", `${event.pageX + 10}px`)
          .style("top", `${event.pageY - 28}px`)
      })
      .on("mouseout", function () {
        d3.select(this).attr("r", 5)
        tooltip.style("opacity", 0)
      })

    // Clean up
    return () => {
      tooltip.remove()
    }
  }, [data])

  return <svg ref={svgRef} width="100%" height="100%"></svg>
}
