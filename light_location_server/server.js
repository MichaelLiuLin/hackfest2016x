// Library imports
var colors 				= 	require("colors");
var http                = require("http");
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

// dictionary that maps each device to its assigned color
var color_dict = {};

// steps through the colors for each new device
var next_color = 0;

/* _updateFixtureColor
 * Updates local in-memory collection of fixture and their current colour
 * fixture_id: byte, the start channel for the fixture corresponding with the fixture_id in fixtures.js
 * color: object, { r: byte, g: byte, b: byte }
 */ 

// TODO: Add hook to onDataChange from tracking service
var url = "http://localhost:8080/getalldevices";

http.get(url, _onConnectionToPositionService).on("error", _onConnectionErrorToPositionService);

function _merge_colors(devices) {
    var result = { r:0, g:0, b:0 };
    for (var dev of devices) {
	if (!(dev.name in color_dict)) {
	    var c = palette[next_color % palette.length];
	    color_dict[dev.name] = { r:c[0], g:c[1], b:c[2] };
	    console.log("ASSIGNED COLOR ", c, " TO ", dev.name);
	    next_color += 1;
	}
	var c = color_dict[dev.name];
	result.r += c.r;
	result.g += c.g;
	result.b += c.b;
    }
    result.r = Math.min(result.r, 255);
    result.g = Math.min(result.g, 255);
    result.b = Math.min(result.b, 255);
    console.log("RESULT COLOR", result.r, result.g, result.b);
    return result;
}

function _onConnectionToPositionService (res) {
    var body = '';

    res.on('data', function(chunk){
        body += chunk;
    });

    res.on('end', function(){
        var fixtures  = JSON.parse(body);
	for (var fixture of fixtures) {
	    if (fixture.devices.length > 0) {
		// merge colors here
		merged_color = _merge_colors(fixture.devices);
		_updateFixtureColor(fixture.fixture_id, merged_color);
	    }
	}
    });
}

function _onConnectionErrorToPositionService (e) {
    console.log("CONNECTION ERROR".red.bold, e);
}

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
