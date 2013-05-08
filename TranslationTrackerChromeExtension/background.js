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
   chrome.browserAction.setBadgeText({text:"??"}); 
   chrome.browserAction.setBadgeBackgroundColor({color:languageColors["default"]});
  }
}