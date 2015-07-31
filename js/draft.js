var draftID;
var countdown;
var draftActive = false;
var timePerPick;
var currentPick;
var userID;

//data that needs to be cached
var playerData;
var messageData;
var firstMessageID;
var currentMessageID;

//initialize audio files
var ticking = new Audio("audio/ticking.wav");
var alarm = new Audio("audio/alarm.wav");
var ping = new Audio("audio/ping.mp3");

//information for team on the clock
var currentTeam;
var currentOwner;
var currentPhone;

//information for player that was just selected
var pickedPlayer;
var pickedPlayerTeam;
var pickedPlayerPosition;

//users twilio information
var accountSID;
var authToken;
var twilioNumber;

$(document).ready(function() {
  var pickCounter;
  var teams, owners, phones;
  var players, playerTeams, playerPositions;
  var numRounds;
  userID = localStorage.getItem('uid');

  var draftsRef = new Firebase("https://fantasy-draft-host.firebaseio.com/drafts");
  var userRef = new Firebase("https://fantasy-draft-host.firebaseio.com/users/"+userID);

  draftsRef.once('value', function(draftsSnapshot) {
    $('#draftList').empty();
    var draftListTable = $("<table cellpadding='20'></table>");
    draftListTable.attr('id','draftListTable');
    draftListTable.attr('class','flat-table flat-table-3');
    var titleRow = $('<tr><th><b>League</b></th><th><b>Sport</b></th><th><b>Teams</b></th><th><b>Rounds</b></th><th><b>Timer</b></th><th><b>Draft</b></th></tr>');
    draftListTable.append(titleRow);

    draftsSnapshot.forEach(function(draftSnapshot) {
      if(draftSnapshot.child('userID').val() == userID) {
        var draftRow = $('<tr></tr>');
        draftRow.append($('<th>'+draftSnapshot.child('leagueName').val()+'</th>'));
        draftRow.append($('<th>'+draftSnapshot.child('sport').val()+'</th>'));
        draftRow.append($('<th>'+draftSnapshot.child('teams').val()+'</th>'));
        draftRow.append($('<th>'+draftSnapshot.child('rounds').val()+'</th>'));
        draftRow.append($('<th>'+draftSnapshot.child('timePerPick').val()+'</th>'));
        draftRow.append($('<th><input type="submit" value="Start Draft" class="start-draft-flat-button draftIDSubmit" data-id="'+draftSnapshot.key()+'" /></th>'));
        draftListTable.append(draftRow);
      }
    });
    $('#draftList').append("<h1 class='openSans'>"+localStorage.getItem("displayName")+"'s drafts</h1>");
    $('#draftList').append(draftListTable);
  });

  userRef.once('value', function(userSnapshot) {
    accountSID = userSnapshot.child('accountSID').val();
    authToken = userSnapshot.child('authToken').val();
    twilioNumber = userSnapshot.child('number').val();
  });

  $('#draftList').on('click','input', function() {
    //document.getElementById('draftList').style.position = "fixed";
    document.getElementById('draftList').style.zIndex = -2125;

    draftActive = true;
    loadPlayerData();

    draftID = $(this).data('id');
    var draftRef = new Firebase("https://fantasy-draft-host.firebaseio.com/drafts/"+draftID);

    draftRef.once("value", function(draftSnapshot) {
      var teamCounter = 0;
      var limit = parseInt(draftSnapshot.child('teams').val());

      var picksSnapshot = draftSnapshot.child('picks');
      picksSnapshot.forEach(function(pick) {
        teamCounter++;
        var teamPhone = pick.child('phone').val();

        $.ajax({
          url: 'https://api.twilio.com/2010-04-01/Accounts/'+accountSID+'/Messages.json',
          type: 'post',
          dataType: 'json',
          data: {
            "To": teamPhone,
            "From": twilioNumber,
            "Body": "Welcome to Fantasy Draft Host!"
          },
          beforeSend: function(xhr) {
            xhr.setRequestHeader('Authorization',make_base_auth(accountSID,authToken));
          },
          success: function(data) {
          }
        });

        if(teamCounter == limit) {
          return true;
        }
      });
    });

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
      timePerPick = draftSnapshot.child('timePerPick').val();

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
      table.attr('class','flat-table flat-table-3');

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
              var positionColor = getPositionColor(playerPositions[pickCounter-1]);
              cell = $('<th bgcolor="'+positionColor+'" id="'+pickCounter+'"><b>'+players[pickCounter-1]+'</b><br/>'+currentOwner+'</th>');
            }
          }
          row.append(cell);
        }
        table.append(row);
      }
      $('#draft').append(table);
      if(draftActive) {
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
  ping = new Audio("audio/ping.mp3");

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

        //update firebase that the team selects no one
        var pickRef = new Firebase("https://fantasy-draft-host.firebaseio.com/drafts/"+draftID+"/picks/"+currentPick);
        pickRef.update({
          player: "No One",
          playerTeam: "Timed Out",
          playerPosition: "null"
        });
      }
  });

  countdown.start(timePerPick); //just to reset it
  countdown.pause();
  ping.play();

  setTimeout(showCountdown,250);
}

function showCountdown() {
  document.getElementById('timer').style.zIndex = 1000;
}

function stopAlarm() {
  alarm.pause();
}

