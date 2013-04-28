console.log("loaded options page!");

var fontSize = d3.scale.log().range([10, 100]);

var layout = cloud()
      .size([960, 600])
      .timeInterval(10)
      .text(function(d) { return d.key; })
      .font("Impact")
      .fontSize(function(d) { return fontSize(+d.value); })
      .rotate(function(d) { return ~~(Math.random() * 5) * 30 - 60; })
      .padding(1)
      .on("word", progress)
      .on("end", draw)
      .words(['word','word','word','alpha','gecko','gecko'])
      .start();