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