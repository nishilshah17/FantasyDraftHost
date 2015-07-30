$(document).ready(function() {

  if(localStorage.getItem('uid').length > 0) {
    authorized();
  }

  $('#signin').click(function() {
    var ref = new Firebase("https://fantasy-draft-host.firebaseio.com");
    ref.authWithOAuthPopup("google", function(error, authData) {
      if (error) {
        console.log("Login Failed!", error);
      } else {
        console.log("Authenticated successfully with payload:", authData);
        localStorage.setItem('uid',authData.uid);
        authorized();
      }
    });
  });

  function authorized() {
    document.getElementById('afterAuth').style.zIndex = 1000;
  }

});
