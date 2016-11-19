var colors 			= require("colors");
var webSocketServer = require("ws").Server;
var webSocket;

function serverWSApi (options) {

	var sck 		= {};
	var sckPool 	= [];
	sck.connected 	= false;

	options 		= options || { port: 4000, verbose: false };

	function constructor () {
		
		webSocket = new webSocketServer({ port: options.port });
		webSocket.on("connection",	_handleSocketConnection);
		
	}

	function _handleSocketConnection (socket) {
		
		sckPool.push(socket);
		var i = sckPool.indexOf(socket);
		socket.connected = true;
  		
  		console.log("CONNECTED:".green.bold, " WebSocket on PORT:".white, options.port.toString().yellow.bold);

		socket.on("disconnect",	 	_handleSocketDisconnection);
		socket.on("message",       	_onSocketDataReceived);

		if (options.onConnection !== undefined) {
			options.onConnection(socket);
			sckPool.splice(i, 1);
		}
		
	}

	function _onSocketDataReceived (data) {

		if (options.onDataReceived !== undefined) {
			options.onDataReceived(data);
		}
	}


	function _handleSocketDisconnection (socket) {
  		
  		console.log("DISCONNECTED:".red.bold, " WebSocket on PORT:".white, options.port.toString().yellow.bold);
		
		socket.connected = false;
		var i = sckPool.indexOf(socket);
		sckPool.splice(i, 1);
		if (options.onDisconnection !== undefined) {
			options.onDisconnection(socket);
		}

	}

	function sendData (data, ops) {

		var msg = "";
		
		sckPool.forEach(function(socket) {
			if(socket.connected == true) {
				socket.send(data, ops);
				if (options.verbose) {
					console.log("DATA:".white.bold, data);
				}
			}
		});

	}
	
	constructor ();

	return {
		send: sendData
	}

};

module.exports = serverWSApi;
