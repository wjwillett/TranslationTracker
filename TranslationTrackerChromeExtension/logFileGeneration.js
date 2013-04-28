var latitude = 0.0;
var longitude = 0.0;
var sampleRows = [];

getLocation();

function getLocation(){
  if (navigator.geolocation){
    navigator.geolocation.getCurrentPosition(function(position){
      latitude = position.coords.latitude;
      longitude = position.coords.longitude;  
    });
  }
  else{alert("Geolocation is not supported by this browser.");}
}


function appendToSampleLog(word, translatedWord, context){
  var timestamp = new Date().getTime().toString();
  var sampleRow = [timestamp, word, translatedWord, context, 
                   latitude.toString(), longitude.toString()];
  if(sampleRows.length == 0 || sampleRows[sampleRows.length - 1][1] != word)
    sampleRows.push(sampleRow);
}


function exportCurrentLog(){
  var outputRows = [];
  for(var ri in sampleRows){
    var outputRowString = JSON.stringify(sampleRows[ri]);
    outputRowString = outputRowString.slice(1,outputRowString.length - 1);
    outputRows.push(outputRowString);
  }
  return outputRows.join("\n");
}