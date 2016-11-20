// Library imports
var colors 				= 	require("colors");
var http                = 	require("http");
var webSocketServer 	= 	require("ws").Server;

// Application imports
var palette 			= 	require("./palette").palette;
var fixtures 			= 	require("./fixtures").fixtures;
var websocketServerApi 	= 	require("./ws-api");

// Global variables
var fixtureService 		= 	new websocketServerApi({
								port: 			3000,
								verbose: 		true,
								onConnection: 	setAllFixturesToBlack
							});
var defaults 			= 	{
								universe: 		1,
								delay: 			1,
								duration: 		3000,
								intensity: 		255,
								soundMode: 		0,
								strobeMode: 	0,
								w: 				0,
								a: 				0,
								p: 				0,
								colorInterval: 	5000,
								dataInterval: 	2500
							}

// dictionary that maps each device to its assigned color
var device_colors = {};

// steps through the colors for each new device
var next_color = 0;

// GIS data RESTful API
var positioning_data_url = "http://192.168.0.151:8080/getalldevices";


function getLastestPositioningData () {
	http.get(positioning_data_url, _onConnectionToPositionService).on("error", _onConnectionErrorToPositionService);
}

function addColorsFromMultipleDevices(devices) {
    var result = { r:0, g:0, b:0 };
    for (var device of devices) {
		if (!(device.name in device_colors)) {
		    var color = palette[next_color % palette.length];
		    device_colors[device.name] = { r: color[0], g: color[1], b: color[2] };
		    next_color += 1;
		}
		var color = device_colors[device.name];
		result.r += color.r;
		result.g += color.g;
		result.b += color.b;
    }
    result.r = Math.min(result.r, 255);
    result.g = Math.min(result.g, 255);
    result.b = Math.min(result.b, 255);
    // console.log("RESULT COLOR", result.r, result.g, result.b);
    return result;
}

function _onConnectionToPositionService (positionService) {
    var body = '';

    positionService.on("data", function(chunk){
        body += chunk;
    });

    positionService.on("end", function() {
        var fixtures  = JSON.parse(body);
		for (var fixture of fixtures) {
		    if (fixture.devices.length > 0) {
				// merge colors here
				merged_color = addColorsFromMultipleDevices(fixture.devices);
				_updateFixtureColor(fixture.fixture_id, merged_color);
		    }
		}
    });
}

function _onConnectionErrorToPositionService (e) {
    console.log("CONNECTION ERROR".red.bold, e);
}

/* _updateFixtureColor
 * Updates local in-memory collection of fixture and their current colour
 * fixture_id: byte, the start channel for the fixture corresponding with the fixture_id in fixtures.js
 * color: object, { r: byte, g: byte, b: byte }
 */ 

function _updateFixtureColor (id, color) {
	for (var i = 0; i < fixtures.length; i++) {
		if (fixtures[i].fixture_id == id) {
			fixtures[i].r = color.r;
			fixtures[i].g = color.g;
			fixtures[i].b = color.b;
			// console.log("UPDATED:".white.bold, fixtures[i]);
		}
	};
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

		fixtureService.send(payload, {binary: true, mask: true});
		// console.log("TO COLOR".yellow.bold, payload);
	}
}

function setAllFixturesToBlack () {
	
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
			0,
			0,
			0,
			0,
			0,
			0
		]; 

		fixtureService.send(payload, {binary: true, mask: true});
		// console.log("TO BLACK".yellow.bold, payload);
	}
}

setInterval(getLastestPositioningData, defaults.dataInterval);
setInterval(sendColorToFixtures, defaults.colorInterval);

function returnByteModulo (value)	{ return value % 256; }
function returnByteDivide (value)	{ return parseInt(value / 256); }
function returnIntFrom2Bytes (d,m)	{ return d * 256 + m;  }

console.log("STARTED:".green.bold, "Colour Server".white);
