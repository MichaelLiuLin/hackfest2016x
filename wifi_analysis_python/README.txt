Wifi data for King's Beach
==========================

GeoJSON file available from: 
  https://lsyfkbcca3.execute-api.ap-southeast-2.amazonaws.com/prod/CMX-receiver/lastest

Updated each time the Meraki Wifi Access points detect changes.
Most phones request new Wifi AP data each 10 seconds?

Data is a dictionary:
  "type" : "FeatureCollection",
  "features" : list of phone_object

Each phone_object is a dictionary:
  "properties" : property_dictionary
  "geometry" : GeoJSON point object

Each property_dictionary contains:
  "clientSeenString": string date and time in GMT
  "lat": float latitude
  "lng": float longitude
  "name": string unique ID (string of digits)
  "distance": float distance in metres from last position ()
  "direction": float angle in degrees from last position (0=north)
  "speed": float speed in kmh
  "clientOS": string usually "unknown"
  "clientManufacturer": "Huawei Technologies"
  "clientSeenEpoch": int seconds since 1970
  "time_interval_secs": int seconds since previous entry


RUNNING
======
This web service monitors the SCC Wifi access point data for King's
Beach and keeps track of the devices that are closest to each light
fixture.  It returns this data in JSON format as a web service.

To run this web service program, just do 'python3 server.py'.
You will need to change the IP address on the last line of the
script to match the IP address of the server you are running it on.

Then you can use any web browser to test it out, for example:
   http://<server.ip.address>:8080/getalldevices
 or
   http://<server.ip.address>:8080/getdevices?id=10

