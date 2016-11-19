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
