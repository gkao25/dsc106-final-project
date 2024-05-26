const svg = d3.select("svg");
const path = d3.geoPath();
const color = d3.scaleQuantize([0, 1], d3.schemeBlues[9]);

const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

d3.json("https://d3js.org/us-10m.v1.json").then(us => {
    const data = d3.csv("test_data.csv", d => {
        d.value = +d.value;
        d.average_temp = +d.average_temp;
        return d;
    }).then(data => {
        const years = Array.from(new Set(data.map(d => d.year)));
        const yearSelect = d3.select("#year");

        yearSelect.selectAll("option")
            .data(years)
            .enter()
            .append("option")
            .text(d => d)
            .attr("value", d => d);

        yearSelect.on("change", function() {
            const selectedYear = +this.value;
            updateMap(selectedYear);
        });

        function updateMap(year) {
            const yearData = data.filter(d => d.year === year);
            const valueById = {};
            yearData.forEach(d => {
                valueById[d.state] = d.value;
            });
            color.domain(d3.extent(yearData, d => d.value));

            svg.append("g")
                .selectAll("path")
                .data(topojson.feature(us, us.objects.states).features)
                .join("path")
                .attr("class", "state")
                .attr("d", path)
                .attr("fill", d => color(valueById[d.id]))
                .on("mouseover", function(event, d) {
                    tooltip.transition().duration(200).style("opacity", .9);
                    tooltip.html(`State: ${d.properties.name}<br>CO2: ${valueById[d.id]}`)
                        .style("left", (event.pageX + 5) + "px")
                        .style("top", (event.pageY - 28) + "px");
                })
                .on("mouseout", function(d) {
                    tooltip.transition().duration(500).style("opacity", 0);
                });
        }

        updateMap(years[0]);
    });
});