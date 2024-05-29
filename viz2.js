const svg2 = d3.select("#map2");
const path2 = d3.geoPath();
const color2 = d3.scaleQuantize().range(d3.schemeReds[9]);
const tooltip2 = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

Promise.all([
    d3.json("https://d3js.org/us-10m.v1.json"),
    d3.csv("data/test_data.csv")
]).then(([us, data]) => {
    data.forEach(d => {
        d.value = +d.value;
        d.year = +d.year;
    });

    const years = Array.from(new Set(data.map(d => d.year)));
    const yearSelect2 = d3.select("#year2");

    yearSelect2.selectAll("option")
        .data(years)
        .enter()
        .append("option")
        .text(d => d)
        .attr("value", d => d);

    yearSelect2.on("change", function(event) {
        const selectedYear = +this.value;
        updateMap2(selectedYear);
    });

    updateMap2(years[0]);

    function updateMap2(year) {
        const yearData = data.filter(d => d.year === year);
        const valueByState = {};
        yearData.forEach(d => {
            valueByState[d.state] = d.value;
        });

        color2.domain(d3.extent(yearData, d => d.value));

        svg2.selectAll("path").remove();

        svg2.append("g")
            .selectAll("path")
            .data(topojson.feature(us, us.objects.states).features)
            .join("path")
            .attr("class", "state")
            .attr("d", path2)
            .attr("fill", d => {
                const state = d.properties.name;
                return valueByState[state] ? color2(valueByState[state]) : "#ccc";
            })
            .on("mouseover", function(event, d) {
                const state = d.properties.name;
                const value = valueByState[state] || 0;
                tooltip2.transition().duration(200).style("opacity", .9);
                tooltip2.html(`State: ${state}<br>CO2: ${value}`)
                    .style("left", (event.pageX + 5) + "px")
                    .style("top", (event.pageY - 28) + "px");
            })
            .on("mousemove", function(event) {
                tooltip2
                    .style("left", (event.pageX + 5) + "px")
                    .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", function() {
                tooltip2.transition().duration(500).style("opacity", 0);
            });
    }
}).catch(error => {
    console.error('Error loading or processing data:', error);
});