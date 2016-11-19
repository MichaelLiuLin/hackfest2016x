// Library imports
var colors 				= 	require("colors");
var webSocketServer 	= 	require("ws").Server;

// Application imports
var palette 			= 	require("./palette").palette;
var fixtures 			= 	require("./fixtures").fixtures;
var websocketServerApi 	= 	require("./ws-api");

// Global variables
var fixtureService 		= 	new websocketServerApi({
								port: 			3000,
								verbose: 		true
							});
var defaults 			= 	{
								universe: 	1,
								delay: 		0,
								duration: 	1000,
								intensity: 	255,
								soundMode: 	0,
								strobeMode: 0,
								w: 			0,
								a: 			0,
								p: 			0,
								updateFreq: 250
							}

/* _updateFixtureColor
 * Updates local in-memory collection of fixture and their current colour
 * fixture_id: byte, the start channel for the fixture corresponding with the fixture_id in fixtures.js
 * color: object, { r: byte, g: byte, b: byte }
 */ 

// TODO: Add hook to onDataChange from tracking service

function _updateFixtureColor (id, color) {
	var fixture = fixtures.filter(fixture => fixture.fixture_id === id);
	fixture.color = color;


	console.log("UPDATED:".white.bold, fixture);
}

/* sendColorToFixtures
 * Sends a colour to all connected fixtures
 * fixture: byte, each fixture starts at 0, stepped by 10 eg- fixture 1 = 0, fixture 2 = 10
 * color: object, { r: byte, g: byte, b: byte }
 */

function sendColorToFixtures () {
	
	for (var fixture of fixtures) {

		var payload = [
			defaults.universe,
			fixture.fixture_id,
			returnByteDivide(defaults.delay),
			returnByteModulo(defaults.delay),
			returnByteDivide(defaults.duration),
			returnByteModulo(defaults.duration),
			defaults.intensity,
			defaults.soundMode,
			defaults.strobeMode,
			fixture.r,
			fixture.g,
			fixture.b,
			defaults.w,
			defaults.a,
			defaults.p
		]; 

		fixtureService.send(payload);
	}
}

setInterval(sendColorToFixtures, defaults.updateFreq);

function returnByteModulo (value)	{ return value % 256; }
function returnByteDivide (value)	{ return parseInt(value / 256); }
function returnIntFrom2Bytes (d,m)	{ return d * 256 + m;  }

console.log("STARTED:".green.bold, "Colour Server".white);