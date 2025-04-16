"use client"

import { useEffect, useRef } from "react"
import * as d3 from "d3"

interface YearLineChartProps {
  data: any[]
  highlightYear?: number
}

export default function YearLineChart({ data, highlightYear }: YearLineChartProps) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!data || data.length === 0 || !svgRef.current) return

    // Sort data by year
    const sortedData = [...data].sort((a, b) => a.year - b.year)

    // Clear previous chart
    d3.select(svgRef.current).selectAll("*").remove()

    // Set up dimensions
    const margin = { top: 20, right: 80, bottom: 50, left: 60 }
    const width = svgRef.current.clientWidth - margin.left - margin.right
    const height = svgRef.current.clientHeight - margin.top - margin.bottom

    // Create SVG
    const svg = d3.select(svgRef.current).append("g").attr("transform", `translate(${margin.left},${margin.top})`)

    // Set up scales
    const x = d3
      .scaleLinear()
      .domain(d3.extent(sortedData, (d) => d.year) as [number, number])
      .range([0, width])

    const yCount = d3
      .scaleLinear()
      .domain([0, d3.max(sortedData, (d) => d.count) as number])
      .nice()
      .range([height, 0])

    const yArea = d3
      .scaleLinear()
      .domain([0, d3.max(sortedData, (d) => d.total_area) as number])
      .nice()
      .range([height, 0])

    // Add X axis
    svg
      .append("g")
      .attr("transform", `translate(0,${height})`)
      .call(
        d3
          .axisBottom(x)
          .tickFormat((d) => d.toString())
          .ticks(sortedData.length),
      )
      .selectAll("text")
      .style("font-size", "12px")

    // Add X axis label
    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", height + margin.bottom - 10)
      .style("text-anchor", "middle")
      .text("Year")
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

    // Create line generator for count
    const lineCount = d3
      .line<any>()
      .x((d) => x(d.year))
      .y((d) => yCount(d.count))
      .curve(d3.curveMonotoneX)

    // Create line generator for area
    const lineArea = d3
      .line<any>()
      .x((d) => x(d.year))
      .y((d) => yArea(d.total_area))
      .curve(d3.curveMonotoneX)

    // Add count line
    svg
      .append("path")
      .datum(sortedData)
      .attr("fill", "none")
      .attr("stroke", "#ef4444")
      .attr("stroke-width", 2)
      .attr("d", lineCount)

    // Add area line
    svg
      .append("path")
      .datum(sortedData)
      .attr("fill", "none")
      .attr("stroke", "#3b82f6")
      .attr("stroke-width", 2)
      .attr("d", lineArea)

    // Add dots for count
    svg
      .selectAll(".dot-count")
      .data(sortedData)
      .enter()
      .append("circle")
      .attr("class", "dot-count")
      .attr("cx", (d) => x(d.year))
      .attr("cy", (d) => yCount(d.count))
      .attr("r", (d) => (d.year === highlightYear ? 8 : 5))
      .attr("fill", (d) => (d.year === highlightYear ? "#ef4444" : "#f87171"))
      .attr("stroke", "#ffffff")
      .attr("stroke-width", (d) => (d.year === highlightYear ? 2 : 1))

    // Add dots for area
    svg
      .selectAll(".dot-area")
      .data(sortedData)
      .enter()
      .append("circle")
      .attr("class", "dot-area")
      .attr("cx", (d) => x(d.year))
      .attr("cy", (d) => yArea(d.total_area))
      .attr("r", (d) => (d.year === highlightYear ? 8 : 5))
      .attr("fill", (d) => (d.year === highlightYear ? "#3b82f6" : "#93c5fd"))
      .attr("stroke", "#ffffff")
      .attr("stroke-width", (d) => (d.year === highlightYear ? 2 : 1))

    // Add vertical line for highlighted year
    if (highlightYear) {
      const yearData = sortedData.find((d) => d.year === highlightYear)
      if (yearData) {
        svg
          .append("line")
          .attr("x1", x(highlightYear))
          .attr("x2", x(highlightYear))
          .attr("y1", 0)
          .attr("y2", height)
          .attr("stroke", "#9ca3af")
          .attr("stroke-width", 1)
          .attr("stroke-dasharray", "4")
      }
    }

    // Add legend
    const legend = svg.append("g").attr("transform", `translate(${width - 120}, 0)`)

    // Count legend
    legend.append("circle").attr("cx", 0).attr("cy", 10).attr("r", 5).attr("fill", "#ef4444")

    legend.append("text").attr("x", 10).attr("y", 15).text("Fire Count").style("font-size", "12px")

    // Area legend
    legend.append("circle").attr("cx", 0).attr("cy", 30).attr("r", 5).attr("fill", "#3b82f6")

    legend.append("text").attr("x", 10).attr("y", 35).text("Area (ha)").style("font-size", "12px")

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

    // Add tooltip interaction for count dots
    svg
      .selectAll(".dot-count")
      .on("mouseover", function (event, d) {
        d3.select(this).attr("r", d.year === highlightYear ? 10 : 7)
        tooltip
          .style("opacity", 1)
          .html(`
            <div>
              <strong>Year: ${d.year}</strong><br/>
              Fires: ${d.count.toLocaleString()}<br/>
              Area: ${d.total_area.toLocaleString()} ha
            </div>
          `)
          .style("left", `${event.pageX + 10}px`)
          .style("top", `${event.pageY - 28}px`)
      })
      .on("mouseout", function (event, d) {
        d3.select(this).attr("r", d.year === highlightYear ? 8 : 5)
        tooltip.style("opacity", 0)
      })

    // Add tooltip interaction for area dots
    svg
      .selectAll(".dot-area")
      .on("mouseover", function (event, d) {
        d3.select(this).attr("r", d.year === highlightYear ? 10 : 7)
        tooltip
          .style("opacity", 1)
          .html(`
            <div>
              <strong>Year: ${d.year}</strong><br/>
              Fires: ${d.count.toLocaleString()}<br/>
              Area: ${d.total_area.toLocaleString()} ha
            </div>
          `)
          .style("left", `${event.pageX + 10}px`)
          .style("top", `${event.pageY - 28}px`)
      })
      .on("mouseout", function (event, d) {
        d3.select(this).attr("r", d.year === highlightYear ? 8 : 5)
        tooltip.style("opacity", 0)
      })

    // Clean up
    return () => {
      tooltip.remove()
    }
  }, [data, highlightYear])

  return <svg ref={svgRef} width="100%" height="100%"></svg>
}
