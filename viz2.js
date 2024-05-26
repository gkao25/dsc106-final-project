const svg = d3.select("svg");
const path = d3.geoPath();
const color = d3.scaleQuantize([0, 1], d3.schemeBlues[9]);

const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

// Load the US map and the aggregated data
Promise.all([
    d3.json("https://d3js.org/us-10m.v1.json"),
    d3.csv("test_data.csv")
]).then(([us, data]) => {
    // Convert data to appropriate types
    data.forEach(d => {
        d.value = +d.value;
        d.year = +d.year;
    });

    // Extract years for the dropdown
    const years = Array.from(new Set(data.map(d => d.year)));
    const yearSelect = d3.select("#year");

    yearSelect.selectAll("option")
        .data(years)
        .enter()
        .append("option")
        .text(d => d)
        .attr("value", d => d);

    // Update the map when a new year is selected
    yearSelect.on("change", function() {
        const selectedYear = +this.value;
        updateMap(selectedYear);
    });

    // Initial map update
    updateMap(years[0]);

    function updateMap(year) {
        const yearData = data.filter(d => d.year === year);
        const valueByState = {};
        yearData.forEach(d => {
            valueByState[d.state] = d.value;
        });

        // Set color domain based on data range
        color.domain(d3.extent(yearData, d => d.value));

        // Remove existing paths before adding new ones
        svg.selectAll("path").remove();

        svg.append("g")
            .selectAll("path")
            .data(topojson.feature(us, us.objects.states).features)
            .join("path")
            .attr("class", "state")
            .attr("d", path)
            .attr("fill", d => {
                const state = d.properties.name;
                return valueByState[state] ? color(valueByState[state]) : "#ccc";
            })
            .on("mouseover", function(event, d) {
                const state = d.properties.name;
                const value = valueByState[state] || 0;
                tooltip.transition().duration(200).style("opacity", .9);
                tooltip.html(`State: ${state}<br>CO2: ${value}`)
                    .style("left", (event.pageX + 5) + "px")
                    .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", function() {
                tooltip.transition().duration(500).style("opacity", 0);
            });
    }
}).catch(error => {
    console.error('Error loading or processing data:', error);
});