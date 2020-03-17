$(function () {
  // Connect to web socket
  var ws = new WebSocket('ws://' + location.hostname + ':8081');

  // Reference to the state from the server
  var serverState = {};

  // When the web socket connects
  ws.addEventListener('open', function open() {
    console.log("Successfully connected to web socket");
  });

  // When the web socket receives data
  ws.addEventListener('message', function incoming(payload) {
    // Parse the data into JSON (as it is a string)
    var data = JSON.parse(payload.data);

    // If there is state information in the data, store that
    if (data.state) {
      serverState = data.state;
      refreshTotals();
    }

    // If there is emotion information in the data, log that to the fake console
    if (data.emotion) {
      $('#debug_console').append('<div>I am feeling ' + data.emotion + '</div>');
    }
  });

  // Ensure websocket is closed before leaving the page
  window.onbeforeunload = function () {
    ws.close();
  };

  // Read the server's state object and update button totals to use this
  function refreshTotals() {
    $('#button-joy').text('Joy (' + serverState.joyCount + ')');
    $('#button-scared').text('Scared (' + serverState.scaredCount + ')');
    $('#button-sad').text('Sad (' + serverState.sadCount + ')');
    $('#button-angry').text('Angry (' + serverState.angryCount + ')');
  }

  // Button click handlers
  $('#button-joy').click(function () {
    ws.send(JSON.stringify({ emotion: 'joy' }));
  });
  $('#button-scared').click(function () {
    ws.send(JSON.stringify({ emotion: 'scared' }));
  });
  $('#button-sad').click(function () {
    ws.send(JSON.stringify({ emotion: 'sad' }));
  });
  $('#button-angry').click(function () {
    ws.send(JSON.stringify({ emotion: 'angry' }));
  });
});
