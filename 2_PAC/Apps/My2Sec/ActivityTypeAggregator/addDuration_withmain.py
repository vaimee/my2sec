import pandas as pd
import datetime
from datetime import timezone, timedelta, datetime
import json
from collections import defaultdict
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
import nltk
import re
from nltk.tokenize import word_tokenize
from nltk.stem import WordNetLemmatizer
from nltk.corpus import stopwords
from sklearn import svm
import sys
#nltk.download('stopwords')
#nltk.download('punkt')
#nltk.download('wordnet')
#nltk.download('omw-1.4')

configurations = {
    'node':'nodeid',
    'user_graph':'user_graph',
    'user':'username_literal',
    'value':'value',
    'datetimestamp':'datetimestamp',
    'duration':'real_duration',
    'not_afk':'',
    'afk':'http://www.vaimee.it/ontology/sw#afkEvent',
    'not_shutdown':'http://www.vaimee.it/ontology/sw#notShutdown',
    'window_event':'http://www.vaimee.it/ontology/sw#windowEvent',
    'window_event_columns':['app','title'],
    'no_words':["firefox", "mozilla", "edge", "exe", "chrome", "safari", "opera", "google", "youtube", "http", "www", "https", "msedg","com","microsoft"],
    'languages':['english', 'italian']
}


# load the stopwords and languages
stopwords_list = []
for language in configurations['languages']:
    stopwords_list.append(set(stopwords.words(language)))
for n in configurations['no_words']:
    stopwords_list[0].add(n)

# load the english lemmatizer
english_lemmatizer = WordNetLemmatizer()

# load the classifier
classifier = svm.SVC(C=10.0, kernel='linear', gamma='auto')


'''
Convert the list of events (i.e. list of jsons) to a defaultdict.
In particular, it tries to aggregate the values with the same node-id.
It takes the list of events, the node-id column name and the value column name.
It return the defaultdict and the predicates found in the list of events.
Ex. of json:
{'user_graph': {'type': 'uri','value': 'http://www.vaimee.it/my2sec/gianluca.dituccio@vaimee.it'},
 'username_literal': {'type': 'literal', 'value': 'ditucspa'},
 'nodeid': {'type': 'bnode', 'value': 'b0'}}
'''
def graph2dict(ontos, nodeid=configurations['node']):
    predicates = []
    dict_of_values = defaultdict(list)
    for i in ontos:
        for y in list(i.keys()):
            if y == nodeid:
                continue
            dict_of_values[i[nodeid]].append((y,i[y]))
            if y not in predicates:
                predicates.append(y)
    return dict_of_values, predicates

'''
Convert the defaultdict into a pandas dataframe.
It takes the defaultdict, the node-id column name, the value column name and the datetimestamp column name.
It return the pandas dataframe based on the defaultdict.
'''
def dict2pandas(dict_of_events,
                nodeid=configurations['node'],
                datetimestamp=configurations['datetimestamp']):
    tmp = []
    for j in browse(pd.DataFrame(dict_of_events.items(), columns=[nodeid, 'value'])['value']):
        key = [z[0] for z in browse(j)]
        value = [z[1] for z in browse(j)]
        tmp.append(dict(zip(key,value)))
    tmp = DropDuplicates_and_sort(pd.DataFrame(tmp), datetimestamp, drop_duplicates=True)

    # try to adjust the datatimestamp if it is in a wrong form
    dates = tmp[datetimestamp].apply(lambda x: x[:x.index('+')]+'.0'+x[x.index('+'):] if not '.' in x else x).apply(lambda x: datetime.strptime(x, '%Y-%m-%dT%H:%M:%S.%f%z'))
    tmp = tmp.drop(columns=datetimestamp)
    tmp[datetimestamp] = dates
    return tmp


def browse(element):
    for i in element:
        yield i

'''
Sort the values of the pandas dataframe by the column and drop the duplicates.
It takes the dataframe to sort, the column used to sort (or a list of columns) and True if drop duplicates.
It returns the pandas sorted and without duplicates (if the flag is activated).
'''
def DropDuplicates_and_sort(dataframe, column_to_sort, drop_duplicates=False):
    tmp = dataframe.copy()
    if drop_duplicates:
        tmp = tmp.drop_duplicates()
    return tmp.sort_values(by=column_to_sort).reset_index().drop(columns='index')

