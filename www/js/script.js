// CONFIG
// The max number of items to display in the background
var MAX_ITEMS = 200;

$(function () {

  var emotionSet = [];

  $(window).on('resize', function () {
    drawTriangles();
  })
  drawTriangles();

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
      addTriangle(data.emotion);
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

  function drawTriangles() {
    // Responsive triangle size
    var TRIANGLE_SIZE_PIXELS = Math.ceil($(window).width() / 1000) * 50;

    // Work out height of equilateral triangle
    var triangleHeight = Math.sqrt((TRIANGLE_SIZE_PIXELS * TRIANGLE_SIZE_PIXELS) - ((TRIANGLE_SIZE_PIXELS / 2) * (TRIANGLE_SIZE_PIXELS / 2)));
    // Number of triangles x and y
    var dimX = Math.ceil($(window).width() / TRIANGLE_SIZE_PIXELS);
    var dimY = Math.ceil($(window).height() / triangleHeight);

    // Maintain an offset per row (i.e. every second row is offset by half a triangle's width)
    var offsetSize = TRIANGLE_SIZE_PIXELS / 2;
    var currentRowOffset = 0;

    // Clear the svg out
    $('#console').empty();

    // @RESUME @TODO This needs to become a while loop and test if pointTop is on screen or not
    for (var y = 0; y < dimY; y++) {
      for (var x = 0; x < dimX; x++) {
        // @NOTE JON STAY AWAY

        // Draw upright triangle
        var pointTop = {
          x: ((x * TRIANGLE_SIZE_PIXELS) + currentRowOffset),
          y: y * triangleHeight,
        };
        var pointLeft = {
          x: pointTop.x - offsetSize,
          y: pointTop.y + triangleHeight,
        };
        var pointRight = {
          x: pointTop.x + offsetSize,
          y: pointTop.y + triangleHeight,
        };
        $('#console').append('<path ' +
          'd="M ' + pointTop.x + ' ' + pointTop.y + ' L ' + pointLeft.x + ' ' + pointLeft.y + ' L ' + pointRight.x + ' ' + pointRight.y + ' z" ' +
          '/>');

        // Draw upside-down triangle
        var pointBottom = {
          x: (x * TRIANGLE_SIZE_PIXELS) + currentRowOffset + offsetSize,
          y: y * triangleHeight + triangleHeight,
        };
        pointLeft = {
          x: pointBottom.x - offsetSize,
          y: pointBottom.y - triangleHeight,
        };
        pointRight = {
          x: pointBottom.x + offsetSize,
          y: pointBottom.y - triangleHeight,
        };
        $('#console').append('<path ' +
          'd="M ' + pointBottom.x + ' ' + pointBottom.y + ' L ' + pointLeft.x + ' ' + pointLeft.y + ' L ' + pointRight.x + ' ' + pointRight.y + ' z" ' +
          '/>');
      }
      currentRowOffset = -(currentRowOffset + offsetSize) % (offsetSize * 2);
    }

    // Force the SVG to redraw
    $('#svgContainer').html($('#svgContainer').html());

    // Redraw triangle colors
    updateTriangles();
  }

  function updateTriangles() {
    var $paths = $('#console path');
    for (var i = 0; i < $paths.length; i++) {
      if (i < emotionSet.length) {
        $paths[i].setAttribute('class', 'emotion-' + emotionSet[i]);
      } else {
        $paths[i].setAttribute('class', '');
      }
    }
  }

  function addTriangle(emotion) {
    emotionSet.unshift(emotion);
    if (numItems >= MAX_ITEMS) {
      // Remove the last item if we've reached max
      emotionSet.pop();
    } else {
      // Have not yet reached max, continue counting
      numItems++;
    }

    updateTriangles();
  }
  window.addTriangle = addTriangle;

  function debug_randomColor() {
    var colors = ['Yellow', 'Red', 'Blue', 'Green'];
    return colors[~~(colors.length * Math.random())];
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
