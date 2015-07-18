var draftID;
var countdown;

var ticking = new Audio("audio/ticking.wav");
var alarm = new Audio("audio/alarm.wav");

$(document).ready(function() {
  var currentPick = 0;
  var teams = [];
  var owners = [];
  var phones = [];
  var numRounds;

  $('#draftIDSubmit').click(function() {
    draftID = $('#draftID').val();

    var draftRef = new Firebase("https://fantasy-draft-host.firebaseio.com/drafts/"+draftID);

    draftRef.on("value", function(draftSnapshot) {
      teams = [];
      owners = [];
      phones = [];

      numRounds = draftSnapshot.child('rounds').val();
      var numPicks = draftSnapshot.child('picks').numChildren();
      var limit = numPicks/numRounds;
      var counter = 0;
      draftSnapshot.child('picks').forEach(function(pickSnapshot) {
        counter++;
        teams.push(pickSnapshot.child('team').val());
        owners.push(pickSnapshot.child('owner').val());
        phones.push(pickSnapshot.child('phone').val());
        if(counter == limit) {
          return true;
        }
      });

      $('#draft').empty();
      var table = $("<table></table>");
      table.attr('id','draftTable');
      table.attr('class','flat-table flat-table-3')

      for(var y = 0; y < numRounds; y++) {
        var row = $("<tr></tr>");
        row.attr('id','round'+(y+1));

        for(var x = 0; x < teams.length+1; x++) {
          var cell;
          if(x == 0) {
            cell = $('<th>'+(y+1)+'</th>');
          } else {
            currentPick++;
            if(y % 2 == 0) {
              var currentOwner = owners[x-1];
            } else {
              var currentOwner = owners[owners.length-x];
            }
            cell = $('<th>'+currentPick+'<br/>'+currentOwner+'</th>');
          }
          row.append(cell);
        }
        table.append(row);
      }
      $('#draft').append(table);
    }, function (errorObject) {
      console.log("The read failed: " + errorObject.code);
    });

    $('#draftID').remove();
    $('#draftIDSubmit').remove();


  /**/
  });

  $('#timerButton').click(function() {
    var timerButtonValue = $('#timerButton').val();
    if(timerButtonValue == "pause") {
      $('#timerButton').val("resume");
      pauseCountdown();
    } else {
      $('#timerButton').val("pause");
      resumeCountdown();
    }
  });
});

function initiateCountdown() {
  document.getElementById('timer').style.zIndex = 1000;

  countdown = Tock({
      countdown: true,
      interval: 50,
      callback: function () {
        var currentValue = countdown.msToTime(countdown.lap());
        var currentValueInt = parseInt(currentValue.replace(":",""));
        if(currentValueInt <= 100) {
          ticking.play();
          $('#countdown_clock').css("color","red");
        } else {
          $('#countdown_clock').css("color", "black")
        }
        $('#countdown_clock').val(currentValue);
      },
      complete: function () {
        ticking.pause();
        alarm.play();
        setTimeout(stopAlarm, 4500);
        //alert firebase its too late to experience this pick
      }
  });

  setTimeout(startCountdown,1000);
}

function stopAlarm() {
  alarm.pause();
}

function startCountdown() {
  countdown.start("05:00");
}

function resumeCountdown() {
  countdown.start($('#countdown_clock').val());
}

function pauseCountdown() {
  countdown.pause();
  ticking.pause();
  alarm.pause();
}
