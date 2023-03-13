import sys
import json

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


print("###################################")
print("THE BOA CONSTRICTOR STARTED EATING!")
print("###################################")
filename=sys.argv[1]
jsonEvents=read_node_input_from_file(filename)
print("File loaded successfully")
print("###################################")
#print(jsonEvents)
dataToSend=AddDuration(arg)
#print(dataToSend)
sys.stdout.flush()
