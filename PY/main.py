from ActivityTypeAI import GetTrainActivityEvents, GetTestActivityEvents, CreateCSV
import json

try:

    # load the events and print the first event
    f = open('PY/events.txt')
    json_file = json.load(f)
    print(json_file[0]) # {'user_graph': 'http://www.vaimee.it/my2sec/defuser@vaimee.it', 'username_literal': 'defuser', 'nodeid': 'b292', ...}
    print()
    print()


    # get the train events from a list of events
    results = GetTrainActivityEvents(json_file)
    if not results: raise Exception('ERROR: impossible get the train events.')
    print()
    print()


    # load the train events with user's selection
    f = open('PY/train_test_events.txt')
    json_file = json.load(f)


    # save the user's train events to a CSV
    if not CreateCSV(json_file['train_events']): raise Exception('ERROR: impossible to save the train events.')


    # get the ActivityType on all the events using the user's train events
    results = GetTestActivityEvents(json_file)
    if not results: raise Exception('ERROR: impossible get the ActivityType for the events.')




except Exception as ex:
    print(ex)
