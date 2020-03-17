const WebSocket = require('ws');
const fs = require('fs');

// SERVER STATE ===
const DEFAULT_STATE = {
  joyCount: 0,
  scaredCount: 0,
  sadCount: 0,
  angryCount: 0,
};

// Object that holds the server's state
let state;
try {
  // Read the state from file
  let serverStateJson = fs.readFileSync('server_state.json');
  // Attempt to parse the JSON in the file
  //  This will throw errors if the JSON is invalid, the file doesn't exist, or the file is empty, etc.
  let serverStateParsed = JSON.parse(serverStateJson);

  // Default the state if it is partially undefined (e.g. if you add new properties)
  state = {
    joyCount: serverStateParsed.joyCount || DEFAULT_STATE.joyCount,
    scaredCount: serverStateParsed.scaredCount || DEFAULT_STATE.scaredCount,
    sadCount: serverStateParsed.sadCount || DEFAULT_STATE.sadCount,
    angryCount: serverStateParsed.angryCount || DEFAULT_STATE.angryCount,
  };
} catch (e) {
  // Handle any errors that happened by writing the default state to disk
  console.warn("Error while parsing server state: ", e.message);
  console.log("Initialising default state.");
  state = DEFAULT_STATE;
  saveState();
}

// Save the current state to disk
function saveState() {
  fs.writeFileSync('server_state.json', JSON.stringify(state));
}


// WEB SOCKETS ===
const wss = new WebSocket.Server({ port: 8081 });

// Set of all currently connected clients
let connectedClients = [];

// Whenever a websocket connection is made
wss.on('connection', function connection(ws) {
  // Add new socket to list of connected sockets
  connectedClients.push(ws);
  console.log(`New client connected (${connectedClients.length})`);

  // Send initial state to client
  ws.send(JSON.stringify({
    state: state,
  }));

  // WebSocket disconnect
  ws.on("close", function onClose() {
    // Remove from list of connected clients
    connectedClients.splice(connectedClients.indexOf(ws), 1);
    console.log(`Client disconnected (${connectedClients.length})`);
  });

  // When the server receives data from a client
  ws.on("message", function onMessage(json) {
    let data = JSON.parse(json);

    // Update server state
    switch (data.emotion) {
      case 'joy':
        state.joyCount++;
        saveState();
        break;
      case 'scared':
        state.scaredCount++;
        saveState();
        break;
      case 'sad':
        state.sadCount++;
        saveState();
        break;
      case 'angry':
        state.angryCount++;
        saveState();
        break;
      default:
        console.error("Received invalid payload. Somebody probably hacking: ", data);
        return;
    }

    // Send the state and emotion payload to every connected client
    try {
      connectedClients.forEach(function (client) {
        client.send(JSON.stringify({
          state: state,
          emotion: data.emotion,
        }));
      });
    } catch (e) {
      // Paranoia-based error handling
      console.error("An error occurred while sending the payload to connected clients:", e);
    }
  });
});
