d3.csv("./data/map_data.csv").then(function(data) {
    // Extract unique years from the dataset
    const years = [...new Set(data.map(d => d.year))];

    // Populate the dropdown menu with years
    const select = d3.select("#year2");
    select.selectAll("option")
      .data(years)
      .enter()
      .append("option")
      .text(d => d);

    // Set up the map dimensions
    const width = 960;
    const height = 600;

    // Create the map svg
    const svg = d3.select("#map2")
      .append("svg")
      .attr("width", width)
      .attr("height", height);

    // Load the US states TopoJSON data
    d3.json("https://cdn.jsdelivr.net/npm/us-atlas@3/states-albers-10m.json").then(function(us) {
      // Create a path generator
      const path = d3.geoPath();

      // Create a color scale for average temperature
      const color = d3.scaleSequential()
        .domain(d3.extent(data, d => +d.average_temp))
        .interpolator(d3.interpolateLab("#85aefe", "#ff4d13"));

      // Create a tooltip
      const tooltip = d3.select("body")
        .append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("visibility", "hidden")
        .style("background-color", "white")
        .style("border", "solid")
        .style("border-width", "2px")
        .style("border-radius", "10px")
        .style("padding", "3px");

      // Draw the states
      const states = svg.append("g")
        .selectAll("path")
        .data(topojson.feature(us, us.objects.states).features)
        .join("path")
        .attr("d", path)
        .attr("fill", function(d) {
          const stateData = data.filter(s => s.state === d.properties.name && s.year === select.property("value"));
          const averageTemp = d3.mean(stateData, d => +d.average_temp);
          return averageTemp ? color(averageTemp) : "#ccc";
        })
        .on("mouseover", function(event, d) {
          const stateData = data.filter(s => s.state === d.properties.name && s.year === select.property("value"));
          const industrialCO2 = stateData.find(s => s['sector-name'] === 'Industrial carbon dioxide emissions')?.value;
          const residentialCO2 = stateData.find(s => s['sector-name'] === 'Residential carbon dioxide emissions')?.value;
          const commercialCO2 = stateData.find(s => s['sector-name'] === 'Commercial carbon dioxide emissions')?.value;
          const transportationCO2 = stateData.find(s => s['sector-name'] === 'Transportation carbon dioxide emissions')?.value;
          const electricCO2 = stateData.find(s => s['sector-name'] === 'Electric Power carbon dioxide emissions')?.value;
          const totalCO2 = Number(industrialCO2) + Number(residentialCO2) + Number(commercialCO2) + Number(transportationCO2) + Number(electricCO2);

          tooltip.transition()
            .duration(50)
            .style("opacity", .9);
          tooltip.html(`
            <strong>${d.properties.name}</strong><br>
            Industrial: ${industrialCO2}<br>
            Residential: ${residentialCO2}<br>
            Commercial: ${commercialCO2}<br>
            Transportation: ${transportationCO2}<br>
            Electric Power: ${electricCO2}<br>
            <strong>Total Emissions: ${totalCO2.toFixed(2)}</strong>
          `)
            .style("left", (event.pageX) + "px")
            .style("top", (event.pageY - 28) + "px");
          tooltip.style("visibility", "visible");
        })
        .on("mouseout", function() {
          tooltip.transition()
            .duration(500)
            .style("opacity", 0);
        });

      // Update the map when the year changes
      select.on("change", function() {
        states.transition()
          .duration(500)
          .attr("fill", function(d) {
            const stateData = data.filter(s => s.state === d.properties.name && s.year === select.property("value"));
            const averageTemp = d3.mean(stateData, d => +d.average_temp);
            return averageTemp ? color(averageTemp) : "#ccc";
          });
      });
      
    });
  });