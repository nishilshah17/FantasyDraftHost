$(document).ready(function() {

  var userRef = new Firebase("https://fantasy-draft-host.firebaseio.com/users/"+localStorage.getItem('uid'));

  userRef.once('value', function(userSnapshot) {
    if(userSnapshot.child('accountSID').val() != null) {
      $('#accountSID').val(userSnapshot.child('accountSID').val());
    }
    if(userSnapshot.child('authToken').val() != null) {
      $('#authToken').val(userSnapshot.child('authToken').val());
    }
    if(userSnapshot.child('number').val() != null) {
      $('#twilioNumber').val(userSnapshot.child('number').val());
    }
  });

  $('#homeButton').click(function() {
    window.location.href = "index.html";
  });

  $('#submitButton').click(function() {
    var sid = $('#accountSID').val();
    var token = $('#authToken').val();
    var num = $('#twilioNumber').val();
    sid = sid.replace(/\s+/g, '');
    token = token.replace(/\s+/g, '');
    num = num.replace(/\s+/g, '');
    num = num.replace(/\(|\)/g,'');
    num = num.replace(/-/g, "");

    userRef.update({
      accountSID: sid,
      authToken: token,
      number: num
    });

    $('#twilioSettingsTitle').append(' saved');
  });
});
