var draftID;

$(document).ready(function() {
  $('#draftIDSubmit').click(function() {
    draftID = parseInt($('#draftID').val());

    //verify draftID using firebase

    $('#draftID').remove();
    $('#draftIDSubmit').remove();

    if(draftID > 0) {

      var currentPick = 0;
      var teams = [];
      var owners = [];
      var rounds;

      //replace the following bs data with firebase later
      for(var i = 0; i < 10; i++) {
        teams.push('team '+(i+1));
        owners.push('owner '+(i+1));
      }
      rounds = 17;

      var table = $("<table></table>");
      table.attr('id','draftTable');
      table.attr('class','flat-table flat-table-3')

      for(var y = 0; y < rounds; y++) {
        var row = $("<tr></tr>");
        row.attr('id','round'+(y+1));

        for(var x = 0; x < teams.length+1; x++) {
          var cell;
          if(x == 0) {
            cell = $('<th>'+(y+1)+'</th>');
          } else {
            currentPick++;
            cell = $('<th>'+currentPick+'</th>');
          }
          row.append(cell);
        }

        table.append(row);
      }

      $('#draftBody').append(table);

    }

  });
});
