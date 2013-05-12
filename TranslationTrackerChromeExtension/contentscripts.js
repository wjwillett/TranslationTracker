
var fromLanguage = "fr";
var toLanguage = "en";

var isEnabled = getIsEnabledFromBackgroundPage();

var currentTranslation = {};

//Check with the background script to see if the plugin is currently enabled
function getIsEnabledFromBackgroundPage(){
   chrome.runtime.sendMessage({action: "getIsEnabled"}, function(response){
      isEnabled = response;
    });
}

//Handle messages from the background script
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if(request.action == "isEnabledChange"){
      if(isEnabled == request.isEnabled) 
        return;
      isEnabled = request.isEnabled;
      if(!isEnabled)
        $("#translationPluginTooltip").hide();
      else detectPageLanguage();
    }
  });


function setup(){
  //Add tooltip
  $("body").append("<div id='translationPluginTooltip'></div>");
  
  //Translation on hover
  document.addEventListener("mousemove", translateWordToTip);
  //TODO: Fix to fire just on selections so that other clicks in the document don't break it
  document.addEventListener("select", translateSelectionToTip);
  document.addEventListener("mouseup", translateSelectionToTip);
  
  //Detect the language of this page and set the to/from languages for future translation
  detectPageLanguage();
  
  //Get all previous log items
  var logItems = storage.open(function(){
    var list = storage.getAllLogItems(function(results){
      console.log("log contains " + results.length + " words");
    //Begin Highlighting by processing the returned list
    var phrases = [];
    
    for(i = 0; i < results.length; i++)
      phrases.push(results[i].word)
    highlightPhrases(phrases, toLanguage);
    });
  });
}


//Call the background process to detect the language of the current page
function detectPageLanguage(){
  //get sample text from the page
  var text;
  if(articleText = $("article").text())
    text = articleText;
  else if(pText = $("p").text())
    text = pText;
  else text = $("body").text();
  
  //detect the language of the current page
  chrome.runtime.sendMessage({action: "detectLanguage", text: text}, 
    function(response){ //on reply, tell the background process which languages we'll use for the page
      fromLanguage = response;
      if(fromLanguage == "en") toLanguage = "fr";
      setTranslationLanguages(fromLanguage, toLanguage);
    });
}

//Call the background process to set the to and from languages for the current page
function setTranslationLanguages(fromLanguage, toLanguage){
  chrome.runtime.sendMessage({action: "setLanguages", fromLanguage: fromLanguage, toLanguage: toLanguage});
}

//Call the background process to translate text
function translateText(text, callback){
  chrome.runtime.sendMessage({action: "translate", text: text}, callback);
}


//On mouse hover, translate the current word and display a tooltip
function translateWordToTip(e) {
  if (!isEnabled) return;
  if (window.getSelection().toString()) return; //don't provide hover tips if we're selecting.
  
  var word = getWordAtPoint(e.target, e.x, e.y);
  var tip = $("#translationPluginTooltip");
  
  if(word){
    translateText(word, function(response){
      var translatedWord = response.translationWithEmphasis;
      if(!translatedWord){
        tip.hide();
        return;
      }
      tip.removeClass().addClass("lang"+toLanguage).html(translatedWord).show();
      positionTip(tip, e.pageX, e.pageY);
    });
  }
  else tip.hide();
}


//Following a selection, translate the selected text and display a tooltip
function translateSelectionToTip(e){
  if (!isEnabled) return;
  var text = window.getSelection().toString();
  if (text) {
    
    //only allow up to 50 characters
    if(text.length > 50) text = text.slice(0,50) + "...";
    
    translateText(text, function(response){
      var translation = response.translation;
      var translationWithEmphasis = response.translationWithEmphasis;
      var fromLanguage = response.fromLanguage;
      var toLanguage = response.toLanguage;
      var tip = $("#translationPluginTooltip");
      tip.removeClass().addClass("lang"+toLanguage).html(translationWithEmphasis).show();
      tip.append("<button>remember this phrase</button>");
      $("button",tip).click(function(e){
        if(!isEnabled) return;
        storage.addLogItem(currentTranslation.text, currentTranslation.translation,
                           currentTranslation.fromLanguage, currentTranslation.toLanguage, 
                           currentTranslation.context);
        getSelectedText();
      });
    
      currentTranslation.text = text;
      currentTranslation.translation = translation;
      currentTranslation.fromLanguage = fromLanguage;
      currentTranslation.toLanguage = toLanguage;
      //TODO: Get the smallest tag containing the selection.
      currentTranslation.context = ""; 
    
      var coords = getSelectionCoords();
      positionTip(tip, coords.x, coords.y);
    });
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


$(document).ready(setup);
