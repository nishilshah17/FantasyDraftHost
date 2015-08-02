var viewDraftID;
var draftActive = false;
var firstInstance = true;
var lastPick = false;

var currentTeam;
var currentOwner;
var currentPick;
var announced = [];

var ping = new Audio("../audio/ping.mp3");

$(document).ready(function() {
  var pickCounter;
  var teams, owners, phones;
  var players, playerTeams, playerPositions;
  var numRounds, numPicks;
  draftActive = true;
  viewDraftID = localStorage.getItem('viewDraftID');
  console.log(viewDraftID);

  var draftRef = new Firebase("https://fantasy-draft-host.firebaseio.com/drafts/"+viewDraftID);

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
    nextPick(teams, owners, phones, players, playerTeams, playerPositions);
  }, function (errorObject) {
    console.log("The read failed: " + errorObject.code);
  });
});

function nextPick(teams, owners, phones, players, playerTeams, playerPositions) {

  var draftTable = document.getElementById('draftTable');

  var counter = 0;
  videoReadyToPlay = true;
  while(players[counter] != "null" && counter < players.length) {
    counter++;
  }
  currentPick = counter+1;

  if(counter > 0 && !firstInstance) {
    if(counter == players.length) {
      draftActive = false;
      lastPick = true;
    }
    if(announced.indexOf(players[counter-1]) < 0) {
      announced.push(players[counter-1]);
      toppp = [];
      document.getElementById('pickin').style.zIndex = 2000;
      toppp.push(teams[counter-1]);
      toppp.push(owners[counter-1]);
      toppp.push(players[counter-1]);
      toppp.push(playerTeams[counter-1]);
      toppp.push(playerPositions[counter-1]);
      var source = '../videos/'+toppp[2].replace(/\s+/g, '')+'.mp4';
      $('#playerHighlightReel').attr('src',source);
      $('#playerHighlightReel').attr('preload','auto');
      responsiveVoice.speak("The pick is in", "UK English Male",{onstart: null, onend: pauseForTeam});
    }
  } else if(currentPick < (players.length + 1)){
    firstInstance = false;
  }
  if(counter < players.length) {
    currentTeam = teams[counter];
    currentOwner = owners[counter];

    if(counter > 0) {
      var previousCell = document.getElementById(counter);
      previousCell.className = "";
    }
    var cell = document.getElementById(counter+1);
    cell.className += "currentPick";
    $('#teamName').empty();
    $('#teamName').append(currentTeam);
  }
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

function hidePick() {
  document.getElementById('pick').style.zIndex = -3000;
}

function playPlayerHighlightReel() {
  var HTMLvideo = document.getElementById('playerHighlightReel');
  HTMLvideo.addEventListener('ended',videoEnded,false);
  if(videoReadyToPlay) {
    HTMLvideo.play();
    document.getElementById('playerHighlights').style.zIndex = 4000;
  } else {
    if(!lastPick) {
      ping.play();
    }
  }
}

function videoEnded() {
  document.getElementById('playerHighlights').style.zIndex = -4000;
  if(!lastPick) {
    ping.play();
  }
}

$("video").on("error", function() {
  if(draftActive || lastPick) {
    videoReadyToPlay = false;
  }
})

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
