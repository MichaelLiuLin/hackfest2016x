#include <ESP8266WiFi.h> 			// ESP8266 Core WiFi Library (you most likely already have this in your sketch)
#include <DNSServer.h>  			// Local DNS Server used for redirecting all requests to the configuration portal
#include <ESP8266WebServer.h> 		// Local WebServer used to serve the configuration portal
#include <WiFiManager.h> 			// https://github.com/tzapu/WiFiManager WiFi Configuration Magic
#include <WebSocketsClient.h> 		// https://github.com/Links2004/arduinoWebSockets
#include <ESPDMX.h> 			 	// https://github.com/Rickgg/ESP-Dmx

#define REBOOT    5 				// Assignment of REBOOT pin which just reboots the device
#define BUTTTON   10 				// Assignment of RESET pin which discards all previous WIFI settings

// num dmx channels
const uint16_t DMX_CHANNELS 			= 255;

uint16_t 	duration 					= 0;
char 		server_url[40] 				= "192.168.0.145"; 	// The URL of the service sending lighting instructions
char 		server_port[6] 				= "3000"; 			// The port of the service sending lighting instructions
uint8_t 	webSocketConnected 			= false; 
uint8_t 	dmxChannelNumber;

DMXESPSerial 		dmx;
WiFiManager 		wifiManager;
WebSocketsClient 	webSocket;

struct instruction {
	uint32_t 	start;
	uint16_t 	duration;
	byte 		from;
	byte 		to;

	// default values are UNINITIALISED
	inline instruction() __attribute__((always_inline)){}

	/// allow construction from values
	inline instruction( uint32_t astart, uint16_t aduration, byte afrom, byte ato)  __attribute__((always_inline))
	: start(astart), duration(aduration), from(afrom), to(ato)
	{}

	int8_t LinearTick (uint32_t currenttime){
		if (currenttime > start+duration) {
			return to; // Instruction is in the past
		} else if (currenttime <= start){
			return from; // Instruction is in the future
		} else if(to>from){
			return from + (currenttime-start)*(to-from)/duration;
		} else {
			return from - (currenttime-start)*(from-to)/duration;
		}
	}
};

byte v[DMX_CHANNELS];
instruction i[DMX_CHANNELS];

void webSocketEvent(WStype_t type, uint8_t * payload, size_t len) {

	switch (type) {
		case WStype_DISCONNECTED:
			if (webSocketConnected) {
				Serial.printf("Disconnected \n");
				webSocketConnected = false;
			}
			break;
			
		case WStype_CONNECTED:
			if (!webSocketConnected) {
				Serial.printf("Connected \n");
				webSocketConnected = true;
			}
			break;
			
		case WStype_TEXT:
			break;
			
		case WStype_BIN:
			switch (payload[0]) {
				case 1:
					for(byte x = 0; x < (len); x++){
						i[payload[1]-1+x] = instruction(millis()+(payload[2] * 256 + payload[3]), (uint16_t) payload[4] * 256 + payload[5] , v[payload[1]-1+x], payload[6+x]);
					}
					Serial.print("Received data");
				break;
				case 254:
					Serial.print("Reboot Flag Sent");
					rebootDevice();
					break;   
				case 255:
					Serial.print("Reset Flag Sent");
					resetWIFIAndRebootDevice();
					break;                  
				default:
					break;
				}
		break;
	}

}


void rebootDevice () {

	pinMode(REBOOT,OUTPUT);
	delay(1000);
	digitalWrite(REBOOT, HIGH);
	delay(1000);
	digitalWrite(REBOOT, LOW);
	delay(1000);

}

void resetWIFIAndRebootDevice(){

	pinMode(REBOOT,OUTPUT);
	delay(1000);
	digitalWrite(REBOOT, HIGH);
	delay(1000);
	digitalWrite(REBOOT, LOW);
	delay(1000);
	
}

uint16_t returnIntFrom2Bytes(uint8_t d, uint8_t m)	{ return d * 256 + m; }
uint8_t  get256DividedValue(uint32_t value) 		{ return round(value/256); }
uint8_t  getModuloValue(uint32_t value) 			{ return value % 256; }

void tween () {

	uint32_t now = millis();

	// Calculate updated values for every DMX channel
	for (uint8_t x = 0; x < DMX_CHANNELS; x++) {
		// Save the value to a history, used when creating new instructions (Rather than calculating at that time which would be slightly less accurate)
		v[x] = i[x].LinearTick(now);
		// Send the value to the DMX library'
		dmx.write(x+1, v[x]); 
	}

	dmx.update();
	delay(10);
}


void setup () {

	Serial.begin(9600);

	pinMode(BUTTTON, INPUT_PULLUP);
	delay(1000);

	dmx.init(512);

	WiFiManagerParameter custom_server_url("server", "WebSocket server", server_url, 40);
	WiFiManagerParameter custom_server_port("port", "WebSocket port", server_port, 5);
	wifiManager.addParameter(&custom_server_url);
	wifiManager.addParameter(&custom_server_port);

	wifiManager.autoConnect("ESP8266-DMX", "talktomic");

	// Settings are 
	strcpy(server_url, custom_server_url.getValue());
	strcpy(server_port, custom_server_port.getValue());
	Serial.println(server_url);
	Serial.println(atoi(server_port));
	webSocket.begin(server_url, atoi(server_port));

	delay(5000);

	webSocket.onEvent(webSocketEvent); 
}

void loop () { 
	webSocket.loop();

	if(digitalRead(BUTTTON) == LOW){
		Serial.println("Resetting WIFI and rebooting device....");
		resetWIFIAndRebootDevice();
	}

	tween();
}