var currentLocation;

getLocation();

function getLocation(){
  if (navigator.geolocation){
    navigator.geolocation.getCurrentPosition(function(position){
      currentLocation = position.coords;
    });
  }
  else{console.log("Geolocation is not supported by this browser.");}
}