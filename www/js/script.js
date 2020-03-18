// The max number of items to display in the background
var MAX_ITEMS = 200;

$(function () {
  // Connect to web socket
  var ws = new WebSocket(WEB_SOCKET_ADDRESS);

  // Whether the frontend has received the first message from the server
  var hasLoaded = false;

  // How many items have been added to the DOM
  var numItems = 0;

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

    if (!hasLoaded) {
      $('#button-joy').removeClass('is-loading');
      $('#button-scared').removeClass('is-loading');
      $('#button-sad').removeClass('is-loading');
      $('#button-angry').removeClass('is-loading');
      hasLoaded = true;
    }

    // If there is state information in the data, store that
    if (data.state) {
      serverState = data.state;
      refreshTotals();
    }

    // If there is emotion information in the data, log that to the fake console
    if (data.emotion) {
      $('#console').prepend('<span class="emotion-' + data.emotion + '">' + data.emotion + ' </span>');
      if (numItems >= MAX_ITEMS) {
        // Remove the last item if we've reached max
        $("#console>div:last-child").remove();
      } else {
        // Have not yet reached max, continue counting
        numItems++;
      }
    }
  });

  // Ensure websocket is closed before leaving the page
  window.onbeforeunload = function () {
    ws.close();
  };

  // Read the server's state object and update button totals to use this
  function refreshTotals() {
    $('#button-joy').text('Joy\n(' + serverState.joyCount + ')');
    $('#button-scared').text('Scared\n(' + serverState.scaredCount + ')');
    $('#button-sad').text('Sad\n(' + serverState.sadCount + ')');
    $('#button-angry').text('Angry\n(' + serverState.angryCount + ')');
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
