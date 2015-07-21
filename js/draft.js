var draftID;
var countdown;
var draftNotStarted = true;

var currentTeam;
var currentOwner;
var currentPhone;

$(document).ready(function() {
  var pickCounter;
  var teams;
  var owners;
  var phones;
  var players;
  var playerTeams;
  var numRounds;

  $('#draftIDSubmit').click(function() {
    draftID = $('#draftID').val();

    var draftRef = new Firebase("https://fantasy-draft-host.firebaseio.com/drafts/"+draftID);

    draftRef.on("value", function(draftSnapshot) {
      pickCounter = 0;
      teams = [];
      owners = [];
      phones = [];
      players = [];
      playerTeams = [];

      numRounds = draftSnapshot.child('rounds').val();
      var numPicks = draftSnapshot.child('picks').numChildren();

      var counter = 0;
      draftSnapshot.child('picks').forEach(function(pickSnapshot) {
        counter++;
        teams.push(pickSnapshot.child('team').val());
        owners.push(pickSnapshot.child('owner').val());
        phones.push(pickSnapshot.child('phone').val());
        players.push(pickSnapshot.child('player').val());
        playerTeams.push(pickSnapshot.child('playerTeam').val());
      });

      $('#draft').empty();
      var table = $("<table></table>");
      table.attr('id','draftTable');
      table.attr('class','flat-table flat-table-3')

      for(var y = 0; y < numRounds; y++) {
        var row = $("<tr></tr>");
        row.attr('id','round'+(y+1));

        for(var x = 0; x < (teams.length/numRounds)+1; x++) {
          var cell;
          if(x == 0) {
            cell = $('<th>'+(y+1)+'</th>');
          } else {
            pickCounter++;
            if(y % 2 == 0) {
              var currentOwner = owners[x-1];
            } else {
              var currentOwner = owners[owners.length-x];
            }
            if(players[pickCounter-1] == "null") {
              cell = $('<th id="'+pickCounter+'">'+pickCounter+'<br/>'+currentOwner+'</th>');
            } else {
              cell = $('<th id="'+pickCounter+'">'+players[pickCounter-1]+'<br/>'+currentOwner+'</th>');
            }
          }
          row.append(cell);
        }
        table.append(row);
      }
      $('#draft').append(table);
      if(draftNotStarted) {
        nextPick(teams, owners, phones, players, playerTeams);
      }
    }, function (errorObject) {
      console.log("The read failed: " + errorObject.code);
    });

    $('#draftID').remove();
    $('#draftIDSubmit').remove();

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

  var ticking = new Audio("audio/ticking.wav");
  var alarm = new Audio("audio/alarm.wav");

  countdown = Tock({
      countdown: true,
      interval: 50,
      callback: function () {
        var currentValue = countdown.msToTime(countdown.lap());
        var currentValueInt = parseInt(currentValue.replace(":",""));
        if(currentValueInt != 500 && currentValueInt % 30 == 0 && currentValueInt > 30) {
          document.getElementById('timer').style.zIndex = -1000;
          setTimeout(showCountdown, 24000);
        }
        if(currentValueInt <= 100) {
          ticking.play();
          $('#countdown_clock').css("color","red");
        } else {
          $('#countdown_clock').css("color", "black");
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

  setTimeout(startCountdown,500);
}

function showCountdown() {
  document.getElementById('timer').style.zIndex = 1000;
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

function nextPick(teams, owners, phones, players, playerTeams) {

  pauseCountdown();
  var draftTable = document.getElementById('draftTable');

  var counter = 0;
  while(players[counter] != "null") {
    counter++;
  }
  if(counter > 0) {
    document.getElementById('timer').style.zIndex = -1000;
    document.getElementById('pickin').style.zIndex = 2000;
    responsiveVoice.speak("The pick is in", "UK English Male",{onStart: nothing, onEnd: releaseAnnouncePick});
    function releaseAnnouncePick() {
      announcePick(currentTeam, currentOwner, players[counter-1], playerTeams[counter-1]);
    }
  }

  initiateCountdown();
  currentTeam = teams[counter];
  currentOwner = owners[counter];
  currentPhone = phones[counter];
  if(counter > 0) {
    var previousCell = document.getElementById(counter);
    previousCell.className = "";
  }
  var cell = document.getElementById(counter+1);
  cell.className += "currentPick";
  $('#teamName').empty();
  $('#teamName').append(currentTeam);

}

function announcePick(t, o, p, player, playerTeam) {
  document.getElementById('pickin').style.zIndex = -2000;
  document.getElementById('pick').style.zIndex = 3000;
  responsiveVoice.speak(player);
}

function nothing() {
}

function sleep(miliseconds) {
 var currentTime = new Date().getTime();
 while (currentTime + miliseconds >= new Date().getTime()) {
 }
}
