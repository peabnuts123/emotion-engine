// CONFIG
// The max number of items to display in the background
var MAX_ITEMS = 200;

// jQuery utility - only begin processing after page has finished loading
$(function () {
  // Array of emotions received from the server that are on the page
  // There should only ever be at most MAX_ITEMS in this array
  var emotionSet = [];

  // Connect to web socket server
  // `WEB_SOCKET_ADDRESS` comes from `config.js`
  var ws = new WebSocket(WEB_SOCKET_ADDRESS);

  // Whether the frontend has received the first message from the server
  // This is used to hide the totals until they are available
  var hasReceivedFirstMessage = false;

  // Reference to the state from the server
  // This holds things like totals for each emotion
  var serverState = {};

  // When the web socket successfully connects
  ws.addEventListener('open', function open() {
    console.log("Successfully connected to web socket");
  });

  // When the web socket receives data from the server
  ws.addEventListener('message', function incoming(payload) {
    // Convert a JSON string into an actual object
    var data = JSON.parse(payload.data);

    // If this is the first message then remove the "is-loading"
    //  class from all the buttons
    if (!hasReceivedFirstMessage) {
      $('#button-determined').removeClass('is-loading');
      $('#button-afraid').removeClass('is-loading');
      $('#button-sad').removeClass('is-loading');
      $('#button-stressed').removeClass('is-loading');

      // Mark first message as received so we don't
      //  do this again
      hasReceivedFirstMessage = true;
    }

    // If there is state information in the data, store that
    // and update the totals
    if (data.state) {
      serverState = data.state;
      refreshTotals();
    }

    // If there is emotion information in the data, add it
    //  to the page
    if (data.emotion) {
      addTriangle(data.emotion);
    }
  });

  // Ensure websocket is closed before leaving the page
  //  e.g. by closing a tab, or hitting refresh
  window.onbeforeunload = function () {
    ws.close();
  };

  // Draw all triangles to the screen (with or without fill)
  // and tell the browser to do this whenever the window size
  // changes as well
  setupTriangles();
  $(window).on('resize', function () {
    setupTriangles();
  });

  /**
   * Read the server's state object and update button totals based on that
   */
  function refreshTotals() {
    $('#button-determined').text("I'm feeling determined (" + serverState.determinedCount + ")");
    $('#button-afraid').text("I'm feeling afraid (" + serverState.determinedCount + ")");
    $('#button-sad').text("I'm feeling sad (" + serverState.determinedCount + ")");
    $('#button-stressed').text("I'm feeling stressed (" + serverState.determinedCount + ")");
  }

  /**
   * Initialise the triangles on the page.
   * We initialise every triangle on the page without any fill color
   * and then call `updateTriangles` to set the fill colors
   * based on the emotions we've received from the server.
   */
  function setupTriangles() {
    // Responsive triangle size based on window width (in pixels)
    // 0-1000: 50px
    // 1000-2000: 100px
    // etc.
    var TRIANGLE_SIZE_PIXELS = Math.ceil($(window).width() / 1000) * 50;

    // Work out the height of an equilateral triangle
    // This is just Pythagoras' theorem
    var triangleHeight = Math.sqrt((TRIANGLE_SIZE_PIXELS * TRIANGLE_SIZE_PIXELS) - ((TRIANGLE_SIZE_PIXELS / 2) * (TRIANGLE_SIZE_PIXELS / 2)));

    // X and Y dimensions of the "grid"
    var numTrianglesPerRow = Math.ceil($(window).width() / (TRIANGLE_SIZE_PIXELS / 2)) + 1;
    var numRows = Math.ceil($(window).height() / triangleHeight);

    // Clear the svg out first
    $('#console').empty();

    // Toggle this for every second triangle and reset it
    //  for the start of every row
    var currentTriangleIsUpsideDown = false

    // Create an SVG path element for each triangle on the screen
    // Create triangles row-by-row
    for (var y = 0; y < numRows; y++) {
      for (var x = 0; x < numTrianglesPerRow; x++) {
        // Calculate the three points of a triangle
        // Note that "top" might actually be bottom if the triangle is upside down
        var pointTop, pointLeft, pointRight;

        if (currentTriangleIsUpsideDown) {
          // Calculate the points of an upside down triangle
          pointTop = {
            x: (x * TRIANGLE_SIZE_PIXELS / 2),
            y: y * triangleHeight + triangleHeight,
          };
          pointLeft = {
            x: pointTop.x - (TRIANGLE_SIZE_PIXELS / 2),
            y: pointTop.y - triangleHeight,
          };
          pointRight = {
            x: pointTop.x + TRIANGLE_SIZE_PIXELS / 2,
            y: pointTop.y - triangleHeight,
          };
        } else {
          // Calculate the points of a right-way-up triangle
          pointTop = {
            x: (x * TRIANGLE_SIZE_PIXELS / 2),
            y: y * triangleHeight,
          };
          pointLeft = {
            x: pointTop.x - TRIANGLE_SIZE_PIXELS / 2,
            y: pointTop.y + triangleHeight,
          };
          pointRight = {
            x: pointTop.x + TRIANGLE_SIZE_PIXELS / 2,
            y: pointTop.y + triangleHeight,
          };
        }

        // Add the triangle's SVG code (with no fill color set)
        $('#console').append('<path ' +
          'd="M ' + pointTop.x + ' ' + pointTop.y + ' L ' + pointLeft.x + ' ' + pointLeft.y + ' L ' + pointRight.x + ' ' + pointRight.y + ' z" ' +
          '/>');

        // Next triangle will be the other way up
        currentTriangleIsUpsideDown = !currentTriangleIsUpsideDown;
      }

      // The first triangle of the row will be upside down for odd-numbered rows
      currentTriangleIsUpsideDown = (y % 2) === 1;
    }

    // Force the SVG to redraw (fixes a bug in browsers)
    $('#svgContainer').html($('#svgContainer').html());

    // Set all the triangles fill colors
    updateTriangleColors();
  }

  /**
   * Set the color of each triangle based on the set of
   * emotions we've received from the server
   */
  function updateTriangleColors() {
    var $paths = $('#console path');
    // There may be more paths on the screen or more emotions in the emotion set
    //  so iterate through whatever is the smaller of the two.
    // If we iterated too many then we would get errors trying to either
    //  update a path that doesn't exist, or referencing an emotion object
    //  that doesn't exist.
    for (var i = 0; i < Math.min($paths.length, emotionSet.length); i++) {
      if (i < emotionSet.length) {
        // Set a class on each element based on the emotion e.g. "emotion-sad"
        // These classes are defined in `style.css` and set a fill color on the path
        $paths[i].setAttribute('class', 'emotion-' + emotionSet[i]);
      }
    }
  }

  /**
   * Add a triangle to the screen with a given emotion.
   * @param {string} emotion An emotion name e.g. "grateful"
   */
  function addTriangle(emotion) {
    // We're just adding it to the `emotionSet` array
    //  but we're also making sure we have no more than `MAX_ITEMS`
    //  things in the array.

    // "Unshift" adds the item to the FRONT of the array (poorly named function)
    emotionSet.unshift(emotion);
    if (emotionSet.length > MAX_ITEMS) {
      // Remove the last item from the end if we've reached max
      emotionSet.pop();
    }

    // Redraw all the triangle colors based on the new emotion set
    updateTriangleColors();
  }

  // Button click handlers
  $('#button-determined').click(function () {
    ws.send(JSON.stringify({ emotion: 'determined' }));
  });
  $('#button-afraid').click(function () {
    ws.send(JSON.stringify({ emotion: 'afraid' }));
  });
  $('#button-sad').click(function () {
    ws.send(JSON.stringify({ emotion: 'sad' }));
  });
  $('#button-stressed').click(function () {
    ws.send(JSON.stringify({ emotion: 'stressed' }));
  });
});
