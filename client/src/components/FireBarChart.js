import * as d3 from 'd3';
import React, { useEffect, useRef } from 'react';

function FireBarChart({ fireData, width = 600, height = 300 }) {
    const svgRef = useRef();
    const tooltipRef = useRef(); // Ref for tooltip div

    useEffect(() => {
        if (!fireData || fireData.length === 0 || !svgRef.current || width <= 0 || height <= 0) {
            d3.select(svgRef.current).selectAll("*").remove();
             return;
        }

        // --- Data Aggregation (Client-side) ---
        // Group by year and count occurrences
        const aggregatedData = Array.from(
            d3.rollup(
                fireData.filter(d => d.year != null), // Filter out entries without a year
                v => v.length, // Count entries in each group
                d => d.year    // Group by year
            ),
            ([year, count]) => ({ year: +year, count }) // Convert year back to number if needed, structure object
        ).sort((a, b) => a.year - b.year); // Sort by year


        if (aggregatedData.length === 0) {
             d3.select(svgRef.current).selectAll("*").remove(); // Clear if no data after aggregation
             return;
        }

        // --- Chart Setup ---
        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove(); // Clear previous render

        const margin = { top: 20, right: 30, bottom: 40, left: 50 };
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;

        const chartG = svg.append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        // --- Tooltip Setup ---
        const tooltip = d3.select(tooltipRef.current);
         const showTooltip = (event, d) => {
            tooltip
                .style('opacity', 1)
                .style('left', `${event.pageX + 10}px`)
                .style('top', `${event.pageY - 20}px`)
                .html(`<strong>Year:</strong> ${d.year}<br/><strong>Fires:</strong> ${d.count.toLocaleString()}`);
        };
        const moveTooltip = (event) => {
            tooltip.style('left', `${event.pageX + 10}px`).style('top', `${event.pageY - 20}px`);
        };
        const hideTooltip = () => {
            tooltip.style('opacity', 0);
        };


        // --- Scales ---
        const xScale = d3.scaleBand()
            .domain(aggregatedData.map(d => d.year))
            .range([0, innerWidth])
            .padding(0.2);

        const yScale = d3.scaleLinear()
            .domain([0, d3.max(aggregatedData, d => d.count) || 1]) // Handle case with 0 max
            .nice()
            .range([innerHeight, 0]);

        // --- Axes ---
        const xAxis = d3.axisBottom(xScale)
            .tickValues(xScale.domain().filter((d, i) => !(i % Math.ceil(aggregatedData.length / (innerWidth / 60))))) // Show fewer ticks if many years
            .tickFormat(d3.format("d")); // Format year as integer

        const yAxis = d3.axisLeft(yScale)
            .ticks(Math.max(3, Math.floor(innerHeight / 40))) // Adjust number of ticks based on height
            .tickFormat(d3.format(".2s")); // Format large numbers (e.g., 1.5k)

        chartG.append("g")
            .attr("transform", `translate(0,${innerHeight})`)
            .call(xAxis)
            .selectAll("text")
            .attr("transform", "rotate(-45)")
            .style("text-anchor", "end");

        chartG.append("g")
            .call(yAxis);

        // Axis Labels (Optional)
        chartG.append("text")
            .attr("x", innerWidth / 2)
            .attr("y", innerHeight + margin.bottom - 5)
            .attr("text-anchor", "middle")
            .style("font-size", "12px")
            .text("Year");

        chartG.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 0 - margin.left + 5)
            .attr("x", 0 - (innerHeight / 2))
            .attr("dy", "1em")
            .attr("text-anchor", "middle")
            .style("font-size", "12px")
            .text("Number of Fires");


        // --- Draw Bars ---
        chartG.selectAll(".bar")
            .data(aggregatedData)
            .join("rect")
                .attr("class", "bar")
                .attr("x", d => xScale(d.year))
                .attr("y", d => yScale(d.count))
                .attr("width", xScale.bandwidth())
                .attr("height", d => innerHeight - yScale(d.count))
                .attr("fill", "steelblue")
                 .on('mouseover', showTooltip)
                .on('mousemove', moveTooltip)
                .on('mouseleave', hideTooltip);

    }, [fireData, width, height]); // Dependencies

    return (
        <div style={{ position: 'relative', width: width, height: height }}>
            <svg ref={svgRef} width={width} height={height}></svg>
            <div
                ref={tooltipRef}
                className="tooltip" // Use same class as map or define new one
                style={{
                    position: 'absolute',
                    opacity: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    color: 'white',
                    padding: '5px 10px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    pointerEvents: 'none',
                    whiteSpace: 'nowrap',
                    transition: 'opacity 0.2s',
                }}
            ></div>
        </div>
    );
}

export default FireBarChart;