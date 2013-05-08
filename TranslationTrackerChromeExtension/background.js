var languageColors = {
  de: "#DAA520", //GoldenRod
  en: "#B22222", //FireBrick
  fr: "#00008B", //DarkBlue
  default: "#777"}

//The current enabled/disabled state of the extension
var isEnabled = (localStorage["_TranslationTrackerIsEnabled"] == undefined ?
                 true : localStorage["_TranslationTrackerIsEnabled"] == "true");

//Track to/from languages for each tab
var toLanguageByTab = {};
var fromLanguageByTab = {};

//Toggle translation on/off when browserAction button is clicked
chrome.browserAction.onClicked.addListener(function(tab) {
  isEnabled = !isEnabled;
  localStorage["_TranslationTrackerIsEnabled"] = isEnabled;
  
  //tell all tabs about the change
  chrome.tabs.query({}, function(tabs) {
    var message = {action: "isEnabledChange", isEnabled:isEnabled};
    for (var i=0; i<tabs.length; ++i) {
        chrome.tabs.sendMessage(tabs[i].id, message);
    }
  });
  
  //update the browserActionButton
  updateBrowserAction();
});


//Handle messages from the contentScript
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    var tabId = sender.tab.id;
    if(request.action == "getIsEnabled")
      sendResponse(isEnabled);
    else if(request.action == "detectLanguage")
      sendResponse(detectLanguage(request.text));
    else if(request.action == "translate"){
      sendResponse(translateForTab(request.text, tabId));  
    }
    else if(sender.tab && request.action == "setLanguages"){
      fromLanguageByTab[tabId] = request.fromLanguage;
      toLanguageByTab[tabId] = request.toLanguage;
      updateBrowserAction(tabId);
    }
  });

//Handle tab changes
chrome.tabs.onActivated.addListener(function(activeInfo){
  updateBrowserAction(activeInfo.tabId);
});


//Translate text using settings for the current tab
function translateForTab(text, tabId, emphasizeTranslatedWords){
  var fromLanguage = fromLanguageByTab[tabId];
  var toLanguage = toLanguageByTab[tabId];
  if(fromLanguage && toLanguage){
    return { text: text,
      fromLanguage: fromLanguage,
      toLanguage: toLanguage,
      translation: translate(text, fromLanguage, toLanguage, false),
      translationWithEmphasis: translate(text, fromLanguage, toLanguage, true)};
  }
  else return "ERROR - translation languages not set.";
}


//Update the look of the browserAction button
function updateBrowserAction(tabId){
  if(!isEnabled){
    chrome.browserAction.setBadgeText({text:"off"});
    chrome.browserAction.setBadgeBackgroundColor({color:languageColors["default"]});
    return;
  }
  var currentFromLanguage = fromLanguageByTab[tabId];
  var currentToLanguage = toLanguageByTab[tabId];
  if(currentFromLanguage && currentToLanguage){
    chrome.browserAction.setBadgeText({text:currentFromLanguage + "|" + currentToLanguage});
    var languageColor = languageColors[currentToLanguage] ? languageColors[currentToLanguage] : languageColors["default"]
    chrome.browserAction.setBadgeBackgroundColor({color:languageColor});
  }  
  else{
   chrome.browserAction.setBadgeText({text:"on"}); 
   chrome.browserAction.setBadgeBackgroundColor({color:languageColors["default"]});
  }
}