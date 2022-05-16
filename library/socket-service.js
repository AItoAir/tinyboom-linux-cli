let io;
function setup(apiKey) {
  const socketIOClient = require('socket.io-client');
  const sailsIOClient = require('sails.io.js');
  io = sailsIOClient(socketIOClient);
  io.sails.url = process.env.TINYBOOM_APIHOST || 'https://tinyboom.aitoair.com ';
  io.sails.initialConnectionHeaders = { 'x-api-key': apiKey };
}

function sendMessage(projectId, deviceId, message) {
  return new Promise((resolve, reject) => {
    io.socket.post(`/api/v1/handle-cli-messages/${projectId}`, { message, deviceId }, function (body, JWR) {
      if (process.env.DEBUG_MODE === 'true') {
        console.debug('SocketService.sendMessage responded with:', JWR.statusCode, body);
      }
      resolve();
    });
  });
}

function disconnect() {
  io.socket.disconnect();
}

function on(eventName, fn) {
  io.socket.on(eventName, fn);
}

module.exports = {
  setup,
  sendMessage,
  disconnect,
  on
}