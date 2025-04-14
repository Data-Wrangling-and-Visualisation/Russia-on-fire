// Map Visualization - Full Window
const mapWidth = window.innerWidth;
const mapHeight = window.innerHeight - 80; // Subtract header height

const svg = d3.select("svg#map");
const g = svg.append("g");

const tooltip = d3.select("#tooltip");

// Projection
const projection = d3.geoMercator()
  .center([100, 60])
  .scale(500)
  .translate([mapWidth / 2, mapHeight / 2]);

const path = d3.geoPath().projection(projection);

// Create a style block and add it to the document's head
const style = document.createElement('style');
style.innerHTML = `
  #toggle-zoom {
    position: absolute;
    top: 20px;
    right: 20px;
    z-index: 1000;
    background-color: white;
    padding: 8px 12px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    box-shadow: 0 0 8px rgba(0,0,0,0.3);
  }

  @media screen and (max-width: 600px) {
    #toggle-zoom {
      top: 10px;
      right: 10px;
    }
  }
`;
document.head.appendChild(style);


// Zoom + Pan with clamping
let zoomEnabled = false;

const zoom = d3.zoom()
  .scaleExtent([0.5, 10])
  .on("zoom", (event) => {
    const { transform } = event;
    const maxX = mapWidth / 2;
    const maxY = mapHeight / 2;
    const minX = -mapWidth * transform.k + mapWidth / 2;
    const minY = -mapHeight * transform.k + mapHeight / 2;

    const clampedX = Math.max(minX, Math.min(maxX, transform.x));
    const clampedY = Math.max(minY, Math.min(maxY, transform.y));

    g.attr("transform", `translate(${clampedX},${clampedY}) scale(${transform.k})`);

});

svg.call(zoom)

// 2. Button Logic
// const toggleButton = document.getElementById("toggle-zoom");

// toggleButton.addEventListener("click", () => {
//   zoomEnabled = !zoomEnabled;

//   if (zoomEnabled) {
//     // Enable zoom and scroll interaction
//     toggleButton.textContent = "Disable Zoom";
//     svg.call(zoom);  // Enable zoom interaction
//     svg.on("wheel.zoom", (event) => event.preventDefault()); // Allow scroll zoom
//   } else {
//     // Disable zoom and scroll interaction
//     toggleButton.textContent = "Enable Zoom";
//     svg.on("wheel.zoom", null);  // Disable scroll zoom
//     svg.on(".zoom", null);  // Disable zoom events entirely
//   }
// });

// Color scales
const fireColorScale = d3.scaleOrdinal()
  .domain(["Forest Fire", "Other"])
  .range(["#ff5722", "#9e9e9e"]);

const areaScale = d3.scaleSqrt()
  .range([3, 15]); // Radius range for fire circles

// Parse date strings
const parseDate = d3.timeParse("%d.%m.%Y");

// Your enhanced fire data
const fireData = [
  {
    "region": "Adygey",
    "year": 2020,
    "type": "Forest Fire",
    "latitude": 44.5,
    "longitude": 40.2,
    "date_beginning": "28.05.2017",
    "area_beginning": 10,
    "area_total": 100,
    "date_end": "28.05.2017"
  },
  {
    "region": "Altay",
    "year": 2021,
    "type": "Other",
    "latitude": 51.0,
    "longitude": 85.0,
    "date_beginning": "23.05.2005",
    "area_beginning": 5,
    "area_total": 50,
    "date_end": "23.05.2005"
  },
  // Add more sample data points
  {
    "region": "Krasnoyarsk Krai",
    "year": 2019,
    "type": "Forest Fire",
    "latitude": 58.0,
    "longitude": 93.0,
    "date_beginning": "15.07.2019",
    "area_beginning": 20,
    "area_total": 500,
    "date_end": "20.07.2019"
  },
  {
    "region": "Sakha Republic",
    "year": 2018,
    "type": "Forest Fire",
    "latitude": 66.0,
    "longitude": 129.0,
    "date_beginning": "10.08.2018",
    "area_beginning": 15,
    "area_total": 300,
    "date_end": "18.08.2018"
  }
].map(d => ({
  ...d,
  date_beginning: parseDate(d.date_beginning),
  date_end: parseDate(d.date_end),
  month: parseDate(d.date_beginning).getMonth()
}));

// Process fire data to get max area for scaling
const maxArea = d3.max(fireData, d => d.area_total);
areaScale.domain([0, maxArea]);

