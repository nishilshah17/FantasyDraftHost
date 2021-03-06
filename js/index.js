$(document).ready(function() {
  if(localStorage.getItem('uid') == null) {
    console.log("not authorized");
  } else {
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
          displayName: authData.google.displayName
        });
        localStorage.setItem('uid',authData.uid);
        localStorage.setItem('displayName',authData.google.displayName);
        authorized();
      }
    });
  });

  $('#signout').click(function() {
    localStorage.removeItem('uid');
    localStorage.removeItem('displayName');
    document.getElementById('afterAuth').style.zIndex = -1000;
    location.reload(true);
  });

  function authorized() {
    document.getElementById('afterAuth').style.zIndex = 1000;
    document.getElementById('afterAuthTitle').innerHTML = localStorage.getItem('displayName')+"'s fantasy draft host";

    var userRef = new Firebase("https://fantasy-draft-host.firebaseio.com/users/"+localStorage.getItem('uid'));
    userRef.once('value', function(userSnapshot) {
      var accountSID = userSnapshot.child('accountSID').val();
      var authToken = userSnapshot.child('authToken').val();
      var number = userSnapshot.child('number').val();

      if(accountSID == null || accountSID == "" || authToken == null || authToken == "" || number == null || number == "") {
        document.getElementById('twilioNotSet').style.visibility = 'visible';
        document.getElementById('setup').disabled = true;
        document.getElementById('start').disabled = true;
      }
    });

  }

});
