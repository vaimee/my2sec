import pandas as pd
import os
from cryptography.fernet import Fernet
from AIFilter import Filter
import datetime
import builtins

def custom_print(*args, **kwargs):
    now = datetime.datetime.now().strftime("%d/%m/%Y %H:%M:%S")
    prefix = "127.0.0.1 -- [{}] ".format(now)
    sep = kwargs.get("sep", " ")
    end = kwargs.get("end", "\n")
    builtins.print(prefix, end="")
    builtins.print(*args, sep=sep, end=end)

def CheckFile(path, name_of_file):
    return True if os.path.isfile(path+name_of_file) else False

def ReadCSV(path, name_of_file):
    try:
        if not CheckFile(path, '/filekey.key'):
            CreateStoreKey(path)
        try:
            Decrypt(path, path+name_of_file)
        except:
            pass
        result = pd.read_csv(path+name_of_file)
        Encrypt(path, path+name_of_file)
        return result.reset_index().drop(columns="index")
    except:
        return None

def CreateStoreKey(path):
    key = Fernet.generate_key()
    with open(path+'/filekey.key', 'wb') as filekey:
       filekey.write(key)

def LoadKey(path_filekey):
    with open(path_filekey, 'rb') as filekey:
        key = filekey.read()
    return Fernet(key)

def Encrypt(path, pathfile_to_encrypt):
    fernet = LoadKey(path+'/filekey.key')
    with open(pathfile_to_encrypt, 'rb') as file:
        original = file.read()
    encrypted = fernet.encrypt(original)
    with open(pathfile_to_encrypt, 'wb') as encrypted_file:
        encrypted_file.write(encrypted)

def Decrypt(path, pathfile_to_encrypt):
    fernet = LoadKey(path+'/filekey.key')
    with open(pathfile_to_encrypt, 'rb') as enc_file:
        decrypted = enc_file.read()
    decrypted = fernet.decrypt(decrypted)
    with open(pathfile_to_encrypt, 'wb') as dec_file:
        dec_file.write(decrypted)


def EventsToCSV(path, query_res):
    try:
        if not CheckFile(path, '/filekey.key'):
            CreateStoreKey(path)
        message = None
        if CheckFile(path, "/apps_current.csv"):
            pd.concat([ReadCSV(path,"/apps_current.csv"), query_res], ignore_index=False).to_csv(path+'/apps_current.csv', index=False)
            custom_print("'apps_current.csv' updated")
            message = "'apps_current.csv' updated"
        else:
            query_res.to_csv(path+"/apps_current.csv", index=False)
            custom_print("'apps_current.csv' created")
            message = "'apps_current.csv' created"
        Encrypt(path, path+"/apps_current.csv")
        return message, False
    except Exception as ex:
        print(ex)
        return ex, True


def WorkingEvents(path):
    try:
        filter = False
        message = None
        if not CheckFile(path, '/apps_current.csv'):
            raise Exception("no current selection")
        current = ReadCSV(path, '/apps_current.csv')
        selection = pd.DataFrame(columns=['app','title','url','working_selection'])
        if CheckFile(path, '/apps_selection.csv'):
            selection = ReadCSV(path, '/apps_selection.csv')
            if selection.shape[0]>5: filter = True


        # browse all the rows of the apps_current_dataset.
        # if a row already exists inside the apps_selection_dataset, ignore it,
        # otherwise add the row --> means that the event doesn't exist in the list of apps
        # and the program needs to find its working_selection flag
        list_selection = []
        for i in range(current.shape[0]):
            current_app = current.loc[i]['app']
            current_title = current.loc[i]['title']
            current_url = current.loc[i]['url']
            #print(current_app, current_title)
            # if the current_app and current_title already exist in the list of apps, ignore
            if not selection[(selection['app'] == current_app) & (selection['title'] == current_title)].empty:
                continue
            # add the current_title and current_app to the list of apps
            list_selection.append({'app':current_app, 'title':current_title, 'url':current_url, 'working_selection':'None'})
        tmp = pd.DataFrame(list_selection, columns=['app','title','url','working_selection']).drop_duplicates(subset=['app','title','url'])
        selection = pd.concat([selection, tmp], ignore_index=True)
        # try to get the working selection for the events without flag
        # apps_without_selection_dataset --> the dataset with the app without activity_type and working_selection
        without_selection = selection[selection['working_selection'] == 'None']

        # tutte le attività lavorative sono già state assegnate
        if without_selection.empty:
            UpdateCurrentCSV(path)
            return pd.DataFrame(), False

        elements = list(set(selection.working_selection))
        elements.remove('None')

        if filter:
            if len(elements) < 2:
                return without_selection.assign(working_selection=elements[0]), False
            return Filter(selection, without_selection), False
        UpdateCurrentCSV(path)
        return without_selection, False
    except Exception as ex:
        return ex, True


def UpdateSelectionCSV(dataframe, path):
    try:
        selection = pd.DataFrame(columns=['app','title','url','working_selection'])
        if CheckFile(path, '/apps_selection.csv'):
            selection = ReadCSV(path, '/apps_selection.csv')
            print(selection)
        tmp = pd.concat([selection, dataframe])
        tmp = tmp.drop_duplicates(subset=['app','title','url'], keep='last').reset_index().drop(columns='index')
        print(tmp)
        tmp.to_csv(path+'/apps_selection.csv', index=False)
        return None, False
    except Exception as ex:
        print(ex)
        return ex, True

def UpdateCurrentCSV(path):
    try:
        selection = pd.DataFrame(columns=['app','title','url','working_selection'])
        if CheckFile(path, '/apps_selection.csv'):
            selection = ReadCSV(path, '/apps_selection.csv')


        if CheckFile(path, '/apps_current.csv'):
            current = ReadCSV(path, '/apps_current.csv')
        else: raise Exception('no apps_current.csv to update')

        merge = pd.merge(current, selection, on=['app','title','url'], how='left')
        merge['working_selection'] = merge['working_selection_y']
        merge = merge.drop(columns=['working_selection_y', 'working_selection_x'])
        merge = merge.fillna('None')
        merge.to_csv(path+'/apps_current.csv', index=False)
        Encrypt(path, path+"/apps_current.csv")
        return None, False
    except Exception as ex:
        print(ex)
        return ex, True