// Load TopoJSON and create visualization
d3.json("russia.topo.json").then(function(topoData) {
    // Convert TopoJSON to GeoJSON
    const geoData = topojson.feature(topoData, topoData.objects['russia.topo']);

    // Calculate total fire area per region for coloring
    const regionFireTotals = d3.rollup(
      fireData,
      v => d3.sum(v, d => d.area_total),
      d => d.region
    );

    // Color scale for regions based on fire area
    const regionColorScale = d3.scaleSequential(d3.interpolateOranges)
      .domain([0, d3.max(Array.from(regionFireTotals.values()))]);

    // Draw the regions
    const regions = g.append("g")
        .selectAll("path")
        .data(geoData.features)
        .enter()
        .append("path")
        .attr("d", path)
        .attr("fill", d => {
          const regionName = d.properties.NAME_1;
          const totalArea = regionFireTotals.get(regionName) || 0;
          return totalArea > 0 ? regionColorScale(totalArea) : "#e0f7fa";
        })
        .attr("stroke", "#00796b")
        .attr("stroke-width", 1.)
        .on("mouseover", function(event, d) {
            const regionName = d.properties.NAME_1;
            const regionFires = fireData.filter(f => f.region === regionName);
            const totalArea = regionFireTotals.get(regionName) || 0;

            // Move this element to top so border is visible
            this.parentNode.appendChild(this);

            d3.select(this)
              .attr("stroke", "#ff5722")
              .attr("stroke-width", 2);

            tooltip.style("display", "block")
                   .html(`<strong>${regionName}</strong><br>
                          Total Fire Area: ${totalArea.toLocaleString()} ha<br>
                          Number of Fires: ${regionFires.length}<br>`)
                   .style("left", (event.pageX + 10) + "px")
                   .style("top", (event.pageY - 28) + "px");

            d3.selectAll("circle.fire-point")
              .attr("opacity", p => p.region === regionName ? 1 : 0.2);
        })
        .on("mouseout", function(d) {
            d3.select(this)
              .attr("stroke", "#00796b")
              .attr("stroke-width", 1.2);

            tooltip.style("display", "none");

            d3.selectAll("circle.fire-point")
              .attr("opacity", 0.7);
        });


    // Add fire incidents to the map
    const firePoints = g.append("g")
        .selectAll("circle")
        .data(fireData)
        .enter()
        .append("circle")
        .attr("class", "fire-point")
        .attr("cx", d => projection([d.longitude, d.latitude])[0])
        .attr("cy", d => projection([d.longitude, d.latitude])[1])
        .attr("r", d => areaScale(d.area_total))
        .attr("fill", d => fireColorScale(d.type))
        .attr("opacity", 0.7)
        .attr("stroke", "#fff")
        .attr("stroke-width", 0.5)
        .on("mouseover", function(event, d) {
            d3.select(this).attr("opacity", 1).attr("stroke-width", 2);

            // Format date
            const formatDate = d3.timeFormat("%d %b %Y");

            tooltip.style("display", "block")
                   .html(`<strong>${d.region}</strong><br>
                          Type: ${d.type}<br>
                          Year: ${d.year}<br>
                          Month: ${d3.timeFormat("%B")(d.date_beginning)}<br>
                          Total Area: ${d.area_total.toLocaleString()} ha<br>
                          Dates: ${formatDate(d.date_beginning)} to ${formatDate(d.date_end)}`)
                   .style("left", (event.pageX + 10) + "px")
                   .style("top", (event.pageY - 28) + "px");

            // Highlight the region
            regions.filter(r => r.properties.NAME_1 === d.region)
              .attr("stroke", "#ff5722")
              .attr("stroke-width", 2);
        })
        .on("mouseout", function(d) {
            d3.select(this).attr("opacity", 0.7).attr("stroke-width", 0.5);
            tooltip.style("display", "none");

            // Reset region highlight
            regions.filter(r => r.properties.NAME_1 === d.region)
              .attr("stroke", "#00796b")
              .attr("stroke-width", 1.2);
        });

    // Add region names
    g.append("g")
    .selectAll("text")
    .data(geoData.features.filter(d => d.properties.ENGTYPE_1 === "Region"))
    .enter()
    .append("text")
    .attr("x", d => path.centroid(d)[0])
    .attr("y", d => path.centroid(d)[1])
    .attr("text-anchor", "middle")
    .attr("fill", "#00796b")
    .attr("font-size", "6px")
    .text(d => d.properties.NAME_1)
    .style("pointer-events", "none")
    .attr("user-select", "none")
    .style("pointer-events", "none")
    .attr("user-select", "none");


    // Add legend for fire points
    const legend = g.append("g")
      .attr("transform", `translate(${mapWidth - 50},${mapHeight - 150})`);

    // Fire type legend
    legend.append("text")
      .attr("x", 0)
      .attr("y", 0)
      .text("Fire Types")
      .attr("font-weight", "bold");

    const fireTypes = ["Forest Fire", "Other Fire"];
    legend.selectAll(".fire-legend")
      .data(fireTypes)
      .enter()
      .append("g")
      .attr("transform", (d, i) => `translate(0,${(i + 1) * 20})`)
      .each(function(d) {
        d3.select(this).append("circle")
          .attr("r", 6)
          .attr("fill", fireColorScale(d));

        d3.select(this).append("text")
          .attr("x", 15)
          .attr("dy", "0.35em")
          .text(d);
      });
});

// Bar Chart Visualization
const margin = { top: 20, right: 30, bottom: 100, left: 60 };
const chartWidth = Math.min(1000, window.innerWidth - 40) - margin.left - margin.right;
const chartHeight = 400 - margin.top - margin.bottom;

