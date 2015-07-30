$(document).ready(function() {

  if(localStorage.getItem('uid').length > 0 && localStorage.getItem('uid') != null) {
    authorized();
  }

  $('#signin').click(function() {
    var ref = new Firebase("https://fantasy-draft-host.firebaseio.com");
    ref.authWithOAuthPopup("google", function(error, authData) {
      if (error) {
        console.log("Login Failed!", error);
      } else {
        console.log("Authenticated successfully with payload:", authData);

        var userRef = new Firebase("https://fantasy-draft-host.firebaseio.com/users/"+authData.uid);
        userRef.update({
          accountSID: "null",
          authToken: "null",
          number: "null"
        });
        localStorage.setItem('uid',authData.uid);
        localStorage.setItem('displayName',authData.google.displayName);
        authorized();
      }
    });
  });

  function authorized() {
    document.getElementById('afterAuth').style.zIndex = 1000;
    document.getElementById('afterAuthTitle').innerHTML = localStorage.getItem('displayName')+"'s fantasy draft host";
  }

});
