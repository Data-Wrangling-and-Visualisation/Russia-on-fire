"use client"

import { useEffect, useState, useRef } from "react"
import * as d3 from "d3"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Play, Pause, SkipBack } from "lucide-react"

interface FireTimelineProps {
  onYearChange: (year: number) => void
}

export default function FireTimeline({ onYearChange }: FireTimelineProps) {
  const [yearData, setYearData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [currentYear, setCurrentYear] = useState<number | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const animationRef = useRef<number | null>(null)

  // Fetch year data
  useEffect(() => {
    const fetchYearData = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch(`/api/fires?endpoint=stats/years`)
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data = await response.json()

        // Sort by year
        const sortedData = [...data].sort((a, b) => a.year - b.year)
        setYearData(sortedData)

        // Set initial year to the first year
        if (sortedData.length > 0 && !currentYear) {
          setCurrentYear(sortedData[0].year)
          onYearChange(sortedData[0].year)
        }
      } catch (error) {
        console.error("Error fetching year data:", error)
        setError(error instanceof Error ? error.message : "Failed to load year data")
      } finally {
        setLoading(false)
      }
    }

    fetchYearData()
  }, [onYearChange])

  // Draw the chart
  useEffect(() => {
    if (!yearData.length || !svgRef.current) return

    // Clear previous chart
    d3.select(svgRef.current).selectAll("*").remove()

    // Set up dimensions
    const margin = { top: 20, right: 40, bottom: 40, left: 70 }
    const width = svgRef.current.clientWidth - margin.left - margin.right
    const height = svgRef.current.clientHeight - margin.top - margin.bottom

    // Create SVG
    const svg = d3.select(svgRef.current).append("g").attr("transform", `translate(${margin.left},${margin.top})`)

    // Set up scales
    const x = d3
      .scaleLinear()
      .domain(d3.extent(yearData, (d) => d.year) as [number, number])
      .range([0, width])

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(yearData, (d) => d.count) as number])
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
          .ticks(yearData.length),
      )
      .selectAll("text")
      .style("font-size", "14px")
      .style("font-weight", "bold")

    // Add Y axis
    svg.append("g").call(d3.axisLeft(y)).selectAll("text").style("font-size", "14px")

    // Add Y axis label
    svg
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", -margin.left + 20)
      .attr("x", -height / 2)
      .attr("text-anchor", "middle")
      .text("Number of Fires")
      .style("font-size", "16px")
      .style("font-weight", "bold")

    // Create line generator
    const line = d3
      .line<any>()
      .x((d) => x(d.year))
      .y((d) => y(d.count))
      .curve(d3.curveMonotoneX)

    // Add the line
    svg
      .append("path")
      .datum(yearData)
      .attr("fill", "none")
      .attr("stroke", "#ef4444")
      .attr("stroke-width", 3)
      .attr("d", line)

    // Add dots
    const dots = svg
      .selectAll(".dot")
      .data(yearData)
      .enter()
      .append("circle")
      .attr("class", "dot")
      .attr("cx", (d) => x(d.year))
      .attr("cy", (d) => y(d.count))
      .attr("r", (d) => (d.year === currentYear ? 8 : 6))
      .attr("fill", (d) => (d.year === currentYear ? "#ef4444" : "#9ca3af"))
      .attr("stroke", "#ffffff")
      .attr("stroke-width", 2)

    // Add hover effect
    dots
      .on("mouseover", function (event, d) {
        d3.select(this).attr("r", 10)

        // Add tooltip
        svg
          .append("text")
          .attr("class", "tooltip")
          .attr("x", x(d.year))
          .attr("y", y(d.count) - 15)
          .attr("text-anchor", "middle")
          .style("font-size", "14px")
          .style("font-weight", "bold")
          .style("fill", "#ef4444")
          .text(`${d.year}: ${d.count.toLocaleString()} fires`)
      })
      .on("mouseout", function (event, d) {
        d3.select(this).attr("r", d.year === currentYear ? 8 : 6)
        svg.selectAll(".tooltip").remove()
      })
      .on("click", (event, d) => {
        setCurrentYear(d.year)
        onYearChange(d.year)
      })

    // Highlight current year
    svg
      .selectAll(".dot")
      .filter((d: any) => d.year === currentYear)
      .attr("r", 8)
      .attr("fill", "#ef4444")

    // Add vertical line for current year
    if (currentYear) {
      const yearIndex = yearData.findIndex((d) => d.year === currentYear)
      if (yearIndex !== -1) {
        svg
          .append("line")
          .attr("class", "current-year-line")
          .attr("x1", x(currentYear))
          .attr("x2", x(currentYear))
          .attr("y1", 0)
          .attr("y2", height)
          .attr("stroke", "#ef4444")
          .attr("stroke-width", 2)
          .attr("stroke-dasharray", "6")
      }
    }
  }, [yearData, currentYear])

  // Animation logic
  useEffect(() => {
    if (isPlaying && yearData.length > 0) {
      const years = yearData.map((d) => d.year)
      const startAnimation = () => {
        const currentIndex = years.indexOf(currentYear || years[0])
        const nextIndex = (currentIndex + 1) % years.length
        setCurrentYear(years[nextIndex])
        onYearChange(years[nextIndex])

        // If we've reached the end, stop playing
        if (nextIndex === 0) {
          setIsPlaying(false)
        } else {
          animationRef.current = window.setTimeout(startAnimation, 1000)
        }
      }

      animationRef.current = window.setTimeout(startAnimation, 1000)
    }

    return () => {
      if (animationRef.current) {
        clearTimeout(animationRef.current)
      }
    }
  }, [isPlaying, currentYear, yearData, onYearChange])

  // Handle slider change
  const handleSliderChange = (value: number[]) => {
    const year = value[0]
    setCurrentYear(year)
    onYearChange(year)
  }

  // Reset to first year
  const handleReset = () => {
    if (yearData.length > 0) {
      const firstYear = yearData[0].year
      setCurrentYear(firstYear)
      onYearChange(firstYear)
    }
  }

  // Toggle play/pause
  const togglePlay = () => {
    setIsPlaying(!isPlaying)
  }

  if (loading) {
    return (
      <Card className="border-2 shadow-md">
        <CardHeader>
          <CardTitle className="text-2xl">Fire Timeline</CardTitle>
          <CardDescription className="text-base">Loading timeline data...</CardDescription>
        </CardHeader>
        <CardContent className="h-[250px] flex items-center justify-center">
          <div className="animate-pulse bg-gray-200 w-full h-[150px] rounded-md"></div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="border-2 shadow-md">
        <CardHeader>
          <CardTitle className="text-2xl">Fire Timeline</CardTitle>
          <CardDescription className="text-base text-red-500">Error: {error}</CardDescription>
        </CardHeader>
        <CardContent className="h-[250px] flex items-center justify-center">
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </CardContent>
      </Card>
    )
  }

  const years = yearData.map((d) => d.year)
  const minYear = Math.min(...years)
  const maxYear = Math.max(...years)

  return (
    <Card className="border-2 shadow-md">
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div>
            <CardTitle className="text-2xl">Fire Timeline</CardTitle>
            <CardDescription className="text-base">
              Explore fire data over time - {currentYear ? `Currently viewing: ${currentYear}` : "Select a year"}
            </CardDescription>
          </div>
          <div className="text-xl font-bold text-red-600">{currentYear ? `${currentYear}` : ""}</div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[200px] mb-8">
          <svg ref={svgRef} width="100%" height="100%"></svg>
        </div>

        <div className="flex items-center gap-6 mb-6">
          <Button variant="outline" size="lg" onClick={handleReset} className="text-base">
            <SkipBack className="h-5 w-5 mr-2" />
            Reset
          </Button>
          <Button variant="outline" size="lg" onClick={togglePlay} className="text-base">
            {isPlaying ? <Pause className="h-5 w-5 mr-2" /> : <Play className="h-5 w-5 mr-2" />}
            {isPlaying ? "Pause" : "Play"}
          </Button>
          <div className="text-lg font-medium flex-1 text-right">
            {currentYear ? `Year: ${currentYear}` : "Select a year"}
          </div>
        </div>

        <Slider
          value={[currentYear || minYear]}
          min={minYear}
          max={maxYear}
          step={1}
          onValueChange={handleSliderChange}
          className="py-4"
        />
      </CardContent>
    </Card>
  )
}
