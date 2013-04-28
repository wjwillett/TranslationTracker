
var fromLanguage = "fr";
var toLanguage = "en";
var clickToggle = true;

function setup(){
  //Add tooltip
  $("body").append("<div id='translationPluginTooltip'></div>");
  //Add mode overlay
  $("body").append("<div id='translationPluginOverlay'></div>");
  
  //Translation on hover
  document.addEventListener("mousemove", translateWordToTip);
  document.addEventListener("select", translateSelectionToTip);
  document.addEventListener("mouseup", translateSelectionToTip);
  document.addEventListener("mousedown", translateSelectionToTip);
  
  //Toggle the use of our application on ctrl-j
  $(document).bind('keydown', 'ctrl+j', function() {
    clickToggle = !clickToggle;
    console.log(clickToggle);
    drawOverlay()
  });
  document.addEventListener("click", logSelection);
  
  //Set translation language
  fromLanguage = detectLanguage();
  if(fromLanguage == "en") toLanguage = "fr";
  drawOverlay();
  
  //Get all previous log items
  var logItems = storage.open(function(){
    var list = storage.getAllLogItems(function(results){
      console.log("log contains " + results.length + " words");
	  //Begin Highlighting by processing the returned list
		var Words = [];
		var selected = "";
		
		for(i = 0; i < results.length; i++){
			selected = new RegExp('('+results[i].word+')', 'gi');
			Words.push({ "Word": selected, "Color": 1});	
		}
		processHighlights(Words);
    });
  });
}


//On a mouse click, log the word that's clicked if the toggle is on
function logSelection(e) {
  if(clickToggle) {
    var word = getWordAtPoint(e.target, e.x, e.y);

    if(word != null) {
      
      var lang = $(e.target).attr("lang");
      var fromLang = (lang ? lang : fromLanguage);
      var translatedWord = translate(word, fromLang, toLanguage, false);
      var context = $(e.target).text();
      
      storage.addLogItem(word, translatedWord, fromLang, toLanguage, context);
    }
  }
}


//On mouse hover, translate the current word and display a tooltip
function translateWordToTip(e) {
  if (window.getSelection().toString()) return; //don't provide hover tips if we're selecting.
  
  var word = getWordAtPoint(e.target, e.x, e.y);
  var tip = $("#translationPluginTooltip");
  
  if(word){
    var lang = $(e.target).attr("lang");
    var translatedWord = translate(word, lang ? lang : fromLanguage, toLanguage, true);
    
    var translatedWordUnwrapped = translate(word, lang ? lang : fromLanguage, toLanguage, false);
    appendToSampleLog(word, translatedWordUnwrapped, $(e.target).text());
    
    if (!translatedWord){
      tip.hide();
      return;
    }
    
    tip.removeClass().addClass("lang"+fromLanguage).html(translatedWord).show();
    positionTip(tip, e.pageX, e.pageY);
  }
  else tip.hide();
}


//Following a selection, translate the selected text and display a tooltip
function translateSelectionToTip(e){
  var text = window.getSelection().toString();
  if (text) {
    
    //only allow up to 100 characters
    if(text.length > 100) text = text.slice(0,100) + "...";
    
    var translatedText = translate(text, fromLanguage, toLanguage, true);
    
    var tip = $("#translationPluginTooltip");
    tip.removeClass().addClass("lang"+fromLanguage).html(translatedText).show();
    
    var coords = getSelectionCoords();
    positionTip(tip, coords.x, coords.y);
  }
}



// Recursively search for the word under the current cursor 
//  Adapted from: http://stackoverflow.com/a/3710561
function getWordAtPoint(elem, x, y) {
    if (elem.nodeType == elem.TEXT_NODE) {
        var range = elem.ownerDocument.createRange();
        range.selectNodeContents(elem);
        var currentPos = 0;
        var endPos = range.endOffset;
        while (currentPos + 1 < endPos) {
            range.setStart(elem, currentPos);
            range.setEnd(elem, currentPos + 1);
            if (range.getBoundingClientRect().left <= x && range.getBoundingClientRect().right >= x && range.getBoundingClientRect().top <= y && range.getBoundingClientRect().bottom >= y) {
                range.expand("word");
                var ret = range.toString();
                range.detach();
                return (ret);
            }
            currentPos += 1;
        }
    } else {
        for (var i = 0; i < elem.childNodes.length; i++) {
            var range = elem.childNodes[i].ownerDocument.createRange();
            range.selectNodeContents(elem.childNodes[i]);
            if (range.getBoundingClientRect().left <= x && range.getBoundingClientRect().right >= x && range.getBoundingClientRect().top <= y && range.getBoundingClientRect().bottom >= y) {
                range.detach();
                return (getWordAtPoint(elem.childNodes[i], x, y));
            } else {
                range.detach();
            }
        }
    }
    return (null);
}