'''
Resample the Not Shutdown events every 5 minutes. Then, create the events when a Not Shutdown event isn't in the dataset.
It takes the dataframe, the not_shutdown columns name and the datetimestamp name.
It returns the dataframe with only the not shutdown events.
'''
def resample_not_shutdown(dataframe,
                          not_shutdown=configurations['not_shutdown'],
                          datetimestamp=configurations['datetimestamp']):
    try:
        df = pd.DataFrame(columns=dataframe.columns)
        events = list(dataframe[dataframe.event_type==not_shutdown][datetimestamp].values)
        if not events: return df
        events.append(events[-1] + np.timedelta64(5,'m'))
        shutdown = ["T"]*(len(events)-1)
        shutdown.append(None)
        tmp = pd.DataFrame(data={"Timestamp":events, "Not_Shutdown":shutdown}, dtype='datetime64[ns, UTC]').set_index('Timestamp').resample('5min', label='right').first()
        shutdown_false = tmp[tmp.Not_Shutdown!="T"]
        last = shutdown_false.index[0]
        df = pd.concat([df, pd.DataFrame({datetimestamp:[last]})])
        for i in range(1, shutdown_false.shape[0]):
            if not last+timedelta(minutes=5) == shutdown_false.index[i]:
                df = pd.concat([df, pd.DataFrame({datetimestamp:[shutdown_false.index[i]]})])
                pass
            last = shutdown_false.index[i]
        return df
    except Exception as ex:
        print(ex)
        return pd.DataFrame(columns=dataframe.columns)

'''
Add the duration to the events, using the Not Shutdown Events. It simply compute the difference between the
event with timestamp i and the event with the timestamp i+1. The Not Shutdown prevents eventually turn-off of the application or PC.
It takes the list of events (i.e. the list of jsons) and all the column names
'''
def AddDuration(json_events,
                user_graph=configurations['user_graph'],
                username_literal=configurations['user'],
                nodeid=configurations['node'],
                datetimestamp=configurations['datetimestamp'],
                duration=configurations['duration'],
                not_afk=configurations['not_afk'],
                afk=configurations['afk'],
                not_shutdow=configurations['not_shutdown']):
    try:
        if not json_events: raise Exception('ERROR DURING JSON PARSE: no events in the json.')
        dict_events, predicates = graph2dict(json_events)
        df = dict2pandas(dict_events)

        final = pd.DataFrame(columns=df.columns)
        tmp = df.copy()
        tmp = pd.concat([tmp, resample_not_shutdown(tmp, not_shutdow, datetimestamp)])
        tmp = DropDuplicates_and_sort(tmp, datetimestamp)
        durations = []
        for i in range(tmp.shape[0]):
            try:
                current_dt = tmp.iloc[i][datetimestamp]
                next_dt = tmp.iloc[i+1][datetimestamp]
                durations.append((next_dt - current_dt).total_seconds())
            except:
                durations.append(0)
        tmp[duration]=durations.copy()
        tmp = tmp.dropna(subset=[user_graph, username_literal])
        final = pd.concat([final, tmp])

        return final
    except Exception as ex:
        print(ex)
        return []

