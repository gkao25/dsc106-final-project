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
      svg.append("g")
        .selectAll("path")
        .data(topojson.feature(us, us.objects.states).features)
        .join("path")
        .attr("d", path)
        .attr("fill", function(d) {
          const state = data.find(s => s.state === d.properties.name && s.year === select.property("value"));
          return state ? color(+state.average_temp) : "#ccc";
        })
        .on("mouseover", function(event, d) {
          const state = data.find(s => s.state === d.properties.name && s.year === select.property("value"));
          const stateData = data.filter(s => s.state === d.properties.name && s.year === select.property("value"));
          const industrialCO2 = stateData.find(s => s['sector-name'] === 'Industrial carbon dioxide emissions')?.value || 'N/A';
          const residentialCO2 = stateData.find(s => s['sector-name'] === 'Residential carbon dioxide emissions')?.value || 'N/A';
          const commercialCO2 = stateData.find(s => s['sector-name'] === 'Commercial carbon dioxide emissions')?.value || 'N/A';
          const transportationCO2 = stateData.find(s => s['sector-name'] === 'Transportation carbon dioxide emissions')?.value || 'N/A';
          const electricCO2 = stateData.find(s => s['sector-name'] === 'Electric Power carbon dioxide emissions')?.value || 'N/A';
          tooltip.html(`
              <strong>${d.properties.name}</strong><br>
              Industrial CO2: ${industrialCO2}<br>
              Residential CO2: ${residentialCO2}<br>
              Commercial CO2: ${commercialCO2}<br>
              Transportation CO2: ${transportationCO2}<br>
              Electric Power CO2: ${electricCO2}
            `)
              .style("left", (event.pageX) + "px")
              .style("top", (event.pageY - 28) + "px");
          tooltip.style("visibility", "visible");
        })
        .on("mousemove", function(event) {
          tooltip.style("top", (event.pageY - 10) + "px")
            .style("left", (event.pageX + 10) + "px");
        })
        .on("mouseout", function() {
          tooltip.style("visibility", "hidden");
        });

      // Update the map when the year changes
      select.on("change", function() {
        svg.selectAll("path")
          .attr("fill", function(d) {
            const state = data.find(s => s.state === d.properties.name && s.year === select.property("value"));
            return state ? color(+state.average_temp) : "#ccc";
          });
      });
    });
  });