//Translate a phrase from one language to another
// Dirt-simple placeholder for a smarter algorithm.
function translate(text, fromLang, toLang, emphasizeTranslatedWords){
  var lookupName = ("lookup" + fromLang.toLocaleUpperCase() + 
                    "to" + toLang.toLocaleUpperCase());
  var lookup = window[lookupName];
  if (typeof lookup === "undefined") 
    return "CANNOT TRANSLATE " + fromLang + " to " + toLang + "."
  
  var translatedText = text;
  var words = text.match(/\w+/gi);
  for(var wi in words){
    var word = words[wi];
    var translatedWord = lookup[word];
    if(translatedWord){
      var regexp = new RegExp("\\b" + word + "\\b","gi");
      if(emphasizeTranslatedWords)
        translatedText = translatedText.replace(regexp,"<strong><em>" + translatedWord + "</em></strong>");
      else translatedText = translatedText.replace(regexp,translatedWord);
    }
  }
  return translatedText;
}


//Stupid-simple language detection.
function detectLanguage(text){
  if(!text){
    //If no text is provided look for an article or content block in the page
    if(articleText = $("article").text())
      text = articleText;
    else if(pText = $("p").text())
      text = pText;
    else text = $("body").text();
  }  
  //check the first 200 words against all languages
  var words = text.match(/\w+/gi).slice(0,200);
  var hitsByLanguage  = {};
  var languages = Object.keys(lookupsBySourceLanguage);
  for(var li in languages)
    hitsByLanguage[languages[li]] = 0;
  
  //try each word in all dictionaries
  for(var wi in words){
    for(var li in languages){
      var lookups = lookupsBySourceLanguage[languages[li]];
      for(var lj in lookups){
        var lookup = lookups[lj];
        hitsByLanguage[languages[li]] += (lookup[words[wi]] ? 1 : 0);
      }
    }
  }
  var mostHitsIndex = 0;
  var mostHits = 0;
  for(var li in languages){
    var hitsInLanguage = hitsByLanguage[languages[li]] / lookupsBySourceLanguage[languages[li]].length;
    if(hitsInLanguage > mostHits){
      mostHits = hitsInLanguage;
      mostHitsIndex = li;
    }
  }
  return languages[mostHitsIndex];
}


//Get the x and y screen coordinates of the selected text
// Adapted from: http://stackoverflow.com/a/6847328
function getSelectionCoords() {
  var sel = window.getSelection();
  var x = 0, y = 0;
  if(sel) {
    if (sel.rangeCount) {
        range = sel.getRangeAt(0).cloneRange();
        if (range.getClientRects) {
            var rect = range.getBoundingClientRect();
            x = rect.left;
            y = rect.top + $(document).scrollTop();
        }
    }
  }
  return { x: x, y: y };
}


//Position the tooltip
function positionTip(tip, x, y){
    var tipWidth = tip.outerWidth(); //Find width of tooltip
    var tipHeight = tip.outerHeight(); //Find height of tooltip
    
    y = y - tipHeight;
    
    //Distance of element from the right edge of viewport
    var tipVisX = $(window).width() - (x + tipWidth);
    //Distance of element from the bottom of viewport
    var tipVisY = $(window).height() - (y + tipHeight);

    if (tipVisX < 20) { //If tooltip exceeds the X coordinate of viewport
        x = x - tipWidth - 20;
    }
    if (tipVisY < 20) { //If tooltip exceeds the Y coordinate of viewport
        y = y - tipHeight - 20;
    }
    //Absolute position the tooltip according to mouse position
    tip.css({
        top: y,
        left: x
    });
}

//Draw a small overlay in the upper left corner
function drawOverlay(){
  $("#translationPluginOverlay").html(fromLanguage + "&rarr;" + toLanguage + " (" + (clickToggle ? "on" : "off") + ")");
}


$(document).ready(setup);
