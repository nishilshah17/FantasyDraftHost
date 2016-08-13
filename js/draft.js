var draftID;
var userID;
var countdown;
var draftActive = false;
var lastPick = false;
var timePerPick;
var currentPick;
var videoReadyToPlay;
var firstInstance = true;
var numPicks;
var betweenPicks = true;

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

var toppp; //stands for teams, owners, phones, players playerTeams, playerPositions

$(document).ready(function() {
  var pickCounter;
  var teams, owners, phones;
  var players, playerTeams, playerPositions;
  var numRounds;
  userID = localStorage.getItem('uid');

  var draftsRef = new Firebase("https://fantasy-draft-host.firebaseio.com/drafts");
  var userRef = new Firebase("https://fantasy-draft-host.firebaseio.com/users/"+userID);

  draftsRef.on('value', function(draftsSnapshot) {
    $('#draftList').empty();
    var draftListTable = $("<table cellpadding='20'></table>");
    draftListTable.attr('id','draftListTable');
    draftListTable.attr('class','flat-table flat-table-3');
    var titleRow = $('<tr><th><b>League</b></th><th><b>Sport</b></th><th><b>Teams</b></th><th><b>Rounds</b></th><th><b>Timer</b></th><th><b>Draft</b></th><th><b>Delete</b></th></tr>');
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
        draftRow.append($('<th><input type="submit" value="Delete" class="delete-draft-flat-button deleteDraftSubmit" data-id="'+draftSnapshot.key()+'" /></th>'));
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
    draftID = $(this).data('id');
    var draftRef = new Firebase("https://fantasy-draft-host.firebaseio.com/drafts/"+draftID);

    if($(this).val() == "Start Draft") {

      //document.getElementById('draftList').style.position = "fixed";
      document.getElementById('draftList').style.zIndex = -2125;

      draftActive = true;
      loadPlayerData();

      draftRef.update({
        active: "true"
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
        numPicks = draftSnapshot.child('picks').numChildren();
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
          var rowCells = [];

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
            rowCells.push(cell);
          }

          row.append(rowCells[0]);
          if(y % 2 == 0) {
            for (var i = 1; i < rowCells.length; i++) {
              row.append(rowCells[i]);
            }
          } else {
            for (var i = rowCells.length-1; i > 0; i--) {
              row.append(rowCells[i]);
            }
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
    } else if ($(this).val() == "Delete") {
      draftRef.remove();
    }

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

  $(window).on('beforeunload', function() {
    var draftRef = new Firebase("https://fantasy-draft-host.firebaseio.com/drafts/"+draftID);
    draftRef.update({
      active: "false"
    });
  });
});

function initiateCountdown() {

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
        ticking.currentTime = 0;
        alarm.play();
        setTimeout(stopAlarm, 4500);

        //check messages one last time
        checkMessages(true);
      }
  });

  countdown.start(timePerPick); //just to reset it
  countdown.pause();
  ping.play();
  betweenPicks = false;

  setTimeout(resumeCountdown,250);
}

function showCountdown() {
  document.getElementById('timer').style.zIndex = 1000;
}

function stopAlarm() {
  alarm.pause();
  alarm.currentTime = 0;
}

function resumeCountdown() {
  document.getElementById('timer').style.zIndex = 1000;
  countdown.start($('#countdown_clock').val());
}

function stopCountdown() {
  countdown.stop();
  ticking.pause();
  ticking.currentTime = 0;
  alarm.pause();
  alarm.currentTime = 0;
}

function pauseCountdown() {
  if(countdown != undefined) {
    countdown.pause();
  }
  ticking.pause();
  alarm.pause();
}

function nextPick(teams, owners, phones, players, playerTeams, playerPositions) {

  var draftTable = document.getElementById('draftTable');

  var counter = 0;
  videoReadyToPlay = true;
  while(players[counter] != "null" && counter < players.length) {
    counter++;
  }
  currentPick = counter+1;

  if(counter > 0 && !firstInstance) {
    var tempCounter = counter-1;
    while(playerPositions[tempCounter] == "keeper") {
      tempCounter--;
    }
    if(tempCounter >= 0) {
      betweenPicks = true;
      if(counter == players.length) {
        draftActive = false;
        lastPick = true;
      }
      stopCountdown();
      document.getElementById('timer').style.zIndex = -1000;
      document.getElementById('pickin').style.zIndex = 2000;
      toppp = [];
      toppp.push(teams[tempCounter]);
      toppp.push(owners[tempCounter]);
      toppp.push(players[tempCounter]);
      toppp.push(playerTeams[tempCounter]);
      toppp.push(playerPositions[tempCounter]);
      var source = 'videos/'+toppp[2].replace(/\s+/g, '')+'.mp4';
      $('#playerHighlightReel').attr('src',source);
      $('#playerHighlightReel').attr('preload','auto');
      responsiveVoice.speak("The pick is in", "UK English Male",{onstart: null, onend: pauseForTeam});
    }
  } else if(currentPick < (players.length + 1)){
    firstInstance = false;
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
    checkMessages(false);
  }
}

function hidePick() {
  document.getElementById('pick').style.zIndex = -3000;
}

function pauseForTeam() {
  setTimeout(announceTeam, 3000);
}

function announceTeam() {
  responsiveVoice.speak(toppp[0]+" selects ", "UK English Male", {onstart: null, onend: announcePick});
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
  var HTMLvideo = document.getElementById('playerHighlightReel');
  HTMLvideo.addEventListener('ended',videoEnded,false);
  if(videoReadyToPlay) {
    HTMLvideo.play();
    document.getElementById('playerHighlights').style.zIndex = 4000;
  } else {
    document.getElementById('timer').style.zIndex = -1000;
    if(!lastPick) {
      setTimeout(initiateCountdown, 1750);
    }
  }
}

$("video").on("error", function() {
  if(draftActive || lastPick) {
    videoReadyToPlay = false;
  }
})

function videoEnded() {
  document.getElementById('timer').style.zIndex = -1000;
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

function checkMessages(timeIsOut) {
  updateMessageData();
  var repeat;
  if(currentPick < numPicks + 1) {
    if(messageData.messages.length > 0) {
      currentMessageID = messageData.messages[0].sid;
      if(messageData.messages[0].direction == "outbound-reply" && messageData.messages.length > 1) {
        currentMessageID = messageData.messages[1].sid;
      }
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
      if(fromPhone == currentPhone && validPlayer(playerPicked, messageData.messages[i].sid) && !betweenPicks) {
        if(pickedPlayer == "Adrian Peterson") {
          pickedPlayerTeam = "MIN";
        }
        repeat = false;
        var pickRef = new Firebase("https://fantasy-draft-host.firebaseio.com/drafts/"+draftID+"/picks/"+currentPick);
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

    if(repeat && !timeIsOut) {
      setTimeout(checkMessages,4000,timeIsOut);
    }
    if(repeat && timeIsOut) {
      var pickRef = new Firebase("https://fantasy-draft-host.firebaseio.com/drafts/"+draftID+"/picks/"+currentPick);
      pickRef.update({
        player: "No One",
        playerTeam: "Timed Out",
        playerPosition: "null"
      });
    }
  }
}

var checkedMessages = [];

function validPlayer(playerName, messageSID) {
  var valid = false;
  var auth = make_base_auth(accountSID,authToken);

  //checks if player is real using the data obtained from the NFL Player API
  for (var i = 0; i < playerData.Players.length; i++) {
    if(playerData.Players[i].displayName.toUpperCase().split('.').join("") === playerName.toUpperCase().split('.').join("")) {
      valid = true;
      pickedPlayer = playerData.Players[i].displayName;
      pickedPlayerTeam = playerData.Players[i].team;
      pickedPlayerPosition = playerData.Players[i].position;
      break;
    }
  }
  if(!valid) {
    if(!(checkedMessages.indexOf(messageSID) > -1)) {
      checkedMessages.push(messageSID);
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
    case "keeper":
      return "5AFFC8";
    default:
      return "FFFF91";
  }
}

function make_base_auth(user, password) {
    var tok = user + ':' + password;
    var hash = btoa(tok);
    return 'Basic ' + hash;
}
