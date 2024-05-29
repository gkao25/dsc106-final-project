// set the dimensions and margins of the graph
var margin = {top: 0, right: 210, bottom: 50, left: 100},
    width = 1400 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

// append the svg object to the body of the page
const svg = d3.select("#viz1")
  .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

//Read the data
d3.csv("./data/modified_data.csv").then( function(data) {

    // List of groups (here I have one group per column)
    const allGroup = new Set(data.map(d => d.state))

    // add the options to the button
    d3.select("#selectButton")
      .selectAll('myOptions')
     	.data(allGroup)
      .enter()
    	.append('option')
      .text(function (d) { return d; }) // text showed in the menu
      .attr("value", function (d) { return d; }) // corresponding value returned by the button

    // A color scale: one color for each group
    const myColor = d3.scaleOrdinal()
      .domain(allGroup)
      .range(d3.schemeSet2);

    // Add X axis --> it is a date format
    const x = d3.scaleLinear()
      .domain(d3.extent(data, function(d) { return d.year; }))
      .range([ 0, width ]);
    svg.append("g")
      .attr("transform", `translate(0, ${height})`)
      .call(d3.axisBottom(x).ticks(7));

    // Add Y1 axis
    const y1 = d3.scaleLinear()
      .domain([0, d3.max(data, function(d) { return +d.average_temp; })])
      .range([ height, 0 ]);
    svg.append("g")
      .attr("class", "y axis")
      .call(d3.axisLeft(y1));

    // Add second Y axis
    const y2 = d3.scaleLog()
      .domain([1, d3.max(data, function(d) { return +d.value; })])
      .range([height, 0]);
    svg.append("g")
      .attr("class", "y axis")
      .attr("transform", `translate(${width}, 0)`)
      .call(d3.axisRight(y2));

    // Initialize line for average temperature with the first group of the list
    const line1 = svg
      .append("path")
        .datum(data.filter(function(d){return d.state=="Alabama"}))
        .attr("d", d3.line()
          .x(function(d) { return x(d.year) })
          .y(function(d) { return y1(+d.average_temp) })
        )
        .attr("stroke", "#1E88E5")
        .style("stroke-width", 4)
        .style("fill", "none")

    // Initialize line for CO2 emissions with the second group of the list
    const line2 = svg
      .append("path")
        .datum(data.filter(function(d){return d.state=="Alabama"}))
        .attr("d", d3.line()
          .x(function(d) { return x(d.year) })
          .y(function(d) { return y2(+d.value) })
        )
        .attr("stroke", "#D81B60")
        .style("stroke-width", 4)
        .style("fill", "none");

    // A function that update the chart
    function update(selectedGroup) {

      // Create new data with the selection?
      const dataFilter = data.filter(function(d){return d.state==selectedGroup})

      // Give these new data to update line
      line1.datum(dataFilter)
          .transition()
          .duration(1000)
          .attr("d", d3.line()
            .x(function(d) { return x(d.year) })
            .y(function(d) { return y1(+d.average_temp) })
          )
          //.attr("stroke", function(d){ return myColor(selectedGroup) });
      line2.datum(dataFilter)
          .transition()
          .duration(1000)
          .attr("d", d3.line()
            .x(function(d) { return x(d.year); })
            .y(function(d) { return y2(+d.value); })
          );    
    }

    // When the button is changed, run the updateChart function
    d3.select("#selectButton").on("change", function(event,d) {
        // recover the option that has been chosen
        const selectedOption = d3.select(this).property("value")
        // run the updateChart function with this selected option
        update(selectedOption)
    })

    // Add labels to axes
    svg.append("text")
    .attr("class", "x label")
    .attr("text-anchor", "middle")
    .attr("x", width/2)
    .attr("y", height + 40)
    .text("Year");

    svg.append("text")
    .attr("class", "y label")
    .attr("text-anchor", "middle")
    .attr("x", -height/2)
    .attr("y", -55)
    .attr("dy", ".75em")
    .attr("transform", "rotate(-90)")
    .text("Yearly Average Temperature (°F)");

    svg.append("text")
    .attr("class", "y label")
    .attr("text-anchor", "middle")
    .attr("x", height/2)
    .attr("y", -width-60)
    .attr("dy", ".75em")
    .attr("transform", "rotate(90)")
    .text("Yearly Summed CO2 Emission Value (log scale)");
})