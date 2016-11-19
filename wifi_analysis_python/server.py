# -*- coding: utf-8 -*-
"""
Created on Sat Nov 19 14:44:38 2016

@author: utting
"""

from bottle import route, run, request, response
import urllib.request
import json

CONFIG = "config.js"  # locations of light fixtures
SERVER = "lsyfkbcca3.execute-api.ap-southeast-2.amazonaws.com"
WIFI_PAGE = "https://" + SERVER + "/prod/CMX-receiver/lastest"

# This dictionary maps Device IDs to a dictionary of properties
devices = {}

# This dictionary maps Light Fixture IDs (strings) to
# the corresponding entry from config.js
fixtures = {}


def update_all_devices():
    req = urllib.request.Request(WIFI_PAGE)
    with urllib.request.urlopen(req) as response:
        the_page = response.read().decode(encoding="UTF-8")
        # print(the_page)
    data = json.loads(the_page)
    print("READ NEW PAGE WITH", len(data['features']), "PHONES")
    for dev in data['features']:
        prop = dev["properties"]
        id = prop["name"]
#        if name in devices:
#            oldp = devices[name]
#            update(oldp, prop)
        devices[id] = prop


def update(old_prop, new_prop):
    oldtime = old_prop["clientSeenString"][11:]
    newtime = new_prop["clientSeenString"][11:]
    oldepoch = old_prop["clientSeenEpoch"]
    newepoch = new_prop["clientSeenEpoch"]
    speed = new_prop["speed"]
    if (oldtime != newtime):
        if speed == 0:
            print(oldtime, newtime, "no change in position")
        else:
            print(oldtime, newtime, oldepoch, newepoch, speed)


def inside(fix, lat, lng):
    metres_per_degree = 111111.0  # 111.111km per degree, roughly
    dy = (lat - fix["lat"]) * metres_per_degree
    dx = (lng - fix["lng"]) * metres_per_degree
    sq = dx * dx + dy * dy
    result = sq <= 20 * 20
    # print(dx, dy, sq, result)
    return result


def find_nearby(fix):
    """Finds all devices within the radius of the given light fixture."""
    # TODO: extrapolate to current position
    result = []
    for dev in devices.values():
        lat = dev["lat"]
        lng = dev["lng"]
        if inside(fix, lat, lng):
            result.append(dev)
    return result


@route('/hello')
def test():
    return "Hello World!"


@route('/getdevices')
def find_devices():
    fixture_id = request.query.id
    print("Receive the request for fixture:", fixture_id, type(fixture_id))
    update_all_devices()
    if fixture_id not in fixtures.keys():
        return "ERROR: unknown fixture ID " + fixture_id
    f = fixtures[fixture_id]
    nearby = find_nearby(f)

    # store_locations = etl.fromcsv("store_locations.csv")
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Content-type'] = 'application/json'
    nearby_json = json.dumps(nearby)
    return '{ "fixture_id":' + fixture_id + ', "nearby":' + nearby_json + ' }'


# read fixtures
with open(CONFIG) as config:
    the_page = config.read()  #.decode(encoding="UTF-8")
    fixs = json.loads(the_page)
    for f in fixs:
        id = str(f["id"])
        print("Fixture", f, type(f))
        fixtures[id] = f


# Some tests: should print True, False
f1 = fixtures["1"]
f10 = fixtures["10"]
print("Should be True", inside(f1, f1["lat"], f1["lng"]))
print("Should be False", inside(f1, f10["lat"], f10["lng"]))

run(host='localhost', port=8080, debug=True)
