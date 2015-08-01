for(var i = 0; i < 20; i++) {
  $("#roundsSelect").append(new Option(i+1, i+1));
}

for(var i = 0; i < 20; i++) {
  $("#teamsSelect").append(new Option(i+1, i+1));
}

$('#teamsSelect').change(function() {
  $('#teamsInputList').empty();
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

$('#submitButton').click(function () {
  var league = $('#leagueName').val();
  var sportName = $('#sportSelect').val();
  var numRounds = $('#roundsSelect').val();
  var numTeams = $('#teamsSelect').val();
  var timeLimit = $('#timePerPick').val();
  var teams = [];
  var owners = [];
  var phones = [];
  var uid = localStorage.getItem('uid');

  for(var i = 0; i < numTeams; i++) {
    teams.push($('#team'+(i+1)).val());
    owners.push($('#owner'+(i+1)).val());
    phones.push($('#phone'+(i+1)).val());
  }

  var currentPick = 0;
  var allPicks = "{";
  for(var i = 0; i < numRounds; i++) {
    for(var j = 0; j < numTeams; j++) {
      currentPick++;
      var teamName;
      var ownerName;
      var phoneNumber;
      if(i%2 == 0) {
        teamName = teams[j];
        ownerName = owners[j];
        phoneNumber = phones[j];
      } else {
        teamName = teams[teams.length-1-j];
        ownerName = owners[owners.length-1-j];
        phoneNumber = phones[phones.length-1-j];
      }
      allPicks += '"'+currentPick+'": ';
        allPicks += '{ "team": "'+teamName+'", "owner": "'+ownerName+'", "phone": "'+phoneNumber+'", "player": "null", "playerTeam": "null", "playerPosition": "null"}';
      if((i+1) == numRounds && (j+1) == numTeams) {
        //do nothing
      } else {
        allPicks += ",";
      }
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
