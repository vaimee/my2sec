# BUCKETS_WORKER.PY

# this file is used for:
# - query the "aw-watcher-bucket";
# - convert the list of jsons (each events is represented with a json) to a pandas DataFrame;
# - upload the 'apps_current.csv' to the WorkingBucket.
# the 'apps_current.csv' is a csv with all the events. An event is what the user's doing
# during the scan. Besides, the events inside the 'apps_current.csv' are already
# filtered and it contains only the events seen as working activity (because of privacy,
# not all the events can send to the SEPA).


from time import sleep
from datetime import datetime, timedelta, timezone
from aw_core.models import Event
from aw_client import ActivityWatchClient
import pandas as pd
import math



# this function returns a list of possible jsons of events.
# it queries the ActivityWatch "aw-watcher-window" bucket.
# each json consists of single event that identifies a single user's activity.
# it has a form such as {'id':..., 'data':{'app':'GoogleChrome', 'title':...}}.
# the function receives the datetime when the scan was started and the datetime when it is stopped.
# the datetimes is a list with two elements where the first element is the initial datetime, while
# the second elements is the final datetime
def QueryCurrentWindow(json_results, blacklist):
    try:
        #print(blacklist)
        # append each event (written as json) in a list
        list_of_currentWindow = []

        for element in json_results:
            for item in element:
                print(item["data"])
                # if the title or url is missing, add to the json with a 'None' value
                if "title" not in item["data"]: continue
                if item["data"]["title"] == "": continue
                if item["data"]["app"].lower() in blacklist["black_app"]: continue

                # ignoring the unkown application
                if item["data"]["app"] != "unknown" and item["data"]["title"] != "unknown":
                    if "url" not in item["data"]:
                        item["data"]["url"] = "None"
                    else:
                        try:
                            if item["data"]["url"] == None or item["data"]["url"].lower() == "nan":
                                item["data"]["url"] = "None"
                        except: pass
                    black = False
                    for i in blacklist["black_title"]:
                        if i in item["data"]["title"].lower():
                            black = True
                            break
                    if black: continue
                    # drop the duration from each json
                    #item.pop('duration', None)

                    list_of_currentWindow.append(item)
        return list_of_currentWindow

    except: return [] # return an empty list if there are errors


# convert the dict of all the events in a dataset;
# the dataset will be used for catching working/not-working flag.
# it has an header such as:   app | title | url | timestamp
# app --> the name of the application (for example Google Chrome)
# title --> the title of the page (or tab if browser)
# url --> the URL of the page if browser (otherwise the value is 'None')
# timestamp --> the timestamp when the events is started (in UTC format)
# The function receives a list of json for all the events:
# [  {'id':..., 'data':{'app':'GoogleChrome', 'title':...}}, {'id':..., 'data':{'app':'Safari', 'title':...}}, ...]
def DictToDataset(list_of_events):
    # if the function receives an empty list:
    try:
        # create the header for the dataset, such as:  app | title| url | timestamp
        header = list(list_of_events[0]['data'].keys())
        header.append('timestamp')
        header.append('duration')
        header.append('working_selection')

        # create an empty dataset
        apps_not_filtered_dataset = pd.DataFrame(columns = header)

        # add each item to the dataset
        for item in list_of_events:
            current_item = pd.DataFrame([item["data"]], columns = item["data"].keys())
            current_item['timestamp'] = item["timestamp"]
            current_item['duration'] = item["duration"]
            current_item['working_selection']='None'

            # ad the current item to the dataset
            apps_not_filtered_dataset = pd.concat([apps_not_filtered_dataset, current_item], ignore_index=True)
        return apps_not_filtered_dataset

    except: return pd.DataFrame() # return an empty dataframe if there are errors
