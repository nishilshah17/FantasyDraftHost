$(document).ready(function() {
  var draftsRef = new Firebase("https://fantasy-draft-host.firebaseio.com/drafts");

  draftsRef.on('value', function(draftsSnapshot) {
    $('#draftList').empty();
    var draftListTable = $("<table cellpadding='20'></table>");
    draftListTable.attr('id','draftListTable');
    draftListTable.attr('class','flat-table flat-table-3');
    var titleRow = $('<tr><th><b>League</b></th><th><b>Sport</b></th><th><b>Teams</b></th><th><b>Rounds</b></th><th><b>Timer</b></th><th><b>Draft</b></th></tr>');
    draftListTable.append(titleRow);
    var numDrafts = 0;

    draftsSnapshot.forEach(function(draftSnapshot) {
      if(draftSnapshot.child('active').val() == "true") {
        numDrafts++;
        var draftRow = $('<tr></tr>');
        draftRow.append($('<th>'+draftSnapshot.child('leagueName').val()+'</th>'));
        draftRow.append($('<th>'+draftSnapshot.child('sport').val()+'</th>'));
        draftRow.append($('<th>'+draftSnapshot.child('teams').val()+'</th>'));
        draftRow.append($('<th>'+draftSnapshot.child('rounds').val()+'</th>'));
        draftRow.append($('<th>'+draftSnapshot.child('timePerPick').val()+'</th>'));
        draftRow.append($('<th><input type="submit" value="View Draft" class="view-draft-flat-button draftIDSubmit" data-id="'+draftSnapshot.key()+'" /></th>'));
        draftListTable.append(draftRow);
      }
    });
    $('#draftList').append("<h1 class='openSans'>View Draft</h1>");
    $('#draftList').append(draftListTable);
    if(numDrafts == 0) {
      $('#draftList').append("<h2 class='openSans'>Sorry, there are no drafts currently active.</h2>");
    }
  });

  $('#draftList').on('click','input', function() {
    var draftID = $(this).data('id');
    localStorage.setItem('viewDraftID',draftID);
    window.location = "view.html";
  });
});
