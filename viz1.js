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

    // Add X axis --> it is a date format
    const x = d3.scaleLinear()
      .domain(d3.extent(data, function(d) { return d.year; }))
      .range([ 0, width ]);
    svg.append("g")
      .attr("transform", `translate(0, ${height})`)
      .call(d3.axisBottom(x).tickFormat(d3.format("d")));

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
        .attr("stroke", "#D81B60")  //red temp line
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
        .attr("stroke", "#1E88E5")  //blue co2 line
        .style("stroke-width", 4)
        .style("fill", "none");

    // A function that update the chart
    function update(selectedGroup) {

      // Create new data with the selection?
      const dataFilter = data.filter(function(d){return d.state==selectedGroup})
      tooltipData = dataFilter

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

    // This allows to find the closest X inx of the mouse:
    var bisect = d3.bisector(function(d) { return d.year; }).left;

    // Create the circle that travels along the curve of chart
    var focus = svg
      .append('g')
      .append('circle')
      .style("fill", "none")
      .attr("stroke", "black")
      .attr('r', 8.5)
      .style("opacity", 10)
    
    var focus2 = svg
      .append('g')
      .append('circle')
      .style("fill", "none")
      .attr("stroke", "black")
      .attr('r', 8.5)
      .style("opacity", 0)

    // Create the text that travels along the curve of chart
    var focusText = svg
      .append('g')
      .append('text')
      .style("opacity", 0)
      .attr("text-anchor", "left")
      .attr("alignment-baseline", "middle")

    var focusText2 = svg
      .append('g')
      .append('text')
      .style("opacity", 0)
      .attr("text-anchor", "left")
      .attr("alignment-baseline", "middle")

    var selectedGroup = Array.from(allGroup)[0];
    var tooltipData = data.filter(function(d) { return d.state == selectedGroup; }); 
    
    // Create a rect on top of the svg area: this rectangle recovers mouse position
    var rect = svg.append('rect')
      .style("fill", "none")
      .style("pointer-events", "all")
      .attr('width', width)
      .attr('height', height);

    // What happens when the mouse move -> show the annotations at the right positions.
    rect.on('mouseover', mouseover)
      .on('mousemove', mousemove)
      .on('mouseout', mouseout);

    function mousemove(event) {
      var x0 = x.invert(d3.pointer(event, this)[0]);
      var i = bisect(tooltipData, x0, 1);
      var selectedData = tooltipData[i];
      
      if (selectedData) {
        focus.attr("cx", x(selectedData.year))
            .attr("cy", y1(selectedData.average_temp))
            .style("opacity", 1);
    
        focusText.html("Year: " + selectedData.year + ", Temp: " + selectedData.average_temp + ", CO2: " + selectedData.value)
            .attr("x", x(selectedData.year) + 15)
            .attr("y", (y1(selectedData.average_temp) + y2(selectedData.value)) / 2)
            .style("opacity", 1)
          
        focus2.attr("cx", x(selectedData.year))
            .attr("cy", y2(selectedData.value))
            .style("opacity", 1);
  
        // focusText2.html("Year: " + selectedData.year + ", CO2: " + selectedData.value)
        //     .attr("x", x(selectedData.year) + 15)
        //     .attr("y", y2(selectedData.value))
        //     .style("opacity", 1);
      }
    }

    // What happens when the mouse move -> show the annotations at the right positions.
    function mouseover() {
      focus.style("opacity", 1).style("left", (d3.mouse(this)[0]+70) + "px")
      focusText.style("opacity",1)
      focus2.style("opacity", 1)
      focusText2.style("opacity", 1)
    }
    function mouseout() {
      focus.style("opacity", 0)
      focusText.style("opacity", 0)
      focus2.style("opacity", 0)
      focusText2.style("opacity", 0)
    }

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
    .attr("y", -width-65)
    .attr("dy", ".75em")
    .attr("transform", "rotate(90)")
    .text("Yearly Summed CO2 Emission Value (log scale)");
})