
var storage = {}
storage.db = null;
storage.onerror = function(e){
  console.log(e.value);
};


//Open the database
storage.open = function(onSuccess){
  var request = indexedDB.open("translationLogs", 3);
    
  // Create or upgrade database
  request.onupgradeneeded = function(e) {
    var db = e.target.result;

    // A versionchange transaction is started automatically.
    e.target.transaction.onerror = storage.onerror;

    if(db.objectStoreNames.contains("translationlogs")) {
      db.deleteObjectStore("translationlogs");
    }

    var store = db.createObjectStore("translationlogs", 
      {keyPath: "timestamp"});
  };
  
  // If successful
  request.onsuccess = function(e) {
    storage.db = e.target.result;
    onSuccess();
  };
  
  // Error loading 
  request.onerror = storage.onerror;
}

//return all items in the database
storage.getAllLogItems = function(onSuccess) {
  
  var db = storage.db;
  var trans = db.transaction(["translationlogs"], "readwrite");
  var store = trans.objectStore("translationlogs");
  
  // Get everything in the store;
  var keyRange = IDBKeyRange.lowerBound(0);
  var cursorRequest = store.openCursor(keyRange);
  
  var results = []
  
  cursorRequest.onsuccess = function(e) {
    var result = e.target.result;
    if(!!result == false){
      if(onSuccess) 
        onSuccess(results);
      return;
    }
    results.push(result.value);
    result.continue();
  };
  
  cursorRequest.onerror = storage.onerror;
};


//Add an item to the database
storage.addLogItem = function(word, translatedWord, 
    fromLanguage, toLanguage, context) {
  var db = storage.db;
  var trans = db.transaction(["translationlogs"], "readwrite");
  var store = trans.objectStore("translationlogs");
  
  var timestamp = new Date().getTime().toString();
  
  var request = store.put({
    "timestamp": timestamp,
    "word": word,
    "translatedWord": translatedWord,
    "fromLanguage": fromLanguage,
    "toLanguage": toLanguage,
    "context": context,
    "latitude": latitude,
    "longitude": longitude
  });
  
  request.onsuccess = function(e){
    console.log("Added word to log: " + word + " (" + fromLanguage + ")->(" + toLanguage + ")");
  };
  request.onerror = storage.onerror;
}