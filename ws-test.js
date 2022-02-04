const socketIOClient = require('socket.io-client');
const sailsIOClient = require('sails.io.js');
const io = sailsIOClient(socketIOClient);
io.sails.url = 'http://localhost:1337';
io.sails.initialConnectionHeaders = { 'x-api-key': '38b9647b-f081-44a0-850a-3bb6b7056f2a' };
io.socket.post('/api/v1/handle-cli-messages/3', {}, function serverResponded (body, JWR) {
  // body === JWR.body
  console.log('Sails responded with: ', body);
  console.log('with headers: ', JWR.headers);
  console.log('and with status code: ', JWR.statusCode);

  // ...
  // more stuff
  // ...


  // When you are finished with `io.socket`, or any other sockets you connect manually,
  // you should make sure and disconnect them, e.g.:
  console.log("isConnecting", io.socket.isConnecting());
  console.log("isConnected", io.socket.isConnected());
  try {
    // io.socket.disconnect();
  } catch (e) {
    // console.error(e.message);
  }

  // (note that there is no callback argument to the `.disconnect` method)
});