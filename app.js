document.addEventListener("DOMContentLoaded", function() {
  const kickstarterURL = "https://cdn.rawgit.com/freeCodeCamp/testable-projects-fcc/a80ce8f9/src/data/tree_map/kickstarter-funding-data.json";
  const movieSalesURL = "https://cdn.rawgit.com/freeCodeCamp/testable-projects-fcc/a80ce8f9/src/data/tree_map/movie-data.json";
  const videoGameSalesURL = "https://cdn.rawgit.com/freeCodeCamp/testable-projects-fcc/a80ce8f9/src/data/tree_map/video-game-sales-data.json";
  const width = 900;
  const height = 650;
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

  let svg = d3.select("svg")
              .attr("width", width)
              .attr("height", height)
              .classed("svg", true);

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
        })

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
        
        // tooltip
        let tooltip = d3.select("body")                    
                        .append("div")
                          .attr("id", "tooltip")                        
                          .classed("tooltip", true);  
                
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
        let rects = svg
                      .selectAll("rect")
                      .data(root.leaves());
        
        rects.exit()
             .remove();

        rects
          .enter()
          .append("rect")
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
        let texts = svg
                      .selectAll("text")
                      .data(root.leaves())

        texts.exit()
             .remove();

        texts
          .enter()
          .append("text")
          .append("tspan")
          .merge(texts)                    
            .attr("x", d => d.x0+5)
            .attr("y", d => d.y0+15)
            .style("display", "block")
            .html(d => d.data.name)
            .style("font-size", "9");
            
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
      }
    });
});