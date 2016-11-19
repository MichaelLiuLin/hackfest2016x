# -*- coding: utf-8 -*-
"""
Created on Sat Nov 19 10:46:49 2016

@author: utting
"""

import urllib.request
import json
import time

devices = {}

def updated(old_prop, new_prop):
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


wifi_page = "https://lsyfkbcca3.execute-api.ap-southeast-2.amazonaws.com/prod/CMX-receiver/lastest"

for i in range(0, 100):
    
    req = urllib.request.Request(wifi_page)
    with urllib.request.urlopen(req) as response:
        the_page = response.read() #.decode(encoding="UTF-8")
        the_page = the_page.decode(encoding="UTF-8")
        # print(the_page)
    data = json.loads(the_page)
    print()
    print("READ NEW PAGE WITH", len(data['features']), "PHONES")
    for phone in data['features']:
        prop = phone["properties"]
        name = prop["name"]
        if name in devices:
            oldp = devices[name]
            updated(oldp, prop)
        devices[name] = prop
    time.sleep(1.0)


#    for (n,p) in phones.items():
#        print(n, p["clientSeenString"], p["speed"])
