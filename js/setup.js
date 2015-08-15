//users twilio information
var accountSID;
var authToken;
var twilioNumber;

var picksCustomized = false;
var pickCounter;

var draftOrder = [];
var keepers = [];

var teams = [];
var owners = [];
var phones = [];

var userID = localStorage.getItem('uid');
var userRef = new Firebase("https://fantasy-draft-host.firebaseio.com/users/"+userID);

userRef.once('value', function(userSnapshot) {
  accountSID = userSnapshot.child('accountSID').val();
  authToken = userSnapshot.child('authToken').val();
  twilioNumber = userSnapshot.child('number').val();
});

for(var i = 0; i < 20; i++) {
  $("#roundsSelect").append(new Option(i+1, i+1));
}

for(var i = 0; i < 20; i++) {
  $("#teamsSelect").append(new Option(i+1, i+1));
}

$('#teamsSelect').change(function() {
  $('#teamsInputList').empty();
  draftOrder = [];
  keepers = [];
  for(var i = 0; i < $('#roundsSelect').val(); i++) {
    for(var j = 0; j < $('#teamsSelect').val(); j++) {
      if(i % 2 == 1) {
        draftOrder.push($('#teamsSelect').val()-j);
      } else {
        draftOrder.push(j+1);
      }
      keepers.push("No Keeper");
    }
  }
  var teamsValue = $(this).val();
  if(teamsValue != "teams") {
    var maxInputFields = parseInt(teamsValue);
    for(var i = 0; i < maxInputFields; i++) {
      $('#teamsInputList').append('<input type="text" id="team'+(i+1)+'" class="team-sub-input" placeholder="team" /><input type="text" id="owner'+(i+1)+'" class="team-sub-input" placeholder="owner" /><input type="text" id="phone'+(i+1)+'" class="team-sub-input" placeholder="phone number" />')
    }
    $('#teamsInputList').append('<h4 class="openSans">owners can only text in their picks through their own phones</h4>');
  }
});

var ref = new Firebase("https://fantasy-draft-host.firebaseio.com/drafts");

$('#customizeButton').click(function () {
  if($('#teamsSelect').val() == "teams") {
    alert("Fill out team information first.");
  } else {
    document.getElementById('customizePicks').style.zIndex = 1000;
    pickCounter = 0;
    $('#customizePicks').empty();
    $('#customizePicks').append('<p align="left" class="instructions">enter keepers into the text box; change draft picks with the dropdowns</p>')
    $('#customizePicks').append('<p align="right" onclick="done()" style="color:black;" class="done" id="done">save customization</p>');
    owners = [];
    var table = $('<table></table>');
    table.attr('id','customizeTable');
    table.attr('class','flat-table','flat-table-3');

    for(var y = 0; y < $('#roundsSelect').val(); y++) {
      var row = $("<tr></tr>");
      row.attr('id','round'+(y+1));
      var rowCells = [];
      for(var x = 0; x < parseInt($('#teamsSelect').val()); x++) {
        var cell;
        pickCounter++;
        var dropdownContainer = $('<div></div>')
        var dropdown = $('<select></select>');
        dropdown.attr('class','otherCustomSelect');
        dropdown.attr('id','select'+pickCounter);
        for(var i = 0; i < $('#teamsSelect').val(); i++) {
          if((i+1) == draftOrder[pickCounter-1]) {
            dropdown.append($('<option>', {
              value: i+1,
              text: $('#owner'+(i+1)).val(),
              selected: true
            }));
          } else {
            dropdown.append($('<option>', {
              value: i+1,
              text: $('#owner'+(i+1)).val()
            }))
          }
          owners.push($('#owner'+(i+1)).val());
        }
        dropdownContainer.append(dropdown);
        cell = $('<th class="pickFont" id="'+pickCounter+'">'+pickCounter+'<br/>'+dropdownContainer.html()+'<input type="text" class="keeperText" id="keeper'+pickCounter+'" value="'+keepers[pickCounter-1]+'" /></th>');
        rowCells.push(cell);
      }

      if(y % 2 == 0) {
        for (var i = 0; i < rowCells.length; i++) {
          row.append(rowCells[i]);
        }
      } else {
        for (var i = rowCells.length-1; i > -1; i--) {
          row.append(rowCells[i]);
        }
      }
      table.append(row);
    }
    $('#customizePicks').append(table);
    window.scrollTo(0,0);
  }
});

