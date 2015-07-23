var draftID;
var countdown;
var draftNotStarted = true;

var playerData;
var messageData;
var ogMessagesLength;
var currentMessagesLength;

var ticking;
var alarm;

//information for team on the clock
var currentTeam;
var currentOwner;
var currentPhone;

//information for player that was just selected
var pickedPlayer;
var pickedPlayerTeam;
var pickedPlayerPosition;

$(document).ready(function() {
  var pickCounter;
  var teams, owners, phones;
  var players, playerTeams, playerPositions;
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
      playerPositions = [];

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
        playerPositions.push(pickSnapshot.child('playerPosition').val());
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
        nextPick(teams, owners, phones, players, playerTeams, playerPositions);
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

function nextPick(teams, owners, phones, players, playerTeams, playerPositions) {

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
    topp.push(playerPositions[counter-1]);
    responsiveVoice.speak("The pick is in", "UK English Male",{onstart: nothing, onend: pauseForTeam});
  } else {
    initiateCountdown();
  }

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

  updateMessageData();
  ogMessagesLength = messageData.messages.length;
  checkMessages(counter+1);

}

function announcePick() {
  document.getElementById('pickin').style.zIndex = -2000;
  $('#player').val(topp[2]+", "+topp[4]);
  $('#playerTeam').attr('placeholder',topp[3]);
  $('#team').val(topp[0]);
  document.getElementById('pick').style.zIndex = 3000;
  responsiveVoice.speak(topp[2], "UK English Male");
  setTimeout(hidePick,3000);
  setTimeout(initiateCountdown,4000);
}

function hidePick() {
  document.getElementById('pick').style.zIndex = -3000;
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
    async: false,
    beforeSend: function(xhr) {
      xhr.setRequestHeader('Authorization',make_base_auth(sid,authToken));
    },
    success: function(data) {
      messageData = data;
    }
  });
}

function checkMessages(pickNumber) {
  updateMessageData();
  var repeat;
  currentMessagesLength = messageData.messages.length;

  if(currentMessagesLength > ogMessagesLength) {
    for(var i = 0; i < currentMessagesLength-ogMessagesLength; i++) {
      var fromPhone = messageData.messages[i].from;
      fromPhone = fromPhone.substring(2); //remove the +1 from the phone number
      var playerPicked = messageData.messages[i].body;
      if(fromPhone == currentPhone && containsPlayer(playerPicked)) {
        repeat = false;
        var pickRef = new Firebase("https://fantasy-draft-host.firebaseio.com/drafts/"+draftID+"/picks/"+pickNumber);
        pickRef.update({
          owner: currentOwner,
          team: currentTeam,
          phone: currentPhone,
          player: pickedPlayer,
          playerTeam: pickedPlayerTeam,
          playerPosition: pickedPlayerPosition
        });
        break;
      } else {
        repeat = true;
      }
    }
  } else {
    repeat = true;
  }

  if(repeat) {
    setTimeout(checkMessages,4000,pickNumber);
  }
}

function containsPlayer(playerName) {
  var contains;

  for (var i = 0; i < playerData.Players.length; i++) {
    if(playerData.Players[i].displayName == playerName) {
      contains = true;
      pickedPlayer = playerData.Players[i].displayName;
      pickedPlayerTeam = playerData.Players[i].team;
      pickedPlayerPosition = playerData.Players[i].position;
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
