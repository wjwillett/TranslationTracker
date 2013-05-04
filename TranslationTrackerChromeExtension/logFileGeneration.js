var latitude = 0.0;
var longitude = 0.0;

//getLocation();

function getLocation(){
  if (navigator.geolocation){
    navigator.geolocation.getCurrentPosition(function(position){
      latitude = position.coords.latitude;
      longitude = position.coords.longitude;  
    });
  }
  else{alert("Geolocation is not supported by this browser.");}
}