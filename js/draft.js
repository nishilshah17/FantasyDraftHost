var draftID;
var countdown;
var draftNotStarted = true;

var playerData;
var messageData;
var firstMessageID;
var currentMessageID;

var ticking = new Audio("audio/ticking.wav");
var alarm = new Audio("audio/alarm.wav");

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
            var currentOwner = owners[pickCounter-1];
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

  setTimeout(startCountdown,100);
}

function showCountdown() {
  document.getElementById('timer').style.zIndex = 1000;
}

function stopAlarm() {
  alarm.pause();
}

function startCountdown() {
  countdown.start("05:00");
  document.getElementById('timer').style.zIndex = 1000;
}

function resumeCountdown() {
  countdown.start($('#countdown_clock').val());
}

function pauseCountdown() {
  if(countdown != undefined) {
    countdown.pause();
  }
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
    topp.push(teams[counter-1]);
    topp.push(owners[counter-1]);
    topp.push(players[counter-1]);
    topp.push(playerTeams[counter-1]);
    topp.push(playerPositions[counter-1]);
    responsiveVoice.speak("The pick is in", "UK English Male",{onstart: nothing, onend: pauseForTeam});
  } else {
    initiateCountdown();
  }
  if(counter < players.length) {
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
    if(messageData.messages.length > 0) {
      firstMessageID = messageData.messages[0].sid;
    } else {
      firstMessageID = 0;
    }
    checkMessages(counter+1);
  }
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

function announcePick() {
  document.getElementById('pickin').style.zIndex = -2000;
  $('#player').val(topp[2]+", "+topp[4]);
  $('#playerTeam').attr('placeholder',topp[3]);
  $('#team').val(topp[0]);
  document.getElementById('pick').style.zIndex = 3000;
  responsiveVoice.speak(topp[2], "UK English Male");
  setTimeout(hidePick,3500);
  setTimeout(playPlayerHighlightReel,3200);
}

function playPlayerHighlightReel() {
  var source = 'videos/'+topp[2].replace(/\s+/g, '')+'.mp4';
  $('#playerHighlightReel').attr('src',source);
  var HTMLvideo = document.getElementById('playerHighlightReel');
  HTMLvideo.addEventListener('ended',videoEnded,false);

  HTMLvideo.addEventListener("loadedmetadata", function() {
    if(!isNaN(HTMLvideo.duration)) {
      HTMLvideo.play();
      document.getElementById('playerHighlights').style.zIndex = 4000;
    } else {
      setTimeout(initiateCountdown,1500);
    }
  });
}

function videoEnded() {
  document.getElementById('playerHighlights').style.zIndex = -4000;
  setTimeout(initiateCountdown,1500);
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
  if(messageData.messages.length > 0) {
    currentMessageID = messageData.messages[0].sid;
  } else {
    currentMessageID = 0;
  }

  for(var i = 0; i < messageData.messages.length; i++) {
    if(messageData.messages[i].sid == firstMessageID) {
      repeat = true;
      break;
    }
    var fromPhone = messageData.messages[i].from;
    fromPhone = fromPhone.substring(2); //remove the +1 from the phone number
    var playerPicked = messageData.messages[i].body;
    if(fromPhone == currentPhone && validPlayer(playerPicked)) {
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

  if(repeat) {
    setTimeout(checkMessages,4000,pickNumber);
  }
}

function validPlayer(playerName) {
  var valid = false;

  //checks if player is real using the data obtained from the NFL Player API
  for (var i = 0; i < playerData.Players.length; i++) {
    if(playerData.Players[i].displayName == playerName) {
      valid = true;
      pickedPlayer = playerData.Players[i].displayName;
      pickedPlayerTeam = playerData.Players[i].team;
      pickedPlayerPosition = playerData.Players[i].position;
      break;
    }
  }
  if(!valid) {
    return false;
  }

  //checks if player has already been drafted
  var picksRef = new Firebase("https://fantasy-draft-host.firebaseio.com/drafts/"+draftID+"/picks/");
  picksRef.once('value', function(picksSnapshot) {
    picksSnapshot.forEach(function (pickSnapshot) {
      var savedPlayerName = pickSnapshot.child('player').val();

      if(playerName == savedPlayerName) {
        valid = false;
      }
    });
  });

  return valid;
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
