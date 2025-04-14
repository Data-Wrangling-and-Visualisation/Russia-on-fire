import * as d3 from 'd3';
import React, { useEffect, useRef } from 'react';

// Simple debounce function
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}


function FireMap({ fireData, width = 800, height = 500 }) {
  const svgRef = useRef();
  const tooltipRef = useRef(); // Ref for a div-based tooltip

  // Debounce the resize handler
  const debouncedResize = useRef(
    debounce(() => {
      // Logic to potentially re-render or adjust the chart on resize
      // For this example, we rely on useEffect re-running if width/height props change
      // console.log("Resize detected, re-rendering might be needed if dimensions changed.");
    }, 250)
  ).current;

  useEffect(() => {
    window.addEventListener('resize', debouncedResize);
    return () => {
      window.removeEventListener('resize', debouncedResize);
    };
  }, [debouncedResize]);


  useEffect(() => {
    if (!fireData || fireData.length === 0 || !svgRef.current || width <= 0 || height <= 0) {
        // Clear SVG if no data or invalid dimensions
        d3.select(svgRef.current).selectAll("*").remove();
        return;
    }

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous renders on data change

    const currentWidth = svg.node().getBoundingClientRect().width || width;
    const currentHeight = height; // Use prop height directly

    // --- Tooltip Setup ---
    const tooltip = d3.select(tooltipRef.current);
    const showTooltip = (event, d) => {
        tooltip
            .style('opacity', 1)
            .style('left', `${event.pageX + 15}px`)
            .style('top', `${event.pageY - 10}px`)
            .html(`
                <strong>Region:</strong> ${d.region_name}<br/>
                <strong>Year:</strong> ${d.year || 'N/A'}<br/>
                <strong>Type:</strong> ${d.fire_type || 'N/A'}<br/>
                <strong>Area:</strong> ${d.area_total != null ? d.area_total.toLocaleString() + ' ha' : 'N/A'}<br/>
                <strong>Coords:</strong> ${d.latitude?.toFixed(4)}, ${d.longitude?.toFixed(4)}
            `);
    };
    const moveTooltip = (event, d) => {
        tooltip
            .style('left', `${event.pageX + 15}px`)
            .style('top', `${event.pageY - 10}px`);
    };
    const hideTooltip = () => {
        tooltip.style('opacity', 0);
    };

    // --- Projection ---
    // Create a GeoJSON feature collection for fitting
    const geoJsonFeatures = {
        type: "FeatureCollection",
        features: fireData.map(d => ({
            type: "Feature",
            properties: d, // Keep original data accessible
            geometry: { type: "Point", coordinates: [d.longitude, d.latitude] }
        }))
    };

    const projection = d3.geoMercator()
      .fitSize([currentWidth, currentHeight], geoJsonFeatures)
      // Add some padding
      .fitExtent([[20, 20], [currentWidth - 20, currentHeight - 20]], geoJsonFeatures);

    // --- Scales ---
    // Use square root scale for area mapping to radius
    const radiusScale = d3.scaleSqrt()
      // Use d3.extent to find min/max, handle null/0 areas
      .domain(d3.extent(fireData, d => d.area_total > 0 ? d.area_total : null))
      .range([2, 20]) // Min 2px, Max 20px radius
      .clamp(true); // Prevent values outside range

    const colorScale = d3.scaleOrdinal()
        .domain(['Лесные', 'Нелесные', null, undefined]) // Handle missing types
        .range(['#ff8c00', '#8b4513', '#cccccc']); // Orange, Brown, Gray for others


    // --- Draw Fire Points ---
    svg.append('g')
      .selectAll('circle')
      .data(geoJsonFeatures.features) // Use the GeoJSON features array
      .join('circle')
        .attr('cx', d => projection(d.geometry.coordinates)[0])
        .attr('cy', d => projection(d.geometry.coordinates)[1])
        .attr('r', d => radiusScale(d.properties.area_total || 0)) // Use 0 for null/undefined area
        .attr('fill', d => colorScale(d.properties.fire_type))
        .attr('fill-opacity', 0.6)
        .attr('stroke', '#333')
        .attr('stroke-width', 0.5)
        .style('cursor', 'pointer')
        .on('mouseover', showTooltip)
        .on('mousemove', moveTooltip)
        .on('mouseleave', hideTooltip);

    // --- Optional: Add Zoom/Pan ---
    // const zoom = d3.zoom()
    //     .scaleExtent([0.5, 8]) // Min/max zoom level
    //     .on('zoom', (event) => {
    //         svg.select('g').attr('transform', event.transform);
    //     });
    // svg.call(zoom);

  }, [fireData, width, height]); // Re-run effect if data or dimensions change

  return (
      <div style={{ position: 'relative', width: width, height: height }}>
          <svg ref={svgRef} width={width} height={height}></svg>
          <div
              ref={tooltipRef}
              className="tooltip"
              style={{
                  position: 'absolute', // Position relative to the container
                  opacity: 0,
                  backgroundColor: 'rgba(0, 0, 0, 0.7)',
                  color: 'white',
                  padding: '5px 10px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  pointerEvents: 'none', // Important so it doesn't block mouse events on SVG
                  whiteSpace: 'nowrap',
                  transition: 'opacity 0.2s',
              }}
          ></div>
      </div>
  );
}

export default FireMap;