function showCountdown() {
  document.getElementById('timer').style.zIndex = 1000;
  countdown.start(timePerPick);
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

var toppp;

function nextPick(teams, owners, phones, players, playerTeams, playerPositions) {

  var draftTable = document.getElementById('draftTable');

  var counter = 0;
  while(players[counter] != "null" && counter < players.length) {
    counter++;
  }
  currentPick = counter+1;

  if(counter > 0) {
    if(counter == players.length) {
      draftActive = false;
    }
    toppp = [];
    pauseCountdown();
    document.getElementById('timer').style.zIndex = -1000;
    document.getElementById('pickin').style.zIndex = 2000;
    toppp.push(teams[counter-1]);
    toppp.push(owners[counter-1]);
    toppp.push(players[counter-1]);
    toppp.push(playerTeams[counter-1]);
    toppp.push(playerPositions[counter-1]);
    responsiveVoice.speak("The pick is in", "UK English Male",{onstart: nothing, onend: pauseForTeam});
  } else {
    setTimeout(initiateCountdown,3000);
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

    checkedMessages = [];
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
  responsiveVoice.speak(toppp[0]+" selects ", "UK English Male", {onstart: nothing, onend: announcePick});
}

function announcePick() {
  document.getElementById('pickin').style.zIndex = -2000;
  $('#player').val(toppp[2]+", "+toppp[4]);
  $('#playerTeam').attr('placeholder',toppp[3]);
  $('#team').val(toppp[0]);
  document.getElementById('pick').style.zIndex = 3000;
  responsiveVoice.speak(toppp[2], "UK English Male");
  setTimeout(hidePick,4000);
  setTimeout(playPlayerHighlightReel,3500);
}

function playPlayerHighlightReel() {
  var source = 'videos/'+toppp[2].replace(/\s+/g, '')+'.mp4';
  $('#playerHighlightReel').attr('src',source);
  var HTMLvideo = document.getElementById('playerHighlightReel');
  HTMLvideo.addEventListener('ended',videoEnded,false);

  HTMLvideo.addEventListener("loadedmetadata", function() {
    HTMLvideo.play();
    document.getElementById('playerHighlights').style.zIndex = 4000;
  });
}

$("video").on("error", function() {
  if(draftActive) {
    setTimeout(initiateCountdown,1750);
  }
})

function videoEnded() {
  document.getElementById('playerHighlights').style.zIndex = -4000;
  if(draftActive) {
    setTimeout(initiateCountdown,1750);
  }
}

function loadPlayerData() {
  $.getJSON('http://cors.io/?u=http://www.fantasyfootballnerd.com/service/players/json/63utcjcxdghw', function(data) {
    playerData = data;
  });
}

function updateMessageData() {
  $.ajax({
    url: 'https://api.twilio.com/2010-04-01/Accounts/'+accountSID+'/Messages.json',
    type: 'get',
    dataType: 'json',
    async: false,
    beforeSend: function(xhr) {
      xhr.setRequestHeader('Authorization',make_base_auth(accountSID,authToken));
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
    if(fromPhone == currentPhone && validPlayer(playerPicked, messageData.messages[i].sid)) {
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

var checkedMessages = [];

function validPlayer(playerName, messageSID) {
  var valid = false;
  var auth = make_base_auth(accountSID,authToken);

  //checks if player is real using the data obtained from the NFL Player API
  for (var i = 0; i < playerData.Players.length; i++) {
    if(playerData.Players[i].displayName.toUpperCase() === playerName.toUpperCase()) {
      valid = true;
      pickedPlayer = playerData.Players[i].displayName;
      pickedPlayerTeam = playerData.Players[i].team;
      pickedPlayerPosition = playerData.Players[i].position;
      break;
    }
  }
  if(!valid) {
    if(!(checkedMessages.indexOf(messageSID) > -1)) {
      $.ajax({
        url: 'https://api.twilio.com/2010-04-01/Accounts/'+accountSID+'/Messages.json',
        type: 'post',
        dataType: 'json',
        async: false,
        data: {
          "To": currentPhone,
          "From": twilioNumber,
          "Body": "That is not a valid player, bro (or you may have misspelled the name). Pick again."
        },
        beforeSend: function(xhr) {
          xhr.setRequestHeader('Authorization',auth);
        },
        success: function(data) {
          checkedMessages.push(messageSID);
        }
      });
    }
    return false;
  }

  //checks if player has already been drafted
  var picksRef = new Firebase("https://fantasy-draft-host.firebaseio.com/drafts/"+draftID+"/picks/");
  picksRef.once('value', function(picksSnapshot) {
    picksSnapshot.forEach(function (pickSnapshot) {
      var savedPlayerName = pickSnapshot.child('player').val();

      if(playerName.toUpperCase() === savedPlayerName.toUpperCase()) {
        if(!(checkedMessages.indexOf(messageSID) > -1)) {
          $.ajax({
            url: 'https://api.twilio.com/2010-04-01/Accounts/'+accountSID+'/Messages.json',
            type: 'post',
            dataType: 'json',
            data: {
              "To": currentPhone,
              "From": twilioNumber,
              "Body": savedPlayerName+" has already been selected. Pick again."
            },
            beforeSend: function(xhr) {
              xhr.setRequestHeader('Authorization',auth);
            },
            success: function(data) {
              checkedMessages.push(messageSID);
            }
          });
        }
        valid = false;
      }
    });
  });

  return valid;
}

function getPositionColor(position) {
  switch(position) {
    case "QB":
      return "FFC85A";
    case "RB":
      return "BBFF5A";
    case "WR":
      return "00EEEE";
    case "TE":
      return "FFAEEA";
    case "DEF":
      return "FF3F5A";
    default:
      return "FFFF91";
  }
}

function nothing() {
}

function make_base_auth(user, password) {
    var tok = user + ':' + password;
    var hash = btoa(tok);
    return 'Basic ' + hash;
}