'''
Remove the events with a low duration. First, all the events are grouped by apps and titles and the duration is summed.
Then, the threshold is computed as 10% of the total duration (at most 15 minutes).
Finally, the dynamic threshold is computed on the previous threshold (i.e. cut all the events which their duration is above the threshold).
It takes the dataframe, column name and if cut the element below the threshold (higher=True) or above the threshold (higher=False).
It returns the dataframe with only the events above/below the threshold.
'''
def RemoveLowDuration(dataframe,
                      datetimestamp=configurations['datetimestamp'],
                      duration=configurations['duration'],
                      events_columns=configurations['window_event_columns'],
                      higher=True):
    threshold_minutes = round(dataframe[duration].sum()/60*0.1,2)
    if threshold_minutes > 15:
        threshold_minutes=15
    print('10% Threshold on total duration: {0}m'.format(threshold_minutes))
    tmp = dataframe.groupby(by=events_columns).sum().reset_index()
    duration_threshold = 0
    for i in range(10,1000,2):
        tmp2 = tmp[(tmp[duration]<i)].reset_index()
        if tmp2[duration].sum()/60 > threshold_minutes:
            duration_threshold = i
            print("Total minutes under Threshold: {0}m".format(round(tmp[(tmp[duration]<i)].reset_index()[duration].sum()/60,2)))
            break
    print("Threshold: {0}s".format(duration_threshold))
    if higher: tmp = tmp[tmp[duration]>duration_threshold]
    else: tmp = tmp[tmp[duration]<duration_threshold]
    df = pd.merge(dataframe, tmp, on=events_columns, how='left')
    df = df[df[duration+'_y'].notna()]
    df[duration]=df[duration+'_x']
    df = df.drop(columns=[duration+'_y', duration+'_x'])
    return df


'''
Get the training events (at most 10 events per day).
The function takes the list of events (i.e. a list of jsons).
The function returns a list of jsons containing only the training events.
'''
def GetTrainActivityEvents(json_events,
                           datetimestamp=configurations['datetimestamp'],
                           windowEvent=configurations['window_event'],
                           duration=configurations['duration'],
                           events_columns=configurations['window_event_columns']):
    try:
        if not json_events: raise Exception('ERROR DURING JSON PARSE: no events in the json.')
        df = DropDuplicates_and_sort(AddDuration(json_events), datetimestamp, drop_duplicates=True)
        df = df.copy()
        df = df[df.event_type==windowEvent]

        candidates = RemoveLowDuration(df, datetimestamp, duration, events_columns, higher=True)
        candidates = DropDuplicates_and_sort(candidates, datetimestamp)
        candidates = candidates.drop_duplicates(subset=events_columns, keep='last')

        train_size = 1
        max_events_day = 10
        # se ci sono meno di 20 eventi, ne chiede 5
        if candidates.shape[0] < 20: train_size = round(5 / candidates.shape[0],1)
        else:
            #altrimenti ne chiede il 10%
            train_size = 0.1
            # se il 10% supera i 10 eventi, fa in modo che il train size sia tarato per chiederne massimo 10
            if train_size * candidates.shape[0]>max_events_day: train_size = round(max_events_day / candidates.shape[0],1)

        # se ci sono meno di 5 eventi, ne chiede la metà
        if train_size>0.9: train_size=0.5
        if candidates.shape[0]==3: train_size = 0.7
        print('Train size: ', train_size)

        train, test = train_test_split(candidates, train_size=train_size)
        print('Train shape: {0}, Test shape: {1}'.format(train.shape, test.shape))
        train = train.astype("string")
        train[datetimestamp] = train[datetimestamp].apply(lambda x: x.replace(" ", "T"))


        return train.to_dict('records')
    except Exception as ex:
        print(ex)
        return []





#=====================================================================
def read_node_input_from_file(filename):
    print("Reading input from file: "+filename)
    try:
        arg = open(filename)#,encoding="cp866")
        arg=arg.read()
        #print(arg)
        arg=json.loads(arg)
        #print(arg)
        print("Loaded file with default encoding")
        #print(arg)
    except Exception as ex:
        arg = open(filename,encoding="cp866")
        arg=arg.read()
        #print(arg)
        arg=json.loads(arg)
        #print(arg)
        print("Loaded file with cp866 encoding")
        #print(arg)
        #dataToSend=AddDuration(arg)
        #print(dataToSend)
        #sys.stdout.flush()
    return arg


def write_node_output_to_file(filename,string):
    f = open(filename, "w")
    f.write(string)
    f.close()
    print("File saved correctly!")


print("###################################")
print("THE BOA CONSTRICTOR STARTED EATING!")
print("###################################")
filename=sys.argv[1]
jsonEvents=read_node_input_from_file(filename)
print("File loaded successfully")
print("###################################")
#print(jsonEvents)
dataToSend=GetTrainActivityEvents(jsonEvents)
print("GetTrainActivityEvents function executed correctly")
print("Saving output to file")
write_node_output_to_file(filename,json.dumps(dataToSend))

sys.stdout.flush()
