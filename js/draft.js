var draftID;
var playerData;
var messageData;

var ogMessagesLength;
var currentMessagesLength;
var countdown;
var draftNotStarted = true;

var ticking;
var alarm;

var currentTeam;
var currentOwner;
var currentPhone;

var pickedPlayer;
var pickedPlayerTeam;
var pickedPlayerPosition;

$(document).ready(function() {
  var pickCounter;
  var teams;
  var owners;
  var phones;
  var players;
  var playerTeams;
  var numRounds;

  $('#draftIDSubmit').click(function() {
    loadPlayerData();

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

  ticking = new Audio("audio/ticking.wav");
  alarm = new Audio("audio/alarm.wav");

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
        if(currentValueInt <= 100 && currentValueInt != 0) {
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

var topp;

function nextPick(teams, owners, phones, players, playerTeams) {

  var draftTable = document.getElementById('draftTable');

  var counter = 0;
  while(players[counter] != "null") {
    counter++;
  }
  if(counter > 0) {
    topp = [];
    pauseCountdown();
    document.getElementById('timer').style.zIndex = -1000;
    document.getElementById('pickin').style.zIndex = 2000;
    topp.push(currentTeam);
    topp.push(currentOwner);
    topp.push(players[counter-1]);
    topp.push(playerTeams[counter-1]);
    responsiveVoice.speak("The pick is in", "UK English Male",{onstart: nothing, onend: pauseForTeam});
  }

  initiateCountdown();
  currentTeam = teams[counter];
  currentOwner = owners[counter];
  currentPhone = phones[counter];

  updateMessageData();
  ogMessagesLength = messageData.messages.length;
  checkMessages();

  if(counter > 0) {
    var previousCell = document.getElementById(counter);
    previousCell.className = "";
  }
  var cell = document.getElementById(counter+1);
  cell.className += "currentPick";
  $('#teamName').empty();
  $('#teamName').append(currentTeam);

}

function announcePick() {
  document.getElementById('pickin').style.zIndex = -2000;
  $('#player').val(topp[2]);
  $('#playerTeam').attr('placeholder',topp[3]);
  $('#team').val(topp[0]);
  document.getElementById('pick').style.zIndex = 3000;
  responsiveVoice.speak(topp[2], "UK English Male");
}

function pauseForTeam() {
  setTimeout(announceTeam, 3000);
}

function announceTeam() {
  responsiveVoice.speak(topp[0]+" selects ", "UK English Male", {onstart: nothing, onend: announcePick});
}

function loadPlayerData() {
  $.getJSON('http://cors.io/?u=http://www.fantasyfootballnerd.com/service/players/json/63utcjcxdghw', function(data) {
    playerData = data;
  });
}

function updateMessageData() {
  $.ajax({
    url: 'https://api.twilio.com/2010-04-01/Accounts/'+sid+'/Messages.json',
    type: 'get',
    dataType: 'json',
    beforeSend: function(xhr) {
      xhr.setRequestHeader('Authorization',make_base_auth(sid,authToken));
    },
    success: function(data) {
      messageData = data;
    }
  });
}

function checkMessages() {
  updateMessageData();
  var repeat;

  currentMessagesLength = messageData.messages.length;

  if(currentMessagesLength > ogMessagesLength) {
    for(var i = ogMessagesLength; i < currentMessagesLength-1; i++) {
      var fromPhone = messageData.messages[i].from;
      fromPhone = fromPhone.substring(2);
      var playerPicked = messageData.messages[i].body;
      if(fromPhone == currentPhone && containsPlayer(playerPicked)) {
        repeat = false;
        //save pick to firebase at this point
        break;
      } else {
        repeat = true;
      }
    }
  } else {
    repeat = true;
  }

  if(repeat) {
    setTimeout(checkMessages,5000);
  }
}

function containsPlayer(playerName) {
  var contains;

  for (var i = 0; i < data.Players.length; i++) {
    if(data.Players[i].displayName == playerName) {
      contains = true;
      pickedPlayer = data.Players[i].displayName;
      pickedPlayerTeam = data.Players[i].team;
      pickedPlayerPosition = data.Players[i].position;
      break;
    } else {
      contains = false;
    }
  }

  return contains;
}

function make_base_auth(user, password) {
    var tok = user + ':' + password;
    var hash = btoa(tok);
    return 'Basic ' + hash;
}

function nothing() {
}

function sleep(miliseconds) {
 var currentTime = new Date().getTime();
 while (currentTime + miliseconds >= new Date().getTime()) {
 }
}
