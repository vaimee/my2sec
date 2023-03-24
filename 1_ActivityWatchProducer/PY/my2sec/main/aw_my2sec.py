from aw_client import ActivityWatchClient
from aw_core.models import Event
import os
import json
from datetime import datetime, timezone, timedelta
from dateutil import parser
from threading import Thread
from time import sleep
from aw_ping import check
import buckets_worker
import pandas as pd

# watcher used for scans
class My2secWatcher:
    sleep_time = None  # time [s] between each scan (only for meeting selection)

    __datetime_start_watcher = None # the datetime when the scan is started
    __datetime_end_watcher = None # the datetime when the scan is stopped

    scan_running = False
    watcher_running = False
    program_running = False

    AWserver_running = False




    __hostname = None
    __path = None
    __testing = None
    __meeting_selection = None
    __server_params = None

    __client_name = None
    __client = None # it's the ActivityWatch client used for initializing the aw-watcher-meeting-browser
    __meeting_bucket_id = None # it's the bucket id refered to the aw-watcher-meeting-browser client


    __result = []
    __events = []
    __last_titles_meeting = []

    watcher_thread = None
    AWServer_thread = None


    running_mainloop = True


    # server params
    def __init__(self, path, hostname=None, serverParams=None, meeting=False, testing=False):
        self.__hostname = hostname
        self.__path = path
        self.__testing = testing
        self.__meeting_selection = meeting
        self.__server_params = serverParams
        #self.AWserver_running = check(self.__server_params[0],self.__server_params[1])
        self.AWServer_thread = Thread(target=self.AWServerThread, args=())
        self.AWServer_thread.start()
        if meeting: self.sleep_time = 5.0


    def CreateAWClient(self, client_name):
        config_section = "" if not self.__testing else "-testing" # set the name if testing is true or false
        self.__client_name = client_name + config_section
        self.__client = ActivityWatchClient(self.__client_name, testing=self.__testing)


    def SetAWServerParams(self, params):
        self.__server_params = params
        #check(self.__server_params[0],self.__server_params[1])

    def GetAWServerParams(self):
        return self.__server_params

    def GetAWClientName(self):
        return self.__client_name


    """def SendToAWBucket(self, bucket_name, event_type, timestamp, data):
        try:
            self.__client.create_bucket("{}_{}".format(bucket_name, self.__client.client_hostname), event_type=event_type)
            event = Event(timestamp=timestamp, data=data)
            self.__client.insert_event("{}_{}".format(bucket_name, self.__client.client_hostname), event)
            return True
        except Exception as ex:
            print(ex)
            return False"""


    def Start(self):
        if self.AWserver_running == False:
            print("AWServer is offline")
            return 'ActivityWatch Server offline', 400
        if self.watcher_running == True:
            print("watcher already started")
            return "Watcher already started", 400
        print("Watcher started")
        self.watcher_running = True
        self.SetDatatime()
        self.watcher_thread = Thread(target=self.WatcherThread, args=())
        self.watcher_thread.start()
        bucket = "{}_{}".format("aw-watcher-start-stop", self.__client.client_hostname)
        self.__client.create_bucket(bucket, event_type="start-stop")
        not_shutdown_event = Event(timestamp=datetime.now(timezone.utc), data={"start-stop":"start"})
        self.__client.insert_event(bucket, not_shutdown_event)
        return "watcher started", 200


    def Stop(self):
        if self.AWserver_running == False and self.__datetime_start_watcher == None:
            print("ActivityWatch Server offline")
            return "ActivityWatch Server offline", 400
        if self.AWserver_running == False:
            print("ActivityWatch Server offline")
        print("watcher stopped")
        self.watcher_running = False
        message, error = self.SetDatatime(start=False)
        self.watcher_thread = None
        #self.AWServer_thread = None
        self.__datetime_start_watcher = None
        bucket = "{}_{}".format("aw-watcher-start-stop", self.__client.client_hostname)
        self.__client.create_bucket(bucket, event_type="start-stop")
        not_shutdown_event = Event(timestamp=datetime.now(timezone.utc), data={"start-stop":"stop"})
        self.__client.insert_event(bucket, not_shutdown_event)
        return message, error


    def SetDatatime(self, start=True):
        if start:
            self.__datetime_start_watcher = datetime.now(timezone.utc)
        else:
            try:
                if self.__datetime_start_watcher == None:
                    raise Exception("no initial datetime")
                if os.path.isfile(self.__path+'/datetime.txt'):
                    os.remove(self.__path+'/datetime.txt')
                with open(self.__path+'/datetime.txt', 'w') as f:
                    f.writelines("{0};{1}".format(self.__datetime_start_watcher, datetime.now(timezone.utc)))
                #self.__datetime_start_watcher = None
                #print(self.QueryAWCurrentWindow())
                return None, False
            except Exception as ex:
                print(ex)
                return ex, True


    def WatcherThread(self):
        while self.watcher_running:
            self.NotShutdown()
            self.SetDatatime(start=False)
            print("backup created")
            sleep(300)


    def AWServerThread(self):
        previous_AWStatus = True if self.AWserver_running else False
        while True:
            AWStatus = check(self.__server_params[0],self.__server_params[1])

            if not AWStatus and previous_AWStatus:
                print("Stop della scansione")
                self.AWserver_running = False
                previous_AWStatus = False
                self.Stop() # return su stop

            if AWStatus and not previous_AWStatus:
                print("server nuovamente online")
                self.AWserver_running = True
                previous_AWStatus = True

            sleep(5)

    # utilizzare SendToAWBucket
    def NotShutdown(self):
        try:
            # send NotShutdown to bucket
            bucket = "{}_{}".format("aw-watcher-notshutdown", self.__client.client_hostname)
            self.__client.create_bucket(bucket, event_type="not_shutdown")
            not_shutdown_event = Event(timestamp=datetime.now(timezone.utc), data={"not_shutdown":"T"})
            self.__client.insert_event(bucket, not_shutdown_event)
        except Exception as ex:
            print(ex)


    def QueryAWCurrentWindow(self):
        try:
            datetime = None
            with open(self.__path+'/datetime.txt') as f:
                datetime = f.readlines()[0].split(";")

            # query the bucket with all the user's activities
            self.__client.create_bucket("{}_{}".format("aw-watcher-window", self.__client.client_hostname), event_type="currentwindow")
            query = "RETURN = query_bucket('{}');".format("{}_{}".format("aw-watcher-window", self.__client.client_hostname))
            # the result is a list of jsons of events
            # find the activity 7 seconds before and after (due to the delay)
            self.__datetime_start_watcher = parser.parse(datetime[0]).replace(tzinfo=timezone.utc)
            self.__datetime_end_watcher = parser.parse(datetime[1]).replace(tzinfo=timezone.utc)
            query = self.__client.query(query, timeperiods=[(self.__datetime_start_watcher - timedelta(seconds = 1),
                                                            self.__datetime_end_watcher + timedelta(seconds = 1))])
            if self.RemoveDatetimeFile():
                print("datetime rimosso con successo")
            self.__datetime_start_watcher = None
            self.__datetime_end_watcher = None
            #print(query)
            #print(json.load(open(self.__path+'/blacklist_watcher.json'))["black_app"])
            return buckets_worker.DictToDataset(buckets_worker.QueryCurrentWindow(query, json.load(open(self.__path+'/blacklist_watcher.json'))))

        except Exception as ex:
            print(ex)
            return pd.DataFrame()


    def RemoveDatetimeFile(self):
        try:
            os.remove(self.__path+"/datetime.txt")
            return True
        except:
            return False

    def SendToAWBucket(self, dataframe):
        try:
            bucket_id = "{}_{}".format("aw-watcher-working", self.__client.client_hostname)
            self.__client.create_bucket(bucket_id, event_type='working_events')
            for index in range(dataframe.shape[0]):
                current_item = dataframe.loc[index]
                data = {}
                if str(current_item["working_selection"])== str(0):
                    data = {"app":'private', "title":'private', 'url':'private'}
                else:
                    data = {'app':current_item["app"], 'title':current_item["title"], 'url':current_item["url"]}
                working_event = Event(timestamp=current_item["timestamp"], data=data)
                working_event["duration"] = timedelta(seconds=current_item["duration"])
                inserted_event = self.__client.insert_event(bucket_id, working_event)
            return None, False
        except Exception as ex:
            print(ex)
            return ex, True
