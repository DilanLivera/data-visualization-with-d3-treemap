document.addEventListener("DOMContentLoaded", function() {
  const kickstarterURL = "https://cdn.rawgit.com/freeCodeCamp/testable-projects-fcc/a80ce8f9/src/data/tree_map/kickstarter-funding-data.json";
  const movieSalesURL = "https://cdn.rawgit.com/freeCodeCamp/testable-projects-fcc/a80ce8f9/src/data/tree_map/movie-data.json";
  const videoGameSalesURL = "https://cdn.rawgit.com/freeCodeCamp/testable-projects-fcc/a80ce8f9/src/data/tree_map/video-game-sales-data.json";
  const width = 900;
  const height = 650;
  const legendWidth = 175;
  const legendHeight = 650;
  // const colors = ["rgb(173, 216, 230)", "rgb(240, 128, 128)", "rgb(84, 120, 240)", "rgb(224, 255, 255)", 
  //                 "rgb(211, 211, 211)", "rgb(144, 238, 144)", "rgb(255, 182, 193)", "rgb(255, 160, 122)", 
  //                 "rgb(32, 178, 170)", "rgb(135, 206, 250)", "rgb(119, 136, 153)", "rgb(138, 84, 240)",
  //                 "rgb(175, 195, 221)", "rgb(255, 255, 224)", "rgb(34, 186, 236)", "rgb(255, 98, 71)", 
  //                 "rgb(246, 248, 125)", "rgb(124, 241, 163)", "rgb(171, 172, 240)", "rgb(217, 122, 236)"]
  const dataSetDetails = [{
                          name: "Video Game Data",
                          title: "Video Game Sales",
                          description: "Top 100 Most Sold Video Games Grouped by Platform"
                        },{
                          name: "Movies Data",
                          title: "Movie Sales",
                          description: "Top 100 Highest Grossing Movies Grouped By Genre"
                        },{
                          name: "Kickstarter Data",
                          title: "Kickstarter Pledges",
                          description: "Top 100 Most Pledged Kickstarter Campaigns Grouped By Category"
                        }];

  let treeMap = d3.select("#tree-map")
              .attr("width", width)
              .attr("height", height)
              .classed("svg", true);

  let legend = d3.select("#legend")
                 .attr("width", legendWidth)
                 .attr("height", legendHeight)
                 .classed("legend", true);
  // tooltip
  let tooltip = d3.select("body")                    
                  .append("div")
                    .attr("id", "tooltip")                        
                    .classed("tooltip", true);                                 

  d3.queue()
    .defer(d3.json, kickstarterURL)
    .defer(d3.json, movieSalesURL)
    .defer(d3.json, videoGameSalesURL)
    .await(function(error, kickstarterData, movieSalesData, videoGameSalesData) {
      //default dataset
      drawTreeMap(videoGameSalesData, dataSetDetails[0].name);

      //change datasets
      d3.selectAll("a")
        .on("click", function() {
          let userSelect = d3.select(this).text();
          
          if(userSelect === "Video Game Data") drawTreeMap(videoGameSalesData, userSelect);
          if(userSelect === "Movies Data") drawTreeMap(movieSalesData, userSelect);
          if(userSelect === "Kickstarter Data") drawTreeMap(kickstarterData, userSelect);
        });      
    });

  //draw treemap for a given dataset
  function drawTreeMap(dataSet, userSelect) {
    let details = dataSetDetails.filter(d => d.name === userSelect)[0];
    let title = details.title;
    let description = details.description;

    //set title
    d3.select("#title")
      .text(title);

    //set description
    d3.select("#description") 
      .text(description)
                
    let root = d3.hierarchy(dataSet)
                .sum(d => d.value)
                .sort((a, b) => b.height - a.height || b.value - a.value);
    let children = dataSet.children.map(d => d.name);

    //color scale
    let colorScale = d3.scaleOrdinal()
                      .domain(children)
                      .range(d3.schemeCategory20);
    
    //computes the position of each element of the hierarchy
    d3.treemap()
      .size([width, height])
      .paddingInner(1)
      (root)
    
    //add rects
    let rects = treeMap
                  .selectAll("rect")
                  .data(root.leaves());
    
    rects.exit()
        .remove();

    rects
      .enter()
      .append("rect")
        .classed("tile", true)
      .merge(rects)
        .attr("x", d => d.x0)
        .attr("y", d => d.y0)
        .attr("width", d => d.x1-d.x0)
        .attr("height", d => d.y1-d.y0)        
        .attr("data-name", d => d.data.name)
        .attr("data-category", d => d.data.category)
        .attr("data-value", d => d.data.value)          
        .style("stroke", "lightgrey")
        .style("fill", d => colorScale(d.parent.data.name))
        .on("mouseover", showTooltip)
        .on("touchstart", showTooltip)
        .on("mouseout", hideTooltip)    
        .on("touchend", hideTooltip);            
    
    //add text    
    let texts = treeMap
                  .selectAll("text")
                  .data(root.leaves())

    texts.exit()
        .remove();

    texts
      .enter()
      .append("text")
      // .append("tspan")
      .merge(texts)
        .classed("tile-text", true)
        .attr("x", d => d.x0+5)
        .attr("y", d => d.y0+15)
        .html(textFormater);
    
    //add legend
    let legendBoxes = legend
                      .selectAll(".legend-item")
                      .data(children)

    legendBoxes.exit()
               .remove();

    legendBoxes
      .enter()                      
      .append("rect")
      .merge(legendBoxes)
        .classed("legend-item", true)
        .attr("x", 30)
        .attr("y", (d, i) => { return (i+1) * 30;})
        .attr("width", 20)
        .attr("height", 20)
        .style("fill", d => colorScale(d));

    let legendTexts = legend
                        .selectAll(".legend-text")
                        .data(children);

    legendTexts.exit()
               .remove();

    legendTexts 
      .enter()                     
      .append("text")
      .merge(legendTexts)
        .classed("legend-text", true)
        .attr("x", 75)
        .attr("y", (d, i) => { return (i+1.45) * 30;})
        .text(d => d)
        .attr("font-size", "12");

    //tooltip functions
    function showTooltip(d) {
      d3.select(this).classed("highlight", true);

      tooltip
        .attr("data-value", d.data.value)
        .style("opacity", 1)
        .style("left", `${d3.event.x - tooltip.node().offsetWidth/2}px`)
        .style("top", `${d3.event.y -  tooltip.node().offsetHeight/2}px`)
        .html(`
          <p>Name: ${d.data.name}</p>
          <p>Category: ${d.data.category}</p>
          <p>Value: ${d.data.value}</p>
        `);          
    }

    function hideTooltip() {        
      tooltip
        .style("opacity", 0);
    }
    
    function textFormater(d){
      let words = d.data.name.split(" ");
      let tspans = words.reduce((accumulator, word, i) => { 
                      accumulator += ` ${word}`;
                      if(i%2 ===1 || words.length === (i+1)) accumulator = accumulator + `</tspan><tspan x=${d.x0+3} dy=${i+8} font-size='9'>`;
                      return accumulator;
                    },"<tspan font-size='9'>");
      return tspans;
    }
  }
});