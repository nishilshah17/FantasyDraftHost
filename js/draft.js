var draftID;
var countdown;

var ticking = new Audio("audio/ticking.wav");
var alarm = new Audio("audio/alarm.wav");

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

  countdown = Tock({
      countdown: true,
      interval: 50,
      callback: function () {
        var currentValue = countdown.msToTime(countdown.lap());
        var currentValueInt = parseInt(currentValue.replace(":",""));
        if(currentValueInt <= 100) {
          ticking.play();
          $('#countdown_clock').css("color","red");
        } else {
          $('#countdown_clock').css("color", "black")
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

  setTimeout(startCountdown,1000);
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
