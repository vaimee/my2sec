import pandas as pd
import datetime
from datetime import timezone, timedelta, datetime
import json
from collections import defaultdict
import numpy as np
import sys


def graph2dict(ontos, node_name):
    predicates = []
    dict_of_values = defaultdict(list)
    for i in ontos:
        for y in list(i.keys()):
            if y == node_name:
                continue
            dict_of_values[i[node_name]].append((y,i[y]))
            if y not in predicates:
                predicates.append(y)
    return dict_of_values, predicates


def browse(element):
    for i in element:
        yield i


def DropDuplicates_and_sort(dataframe, column_to_sort, drop_duplicates=False):
    tmp = dataframe.copy()
    if drop_duplicates:
        tmp = tmp.drop_duplicates()
    return tmp.sort_values(by=column_to_sort).reset_index().drop(columns='index')


def dict2pandas(dict_of_events, node_name, value_name, datetimestamp_name):
    tmp = []
    for j in browse(pd.DataFrame(dict_of_events.items(), columns=[node_name, value_name])[value_name]):
        key = [z[0] for z in browse(j)]
        value = [z[1] for z in browse(j)]
        tmp.append(dict(zip(key,value)))
    tmp = DropDuplicates_and_sort(pd.DataFrame(tmp), datetimestamp_name, drop_duplicates=True)
    dates = tmp.datetimestamp.apply(lambda x: x[:x.index('+')]+'.0'+x[x.index('+'):] if not '.' in x else x).apply(lambda x: datetime.strptime(x, '%Y-%m-%dT%H:%M:%S.%f%z'))
    tmp = tmp.drop(columns=datetimestamp_name)
    tmp[datetimestamp_name] = dates
    return tmp

def resample_not_shutdown(dataframe, not_shutdown_name, datetimestamp_name):
    df = pd.DataFrame(columns=dataframe.columns)
    events = list(dataframe[dataframe.event_type==not_shutdown_name][datetimestamp_name].values)
    if not events: return df
    events.append(events[-1] + np.timedelta64(5,'m'))
    shutdown = ["T"]*(len(events)-1)
    shutdown.append(None)
    tmp = pd.DataFrame(data={"Timestamp":events, "Not_Shutdown":shutdown}, dtype='datetime64[ns, UTC]').set_index('Timestamp').resample('5min', label='right').first()
    shutdown_false = tmp[tmp.Not_Shutdown!="T"]
    last = shutdown_false.index[0]
    df = pd.concat([df, pd.DataFrame({datetimestamp_name:[last]})])
    for i in range(1, shutdown_false.shape[0]):
        if not last+timedelta(minutes=5) == shutdown_false.index[i]:
            df = pd.concat([df, pd.DataFrame({datetimestamp_name:[shutdown_false.index[i]]})])
            pass
        last = shutdown_false.index[i]
    return df


def AddDuration(json_events, user_graph_name = 'user_graph', username_literal_name='username_literal', node_name='nodeid', value_name='value', datetimestamp_name='datetimestamp', duration_name='real_duration', not_afk_name = '', afk_name='http://www.vaimee.it/ontology/sw#afkEvent', not_shutdow_name='http://www.vaimee.it/ontology/sw#notShutdown'):
    try:
        if not json_events: raise Exception('ERROR DURING JSON PARSE: no events in the json.')
        dict_events, predicates = graph2dict(json_events, node_name)
        df = dict2pandas(dict_events, node_name, value_name, datetimestamp_name)
        final = pd.DataFrame(columns=df.columns)
        tmp = df.copy()
        tmp = pd.concat([tmp, resample_not_shutdown(tmp, not_shutdow_name, datetimestamp_name)])
        tmp = DropDuplicates_and_sort(tmp, datetimestamp_name)
        durations = []
        for i in range(tmp.shape[0]):
            try:
                current_dt = tmp.iloc[i].datetimestamp
                next_dt = tmp.iloc[i+1].datetimestamp
                durations.append((next_dt - current_dt).total_seconds())
            except:
                durations.append(0)
        tmp[duration_name]=durations.copy()
        tmp = tmp.dropna(subset=[user_graph_name, username_literal_name])
        final = pd.concat([final, tmp]).astype('string')
        final[datetimestamp_name] = final[datetimestamp_name].apply(lambda x: x.replace(" ", "T"))
        return final.to_dict('records')
    except Exception as ex:
        print(ex)
        return []



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
dataToSend=AddDuration(jsonEvents)
print("Add duration function executed correctly")
print("Saving output to file")
write_node_output_to_file(filename,json.dumps(dataToSend))

sys.stdout.flush()
