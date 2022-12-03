# API - Activity Watch and My2Sec


Main link and port: http://127.0.0.1:5000/user

## GET
1. ```GetCurrentCSV```: get a json with all the Current Events (i.e. the events scanned during a start-stop procedure). You can use this method only if all the events are assigned, i.e. the working flag is assigned. Check if there aren't ```None``` value in the working flag, otherwise try to assign the events using ```GetWorkingEvents_AI_Filter```.<br>JSON:```{"watcher-api-request":{"getAction":"GetCurrentCSV"}}```
2. ```GetCurrentCSV-None```: get True if there are Current Events with ```None``` values, otherwise False.<br>JSON:```{"watcher-api-request":{"getAction":"GetCurrentCSV-None"}}```
3. ```GetSelectionCSV```: get a json with all the Selection Events (i.e. the events with the working flag).<br>JSON:```{"watcher-api-request":{"getAction":"GetSelectionCSV"}}```
4. ```GetWorkingEvents-AI-Filter```: get a json file with the all unassigned events; if there are more than 5 events stored in the knowledge base, the AI Filter is applied.<br>JSON:```{"watcher-api-request":{"getAction":"GetWorkingEvents-AI-Filter"}}```
5. ```GetAWClient```: get the name of the client (default: 'aw_my2sec').<br>JSON:```{"watcher-api-request":{"getAction":"GetAWClient"}}```

## A real scenario
- Start and stop a scan;
- ```GetWorkingEvents-AI-Filter``` to get the unassigned events;
- ```SetWorkingEvents``` to upload the knowledge base with the user's selection;
- ```GetCurrentCSV-None``` to get if there are ```None``` in the CSV. If it returns ```False``` go ahead, otherwise raise Error;
- ```SendCurrentCSV``` to send all the events received to the working_buckets.
