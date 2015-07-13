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
  }
});

$('#submitButton').click(function () {
  var leagueName = $('#leagueName').val();
  var sport = $('#sportSelect').val();
  var numRounds = $('#roundsSelect').val();
  var numTeams = $('#teamsSelect').val();
  var teams = [];
  var owners = [];
  var phones = [];

  for(var i = 0; i < numTeams; i++) {
    teams.push($('#team'+(i+1)).val());
    owners.push($('#owner'+(i+1)).val());
    phones.push($('#phone'+(i+1)).val());
  }
});
