# API - Activity Watch and My2Sec


Main link and port: http://127.0.0.1:5000/user<br>
Installing all the requirements: ```python -m pip install -r requirements.txt```<br>
Start the API: ```python main/API_my2sec.py```

## GET
1. ```GetCurrentCSV```: get a json with all the Current Events (i.e. the events scanned during a start-stop procedure). You can use this method only if all the events are assigned, i.e. the working flag is assigned. Check if there aren't ```None``` value in the working flag, otherwise try to assign the events using ```GetWorkingEvents_AI_Filter```.<br>JSON:```{"watcher-api-request":{"getAction":"GetCurrentCSV"}}```
2. ```GetCurrentCSV-None```: get True if there are Current Events with ```None``` values, otherwise False.<br>JSON:```{"watcher-api-request":{"getAction":"GetCurrentCSV-None"}}```
3. ```GetSelectionCSV```: get a json with all the Selection Events (i.e. the events with the working flag).<br>JSON:```{"watcher-api-request":{"getAction":"GetSelectionCSV"}}```
4. ```GetWorkingEvents-AI-Filter```: get a json file with the all unassigned events; if there are more than 5 events stored in the knowledge base, the AI Filter is applied. 0 for not working activity, 1 for working activity.<br>JSON:```{"watcher-api-request":{"getAction":"GetWorkingEvents-AI-Filter"}}```
5. ```GetAWClient```: get the name of the client (default: 'aw_my2sec').<br>JSON:```{"watcher-api-request":{"getAction":"GetAWClient"}}```
<br>

## POST
1. ```AWClient```: to modify the ActivityWatch client name (default aw_my2sec).<br>JSON:```{"watcher-api-request":{"AWClient":"aw_my2sec"}}```
2. ```AWServerParams```: to set the Activity Watch parameters, i.e. hostname and port.<br>JSON:```{"watcher-api-request":{"AWServerParams":{"hostname\":"localhost","port":"5600"}}}```
3. ```START_ALL```: to start all the watchers.<br>JSON:```{"watcher-api-request":{"requestAction":{"watchers-management":"START_ALL"}}}```
4. ```STOP_ALL```: to stop all the watchers.<br>JSON:```{"watcher-api-request":{"requestAction":{"watchers-management":"STOP_ALL"}}}```
5. ```SendCurrentCSV```: to send all the events to the working buckets (only if all the events are assigned: use ```GetCurrentCSV-None```.<br>JSON:```{"watcher-api-request":{"requestAction":{"watchers-management":"SendCurrentCSV"}}}```
6. ```SetWorkingEvents```: to send to the API the events with the user's selection (i.e. the events after the working/not-working selection). See the chapter below to create the JSON.<br>JSON:```{"watcher-api-request":{"requestAction":{"watchers-management":{"SetWorkingEvents": SOMETHING}}}}```
7. ```DeleteCurrentCSV```: in progress...
8. ```DeleteSelectionCSV```: in progress...


### Example of ```SetWorkingEvents```
You must use app, title, url and working_selection as columns. You can express the results as lists (the first element of app and title must refer eachother). Use 0 as not working activity and 1 for a working activity.
```
{"watcher-api-request":{"requestAction":{"watchers-management":{"SetWorkingEvents":
 {'app': ['ARGE','Atom','Safari','Postman','Atom'],
 'title':['Postman','API_my2sec.py — ~/Documents/Python_SIGNALS','Editing my2sec/README.md at API-ActivityWatch · vaimee/my2sec','Postman','API_my2sec.py — ~/Documents/Python_SIGNALS'],
 'url':  ['None','None','None','None','None'],
 'working_selection': ['0','1','0','0','0']}}}}}
 ```
 <br>
 
## A real scenario
- Start and stop a scan;
- ```GetWorkingEvents-AI-Filter``` to get the unassigned events. If you obtain an empty json, then all the events are already assigned, so jump to ```GetCurrentCSV-None```;
- ```SetWorkingEvents``` to upload the knowledge base with the user's selection;
- ```GetCurrentCSV-None``` to get if there are ```None``` in the CSV. If it returns ```False``` go ahead, otherwise raise Error;
- ```SendCurrentCSV``` to send all the events received to the working buckets.
<br>

## All the info about the buckets
- ```aw-watcher-start-stop```: {"start-stop":"start"} for a start event and {"start-stop":"stop"} for a stop event;
- ```aw-watcher-notshutdown```: {"not_shutdown":"T"} created every 5 minutes;
- ```aw-watcher-working```: {"app":..., "title":..., "url":...}. If a event isn't a working activity, all the subset are repleced with "private";
- ```aw-watcher-afk```: {"status":"not-afk"} or {"status":"afk"}
<br>