$('#submitButton').click(function () {
  var league = $('#leagueName').val();
  var sportName = $('#sportSelect').val();
  var numRounds = $('#roundsSelect').val();
  var numTeams = $('#teamsSelect').val();
  var timeLimit = $('#timePerPick').val();
  var uid = localStorage.getItem('uid');

  for(var i = 0; i < numTeams; i++) {
    teams.push($('#team'+(i+1)).val());
    owners.push($('#owner'+(i+1)).val());
    phones.push($('#phone'+(i+1)).val());
  }

  for(var i = 0; i < phones.length; i++) {
    setTimeout(sendWelcome,5,phones[i]);
  }

  var allPicks = "{";
  for(var i = 0; i < draftOrder.length; i++) {
    var currentPick = (i+1);
    var currentPicker = draftOrder[i]-1;
    var teamName;
    var ownerName;
    var phoneNumber;
    var keeper;
    var position;

    teamName = teams[currentPicker];
    ownerName = owners[currentPicker];
    phoneNumber = phones[currentPicker];
    keeper = keepers[i];

    if(keeper == "No Keeper") {
      keeper = "null";
      position = "null";
    } else {
      position = "keeper";
    }

    phoneNumber = phoneNumber.replace(/\s+/g, '');
    phoneNumber = phoneNumber.replace(/\(|\)/g,'');
    phoneNumber = phoneNumber.replace(/-/g, "");
    allPicks += '"'+currentPick+'": ';
      allPicks += '{ "team": "'+teamName+'", "owner": "'+ownerName+'", "phone": "'+phoneNumber+'", "player": "'+keeper+'", "playerTeam": "null", "playerPosition": "'+position+'"}';
    if(i+1 < draftOrder.length) {
      allPicks += ",";
    }
  }
  allPicks += "}";
  var allPicks = JSON.parse(allPicks);

  //send data to firebase
  var newDraftRef = ref.push({
    leagueName: league,
    sport: sportName,
    rounds: numRounds,
    teams: numTeams,
    picks: allPicks,
    timePerPick: timeLimit,
    userID: uid
  });

  var draftID = newDraftRef.key();
  $('#setupBody').empty();
  $('#setupBody').append('<div class="draftID">draft set up successfully</div>');
  $('#setupBody').append('<input type="submit" value="home" class="home-flat-button" onclick=window.location.href="index.html" />');
});

function make_base_auth(user, password) {
    var tok = user + ':' + password;
    var hash = btoa(tok);
    return 'Basic ' + hash;
}

function done() {
  if($('#done').html() == "save customization") {
    draftOrder = [];
    keepers = [];
    for(var i = 0; i < pickCounter; i++) {
      draftOrder.push(parseInt($('#select'+(i+1)).val()));
    }
    for(var i = 0; i < pickCounter; i++) {
      var keeper = $('#keeper'+(i+1)).val();
      keepers.push(keeper);
    }

    $('#done').empty();
    document.getElementById('done').style.color = "red";
    $('#done').append("customization saved");
    setTimeout(hideCustomization, 500);
  }
}

function hideCustomization() {
  document.getElementById('customizePicks').style.zIndex = -1000;
}

function sendWelcome(to) {
  $.ajax({
    url: 'https://api.twilio.com/2010-04-01/Accounts/'+accountSID+'/Messages.json',
    type: 'post',
    dataType: 'json',
    data: {
      "To": to,
      "From": twilioNumber,
      "Body": "Welcome to Fantasy Draft Host! Text me your pick when you're on the clock."
    },
    beforeSend: function(xhr) {
      xhr.setRequestHeader('Authorization',make_base_auth(accountSID,authToken));
    },
    success: function(data) {
    }
  });
}
