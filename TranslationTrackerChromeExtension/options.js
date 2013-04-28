storage.open(function(){
    storage.getAllLogItems(function(results){

    var fill = d3.scale.category20();

    var wordList = results.map(function(d) {
      return d.translatedWord;
    });

    var wordListOrig = results.map(function(d) {
      return d.word;
    });

    var dict = [];

    for(var i=0;i<wordList.length;i++) {
      if(dict[wordList[i]] == null) {
        dict[wordList[i]] = 0;
      }
      dict[wordList[i]] = dict[wordList[i]] + 1;
    }

    wordList = wordList.unique();
    wordListOrig = wordListOrig.unique();
    freq_list = [];
    for(var i=0;i<wordList.length;i++) {
      freq_list[i] = dict[wordList[i]];
    }

    $("#list_en").html('<h2>Francais</h2>' + wordList.join('<br>'));
    $("#list_fr").html('<h2>English</h2>' + wordListOrig.join('<br>'));
    $("#frequency").html('<h2>Count</h2>' + freq_list.join('<br>'));

    console.log(wordList);
    console.log(dict);

    d3.layout.cloud().size([600, 400])
      .words(wordList.map(function(d) {
        return {text: d, size: 10 * dict[d] + Math.random() * 10};
      }))
      .rotate(function() { return ~~(Math.random() * 2) * 90; })
      .font("Impact")
      .fontSize(function(d) { return d.size; })
      .on("end", draw)
      .start();

    function draw(words) {
      d3.select("body").append("svg")
        .attr("width", 600)
        .attr("height", 400)
      .append("g")
        .attr("transform", "translate(300,200)")
      .selectAll("text")
        .data(words)
      .enter().append("text")
        .style("font-size", function(d) { return d.size + "px"; })
        .style("font-family", "Impact")
        .style("fill", function(d, i) { return fill(i); })
        .attr("text-anchor", "middle")
        .attr("transform", function(d) {
          return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
        })
        .text(function(d) { return d.text; });
      }
    });
});

// Return new array with duplicate values removed
Array.prototype.unique =
  function() {
    var a = [];
    var l = this.length;
    for(var i=0; i<l; i++) {
      for(var j=i+1; j<l; j++) {
        // If this[i] is found later in the array
        if (this[i] === this[j])
          j = ++i;
      }
      a.push(this[i]);
    }
    return a;
  };