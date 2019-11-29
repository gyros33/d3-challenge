async function makeResponsive() {

    // if the SVG area isn't empty when the browser loads,
    // remove it and replace it with a resized version of the chart
    const svgArea = d3.select("body").select("svg");

    // clear svg is not empty
    if (!svgArea.empty()) {
        svgArea.remove();
    }

    // SVG wrapper dimensions are determined by the current width and
    // height of the browser window.
    const svgWidth = window.innerWidth;
    const svgHeight = window.innerHeight;

const margin = {
  top: 20,
  right: 40,
  bottom: 100,
  left: 100
};

const width = svgWidth - margin.left - margin.right;
const height = svgHeight - margin.top - margin.bottom;

// Create an SVG wrapper, append an SVG group that will hold our chart,
// and shift the latter by left and top margins.
const svg = d3
  .select("#scatter")
  .append("svg")
  .attr("width", svgWidth)
  .attr("height", svgHeight);

// Append an SVG group
const chartGroup = svg.append("g")
  .attr("transform", `translate(${margin.left}, ${margin.top})`);

// Initial Params
var chosenXAxis = "poverty";
var chosenYAxis = "obesity"

// function used for updating x-scale const upon click on axis label
function xScale(healthData, chosenXAxis) {
  // create scales
  const xLinearScale = d3.scaleLinear()
    .domain([d3.min(healthData, d => d[chosenXAxis]) * 0.8,
      d3.max(healthData, d => d[chosenXAxis]) * 1.2
    ])
    .range([0, width]);

  return xLinearScale;

}

function yScale(healthData, chosenYAxis) {
    // create scales
    const yLinearScale = d3.scaleLinear()
      .domain([d3.max(healthData, d => d[chosenYAxis]) * 1.2, 
        d3.min(healthData, d => d[chosenYAxis]) * 0.8
      ])
      .range([0, height]);
  
    return yLinearScale;
  
  }

// function used for updating xAxis const upon click on axis label
function renderXAxes(newXScale, xAxis) {
  const bottomAxis = d3.axisBottom(newXScale);

  xAxis.transition()
    .duration(1000)
    .call(bottomAxis);

  return xAxis;
}

function renderYAxes(newYScale, yAxis) {
    const leftAxis = d3.axisLeft(newYScale)
  
    yAxis.transition()
      .duration(1000)
      .call(leftAxis)
  
    return yAxis;
  }



// function used for updating circles group with a transition to
// new circles
function renderCircles(circlesGroup, textGroup, newXScale, newYScale, chosenXaxis, chosenYaxis) {

    circlesGroup.transition()
        .duration(1000)
        .attr("cx", d => newXScale(d[chosenXAxis]))
        .attr("cy", d => newYScale(d[chosenYAxis]));

    textGroup.transition()
        .duration(1000)
        .attr("x", d => newXScale(d[chosenXAxis]) - 12)
        .attr("y", d => newYScale(d[chosenYAxis]) + 5);

  return circlesGroup, textGroup;
}

// function used for updating circles group with new tooltip
function updateToolTip(chosenXAxis, chosenYAxis, circlesGroup) {
    let xlabel  = "";
    let ylabel = "";
    if (chosenXAxis === "poverty") {
        xlabel = "Poverty: ";
    }
    else if (chosenXAxis === "age") {
        xlabel = "Age: ";
    }
    else {
        xlabel = "Income: ";
    }

    if (chosenYAxis === "obesity") {
        ylabel = "Obesity: ";
    }
    else if (chosenXAxis === "smokes") {
        ylabel = "Smokers: ";
    }
    else {
        ylabel = "Lacks Healthcare: ";
    }

    const toolTip = d3.tip()
        .attr("class", "tooltip")
        .style("background", "rgba(0, 0, 0, 0.8)")
        .style("color", "#fff")
        .style("border-radius", "2px")
        .offset([80, 0])
        .html(function(d) {
            return (`${d.state}<br>${xlabel} ${d[chosenXAxis]}<br>${ylabel} ${d[chosenYAxis]}`);
        });

    circlesGroup.call(toolTip);

    circlesGroup.on("mouseover", function(data) {
        toolTip.show(data, this);
    })
    // onmouseout event
    .on("mouseout", function(data, index) {
        toolTip.hide(data, this);
    });

  return circlesGroup;
}

// Retrieve data from the CSV file and execute everything below
(async function(){
    const healthData = await d3.csv("/assets/data/data.csv");

    // parse data
    healthData.forEach(function(data) {
        data.poverty = +data.poverty;
        data.obesity = +data.obesity;
        data.age = +data.age;
        data.income = +data.income;
        data.healthcare = +data.healthcare;
        data.smokes = +data.smokes;
    });
    console.log(healthData)

    // xLinearScale function above csv import
    var xLinearScale = xScale(healthData, chosenXAxis);
    var yLinearScale = yScale(healthData, chosenYAxis)
    

    // Create initial axis functions
    const bottomAxis = d3.axisBottom(xLinearScale);
    const leftAxis = d3.axisLeft(yLinearScale);

    // append x axis
    var xAxis = chartGroup.append("g")
        .classed("x-axis", true)
        .attr("transform", `translate(0, ${height})`)
        .call(bottomAxis);

    // append y axis
    var yAxis = chartGroup.append("g")
        .classed("y-axis", true)
        .call(leftAxis);

    // append initial circles
    var textGroup = chartGroup.selectAll("text.my-text")
        .data(healthData)
        .enter()
        .append("text")
        .attr("x", d => xLinearScale(d[chosenXAxis] - .15))
        .attr("y", d => yLinearScale(d[chosenYAxis] - .3))
        .text(d => d.abbr)

    let circlesGroup = chartGroup.selectAll("circle")
        .data(healthData)
        .enter()
        .append("circle")
        .attr("cx", d => xLinearScale(d[chosenXAxis]))
        .attr("cy", d => yLinearScale(d[chosenYAxis]))
        .attr("r", 15)
        .attr("fill", "lightblue")
        .attr("stroke","black")
        .attr("opacity", ".5");

    


    // Create group for  2 x- axis labels
    const xlabelsGroup = chartGroup.append("g")
        .attr("transform", `translate(${width / 2}, ${height + 20})`);

    const povertyLabel = xlabelsGroup.append("text")
        .attr("x", 0)
        .attr("y", 20)
        .attr("value", "poverty") // value to grab for event listener
        .classed("active", true)
        .text("Poverty (%)");

    const ageLabel = xlabelsGroup.append("text")
        .attr("x", 0)
        .attr("y", 40)
        .attr("value", "age") // value to grab for event listener
        .classed("inactive", true)
        .text("Age (Median)");
    
    const incomeLabel = xlabelsGroup.append("text")
        .attr("x", 0)
        .attr("y", 60)
        .attr("value", "income") // value to grab for event listener
        .classed("inactive", true)
        .text("Household Income (Median)");

    const ylabelsGroup = chartGroup.append("g");

    // append y axis
    const obesityLabel = ylabelsGroup.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - margin.left)
        .attr("x", 0 - (height / 2))
        .attr("dy", "1em")
        .attr("value", "obesity")
        .classed("active", true)
        .text("Obesity (%)");
    
    const smokesLabel = ylabelsGroup.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 20 - margin.left)
        .attr("x", 0 - (height / 2))
        .attr("dy", "1em")
        .attr("value", "smokes")
        .classed("inactive", true)
        .text("Smokes (%)");
    
    const healthLabel = ylabelsGroup.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 40 - margin.left)
        .attr("x", 0 - (height / 2))
        .attr("dy", "1em")
        .attr("value", "healthcare")
        .classed("inactive", true)
        .text("Lacks Healthcare (%)");

    // updateToolTip function above csv import
    circlesGroup = updateToolTip(chosenXAxis, chosenYAxis, circlesGroup);

    // x axis labels event listener
    xlabelsGroup.selectAll("text")
        .on("click", function() {
        // get value of selection
        const xvalue = d3.select(this).attr("value");
        if (xvalue !== chosenXAxis) {

            // replaces chosenXAxis with value
            chosenXAxis = xvalue;

            // console.log(chosenXAxis)

            // functions here found above csv import
            // updates x scale for new data
            xLinearScale = xScale(healthData, chosenXAxis);
            yLinearScale = yScale(healthData, chosenYAxis);

            // updates x axis with transition
            xAxis = renderXAxes(xLinearScale, xAxis);

            // updates circles with new x values
            circlesGroup, textGroup = renderCircles(circlesGroup, textGroup, xLinearScale, yLinearScale, chosenXAxis, chosenYAxis);

            // updates tooltips with new info
            circlesGroup = updateToolTip(chosenXAxis, chosenYAxis, circlesGroup);

            // changes classes to change bold text
            if (chosenXAxis === "poverty") {
                ageLabel
                    .classed("active", false)
                    .classed("inactive", true);
                povertyLabel
                    .classed("active", true)
                    .classed("inactive", false);
                incomeLabel
                    .classed("active", false)
                    .classed("inactive", true);
            }
            else if (chosenXAxis === "age") {
                ageLabel
                    .classed("active", true)
                    .classed("inactive", false);
                povertyLabel
                    .classed("active", false)
                    .classed("inactive", true);
                incomeLabel
                    .classed("active", false)
                    .classed("inactive", true);
            }
            else {
                ageLabel
                    .classed("active", false)
                    .classed("inactive", true);
                povertyLabel
                    .classed("active", false)
                    .classed("inactive", true);
                incomeLabel
                    .classed("active", true)
                    .classed("inactive", false);
            }
        }
    });

    ylabelsGroup.selectAll("text")
        .on("click", function() {
        // get value of selection
        const yvalue = d3.select(this).attr("value");
        console.log(yvalue);
        console.log(chosenYAxis);
        if (yvalue !== chosenYAxis) {

            // replaces chosenXAxis with value
            chosenYAxis = yvalue;

            // console.log(chosenXAxis)

            // functions here found above csv import
            // updates x scale for new data
            xLinearScale = xScale(healthData, chosenXAxis);
            yLinearScale = yScale(healthData, chosenYAxis);

            // updates x axis with transition
            yAxis = renderYAxes(yLinearScale, yAxis);

            // updates circles with new x values
            circlesGroup, textGroup = renderCircles(circlesGroup, textGroup, xLinearScale, yLinearScale, chosenXAxis, chosenYAxis);

            // updates tooltips with new info
            circlesGroup = updateToolTip(chosenXAxis, chosenYAxis, circlesGroup);

            // changes classes to change bold text
            if (chosenYAxis === "obesity") {
                obesityLabel
                    .classed("active", true)
                    .classed("inactive", false);
                smokesLabel
                    .classed("active", false)
                    .classed("inactive", true);
                healthLabel
                    .classed("active", false)
                    .classed("inactive", true);
            }
            else if (chosenYAxis === "smokes") {
                obesityLabel
                    .classed("active", false)
                    .classed("inactive", true);
                smokesLabel
                    .classed("active", true)
                    .classed("inactive", false);
                healthLabel
                    .classed("active", false)
                    .classed("inactive", true);
            }
            else {
                obesityLabel
                    .classed("active", false)
                    .classed("inactive", true);
                smokesLabel
                    .classed("active", false)
                    .classed("inactive", true);
                healthLabel
                    .classed("active", true)
                    .classed("inactive", false);
            }
        }
    });
})()
}

// When the browser loads, makeResponsive() is called.
makeResponsive();

// When the browser window is resized, makeResponsive() is called.
d3.select(window).on("resize", makeResponsive);
