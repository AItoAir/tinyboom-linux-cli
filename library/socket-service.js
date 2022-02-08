const socketIOClient = require('socket.io-client');
const sailsIOClient = require('sails.io.js');
const io = sailsIOClient(socketIOClient);
io.sails.url = process.env.TINYBOOM_APIHOST || 'http://localhost:1337';

function sendMessage(projectId, apiKey, frame) {
  return new Promise((resolve, reject) => {
    io.sails.initialConnectionHeaders = { 'x-api-key': apiKey };
    io.socket.post(`/api/v1/handle-cli-messages/${projectId}`, { frame }, function (body, JWR) {
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

module.exports = {
  sendMessage,
  disconnect
}