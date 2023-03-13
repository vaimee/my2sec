# pip install flask
# pip install flask_restful

from flask import Flask, make_response, request
from flask_restful import Resource, Api, reqparse
import pandas as pd
import json
import aw_my2sec
import os
import socket
from manage_csv import CheckFile, ReadCSV, EventsToCSV, WorkingEvents, UpdateSelectionCSV, UpdateCurrentCSV
import numpy as np

app = Flask(__name__)
api = Api(app)




# rispondere sempre con l'hostname e il AW client name
class User(Resource):

    # some client and AW server info (by default)
    path = os.getcwd()
    hostname = socket.gethostname()
    client_name = "aw_my2sec"
    AWServerParams = ("localhost",5600)

    # initialize the watcher
    # args:
    # - path where storing files;
    # - hostname of the client;
    # - meeting selection (boolean) if the watcher have to search for meeting;
    # - testing mode (boolean)
    __watcher = aw_my2sec.My2secWatcher(path=path, hostname=hostname, serverParams=AWServerParams, meeting=False, testing=False)

    # create the ActivityWatch client (by default)
    # args: a str for the AW client name
    __watcher.CreateAWClient(client_name)


    def get(self):
        #print(request.json)
        try:
            try:
                #result = json.loads(request.json)["watcher-api-request"]["getAction"]
                result = dict(request.json)["watcher-api-request"]["getAction"]
            except Exception as ex:
                print("NOT A VALID JSON: MAY BE EMPTY?")
                print(ex)
                result="Null"

            if "Null"==result:
                return make_response("HELLO!",200)

            if "GetAWClient" == result:
                return make_response(self.__watcher.GetAWClientName(), 200)

            if "GetCurrentCSV" == result:
                if CheckFile(self.path, '/apps_current.csv'):
                    res = ReadCSV(self.path, "/apps_current.csv")
                    if not res.empty:
                        return make_response(res.to_json(), 200)
                    raise Exception("impossible to open 'apps_current.csv'")
                else: return make_response("'apps_current.csv' doesn't exist")

            if "GetCurrentCSV-None" == result:
                if CheckFile(self.path, '/apps_current.csv'):
                    res = ReadCSV(self.path, "/apps_current.csv")
                    if 'None' in list(set(res.working_selection)): return make_response(str(True), 200)
                    else: return make_response(str(False), 200)
                else: return make_response("'apps_current.csv' doesn't exist")

            if "GetSelectionCSV" == result:
                if CheckFile(self.path, '/apps_selection.csv'):
                    res = ReadCSV(self.path, "/apps_selection.csv")
                    if not res.empty:
                        return make_response(res.to_json(), 200)
                    raise Exception("impossible to open 'apps_selection.csv'")
                else: return make_response("'apps_selection.csv' doesn't exist")

            if "GetWorkingEvents-AI-Filter" == result:
                if CheckFile(self.path, '/apps_current.csv'):
                    res, err = WorkingEvents(self.path)
                    if err:
                        raise Exception(err)
                    return make_response(res.to_json(), 200)
                else: return make_response("'apps_current.csv' doesn't exist")

        except Exception as ex:
            print(ex)
            return make_response("Bad Request (JSON error): {0}".format(ex), 400)


    def post(self):
        try:
            message = make_response("Bad Request (JSON error)", 400)
            try: result = json.loads(request.json)
            except:
                print("Ho trovato un errore: maybe JAVA?")
                result = dict(request.json)
                print("PARSATO CON JAVA")
            print(result)
            result = result["watcher-api-request"]

            if "getAction" in list(result.keys()):
                result = result["getAction"]
                print(result)
                if "GetAWClient" == result:
                    return make_response(self.__watcher.GetAWClientName(), 200)

                if "GetCurrentCSV" == result:
                    if CheckFile(self.path, '/apps_current.csv'):
                        res = ReadCSV(self.path, "/apps_current.csv")
                        if not res.empty:
                            return make_response(res.to_json(), 200)
                        raise Exception("impossible to open 'apps_current.csv'")
                    else: return make_response("'apps_current.csv' doesn't exist")

                if "GetCurrentCSV-None" == result:
                    if CheckFile(self.path, '/apps_current.csv'):
                        res = ReadCSV(self.path, "/apps_current.csv")
                        if 'None' in list(set(res.working_selection)): return make_response(str(True), 200)
                        else: return make_response(str(False), 200)
                    else: return make_response("'apps_current.csv' doesn't exist")

                if "GetSelectionCSV" == result:
                    if CheckFile(self.path, '/apps_selection.csv'):
                        res = ReadCSV(self.path, "/apps_selection.csv")
                        if not res.empty:
                            return make_response(res.to_json(), 200)
                        raise Exception("impossible to open 'apps_selection.csv'")
                    else: return make_response("'apps_selection.csv' doesn't exist")

                if "GetWorkingEvents-AI-Filter" == result:
                    if CheckFile(self.path, '/apps_current.csv'):
                        res, err = WorkingEvents(self.path)
                        if err:
                            raise Exception(err)
                        return make_response(res.to_json(), 200)
                    else: return make_response("'apps_current.csv' doesn't exist")
                return make_response("Bad Request (JSON error)", 400)


            # change (and create) the AW client with the new name
            if "AWClient" in list(result.keys()):
                self.__watcher.CreateAWClient(result["AWClient"])
                return make_response("Client name: "+self.__watcher.GetAWClientName(), 200)

            # change (and create) the AW client with the new name
            if "AWServerParams" in list(result.keys()):
                params = (result["AWServerParams"]["hostname"],int(result["AWServerParams"]["port"]))
                self.__watcher.SetAWServerParams(params)
                host, port = self.__watcher.GetAWServerParams()
                return make_response("AW hostname: {0}, AW port: {1}".format(host,port), 200)

            result = result["requestAction"]
            if result["watchers-management"] == "START_ALL":
                result = self.__watcher.Start()
                return make_response(result[0], result[1])


            if result["watchers-management"] == "STOP_ALL":
                message, error = self.__watcher.Stop()
                if error:
                    return make_response(str(message), 400)
                query_result = self.__watcher.QueryAWCurrentWindow()
                print(query_result)
                #print(query_result)
                if query_result.empty:
                    print("error or empty")
                    return make_response("empty or error query", 200)
                message, err = EventsToCSV(self.path, query_result)
                return make_response(str(message), 200)

            if result["watchers-management"] == "SendCurrentCSV":
                if CheckFile(self.path, '/apps_current.csv'):
                    tmp = ReadCSV(self.path, "/apps_current.csv")
                    if tmp[tmp.working_selection=='None'].empty:
                        msg, err = self.__watcher.SendToAWBucket(tmp)
                        if err:
                            return make_response(str(msg), 400)
                    else:
                        return make_response('there are some None values in the apps_current.csv', 400)
                    os.remove(self.path+"/apps_current.csv")
                    return make_response('events send to working bucket', 200)
                else: return make_response("'apps_current.csv' doesn't exist")

            if "SetWorkingEvents" in list(result["watchers-management"].keys()):
                msg, err = UpdateSelectionCSV(pd.DataFrame(result["watchers-management"]["SetWorkingEvents"]), self.path)
                if err:
                    make_response(str(msg), 400)
                msg, err = UpdateCurrentCSV(self.path)
                if err:
                    return make_response(str(msg), 400)
                return make_response('all CSVs updated', 200)


        except Exception as ex:
            print(ex)
            return make_response("Bad Request (JSON error)", 400)




api.add_resource(User, '/user')  # '/users' is our entry point


if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5000)  # run our Flask app
