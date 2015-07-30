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
          displayName: authData.google.displayName
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

    var userRef = new Firebase("https://fantasy-draft-host.firebaseio.com/users/"+localStorage.getItem('uid'));
    userRef.once('value', function(userSnapshot) {
      var accountSID = userSnapshot.child('accountSID').val();
      var authToken = userSnapshot.child('authToken').val();
      var number = userSnapshot.child('number').val();

      if(accountSID == null || authToken == null || number == null) {
        document.getElementById('twilioNotSet').style.visibility = 'visible';
        document.getElementById('setup').disabled = true;
        document.getElementById('start').disabled = true;
      }
    });
  }

});
