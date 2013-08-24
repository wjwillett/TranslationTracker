// Translation methods (wjwillet 2013)

//TODO: This server instance will eventually need to be locked down
var TRANSLATION_SERVER = 'http://translationtrack.appspot.com';
var detectionCache = {};
var translationCache = {};



//Fetch a translation from the server
function translate(text, fromLang, toLang, callback){
  
  //strip extra line breaks and white space, then encode 
  text = text.replace(/(\r\n|\n|\r)/gm," ").replace(/\s+/g," ");
  text = encodeURIComponent(text);
  
  //Check the local cache of results to avoid unnecessary calls
  var translationKey = fromLang + '::' + toLang + '::' + text;
  if(translationCache[translationKey]){
    callback({fromLanguage: fromLang, toLanguage: toLang, 
              text: text, translation:translationCache[translationKey]});
    return;
  }
  
  //TODO: Handle Error conditions and load failures appropriately
  $.ajax(TRANSLATION_SERVER + '/translate?from=' + fromLang + '&to=' + toLang + '&text=' + text,
         {success:function(data, textStatus, jqXHR){
             translationCache[translationKey] = data;
             callback({fromLanguage: fromLang, toLanguage: toLang, text: text, translation:data});
           }
         });
}

//Check with the server to guess the language used
function detectLanguage(text, callback){

  //shorten, strip extra line breaks and white space, then encode 
  text = text.replace(/(\r\n|\n|\r)/gm," ").replace(/\s+/g," ");
  text = text.substr(0,200)
  text = encodeURIComponent(text);

  //Check the local cache of results to avoid unnecessary calls
  if(detectionCache[text]){
    callback(detectionCache[text]);
    return;
  }
  //TODO: Handle Error conditions and load failures appropriately
  $.ajax(TRANSLATION_SERVER + '/detect?text=' + escape(text),
         {success:function(data, textStatus, jqXHR){
             detectionCache[text] = data;
             callback(data);
           }
         });
}


//Translate a phrase from one language to another using a local lookup dictionary
function translateLocally(text, fromLang, toLang, callback){
  callback({text: text,
            fromLanguage: fromLang,
            toLanguage: toLang,
            translation: dictionaryLookup(text, fromLang, toLang, false),
            translationWithEmphasis: dictionaryLookup(text, fromLang, toLang, true)});
}


//Stupid-simple language detection using the local lookup dictionary.
function detectLanguageLocally(text, callback){
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
  callback(languages[mostHitsIndex]);
}

//Translate a phrase from one language to another using a local dictionary (if available).
function dictionaryLookup(text, fromLang, toLang, emphasizeTranslatedWords){
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