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

devices = {}
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
        name = prop["name"]
#        if name in devices:
#            oldp = devices[name]
#            update(oldp, prop)
        devices[name] = prop


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


def find_nearby(fix):
    return []


@route('/hello')
def test():
    return "Hello World!"


@route('/getdevices')
def find_devices():
    fixture_id = request.query.id
    print("Receive the request for fixture: " + fixture_id)
    update_all_devices()
    f = fixtures[fixture_id]
    nearby = find_nearby(f)

    # store_locations = etl.fromcsv("store_locations.csv")
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Content-type'] = 'application/json'
    nearby_json = json.dumps(nearby)
    return '{ "fixture_id":' + fixture_id + ', "nearby":' + nearby_json + ' }'


# read fixtures
with open(CONFIG) as config:
    the_page = config.read().decode(encoding="UTF-8")
    fixtures = json.loads(the_page)
    print("Fixtures:", fixtures)

run(host='localhost', port=8080, debug=True)