const svgChart = d3.select("#chart")
  .append("svg")
  .attr("width", chartWidth + margin.left + margin.right)
  .attr("height", chartHeight + margin.top + margin.bottom)
  .append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

// Scales
const x = d3.scaleBand().range([0, chartWidth]).padding(0.2);
const y = d3.scaleLinear().range([chartHeight, 0]);

// Axes groups
const xAxisGroup = svgChart.append("g")
  .attr("class", "x axis")
  .attr("transform", `translate(0, ${chartHeight})`);
const yAxisGroup = svgChart.append("g")
  .attr("class", "y axis");

// Add y-axis label
svgChart.append("text")
  .attr("transform", "rotate(-90)")
  .attr("y", 0 - margin.left)
  .attr("x", 0 - (chartHeight / 2))
  .attr("dy", "1em")
  .style("text-anchor", "middle")
  .text("Area Burned (ha)");

// Add chart title
svgChart.append("text")
  .attr("x", chartWidth / 2)
  .attr("y", 0 - margin.top / 2)
  .attr("text-anchor", "middle")
  .style("font-size", "16px")
  .style("font-weight", "bold")
  .text("Top Regions by Fire Area");

// Function to Update Both Map and Chart
function updateVisualization(selectedYear) {
  // Filter data for the selected year
  const yearData = fireData.filter(d => d.year === selectedYear);

  // Group by region and sum the fire area
  const regionDataMap = d3.rollup(
    yearData,
    v => d3.sum(v, d => d.area_total),
    d => d.region
  );

  // Convert to array, sort by fire area (desc) and take top 10 (or fewer)
  const sortedRegionData = Array.from(regionDataMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  updateChart(sortedRegionData, selectedYear);

  // Update fire points visibility based on year
  d3.selectAll("circle.fire-point")
    .attr("display", d => d.year === selectedYear ? "block" : "none");
}

function updateChart(regionData, year) {
  // Update domains based on new data
  x.domain(regionData.map(d => d[0]));
  y.domain([0, d3.max(regionData, d => d[1])]);

  // Bind data to bars using region name as key
  const bars = svgChart.selectAll(".bar")
    .data(regionData, d => d[0]);

  // Remove any bars that are no longer needed
  bars.exit().remove();

  // For new bars, start at the bottom with zero height for a smooth entrance
  const newBars = bars.enter().append("rect")
    .attr("class", "bar")
    .attr("x", d => x(d[0]))
    .attr("y", chartHeight)
    .attr("width", x.bandwidth())
    .attr("height", 0);

  // Merge new and existing bars, then transition to updated values
  newBars.merge(bars)
    .transition()
    .duration(750)
    .ease(d3.easeCubicOut)
    .attr("x", d => x(d[0]))
    .attr("y", d => y(d[1]))
    .attr("width", x.bandwidth())
    .attr("height", d => chartHeight - y(d[1]))
    .attr("fill", (d, i) => d3.schemeCategory10[i % 10]);

  // Transition for axes
  xAxisGroup.transition().duration(750).ease(d3.easeCubicOut)
    .call(d3.axisBottom(x))
    .selectAll("text")
    .attr("transform", "rotate(-45)")
    .style("text-anchor", "end")
    .attr("dx", "-0.8em")
    .attr("dy", "0.15em");

  yAxisGroup.transition().duration(750).ease(d3.easeCubicOut)
    .call(d3.axisLeft(y).ticks(5).tickFormat(d => d.toLocaleString()));

  // Update chart title with year
  svgChart.select("text.title")
    .text(`Top Regions by Fire Area (${year})`);
}

// Initialize the timeline slider
const slider = document.getElementById("year-slider");
const sliderLabel = document.getElementById("slider-label");

// Get year range from data
const years = [...new Set(fireData.map(d => d.year))].sort((a, b) => a - b);
const minYear = d3.min(years);
const maxYear = d3.max(years);

// Update slider attributes
slider.setAttribute("min", minYear);
slider.setAttribute("max", maxYear);
slider.setAttribute("value", maxYear); // Start with most recent year

// Add year ticks to the slider
const yearStep = Math.max(1, Math.floor((maxYear - minYear) / 5));
for (let year = minYear; year <= maxYear; year += yearStep) {
  const option = document.createElement("option");
  option.value = year;
  option.textContent = year;
  slider.appendChild(option);
}

// Initial update
sliderLabel.textContent = `Year: ${maxYear}`;
updateVisualization(maxYear);

// Update visualization when slider value changes
slider.addEventListener("input", function() {
  const year = slider.value;
  sliderLabel.textContent = `Year: ${year}`;
  updateVisualization(+year);
});

// Add event delegation for tooltip buttons
document.addEventListener('click', function(e) {
  if (e.target.classList.contains('region-detail')) {
    const region = e.target.getAttribute('data-region');
    alert(`Detailed view for ${region} would go here!\nThis could show a time series or more detailed breakdown.`);
  }
});