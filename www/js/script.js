// CONFIG
// The max number of items to have in memory
var MAX_ITEMS = 2000;
/** Properties to adorn the button SVG elements with */
var BUTTON_PROPERTIES = [
  { id: 'button-sad', class: 'button emotion-sad', labelId: 'label-sad', },
  { id: 'button-afraid', class: 'button emotion-afraid', labelId: 'label-afraid', },
  { id: 'button-stressed', class: 'button emotion-stressed', labelId: 'label-stressed', },
  { id: 'button-determined', class: 'button emotion-determined', labelId: 'label-determined', },
];

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
  setupSVG();
  $(window).on('resize', function () {
    setupSVG();
  });

  /**
   * Read the server's state object and update button totals based on that
   */
  function refreshTotals() {
    // @TODO this function does nothing
    // Remove it or give it purpose
  }

  /**
   * Initialise the triangles on the page.
   * We initialise every triangle on the page without any fill color
   * and then call `updateTriangles` to set the fill colors
   * based on the emotions we've received from the server.
   *
   * Also initialise SVG shapes for the buttons.
   */
  function setupSVG() {
    // Responsive triangle size based on window width (in pixels)
    // 0-1000: 50px
    // 1000-2000: 100px
    // etc.
    var TRIANGLE_SIZE_PIXELS = Math.ceil($(window).width() / 1000) * 50;
    // Response font size based on window width (in pixels)
    // 0-1000: 20px
    // 1000-2000: 40px
    // etc.
    var labelFontSize = Math.ceil($(window).width() / 1000) * 20 + 'px';
    $('.button-label').css('font-size', labelFontSize);

    // Work out the height of an equilateral triangle
    // This is just Pythagoras' theorem
    var triangleHeight = Math.sqrt((TRIANGLE_SIZE_PIXELS * TRIANGLE_SIZE_PIXELS) - ((TRIANGLE_SIZE_PIXELS / 2) * (TRIANGLE_SIZE_PIXELS / 2)));

    // X and Y dimensions of the "grid"
    var numTrianglesPerRow = Math.ceil($(window).width() / (TRIANGLE_SIZE_PIXELS / 2)) + 1;
    var numRows = Math.ceil($(window).height() / triangleHeight);

    // Last button row is 2 rows from the last row
    var lastButtonRowIndex = numRows - 3;
    // First button row is 4 rows before the last button row
    var firstButtonRowIndex = lastButtonRowIndex - 4;
    // Margin is either:
    //  - 2 triangles on either side
    //  - 20% of the screen on either side
    // which ever is greater (almost always the 20% option)
    var buttonsMargin = Math.max(2, Math.floor(numTrianglesPerRow * 0.20));
    // The width of each button is the number of UPRIGHT triangles that aren't margin
    var buttonsWidth = (numTrianglesPerRow - (buttonsMargin * 2)) / 2 * TRIANGLE_SIZE_PIXELS;

    // Clear the svg out first
    $('#triangle-container>#triangles').empty();
    $('#triangle-container>#buttons').empty();

    // Toggle this for every second triangle and reset it
    //  for the start of every row
    var currentTriangleIsUpsideDown = false;

    // Create an SVG path element for each triangle on the screen
    // Create triangles row-by-row
    for (var y = 0; y < numRows; y++) {
      for (var x = 0; x < numTrianglesPerRow; x++) {

        // Check if this coordinate is within the button region
        // Draw a special shape for regions that are buttons
        if (y > firstButtonRowIndex && y <= lastButtonRowIndex && x >= buttonsMargin && x < (numTrianglesPerRow - buttonsMargin)) {
          // Check x again - this is just to make sure we only draw ONE button
          //  even though the check above will be true for EVERY CELL that the button
          //  occupies. i.e. if the buttons are 20 triangles wide - we don't
          //  want to draw the button 20 times - just the first time.
          if (x === buttonsMargin) {
            // Points for constructing a parallelogram SVG path
            var pointTopLeft, pointBottomLeft, pointBottomRight, pointTopRight;

            // The order matters here (unlike in a triangle - where you can draw the three
            //  points in any order and it will still make a valid shape). So we need to
            //  make sure the points match their description by checking if the "triangle"
            //  is upside-down
            if (currentTriangleIsUpsideDown) {
              // For an upside-down triangle, "bottom left" will be what was "pointTop"
              pointBottomLeft = {
                x: (x * TRIANGLE_SIZE_PIXELS / 2),
                y: y * triangleHeight + triangleHeight,
              };

              // "Top left" will be what was "pointLeft" for an upside-down triangle
              pointTopLeft = {
                x: pointBottomLeft.x - (TRIANGLE_SIZE_PIXELS / 2),
                y: pointBottomLeft.y - triangleHeight,
              };
            } else {
              // For a right-side-up triangle, "top left" will be what was "pointTop"
              pointTopLeft = {
                x: (x * TRIANGLE_SIZE_PIXELS / 2),
                y: y * triangleHeight,
              };

              // "bottom left" will what was "pointLeft" for a right-side up triangle
              pointBottomLeft = {
                x: pointTopLeft.x - TRIANGLE_SIZE_PIXELS / 2,
                y: pointTopLeft.y + triangleHeight,
              };
            }

            // We can compute "bottom right" and "top right" just by adding the width of
            // the button to "top left" and "top right"
            pointBottomRight = {
              x: pointBottomLeft.x + buttonsWidth,
              y: pointBottomLeft.y,
            };
            pointTopRight = {
              x: pointTopLeft.x + buttonsWidth,
              y: pointTopLeft.y,
            };

            // Index of which button this is - we will need this for looking up its label, id, etc.
            var buttonIndex = y - firstButtonRowIndex - 1;

            // Add the button's SVG code
            $('#triangle-container>#buttons').append('<path ' +
              'd="M ' + pointTopLeft.x + ' ' + pointTopLeft.y + ' L ' + pointBottomLeft.x + ' ' + pointBottomLeft.y + ' L ' + pointBottomRight.x + ' ' + pointBottomRight.y + ' L ' + pointTopRight.x + ' ' + pointTopRight.y + ' z" ' +
              'id="' + BUTTON_PROPERTIES[buttonIndex].id + '" ' +
              'class="' + BUTTON_PROPERTIES[buttonIndex].class + '" ' +
              '></path>');

            $('#' + BUTTON_PROPERTIES[buttonIndex].labelId).css('top', pointTopLeft.y);
            $('#' + BUTTON_PROPERTIES[buttonIndex].labelId).css('left', (pointTopLeft.x + pointBottomLeft.x) / 2);
            $('#' + BUTTON_PROPERTIES[buttonIndex].labelId).css('width', buttonsWidth);
            $('#' + BUTTON_PROPERTIES[buttonIndex].labelId).css('height', triangleHeight);
          }
        } else {
          // Draw triangles

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
          $('#triangle-container>#triangles').append('<path ' +
            'd="M ' + pointTop.x + ' ' + pointTop.y + ' L ' + pointLeft.x + ' ' + pointLeft.y + ' L ' + pointRight.x + ' ' + pointRight.y + ' z" ' +
            'fill="white"' +
            '/>');

          // Next triangle will be the other way up
          currentTriangleIsUpsideDown = !currentTriangleIsUpsideDown;
        }
      }

      // The first triangle of the row will be upside down for odd-numbered rows
      currentTriangleIsUpsideDown = (y % 2) === 1;
    }

    // Force the SVG to redraw (fixes a bug in browsers)
    $('#svgContainer').html($('#svgContainer').html());

    // Set all the triangles fill colors
    updateTriangleColors();

    // Register click handlers on the new button elements
    registerClickHandlers();
  }

  /**
   * Set the color of each triangle based on the set of
   * emotions we've received from the server
   */
  function updateTriangleColors() {
    var $paths = $('#triangle-container>#triangles path');
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
    // We're just adding the value of `emotion` to the `emotionSet` array
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
  function registerClickHandlers() {
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
  }
});
